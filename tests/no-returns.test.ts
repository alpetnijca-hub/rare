import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validation";
import { returnsPolicy } from "@/config/site";

/**
 * Keine Rückgabe, keine Erstattung ohne Grund.
 *
 * Parfüm ist ein Kosmetikprodukt: Was einmal das Lager verlassen hat, darf
 * nicht wieder verkauft werden. In der Schweiz gibt es für Onlinebestellungen
 * kein gesetzliches Widerrufsrecht, ein Ausschluss ist also zulässig.
 *
 * Was **nicht** ausgeschlossen werden darf, ist die Gewährleistung bei
 * Mängeln, Transportschäden und Falschlieferungen (Art. 197 ff. OR; gegenüber
 * Konsumentinnen und Konsumenten nicht wegbedingbar, Art. 210 Abs. 4 OR).
 * Deshalb prüft dieser Test beides: dass die Rückgabe wirklich aus ist – und
 * dass der Weg für Mängel offen bleibt.
 */
describe("Rückgabe ausgeschlossen", () => {
  it("nimmt keine Ware ohne Grund zurück", () => {
    expect(returnsPolicy.acceptsVoluntaryReturns).toBe(false);
  });

  it("nennt keine Frist mehr für eine freiwillige Rückgabe", () => {
    // Solange irgendwo eine Rückgabefrist steht, findet sie den Weg zurück in
    // einen Seitentext – und dann steht im Shop wieder ein Rückgaberecht.
    expect(returnsPolicy).not.toHaveProperty("voluntaryDays");
    expect(returnsPolicy).not.toHaveProperty("refundDays");
    expect(returnsPolicy).not.toHaveProperty("returnShippingPaidBy");
  });

  it("lässt die Meldefrist für Transportschäden als Bitte stehen", () => {
    // Keine Ausschlussfrist: Die gesetzliche Gewährleistung läuft unabhängig
    // davon weiter. Ein früh gemeldeter Schaden ist nur leichter zu belegen.
    expect(returnsPolicy.damageReportDays).toBeGreaterThan(0);
  });
});

describe("Bestätigung an der Kasse", () => {
  const bestellung = {
    items: [{ variantId: "var_1", quantity: 1 }],
    email: "kundin@example.ch",
    shippingAddress: {
      firstName: "Anna",
      lastName: "Muster",
      street: "Bahnhofstrasse",
      houseNumber: "1",
      postalCode: "8001",
      city: "Zürich",
      country: "CH",
    },
    shippingMethod: "post",
    acceptTerms: true as const,
    acceptNoReturns: true as const,
  };

  it("nimmt eine Bestellung mit beiden Häkchen an", () => {
    expect(checkoutSchema.safeParse(bestellung).success).toBe(true);
  });

  it("weist eine Bestellung ohne Bestätigung des Ausschlusses ab", () => {
    // Eine Bedingung, die den Kauf endgültig macht, muss vor dem Klick klar
    // sein. Ein Satz in den AGB allein genügt dafür nicht.
    const ergebnis = checkoutSchema.safeParse({
      ...bestellung,
      acceptNoReturns: false,
    });

    expect(ergebnis.success).toBe(false);
    expect(JSON.stringify(ergebnis.error?.issues)).toContain("Rückgabe");
  });
});
