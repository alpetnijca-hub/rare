import type Stripe from "stripe";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { envValue } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import {
  fulfillPaidOrder,
  releaseOrderStock,
  restockOrder,
} from "@/lib/orders";
import {
  sendOrderConfirmationEmails,
  sendPaymentFailedEmail,
  sendRefundEmail,
} from "@/lib/email";

/**
 * Stripe-Webhook.
 *
 * Sicherheitsgrundsätze:
 *  1. Die Signatur wird gegen STRIPE_WEBHOOK_SECRET geprüft. Ohne gültige
 *     Signatur wird nichts verarbeitet.
 *  2. Jedes Ereignis wird über `WebhookEvent.eventId` genau einmal
 *     verarbeitet (Idempotenz) – Stripe stellt Ereignisse mehrfach zu.
 *  3. Eine Zahlung gilt ausschliesslich hier als bestätigt, niemals durch
 *     eine Rückmeldung aus dem Browser.
 */

// Node-Runtime: für die Signaturprüfung wird der rohe Request-Body benötigt.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ereignistypen, die wir verarbeiten. Alles andere wird protokolliert. */
const handledTypes = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
  "charge.refunded",
]);

function orderIdFrom(object: {
  metadata?: Stripe.Metadata | null;
  client_reference_id?: string | null;
}): string | null {
  return object.metadata?.orderId ?? object.client_reference_id ?? null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = envValue(process.env.STRIPE_WEBHOOK_SECRET);

  if (!signature || !webhookSecret) {
    console.error("[stripe-webhook] Signatur oder Secret fehlt.");
    return Response.json({ error: "Signatur fehlt." }, { status: 400 });
  }

  // Rohtext, nicht das geparste JSON – sonst schlägt die Prüfung fehl.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error(
      "[stripe-webhook] Signaturprüfung fehlgeschlagen:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return Response.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  // -------------------------------------------------------------------
  // Idempotenz: Ereignis genau einmal annehmen.
  // -------------------------------------------------------------------
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        type: event.type,
        status: handledTypes.has(event.type) ? "RECEIVED" : "IGNORED",
        attempts: 1,
      },
    });
  } catch {
    // Unique-Verletzung: Ereignis wurde bereits angenommen.
    await prisma.webhookEvent.updateMany({
      where: { eventId: event.id },
      data: { attempts: { increment: 1 } },
    });
    return Response.json({ received: true, duplicate: true });
  }

  if (!handledTypes.has(event.type)) {
    return Response.json({ received: true, ignored: true });
  }

  try {
    await handleEvent(event);

    await prisma.webhookEvent.updateMany({
      where: { eventId: event.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unbekannt";
    console.error(`[stripe-webhook] ${event.type} fehlgeschlagen:`, message);

    await prisma.webhookEvent.updateMany({
      where: { eventId: event.id },
      data: { status: "FAILED", error: message.slice(0, 500) },
    });

    // 500 signalisiert Stripe, den Versand zu wiederholen. Die Sperre wird
    // aufgehoben, damit der nächste Versuch tatsächlich verarbeitet wird.
    await prisma.webhookEvent.deleteMany({
      where: { eventId: event.id, status: "FAILED" },
    });

    return Response.json({ error: "Verarbeitung fehlgeschlagen." }, { status: 500 });
  }
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Nur wirklich bezahlte Sessions führen zur Freigabe.
      if (session.payment_status !== "paid") return;

      const orderId = orderIdFrom(session);
      if (!orderId) throw new Error("Session ohne orderId.");

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      // Zahlungsdetails für die Anzeige (Marke und letzte 4 Ziffern sind
      // keine vollständigen Kartendaten und dürfen gespeichert werden).
      let methodType: string | null = null;
      let methodBrand: string | null = null;
      let methodLast4: string | null = null;
      let chargeId: string | null = null;

      if (paymentIntentId) {
        const intent = await getStripe().paymentIntents.retrieve(paymentIntentId, {
          expand: ["latest_charge.payment_method_details"],
        });

        const charge = intent.latest_charge as Stripe.Charge | null;
        chargeId = charge?.id ?? null;
        methodType = charge?.payment_method_details?.type ?? null;
        methodBrand = charge?.payment_method_details?.card?.brand ?? null;
        methodLast4 = charge?.payment_method_details?.card?.last4 ?? null;
      }

      const result = await fulfillPaidOrder(orderId, {
        paymentIntentId,
        chargeId,
        amountCents: session.amount_total ?? 0,
        currency: session.currency ?? siteConfig.currency.toLowerCase(),
        methodType,
        methodBrand,
        methodLast4,
      });

      // E-Mails nur beim ersten erfolgreichen Durchlauf.
      if (result.firstFulfillment) {
        await sendOrderConfirmationEmails(orderId);
      }
      return;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = orderIdFrom(session);
      if (!orderId) return;

      await releaseOrderStock(orderId, "Zahlung fehlgeschlagen");
      await prisma.order.updateMany({
        where: { id: orderId, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await sendPaymentFailedEmail(orderId);
      return;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = orderIdFrom(session);
      if (!orderId) return;

      // Reservierung freigeben, damit die Ware wieder verkäuflich ist.
      const released = await releaseOrderStock(
        orderId,
        "Bezahlvorgang abgelaufen",
      );
      if (released) {
        await prisma.order.updateMany({
          where: { id: orderId, status: "PENDING_PAYMENT" },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
      }
      return;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId ?? null;
      if (!orderId) return;

      await prisma.payment.upsert({
        where: { stripePaymentIntentId: intent.id },
        create: {
          orderId,
          provider: "STRIPE",
          status: "FAILED",
          amountCents: intent.amount ?? 0,
          currency: (intent.currency ?? siteConfig.currency).toUpperCase(),
          stripePaymentIntentId: intent.id,
          failureCode: intent.last_payment_error?.code ?? null,
          failureMessage: intent.last_payment_error?.message?.slice(0, 300) ?? null,
        },
        update: {
          status: "FAILED",
          failureCode: intent.last_payment_error?.code ?? null,
          failureMessage: intent.last_payment_error?.message?.slice(0, 300) ?? null,
        },
      });

      await sendPaymentFailedEmail(orderId);
      return;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === "string" ? charge.payment_intent : null;
      if (!paymentIntentId) return;

      const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        include: { order: true },
      });
      if (!payment) return;

      const refunded = charge.amount_refunded ?? 0;
      const fullRefund = refunded >= payment.amountCents;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundedCents: refunded,
          status: fullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
        },
      });

      if (fullRefund) {
        // Vollerstattung: Ware zurück ins Lager und Bestellung als erstattet
        // markieren. `cancelOrder` ist idempotent.
        await restockOrder(
          payment.orderId,
          null,
          "Rückerstattung – Ware zurückgebucht",
        );
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "REFUNDED", refundedAt: new Date() },
        });
      }

      await sendRefundEmail(payment.orderId, refunded);
      return;
    }

    default:
      return;
  }
}
