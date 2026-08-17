import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { buildQuote } from "@/lib/pricing";
import {
  cancelOrder,
  createPendingOrder,
  expireStaleReservations,
  fulfillPaidOrder,
  InsufficientStockError,
  releaseOrderStock,
  restockOrder,
} from "@/lib/orders";
import type { AddressInput } from "@/lib/validation";

/**
 * Integrationstests für Bestellung und Lager.
 *
 * Diese Tests laufen gegen eine echte PostgreSQL-Datenbank (DATABASE_URL).
 * Sie decken genau die Fälle ab, bei denen Fehler Geld kosten:
 *   - Überverkauf bei gleichzeitigen Bestellungen
 *   - doppelte Verarbeitung eines Webhooks (Idempotenz)
 *   - Freigabe reservierter Ware bei Abbruch
 *   - Rückbuchung bei Storno und Erstattung
 *
 * Alle Testdaten tragen das Präfix TEST- und werden am Ende entfernt.
 */

const SKU_PREFIX = "TEST-VITEST-";
const SLUG = "vitest-testduft";

const address: AddressInput = {
  firstName: "Test",
  lastName: "Kundin",
  company: "",
  street: "Teststrasse",
  houseNumber: "1",
  addressLine2: "",
  postalCode: "8000",
  city: "Zürich",
  state: "",
  country: "CH",
  phone: "",
};

async function cleanup() {
  const product = await prisma.product.findUnique({
    where: { slug: SLUG },
    select: { id: true, variants: { select: { id: true } } },
  });
  if (!product) return;

  const variantIds = product.variants.map((variant) => variant.id);

  const orders = await prisma.order.findMany({
    where: { items: { some: { variantId: { in: variantIds } } } },
    select: { id: true, customerId: true },
  });
  const orderIds = orders.map((order) => order.id);

  // Reihenfolge beachtet die Fremdschlüssel.
  await prisma.inventoryMovement.deleteMany({
    where: { OR: [{ variantId: { in: variantIds } }, { orderId: { in: orderIds } }] },
  });
  await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.shipment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.address.deleteMany({
    where: { customer: { email: { startsWith: "vitest-" } } },
  });
  await prisma.customer.deleteMany({ where: { email: { startsWith: "vitest-" } } });
  await prisma.product.delete({ where: { id: product.id } });
}

