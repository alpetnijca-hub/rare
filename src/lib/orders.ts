import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { reservationMinutes, siteConfig } from "@/config/site";
import { generateOrderNumber } from "@/lib/utils";
import type { Quote } from "@/lib/pricing";
import type { AddressInput } from "@/lib/validation";

/**
 * Bestell- und Lagerlogik.
 *
 * Ablauf:
 *  1. `createPendingOrder`  – Bestellung anlegen und Bestand RESERVIEREN.
 *  2. Kunde bezahlt bei Stripe.
 *  3. `fulfillPaidOrder`    – nach verifiziertem Webhook: Bestand ENDGÜLTIG
 *                             abbuchen, Bestellung auf "bezahlt" setzen.
 *  4. `releaseOrderStock`   – bei Abbruch/Ablauf/Storno: Reservierung lösen.
 *
 * Alle bestandsverändernden Schritte laufen in einer Transaktion und sind
 * idempotent: Ein doppelt zugestellter Webhook verändert nichts ein zweites Mal.
 */

type Tx = Prisma.TransactionClient | PrismaClient;

export class InsufficientStockError extends Error {
  constructor(
    readonly variantId: string,
    readonly productName: string,
    readonly size: string,
  ) {
    super(
      `Nicht genügend Bestand für „${productName}“ (${size}). Bitte Menge anpassen.`,
    );
    this.name = "InsufficientStockError";
  }
}

// ---------------------------------------------------------------------------
// Lagerbuchungen
// ---------------------------------------------------------------------------

/**
 * Reserviert Bestand atomar.
 *
 * Die Bedingung `stock - reservedStock >= quantity` steht in der WHERE-Klausel
 * des UPDATE. Damit kann selbst bei gleichzeitigen Bestellungen nie mehr
 * reserviert werden, als tatsächlich vorhanden ist (kein Überverkauf).
 */
async function reserveStock(
  tx: Tx,
  variantId: string,
  quantity: number,
): Promise<boolean> {
  const affected = await tx.$executeRaw`
    UPDATE "ProductVariant"
    SET "reservedStock" = "reservedStock" + ${quantity}
    WHERE "id" = ${variantId}
      AND "stock" - "reservedStock" >= ${quantity}
  `;
  return affected === 1;
}

/**
 * Reserviert eine Vorbestellung. Vorbestellungen haben definitionsgemäss
 * keinen Bestand, deshalb entfällt hier die Bestandsprüfung.
 */
async function reservePreorder(
  tx: Tx,
  variantId: string,
  quantity: number,
): Promise<void> {
  await tx.productVariant.update({
    where: { id: variantId },
    data: { reservedStock: { increment: quantity } },
  });
}

