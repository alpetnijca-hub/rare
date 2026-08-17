import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { describePaymentMethod } from "@/lib/stripe";
import {
  backInStockEmail,
  internalOrderNotificationEmail,
  newsletterConfirmEmail,
  orderCancelledEmail,
  orderConfirmationEmail,
  paymentFailedEmail,
  refundEmail,
  shippingConfirmationEmail,
  type OrderEmailData,
  type RenderedEmail,
} from "@/emails/templates";

/**
 * E-Mail-Versand über Resend.
 *
 * Wichtig: Ein fehlgeschlagener E-Mail-Versand darf niemals die
 * Zahlungsverarbeitung abbrechen. Alle Funktionen fangen Fehler ab und
 * protokollieren sie, statt zu werfen.
 */

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resend = new Resend(apiKey);
  return resend;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const client = getResend();
  const from = process.env.EMAIL_FROM;

  if (!client || !from) {
    // Im lokalen Betrieb ohne Resend-Key wird nur protokolliert.
    console.warn(
      `[email] Kein RESEND_API_KEY gesetzt – E-Mail "${params.subject}" wurde nicht versendet.`,
    );
    return { sent: false, error: "E-Mail-Versand ist nicht konfiguriert." };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo ?? siteConfig.contact.email,
    });

    if (error) {
      console.error("[email] Versand fehlgeschlagen:", error.message);
      return { sent: false, error: error.message };
    }

    return { sent: true, id: data?.id };
  } catch (error) {
    // Keine personenbezogenen Daten ins Log schreiben.
    console.error(
      "[email] Unerwarteter Fehler beim Versand:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return { sent: false, error: "Unerwarteter Fehler beim Versand." };
  }
}

async function deliver(
  to: string | string[],
  email: RenderedEmail,
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// ---------------------------------------------------------------------------
// Bestelldaten für E-Mails aufbereiten
// ---------------------------------------------------------------------------

const orderEmailInclude = {
  items: true,
  shippingAddress: true,
  billingAddress: true,
  payments: { orderBy: { createdAt: "desc" }, take: 1 },
} as const;

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Zahlung ausstehend",
  SUCCEEDED: "Bezahlt",
  FAILED: "Fehlgeschlagen",
  CANCELLED: "Abgebrochen",
  REFUNDED: "Erstattet",
  PARTIALLY_REFUNDED: "Teilweise erstattet",
};

export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: "Zahlung ausstehend",
    PAID: "Bezahlt",
    PROCESSING: "In Bearbeitung",
    READY_TO_SHIP: "Versandbereit",
    SHIPPED: "Versendet",
    DELIVERED: "Zugestellt",
    CANCELLED: "Storniert",
    REFUNDED: "Erstattet",
  };
  return labels[status] ?? status;
}

/** Öffentliche Statusseite einer Gastbestellung. */
export function orderStatusUrl(accessToken: string): string {
  return `${siteConfig.url}/bestellung/${accessToken}`;
}

async function loadOrderEmailData(
  orderId: string,
): Promise<(OrderEmailData & { accessToken: string; customerName: string }) | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderEmailInclude,
  });
  if (!order) return null;

  const payment = order.payments[0] ?? null;

  return {
    orderNumber: order.orderNumber,
    accessToken: order.accessToken,
    orderUrl: orderStatusUrl(order.accessToken),
    email: order.email,
    createdAt: order.createdAt,
    customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
    items: order.items.map((item) => ({
      productName: item.productName,
      size: item.variantSize,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
      isPreorder: item.isPreorder,
      deliveryMinDays: item.deliveryMinDays,
      deliveryMaxDays: item.deliveryMaxDays,
    })),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    discountLabel: order.discountCodeLabel,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    taxCents: order.taxCents,
    taxRateBp: order.taxRateBp,
    shippingMethodLabel: order.shippingMethodLabel,
    deliveryMinDays: order.shippingMinDays,
    deliveryMaxDays: order.shippingMaxDays,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    paymentMethodLabel: describePaymentMethod(
      payment?.methodType,
      payment?.methodBrand,
      payment?.methodLast4,
    ),
    paymentStatusLabel: payment
      ? (paymentStatusLabels[payment.status] ?? payment.status)
      : orderStatusLabel(order.status),
    customerNote: order.customerNote,
  };
}

// ---------------------------------------------------------------------------
// Konkrete Versandfunktionen
// ---------------------------------------------------------------------------

/**
 * Bestätigungsmail an den Kunden plus interne Benachrichtigung.
 * Wird über `confirmationEmailSentAt` gegen Doppelversand abgesichert.
 */
