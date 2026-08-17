import { NextRequest } from "next/server";
import { siteConfig } from "@/config/site";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { buildQuote } from "@/lib/pricing";
import {
  attachCheckoutSession,
  createPendingOrder,
  InsufficientStockError,
  releaseOrderStock,
} from "@/lib/orders";
import { checkoutPaymentMethods, getStripe, isStripeConfigured } from "@/lib/stripe";
import { rateLimit, rateLimits, tooManyRequests } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/utils";
import { formatPrice } from "@/lib/money";

/**
 * Startet den Bezahlvorgang.
 *
 * Ablauf:
 *  1. Eingaben mit Zod validieren.
 *  2. Warenkorb SERVERSEITIG neu berechnen (Preise nie aus dem Browser).
 *  3. Bestellung anlegen und Bestand reservieren.
 *  4. Stripe-Checkout-Session mit den serverseitigen Beträgen erzeugen.
 *  5. Weiterleitungs-URL zurückgeben.
 *
 * Die Bestellung gilt erst nach dem verifizierten Webhook als bezahlt.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers) ?? "unbekannt";

  const limit = await rateLimit(
    `checkout:${ip}`,
    rateLimits.checkout.limit,
    rateLimits.checkout.windowMs,
  );
  if (!limit.success) return tooManyRequests(limit);

  if (!isStripeConfigured()) {
    console.error("[checkout] STRIPE_SECRET_KEY fehlt.");
    return Response.json(
      {
        error:
          "Die Bezahlung ist derzeit nicht verfügbar. Bitte versuche es später erneut.",
      },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Bitte prüfe deine Eingaben.",
        fields: fieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const billingAddress = input.billingDiffers
    ? input.billingAddress!
    : input.shippingAddress;

  // ---------------------------------------------------------------------
  // Serverseitige Neuberechnung – hier entstehen die verbindlichen Beträge.
  // ---------------------------------------------------------------------
  const quote = await buildQuote({
    items: input.items,
    shippingMethodKey: input.shippingMethod,
    country: input.shippingAddress.country,
    discountCode: input.discountCode || null,
  });

  if (!quote.valid || quote.lines.length === 0) {
    return Response.json(
      {
        error:
          quote.notices[0] ??
          "Der Warenkorb ist leer oder enthält keine bestellbaren Artikel.",
        notices: quote.notices,
        removedVariantIds: quote.removed.map((entry) => entry.variantId),
      },
      { status: 409 },
    );
  }

  // Wurden Mengen reduziert oder Positionen entfernt, muss der Kunde das
  // sehen und erneut bestätigen – niemals stillschweigend weniger liefern.
  if (quote.notices.length > 0) {
    return Response.json(
      {
        error:
          "Der Warenkorb hat sich geändert. Bitte prüfe die Angaben und bestelle erneut.",
        notices: quote.notices,
        removedVariantIds: quote.removed.map((entry) => entry.variantId),
        requiresReview: true,
      },
      { status: 409 },
    );
  }

  if (quote.totalCents <= 0) {
    return Response.json(
      { error: "Der Gesamtbetrag ist ungültig." },
      { status: 400 },
    );
  }

  // ---------------------------------------------------------------------
  // Bestellung anlegen und Bestand reservieren.
  // ---------------------------------------------------------------------
  let order;
  try {
    order = await createPendingOrder({
      quote,
      email: input.email,
      phone: input.phone || null,
      shippingAddress: input.shippingAddress,
      billingAddress,
      customerNote: input.customerNote || null,
      marketingOptIn: input.marketingOptIn,
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return Response.json(
        { error: error.message, requiresReview: true },
        { status: 409 },
      );
    }
    console.error(
      "[checkout] Bestellung konnte nicht angelegt werden:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return Response.json(
      { error: "Die Bestellung konnte nicht angelegt werden." },
      { status: 500 },
    );
  }

  // ---------------------------------------------------------------------
  // Stripe-Checkout-Session.
  // ---------------------------------------------------------------------
  try {
    const stripe = getStripe();

    // Positionen aus den serverseitig berechneten Werten aufbauen.
    const lineItems = quote.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: siteConfig.currency.toLowerCase(),
        unit_amount: line.unitPriceCents,
        product_data: {
          name: `${line.productName} – ${line.size}`,
          description: line.isPreorder
            ? `Vorbestellung · Art.-Nr. ${line.sku}`
            : `Art.-Nr. ${line.sku}`,
          metadata: { variantId: line.variantId, sku: line.sku },
        },
      },
    }));

    // Versand als eigene Position, damit der Beleg vollständig ist.
    if (quote.shippingCents > 0 && quote.shippingMethod) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: siteConfig.currency.toLowerCase(),
          unit_amount: quote.shippingCents,
          product_data: {
            name: `Versand – ${quote.shippingMethod.label}`,
            description: "Versandkosten",
            metadata: { variantId: "", sku: "VERSAND" },
          },
        },
      });
    }

    // Rabatt über einen Stripe-Coupon abbilden (Beträge bleiben konsistent).
    const discounts = quote.discountCents > 0
      ? [
          {
            coupon: (
              await stripe.coupons.create({
                amount_off: quote.discountCents,
                currency: siteConfig.currency.toLowerCase(),
                duration: "once",
                name: `Gutschein ${quote.discount.code?.code ?? ""}`.trim(),
                metadata: { orderId: order.id },
              })
            ).id,
          },
        ]
      : undefined;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: checkoutPaymentMethods(),
        line_items: lineItems,
        discounts,
        customer_email: input.email,
        client_reference_id: order.id,
        // Zahlungsdaten liegen ausschliesslich bei Stripe.
        success_url: `${siteConfig.url}/bestellung/${order.accessToken}?bezahlt=1`,
        cancel_url: `${siteConfig.url}/kasse?abgebrochen=1`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
        payment_intent_data: {
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
          description: `Bestellung ${order.orderNumber} – ${siteConfig.name}`,
        },
        // Reservierung und Session laufen zusammen ab.
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        locale: "de",
      },
      // Verhindert doppelte Sessions bei mehrfachem Absenden.
      { idempotencyKey: `checkout-${order.id}` },
    );

    if (!session.url) {
      throw new Error("Stripe hat keine Weiterleitungs-URL geliefert.");
    }

    await attachCheckoutSession(
      order.id,
      session.id,
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    );

    return Response.json({
      url: session.url,
      orderNumber: order.orderNumber,
      totalLabel: formatPrice(quote.totalCents),
    });
  } catch (error) {
    // Zahlung nicht gestartet: Reservierung sofort wieder freigeben,
    // damit die Ware nicht unnötig blockiert bleibt.
    await releaseOrderStock(order.id, "Zahlung konnte nicht gestartet werden");

    console.error(
      "[checkout] Stripe-Session fehlgeschlagen:",
      error instanceof Error ? error.message : "unbekannt",
    );

    return Response.json(
      {
        error:
          "Die Zahlung konnte nicht gestartet werden. Bitte versuche es erneut.",
      },
      { status: 502 },
    );
  }
}