/** Schreibt eine Zeile ins Lagerjournal (mit Bestand nach der Buchung). */
async function logMovement(
  tx: Tx,
  params: {
    variantId: string;
    reason: Prisma.InventoryMovementCreateInput["reason"];
    stockDelta: number;
    reservedDelta: number;
    orderId?: string | null;
    note?: string | null;
    userId?: string | null;
  },
): Promise<void> {
  const variant = await tx.productVariant.findUnique({
    where: { id: params.variantId },
    select: { stock: true, reservedStock: true },
  });
  if (!variant) return;

  await tx.inventoryMovement.create({
    data: {
      variantId: params.variantId,
      reason: params.reason,
      stockDelta: params.stockDelta,
      reservedDelta: params.reservedDelta,
      stockAfter: variant.stock,
      reservedAfter: variant.reservedStock,
      orderId: params.orderId ?? null,
      note: params.note ?? null,
      userId: params.userId ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Bestellung anlegen
// ---------------------------------------------------------------------------

export interface CreateOrderParams {
  quote: Quote;
  email: string;
  phone?: string | null;
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
  customerNote?: string | null;
  marketingOptIn: boolean;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  accessToken: string;
  totalCents: number;
}

function addressData(
  input: AddressInput,
  type: "SHIPPING" | "BILLING",
  customerId: string,
): Prisma.AddressCreateInput {
  return {
    type,
    firstName: input.firstName,
    lastName: input.lastName,
    company: input.company || null,
    street: input.street,
    houseNumber: input.houseNumber || null,
    addressLine2: input.addressLine2 || null,
    postalCode: input.postalCode,
    city: input.city,
    state: input.state || null,
    country: input.country,
    phone: input.phone || null,
    customer: { connect: { id: customerId } },
  };
}

/**
 * Legt eine Bestellung mit Status "Zahlung ausstehend" an und reserviert den
 * Bestand. Schlägt die Reservierung fehl, wird die gesamte Transaktion
 * zurückgerollt – es entsteht keine halbfertige Bestellung.
 */
export async function createPendingOrder(
  params: CreateOrderParams,
): Promise<CreatedOrder> {
  const { quote } = params;
  const shippingMethod = quote.shippingMethod;

  if (!quote.valid || quote.lines.length === 0 || !shippingMethod) {
    throw new Error("Der Warenkorb ist nicht bestellbar.");
  }

  const reservationExpiresAt = new Date(
    Date.now() + reservationMinutes * 60 * 1000,
  );

  return prisma.$transaction(
    async (tx) => {
      // Kunde anlegen oder aktualisieren (Gastbestellung ohne Konto).
      const customer = await tx.customer.upsert({
        where: { email: params.email },
        create: {
          email: params.email,
          firstName: params.shippingAddress.firstName,
          lastName: params.shippingAddress.lastName,
          phone: params.phone || null,
          marketingOptIn: params.marketingOptIn,
        },
        update: {
          firstName: params.shippingAddress.firstName,
          lastName: params.shippingAddress.lastName,
          phone: params.phone || undefined,
          // Eine einmal erteilte Einwilligung wird nicht automatisch entzogen.
          ...(params.marketingOptIn ? { marketingOptIn: true } : {}),
        },
      });

      const shippingAddress = await tx.address.create({
        data: addressData(params.shippingAddress, "SHIPPING", customer.id),
      });
      const billingAddress = await tx.address.create({
        data: addressData(params.billingAddress, "BILLING", customer.id),
      });

      // Bestandsreservierung – vor dem Anlegen der Bestellung.
      for (const line of quote.lines) {
        if (line.isPreorder) {
          await reservePreorder(tx, line.variantId, line.quantity);
        } else {
          const reserved = await reserveStock(tx, line.variantId, line.quantity);
          if (!reserved) {
            throw new InsufficientStockError(
              line.variantId,
              line.productName,
              line.size,
            );
          }
        }
      }

      // Bestellnummer mit Kollisionsschutz.
      let orderNumber = generateOrderNumber();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const existing = await tx.order.findUnique({
          where: { orderNumber },
          select: { id: true },
        });
        if (!existing) break;
        orderNumber = generateOrderNumber();
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          status: "PENDING_PAYMENT",
          customerId: customer.id,
          email: params.email,
          currency: siteConfig.currency,
          subtotalCents: quote.subtotalCents,
          discountCents: quote.discountCents,
          shippingCents: quote.shippingCents,
          totalCents: quote.totalCents,
          taxCents: quote.taxCents,
          taxRateBp: quote.taxRateBp,
          discountCodeId: quote.discount.valid ? quote.discount.code?.id : null,
          discountCodeLabel: quote.discount.valid
            ? (quote.discount.code?.code ?? null)
            : null,
          shippingMethodKey: shippingMethod.key,
          shippingMethodLabel: shippingMethod.label,
          shippingMinDays: quote.delivery.minDays,
          shippingMaxDays: quote.delivery.maxDays,
          customerNote: params.customerNote || null,
          shippingAddressId: shippingAddress.id,
          billingAddressId: billingAddress.id,
          reservationExpiresAt,
          items: {
            create: quote.lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              productName: line.productName,
              variantSize: line.size,
              sku: line.sku,
              imageUrl: line.imageUrl,
              volumeMl: line.volumeMl,
              unitPriceCents: line.unitPriceCents,
              quantity: line.quantity,
              lineTotalCents: line.lineTotalCents,
              deliveryMinDays: line.deliveryMinDays,
              deliveryMaxDays: line.deliveryMaxDays,
              isPreorder: line.isPreorder,
            })),
          },
        },
        select: {
          id: true,
          orderNumber: true,
          accessToken: true,
          totalCents: true,
        },
      });

      // Journal erst nach dem Anlegen – dann existiert die Order-Referenz.
      for (const line of quote.lines) {
        await logMovement(tx, {
          variantId: line.variantId,
          reason: "RESERVATION",
          stockDelta: 0,
          reservedDelta: line.quantity,
          orderId: order.id,
          note: line.isPreorder ? "Vorbestellung" : null,
        });
      }

      return order;
    },
    { timeout: 20_000, maxWait: 10_000 },
  );
}

