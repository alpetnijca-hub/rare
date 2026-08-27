import Stripe from "stripe";
import { envValue } from "@/lib/env";

/**
 * Stripe-Client. Der Secret Key wird ausschliesslich serverseitig gelesen –
 * dieses Modul darf niemals in eine Client Component importiert werden.
 */

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;

  const secretKey = envValue(process.env.STRIPE_SECRET_KEY);
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
  return Boolean(envValue(process.env.STRIPE_SECRET_KEY));
}

/**
 * Zahlungsarten für die Checkout-Session.
 *
 * Standardfall ist "auto": Wir geben Stripe **keine** Liste vor, sondern
 * lassen die Zahlungsarten aus dem Dashboard gelten. Das hat einen handfesten
 * Vorteil: TWINT, PayPal oder eine künftige Methode schaltet man dort mit
 * einem Haken frei – ohne Codeänderung und ohne neues Deployment. Stripe
 * blendet dabei automatisch aus, was zur Währung oder zum Land der Kundin
 * nicht passt.
 *
 * Wer die Auswahl fest verdrahten will, setzt `STRIPE_PAYMENT_METHODS` auf
 * eine Liste, z. B. "card,twint". Dann gilt ausschliesslich diese.
 *
 * Apple Pay und Google Pay erscheinen in beiden Fällen automatisch, sobald
 * das Gerät sie unterstützt und die Domain in Stripe hinterlegt ist – sie
 * laufen technisch unter "card".
 */
export function checkoutPaymentMethodConfig(): Pick<
  Stripe.Checkout.SessionCreateParams,
  "payment_method_types"
> {
  const raw = envValue(process.env.STRIPE_PAYMENT_METHODS);

  // Nicht gesetzt oder ausdrücklich "auto" -> Dashboard entscheidet.
  if (raw === undefined || raw.toLowerCase() === "auto") return {};

  const methods = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean) as Stripe.Checkout.SessionCreateParams.PaymentMethodType[];

  // Eine leere Liste wäre eine Session ohne jede Zahlungsart – Stripe würde
  // sie ablehnen. Dann lieber zurück auf das Dashboard.
  if (methods.length === 0) return {};

  return { payment_method_types: methods };
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
    case "twint":
      return "TWINT";
    case "paypal":
      return "PayPal";
    case "link":
      return "Link (Stripe)";
    case "klarna":
      return "Klarna";
    case "revolut_pay":
      return "Revolut Pay";
    default:
      // Unbekannte Methode: lieber neutral benennen als raten. Der Text steht
      // in Bestellbestätigungen und im Adminbereich.
      return "Onlinezahlung";
  }
}