/** Legt ein frisches Testprodukt mit definierten Beständen an. */
async function seedProduct(options: {
  stock: number;
  preorderStock?: number;
  preorderEnabled?: boolean;
}) {
  await cleanup();

  return prisma.product.create({
    data: {
      slug: SLUG,
      name: "Vitest Testduft",
      description:
        "Automatisch erzeugtes Testprodukt. Wird nach dem Testlauf entfernt.",
      fragranceFamily: "FLORAL",
      kind: "PARFUM",
      topNotes: [],
      heartNotes: [],
      baseNotes: [],
      isActive: true,
      isDemo: true,
      variants: {
        create: [
          {
            sku: `${SKU_PREFIX}LAGER`,
            size: "10 ml",
            volumeMl: 10,
            priceCents: 2000,
            stock: options.stock,
            lowStockThreshold: 2,
            isActive: true,
            preorderEnabled: false,
            deliveryMinDays: 1,
            deliveryMaxDays: 2,
            sortOrder: 1,
          },
          {
            sku: `${SKU_PREFIX}VORBESTELLUNG`,
            size: "30 ml",
            volumeMl: 30,
            priceCents: 5000,
            stock: options.preorderStock ?? 0,
            isActive: true,
            preorderEnabled: options.preorderEnabled ?? true,
            deliveryMinDays: 10,
            deliveryMaxDays: 18,
            sortOrder: 2,
          },
        ],
      },
    },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
}

async function placeOrder(variantId: string, quantity: number, email: string) {
  const quote = await buildQuote({
    items: [{ variantId, quantity }],
    shippingMethodKey: "standard",
    country: "CH",
  });

  return createPendingOrder({
    quote,
    email,
    shippingAddress: address,
    billingAddress: address,
    marketingOptIn: false,
  });
}

function variantState(variantId: string) {
  return prisma.productVariant.findUniqueOrThrow({
    where: { id: variantId },
    select: { stock: true, reservedStock: true },
  });
}

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------

describe("Reservierung beim Anlegen der Bestellung", () => {
  beforeEach(async () => {
    await seedProduct({ stock: 10 });
  });

  it("reserviert Bestand, ohne ihn abzubuchen", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    await placeOrder(variant.id, 3, "vitest-a@example.com");

    const after = await variantState(variant.id);
    expect(after.stock).toBe(10);
    expect(after.reservedStock).toBe(3);
  });

  it("schreibt die Reservierung ins Lagerjournal", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 2, "vitest-b@example.com");

    const movements = await prisma.inventoryMovement.findMany({
      where: { orderId: order.id },
    });

    expect(movements).toHaveLength(1);
    expect(movements[0].reason).toBe("RESERVATION");
    expect(movements[0].reservedDelta).toBe(2);
    expect(movements[0].stockDelta).toBe(0);
  });

  it("verhindert Überverkauf bei gleichzeitigen Bestellungen", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    // Vier gleichzeitige Bestellungen zu je 4 Stück bei 10 Stück Bestand.
    // Höchstens zwei dürfen durchkommen (2 × 4 = 8 <= 10).
    const results = await Promise.allSettled([
      placeOrder(variant.id, 4, "vitest-c1@example.com"),
      placeOrder(variant.id, 4, "vitest-c2@example.com"),
      placeOrder(variant.id, 4, "vitest-c3@example.com"),
      placeOrder(variant.id, 4, "vitest-c4@example.com"),
    ]);

    const succeeded = results.filter((entry) => entry.status === "fulfilled");
    const after = await variantState(variant.id);

    expect(succeeded.length).toBeLessThanOrEqual(2);
    expect(after.reservedStock).toBe(succeeded.length * 4);
    // Entscheidend: Es wurde nie mehr reserviert als vorhanden.
    expect(after.reservedStock).toBeLessThanOrEqual(after.stock);
  });

  it("lehnt eine Bestellung über den verfügbaren Bestand hinaus ab", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    // Bestand künstlich fast vollständig reservieren.
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { reservedStock: 9 },
    });

    const quote = await buildQuote({
      items: [{ variantId: variant.id, quantity: 1 }],
      shippingMethodKey: "standard",
      country: "CH",
    });

    // Zwischen Angebot und Bestellung wird der Rest reserviert.
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { reservedStock: 10 },
    });

    await expect(
      createPendingOrder({
        quote,
        email: "vitest-d@example.com",
        shippingAddress: address,
        billingAddress: address,
        marketingOptIn: false,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);

    // Nach dem fehlgeschlagenen Versuch darf keine Bestellung existieren.
    const orders = await prisma.order.count({
      where: { email: "vitest-d@example.com" },
    });
    expect(orders).toBe(0);
  });

  it("begrenzt die Menge im Angebot auf den verfügbaren Bestand", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const quote = await buildQuote({
      items: [{ variantId: variant.id, quantity: 99 }],
      shippingMethodKey: "standard",
      country: "CH",
    });

    expect(quote.lines[0].quantity).toBe(10);
    expect(quote.notices.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe("Zahlung bestätigt (Webhook)", () => {
  beforeEach(async () => {
    await seedProduct({ stock: 10 });
  });

  it("bucht den Bestand ab und löst die Reservierung", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 3, "vitest-e@example.com");

    const result = await fulfillPaidOrder(order.id, {
      paymentIntentId: "pi_vitest_1",
      amountCents: order.totalCents,
      currency: "eur",
      methodType: "card",
      methodBrand: "visa",
      methodLast4: "4242",
    });

    expect(result.firstFulfillment).toBe(true);

    const after = await variantState(variant.id);
    expect(after.stock).toBe(7);
    expect(after.reservedStock).toBe(0);

    const updated = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(updated.status).toBe("PAID");
    expect(updated.paidAt).not.toBeNull();
    expect(updated.stockCommitted).toBe(true);
  });

  it("verarbeitet einen doppelt zugestellten Webhook nur einmal", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 2, "vitest-f@example.com");

    const payment = {
      paymentIntentId: "pi_vitest_2",
      amountCents: order.totalCents,
      currency: "eur",
    };

    const first = await fulfillPaidOrder(order.id, payment);
    const second = await fulfillPaidOrder(order.id, payment);
    const third = await fulfillPaidOrder(order.id, payment);

    expect(first.firstFulfillment).toBe(true);
    expect(second.firstFulfillment).toBe(false);
    expect(third.firstFulfillment).toBe(false);

    // Der Bestand wurde genau einmal abgebucht.
    const after = await variantState(variant.id);
    expect(after.stock).toBe(8);
    expect(after.reservedStock).toBe(0);

    // Und es existiert nur ein Zahlungsdatensatz.
    const payments = await prisma.payment.count({ where: { orderId: order.id } });
    expect(payments).toBe(1);
  });

  it("zählt einen Rabattcode erst nach bestätigter Zahlung", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const discount = await prisma.discountCode.create({
      data: {
        code: "TESTVITEST10",
        type: "PERCENT",
        value: 1000,
        isActive: true,
      },
    });

    const quote = await buildQuote({
      items: [{ variantId: variant.id, quantity: 2 }],
      shippingMethodKey: "standard",
      country: "CH",
      discountCode: "TESTVITEST10",
    });

    expect(quote.discountCents).toBe(400);

    const order = await createPendingOrder({
      quote,
      email: "vitest-g@example.com",
      shippingAddress: address,
      billingAddress: address,
      marketingOptIn: false,
    });

    // Vor der Zahlung noch nicht gezählt.
    let stored = await prisma.discountCode.findUniqueOrThrow({
      where: { id: discount.id },
    });
    expect(stored.usedCount).toBe(0);

    await fulfillPaidOrder(order.id, {
      paymentIntentId: "pi_vitest_3",
      amountCents: order.totalCents,
      currency: "eur",
    });

    stored = await prisma.discountCode.findUniqueOrThrow({
      where: { id: discount.id },
    });
    expect(stored.usedCount).toBe(1);

    // Ein zweiter Webhook erhöht den Zähler nicht.
    await fulfillPaidOrder(order.id, {
      paymentIntentId: "pi_vitest_3",
      amountCents: order.totalCents,
      currency: "eur",
    });

    stored = await prisma.discountCode.findUniqueOrThrow({
      where: { id: discount.id },
    });
    expect(stored.usedCount).toBe(1);

    await prisma.order.updateMany({
      where: { id: order.id },
      data: { discountCodeId: null },
    });
    await prisma.discountCode.delete({ where: { id: discount.id } });
  });
});