/** Verknüpft die Stripe-Checkout-Session mit der Bestellung. */
export async function attachCheckoutSession(
  orderId: string,
  sessionId: string,
  paymentIntentId: string | null,
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      stripeCheckoutSessionId: sessionId,
      stripePaymentIntentId: paymentIntentId,
    },
  });
}

// ---------------------------------------------------------------------------
// Zahlung bestätigt: Bestand endgültig abbuchen
// ---------------------------------------------------------------------------

export interface FulfillPaymentInfo {
  paymentIntentId: string | null;
  chargeId?: string | null;
  amountCents: number;
  currency: string;
  methodType?: string | null;
  methodBrand?: string | null;
  methodLast4?: string | null;
}

export interface FulfillResult {
  /** War dies die erste erfolgreiche Verarbeitung? */
  firstFulfillment: boolean;
  orderId: string;
  orderNumber: string;
}

/**
 * Markiert eine Bestellung als bezahlt und bucht den Bestand endgültig ab.
 *
 * Idempotent: Das Setzen von `stockCommitted` erfolgt über ein bedingtes
 * UPDATE. Läuft der Webhook ein zweites Mal, greift die Bedingung nicht mehr
 * und der Bestand bleibt unverändert.
 */
export async function fulfillPaidOrder(
  orderId: string,
  payment: FulfillPaymentInfo,
): Promise<FulfillResult> {
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw new Error(`Bestellung ${orderId} nicht gefunden.`);

      // Atomarer Anspruch auf die Bestandsbuchung.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, stockCommitted: false },
        data: { stockCommitted: true },
      });

      const firstFulfillment = claimed.count === 1;

      if (firstFulfillment) {
        for (const item of order.items) {
          if (!item.variantId) continue;

          // Physischen Bestand abbuchen und Reservierung auflösen.
          // Bei Vorbestellungen darf der Bestand negativ werden – das ist der
          // offene Rückstand gegenüber Kunden.
          await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET "stock" = "stock" - ${item.quantity},
                "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
            WHERE "id" = ${item.variantId}
          `;

          await logMovement(tx, {
            variantId: item.variantId,
            reason: "SALE",
            stockDelta: -item.quantity,
            reservedDelta: -item.quantity,
            orderId: order.id,
            note: `Verkauf ${order.orderNumber}`,
          });
        }

        // Rabattcode erst nach bestätigter Zahlung als eingelöst zählen.
        if (order.discountCodeId) {
          await tx.discountCode.update({
            where: { id: order.discountCodeId },
            data: { usedCount: { increment: 1 } },
          });
        }

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            reservationExpiresAt: null,
            stripePaymentIntentId:
              payment.paymentIntentId ?? order.stripePaymentIntentId,
          },
        });
      }

      // Zahlungsdatensatz – nur Referenzen, niemals vollständige Kartendaten.
      if (payment.paymentIntentId) {
        await tx.payment.upsert({
          where: { stripePaymentIntentId: payment.paymentIntentId },
          create: {
            orderId,
            provider: "STRIPE",
            status: "SUCCEEDED",
            amountCents: payment.amountCents,
            currency: payment.currency.toUpperCase(),
            stripePaymentIntentId: payment.paymentIntentId,
            stripeChargeId: payment.chargeId ?? null,
            methodType: payment.methodType ?? null,
            methodBrand: payment.methodBrand ?? null,
            methodLast4: payment.methodLast4 ?? null,
          },
          update: {
            status: "SUCCEEDED",
            amountCents: payment.amountCents,
            stripeChargeId: payment.chargeId ?? undefined,
            methodType: payment.methodType ?? undefined,
            methodBrand: payment.methodBrand ?? undefined,
            methodLast4: payment.methodLast4 ?? undefined,
          },
        });
      }

      return {
        firstFulfillment,
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    },
    { timeout: 20_000, maxWait: 10_000 },
  );
}

// ---------------------------------------------------------------------------
// Reservierung freigeben / Storno
// ---------------------------------------------------------------------------

/**
 * Gibt eine Reservierung wieder frei (Abbruch, Ablauf, Storno vor Zahlung).
 * Idempotent über das Feld `stockReleased`.
 */
export async function releaseOrderStock(
  orderId: string,
  note = "Reservierung freigegeben",
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return false;

    // Bereits endgültig abgebuchte Bestellungen werden hier nicht angefasst.
    if (order.stockCommitted) return false;

    const claimed = await tx.order.updateMany({
      where: { id: orderId, stockReleased: false, stockCommitted: false },
      data: { stockReleased: true, reservationExpiresAt: null },
    });
    if (claimed.count !== 1) return false;

    for (const item of order.items) {
      if (!item.variantId) continue;

      await tx.$executeRaw`
        UPDATE "ProductVariant"
        SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
        WHERE "id" = ${item.variantId}
      `;

      await logMovement(tx, {
        variantId: item.variantId,
        reason: "RELEASE",
        stockDelta: 0,
        reservedDelta: -item.quantity,
        orderId: order.id,
        note,
      });
    }

    return true;
  });
}

/**
 * Storniert eine Bestellung. Vor der Zahlung wird die Reservierung gelöst,
 * nach der Zahlung wird der Bestand zurückgebucht.
 */
export async function cancelOrder(
  orderId: string,
  options: { restock?: boolean; userId?: string | null; note?: string } = {},
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Bestellung nicht gefunden.");
  if (order.status === "CANCELLED") return;

  if (!order.stockCommitted) {
    await releaseOrderStock(orderId, options.note ?? "Bestellung storniert");
  } else if (options.restock !== false) {
    await restockOrder(orderId, options.userId ?? null, "Storno – Rückbuchung");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
}

/** Bucht die Ware einer bezahlten Bestellung zurück ins Lager. */
export async function restockOrder(
  orderId: string,
  userId: string | null,
  note: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || !order.stockCommitted) return;

    // Rückbuchung nur einmal: `stockCommitted` wird zurückgesetzt.
    const claimed = await tx.order.updateMany({
      where: { id: orderId, stockCommitted: true },
      data: { stockCommitted: false },
    });
    if (claimed.count !== 1) return;

    for (const item of order.items) {
      if (!item.variantId) continue;

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });

      await logMovement(tx, {
        variantId: item.variantId,
        reason: "RETURN",
        stockDelta: item.quantity,
        reservedDelta: 0,
        orderId: order.id,
        note,
        userId,
      });
    }
  });
}

/**
 * Gibt abgelaufene Reservierungen frei.
 * Wird vom Cron-Job `/api/cron/reservierungen` aufgerufen.
 */
export async function expireStaleReservations(): Promise<number> {
  const stale = await prisma.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      stockCommitted: false,
      stockReleased: false,
      reservationExpiresAt: { lt: new Date() },
    },
    select: { id: true },
    take: 200,
  });

  let released = 0;
  for (const order of stale) {
    const success = await releaseOrderStock(
      order.id,
      "Reservierung abgelaufen – Zahlung nicht abgeschlossen",
    );
    if (success) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      released += 1;
    }
  }

  return released;
}

/** Manuelle Bestandskorrektur aus dem Adminbereich. */
export async function adjustStock(params: {
  variantId: string;
  newStock: number;
  userId: string;
  note?: string | null;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: params.variantId },
      select: { stock: true },
    });
    if (!variant) throw new Error("Variante nicht gefunden.");

    const delta = params.newStock - variant.stock;
    if (delta === 0) return;

    await tx.productVariant.update({
      where: { id: params.variantId },
      data: { stock: params.newStock },
    });

    await logMovement(tx, {
      variantId: params.variantId,
      reason: delta > 0 ? "RESTOCK" : "MANUAL_ADJUSTMENT",
      stockDelta: delta,
      reservedDelta: 0,
      note: params.note ?? "Manuelle Bestandskorrektur",
      userId: params.userId,
    });
  });
}
