import { afterEach, describe, expect, it } from "vitest";
import { checkoutPaymentMethodConfig, describePaymentMethod } from "@/lib/stripe";

/**
 * Zahlungsarten im Checkout.
 *
 * Der Standard ist bewusst "auto": Stripe bekommt keine Liste, es gelten die
 * im Dashboard freigeschalteten Methoden. TWINT lässt sich dadurch mit einem
 * Haken aktivieren, ohne dass jemand Code anfassen muss.
 */

const original = process.env.STRIPE_PAYMENT_METHODS;

afterEach(() => {
  if (original === undefined) delete process.env.STRIPE_PAYMENT_METHODS;
  else process.env.STRIPE_PAYMENT_METHODS = original;
});

function mitEinstellung(wert: string | undefined) {
  if (wert === undefined) delete process.env.STRIPE_PAYMENT_METHODS;
  else process.env.STRIPE_PAYMENT_METHODS = wert;
  return checkoutPaymentMethodConfig();
}

describe("checkoutPaymentMethodConfig", () => {
  it("überlässt die Auswahl ohne Einstellung dem Dashboard", () => {
    expect(mitEinstellung(undefined)).toEqual({});
  });

  it("versteht 'auto' unabhängig von der Schreibweise", () => {
    expect(mitEinstellung("auto")).toEqual({});
    expect(mitEinstellung("AUTO")).toEqual({});
    expect(mitEinstellung("  Auto  ")).toEqual({});
  });

  it("übernimmt eine ausdrückliche Liste", () => {
    expect(mitEinstellung("card,twint")).toEqual({
      payment_method_types: ["card", "twint"],
    });
  });

  it("räumt Leerzeichen und Grossschreibung auf", () => {
    expect(mitEinstellung(" Card , TWINT ,paypal ")).toEqual({
      payment_method_types: ["card", "twint", "paypal"],
    });
  });

  it("fällt bei leerer Liste auf das Dashboard zurück", () => {
    // Eine Session ohne jede Zahlungsart würde Stripe ablehnen – der
    // Bezahlvorgang wäre für alle Kundinnen tot.
    expect(mitEinstellung("")).toEqual({});
    expect(mitEinstellung(" , , ")).toEqual({});
  });
});

describe("describePaymentMethod", () => {
  it("benennt TWINT", () => {
    expect(describePaymentMethod("twint")).toBe("TWINT");
  });

  it("zeigt bei Karten Marke und letzte Ziffern", () => {
    expect(describePaymentMethod("card", "visa", "4242")).toBe("Visa •••• 4242");
  });

  it("bleibt bei Unbekanntem neutral, statt zu raten", () => {
    expect(describePaymentMethod("irgendwas_neues")).toBe("Onlinezahlung");
    expect(describePaymentMethod(null)).toBe("Onlinezahlung");
  });
});