// ---------------------------------------------------------------------------

describe("Freigabe und Storno", () => {
  beforeEach(async () => {
    await seedProduct({ stock: 10 });
  });

  it("gibt reservierte Ware bei Abbruch wieder frei", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 4, "vitest-h@example.com");
    expect((await variantState(variant.id)).reservedStock).toBe(4);

    const released = await releaseOrderStock(order.id);
    expect(released).toBe(true);

    const after = await variantState(variant.id);
    expect(after.stock).toBe(10);
    expect(after.reservedStock).toBe(0);
  });

  it("gibt eine Reservierung nicht doppelt frei", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 4, "vitest-i@example.com");

    expect(await releaseOrderStock(order.id)).toBe(true);
    expect(await releaseOrderStock(order.id)).toBe(false);

    const after = await variantState(variant.id);
    expect(after.reservedStock).toBe(0);
  });

  it("rührt bereits abgebuchte Ware bei einer Freigabe nicht an", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 3, "vitest-j@example.com");
    await fulfillPaidOrder(order.id, {
      paymentIntentId: "pi_vitest_4",
      amountCents: order.totalCents,
      currency: "eur",
    });

    const released = await releaseOrderStock(order.id);
    expect(released).toBe(false);

    const after = await variantState(variant.id);
    expect(after.stock).toBe(7);
  });

  it("bucht bei Storno nach Zahlung die Ware zurück", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 3, "vitest-k@example.com");
    await fulfillPaidOrder(order.id, {
      paymentIntentId: "pi_vitest_5",
      amountCents: order.totalCents,
      currency: "eur",
    });
    expect((await variantState(variant.id)).stock).toBe(7);

    await cancelOrder(order.id, { restock: true });

    const after = await variantState(variant.id);
    expect(after.stock).toBe(10);

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("CANCELLED");
  });

  it("bucht bei einer Erstattung nicht doppelt zurück", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 2, "vitest-l@example.com");
    await fulfillPaidOrder(order.id, {
      paymentIntentId: "pi_vitest_6",
      amountCents: order.totalCents,
      currency: "eur",
    });

    await restockOrder(order.id, null, "Test-Erstattung");
    await restockOrder(order.id, null, "Test-Erstattung erneut");

    const after = await variantState(variant.id);
    expect(after.stock).toBe(10);
  });

  it("gibt abgelaufene Reservierungen automatisch frei", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 5, "vitest-m@example.com");

    // Reservierung künstlich altern lassen.
    await prisma.order.update({
      where: { id: order.id },
      data: { reservationExpiresAt: new Date(Date.now() - 60_000) },
    });

    const released = await expireStaleReservations();
    expect(released).toBeGreaterThanOrEqual(1);

    const after = await variantState(variant.id);
    expect(after.reservedStock).toBe(0);

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("CANCELLED");
  });
});

