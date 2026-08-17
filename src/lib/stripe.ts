import Stripe from "stripe";

/**
 * Stripe-Client. Der Secret Key wird ausschliesslich serverseitig gelesen –
 * dieses Modul darf niemals in eine Client Component importiert werden.
 */

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY ist nicht gesetzt. Zahlungen sind nicht möglich.",
    );
  }

  client = new Stripe(secretKey, {
    // Fest verdrahtete API-Version: ein Stripe-Update ändert das Verhalten
    // dadurch nicht unbemerkt.
    apiVersion: "2026-07-29.dahlia",
    appInfo: { name: "Rare Scents Shop", version: "1.0.0" },
    typescript: true,
  });

  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Zahlungsmethoden für die Checkout-Session.
 *
 * "card" deckt Kredit- und Debitkarten ab; Apple Pay und Google Pay werden von
 * Stripe Checkout automatisch angeboten, sobald das Gerät sie unterstützt und
 * die Domain in Stripe registriert ist. PayPal wird nur aktiviert, wenn es im
 * Stripe-Konto freigeschaltet und STRIPE_ENABLE_PAYPAL=true gesetzt ist.
 */
export function checkoutPaymentMethods(): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const methods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
    "card",
  ];
  if (process.env.STRIPE_ENABLE_PAYPAL === "true") methods.push("paypal");
  return methods;
}

/** Lesbare Bezeichnung der verwendeten Zahlungsmethode für E-Mails. */
export function describePaymentMethod(
  type: string | null | undefined,
  brand?: string | null,
  last4?: string | null,
): string {
  switch (type) {
    case "card": {
      const brandLabel = brand
        ? brand.charAt(0).toUpperCase() + brand.slice(1)
        : "Karte";
      return last4 ? `${brandLabel} •••• ${last4}` : brandLabel;
    }
    case "paypal":
      return "PayPal";
    case "link":
      return "Link (Stripe)";
    default:
      return "Onlinezahlung";
  }
}