export async function sendOrderConfirmationEmails(
  orderId: string,
): Promise<void> {
  // Atomarer Anspruch: Nur der erste Aufruf versendet.
  const claimed = await prisma.order.updateMany({
    where: { id: orderId, confirmationEmailSentAt: null },
    data: { confirmationEmailSentAt: new Date() },
  });
  if (claimed.count !== 1) return;

  const data = await loadOrderEmailData(orderId);
  if (!data) return;

  const customerResult = await deliver(data.email, orderConfirmationEmail(data));

  const notificationAddress =
    process.env.SHOP_NOTIFICATION_EMAIL ?? siteConfig.contact.email;

  await deliver(
    notificationAddress,
    internalOrderNotificationEmail({
      ...data,
      adminUrl: `${siteConfig.url}/admin/bestellungen/${orderId}`,
    }),
  );

  // Schlug der Kundenversand fehl, wird die Sperre gelöst, damit ein
  // erneuter Versuch (z. B. aus dem Dashboard) möglich bleibt.
  if (!customerResult.sent) {
    await prisma.order.update({
      where: { id: orderId },
      data: { confirmationEmailSentAt: null },
    });
  }
}

export async function sendPaymentFailedEmail(
  orderId: string,
  reason?: string | null,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true },
  });
  if (!order) return;

  await deliver(
    order.email,
    paymentFailedEmail({
      orderNumber: order.orderNumber,
      firstName: order.shippingAddress.firstName,
      totalCents: order.totalCents,
      retryUrl: `${siteConfig.url}/warenkorb`,
      reason,
    }),
  );
}

export async function sendOrderCancelledEmail(
  orderId: string,
  options: { reason?: string | null; refunded?: boolean } = {},
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true },
  });
  if (!order) return;

  await deliver(
    order.email,
    orderCancelledEmail({
      orderNumber: order.orderNumber,
      firstName: order.shippingAddress.firstName,
      totalCents: order.totalCents,
      reason: options.reason ?? null,
      refunded: options.refunded ?? false,
    }),
  );
}

export async function sendShippingConfirmationEmail(
  shipmentId: string,
): Promise<void> {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { order: { include: orderEmailInclude } },
  });
  if (!shipment) return;

  const { order } = shipment;

  const result = await deliver(
    order.email,
    shippingConfirmationEmail({
      orderNumber: order.orderNumber,
      firstName: order.shippingAddress.firstName,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      items: order.items.map((item) => ({
        productName: item.productName,
        size: item.variantSize,
        sku: item.sku,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        isPreorder: item.isPreorder,
        deliveryMinDays: item.deliveryMinDays,
        deliveryMaxDays: item.deliveryMaxDays,
      })),
      shippingAddress: order.shippingAddress,
      deliveryMinDays: order.shippingMinDays,
      deliveryMaxDays: order.shippingMaxDays,
      orderUrl: orderStatusUrl(order.accessToken),
    }),
  );

  if (result.sent) {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { notifiedAt: new Date() },
    });
  }
}

export async function sendRefundEmail(
  orderId: string,
  refundedCents: number,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true },
  });
  if (!order) return;

  await deliver(
    order.email,
    refundEmail({
      orderNumber: order.orderNumber,
      firstName: order.shippingAddress.firstName,
      refundedCents,
      totalCents: order.totalCents,
      partial: refundedCents < order.totalCents,
    }),
  );
}

/**
 * Benachrichtigt alle Interessenten, sobald eine Variante wieder Bestand hat.
 * Jede Anmeldung wird nur einmal benachrichtigt (`notifiedAt`).
 */
export async function sendBackInStockEmails(variantId: string): Promise<number> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || !variant.isActive) return 0;
  if (variant.stock - variant.reservedStock <= 0) return 0;

  const subscriptions = await prisma.backInStockSubscription.findMany({
    where: { variantId, notifiedAt: null },
    take: 200,
  });

  let sentCount = 0;

  for (const subscription of subscriptions) {
    const result = await deliver(
      subscription.email,
      backInStockEmail({
        productName: variant.product.name,
        size: variant.size,
        priceCents: variant.priceCents,
        productUrl: `${siteConfig.url}/produkt/${variant.product.slug}?variante=${variant.id}`,
        unsubscribeUrl: `${siteConfig.url}/api/benachrichtigung/abmelden?id=${subscription.id}`,
      }),
    );

    if (result.sent) {
      await prisma.backInStockSubscription.update({
        where: { id: subscription.id },
        data: { notifiedAt: new Date() },
      });
      sentCount += 1;
    }
  }

  return sentCount;
}

export async function sendNewsletterConfirmEmail(
  email: string,
  token: string,
): Promise<void> {
  await deliver(
    email,
    newsletterConfirmEmail({
      confirmUrl: `${siteConfig.url}/api/newsletter/bestaetigen?token=${token}`,
    }),
  );
}