// ---------------------------------------------------------------------------

describe("Vorbestellungen", () => {
  beforeEach(async () => {
    await seedProduct({ stock: 10, preorderStock: 0, preorderEnabled: true });
  });

  it("lässt Vorbestellungen ohne Bestand zu", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const preorderVariant = product.variants[1];

    const quote = await buildQuote({
      items: [{ variantId: preorderVariant.id, quantity: 2 }],
      shippingMethodKey: "standard",
      country: "CH",
    });

    expect(quote.lines[0].isPreorder).toBe(true);
    expect(quote.hasPreorderItems).toBe(true);

    const order = await createPendingOrder({
      quote,
      email: "vitest-n@example.com",
      shippingAddress: address,
      billingAddress: address,
      marketingOptIn: false,
    });

    const after = await variantState(preorderVariant.id);
    expect(after.reservedStock).toBe(2);
    expect(order.id).toBeTruthy();
  });

  it("führt bei bezahlter Vorbestellung zu einem sichtbaren Rückstand", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const preorderVariant = product.variants[1];

    const order = await placeOrder(preorderVariant.id, 2, "vitest-o@example.com");
    await fulfillPaidOrder(order.id, {
      paymentIntentId: "pi_vitest_7",
      amountCents: order.totalCents,
      currency: "eur",
    });

    const after = await variantState(preorderVariant.id);
    // Negativer Bestand = offene Lieferverpflichtung gegenüber Kunden.
    expect(after.stock).toBe(-2);
    expect(after.reservedStock).toBe(0);
  });

  it("nimmt eine Vorbestellung nicht an, wenn sie deaktiviert ist", async () => {
    await seedProduct({ stock: 10, preorderStock: 0, preorderEnabled: false });

    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[1];

    const quote = await buildQuote({
      items: [{ variantId: variant.id, quantity: 1 }],
      shippingMethodKey: "standard",
      country: "CH",
    });

    // Position wurde entfernt, weil nicht bestellbar.
    expect(quote.lines).toHaveLength(0);
    expect(quote.valid).toBe(false);
    expect(quote.removed).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------

describe("Preisberechnung im Angebot", () => {
  beforeEach(async () => {
    await seedProduct({ stock: 10 });
  });

  it("verwendet ausschliesslich Preise aus der Datenbank", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const quote = await buildQuote({
      items: [{ variantId: variant.id, quantity: 2 }],
      shippingMethodKey: "standard",
      country: "CH",
    });

    // 2 × 20.00 = 40.00, Versand 5.90 (unter der Freigrenze von 60.00)
    expect(quote.subtotalCents).toBe(4000);
    expect(quote.shippingCents).toBe(590);
    expect(quote.totalCents).toBe(4590);
  });

  it("gewährt Gratisversand ab der Freigrenze", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const quote = await buildQuote({
      items: [{ variantId: variant.id, quantity: 3 }],
      shippingMethodKey: "standard",
      country: "CH",
    });

    expect(quote.subtotalCents).toBe(6000);
    expect(quote.shippingCents).toBe(0);
    expect(quote.totalCents).toBe(6000);
  });

  it("übernimmt die Preise als Schnappschuss in die Bestellung", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    const variant = product.variants[0];

    const order = await placeOrder(variant.id, 2, "vitest-p@example.com");

    // Preis nachträglich ändern.
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { priceCents: 9999 },
    });

    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    expect(items[0].unitPriceCents).toBe(2000);
    expect(items[0].lineTotalCents).toBe(4000);
  });

  it("ignoriert unbekannte Varianten-IDs", async () => {
    const quote = await buildQuote({
      items: [{ variantId: "gibt-es-nicht", quantity: 1 }],
      shippingMethodKey: "standard",
      country: "CH",
    });

    expect(quote.lines).toHaveLength(0);
    expect(quote.valid).toBe(false);
  });
});
