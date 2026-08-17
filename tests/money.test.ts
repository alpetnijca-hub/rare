import { describe, expect, it } from "vitest";
import {
  basePricePer100Ml,
  centsToInput,
  discountPercent,
  includedTaxCents,
  parsePriceToCents,
} from "@/lib/money";
import { applyDiscount } from "@/lib/discount";
import type { DiscountCode } from "@prisma/client";
import {
  calculateShippingCents,
  getShippingMethod,
  isSupportedCountry,
} from "@/lib/shipping";

/**
 * Geldrechnung.
 *
 * Alle Beträge sind Integer in Cent. Rundungsfehler hier würden zu
 * abweichenden Rechnungsbeträgen führen.
 */

describe("parsePriceToCents", () => {
  it("akzeptiert Punkt und Komma als Dezimaltrenner", () => {
    expect(parsePriceToCents("49.90")).toBe(4990);
    expect(parsePriceToCents("49,90")).toBe(4990);
  });

  it("akzeptiert ganze Zahlen", () => {
    expect(parsePriceToCents("50")).toBe(5000);
  });

  it("entfernt umgebende Leerzeichen", () => {
    expect(parsePriceToCents(" 17.90 ")).toBe(1790);
  });

  it("weist ungültige Eingaben ab", () => {
    expect(parsePriceToCents("abc")).toBeNull();
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("-5")).toBeNull();
    expect(parsePriceToCents("1.234")).toBeNull();
  });

  it("ist mit centsToInput umkehrbar", () => {
    expect(parsePriceToCents(centsToInput(1790))).toBe(1790);
  });
});

describe("includedTaxCents", () => {
  it("errechnet die im Bruttopreis enthaltene Steuer (8,1 %)", () => {
    // 108.10 brutto enthält 8.10 Steuer.
    expect(includedTaxCents(10810, 810)).toBe(810);
  });

  it("errechnet die enthaltene Steuer bei 19 %", () => {
    expect(includedTaxCents(11900, 1900)).toBe(1900);
  });

  it("liefert 0 bei Steuersatz 0", () => {
    expect(includedTaxCents(10000, 0)).toBe(0);
  });

  it("rundet auf ganze Cent", () => {
    const result = includedTaxCents(8370, 810);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(627);
  });
});

describe("basePricePer100Ml", () => {
  it("rechnet den Grundpreis je 100 ml aus", () => {
    // 17.90 für 10 ml -> 179.00 je 100 ml
    expect(basePricePer100Ml(1790, 10)).toBe(17900);
  });

  it("funktioniert auch bei Größen über 100 ml", () => {
    expect(basePricePer100Ml(8900, 100)).toBe(8900);
  });

  it("liefert null bei fehlendem Volumen", () => {
    expect(basePricePer100Ml(1790, 0)).toBeNull();
  });
});

describe("discountPercent", () => {
  it("errechnet die Ersparnis in Prozent", () => {
    expect(discountPercent(1490, 1890)).toBe(21);
  });

  it("liefert null ohne gültigen Vergleichspreis", () => {
    expect(discountPercent(1490, null)).toBeNull();
    expect(discountPercent(1490, 1000)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Rabattcodes
// ---------------------------------------------------------------------------

function code(overrides: Partial<DiscountCode> = {}): DiscountCode {
  return {
    id: "code-1",
    code: "TEST",
    description: null,
    type: "PERCENT",
    value: 1000,
    minSubtotalCents: 0,
    maxRedemptions: null,
    usedCount: 0,
    startsAt: null,
    endsAt: null,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  } as DiscountCode;
}

describe("applyDiscount", () => {
  it("rechnet Prozentrabatte auf Basis von Basispunkten", () => {
    const result = applyDiscount(code({ value: 1000 }), 9070);

    expect(result.valid).toBe(true);
    expect(result.discountCents).toBe(907);
  });

  it("rechnet Festbeträge unverändert an", () => {
    const result = applyDiscount(code({ type: "FIXED", value: 500 }), 4000);

    expect(result.valid).toBe(true);
    expect(result.discountCents).toBe(500);
  });

  it("begrenzt den Rabatt auf den Warenwert", () => {
    const result = applyDiscount(code({ type: "FIXED", value: 10000 }), 3000);

    expect(result.discountCents).toBe(3000);
    expect(result.discountCents).toBeLessThanOrEqual(3000);
  });

  it("setzt bei Gratisversand keinen Warenrabatt", () => {
    const result = applyDiscount(code({ type: "FREE_SHIPPING", value: 0 }), 5000);

    expect(result.valid).toBe(true);
    expect(result.freeShipping).toBe(true);
    expect(result.discountCents).toBe(0);
  });

  it("weist deaktivierte Codes ab", () => {
    const result = applyDiscount(code({ isActive: false }), 5000);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("INACTIVE");
  });

  it("weist abgelaufene Codes ab", () => {
    const result = applyDiscount(
      code({ endsAt: new Date("2020-01-01") }),
      5000,
      new Date("2026-08-17"),
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("EXPIRED");
  });

  it("weist noch nicht gültige Codes ab", () => {
    const result = applyDiscount(
      code({ startsAt: new Date("2030-01-01") }),
      5000,
      new Date("2026-08-17"),
    );

    expect(result.reason).toBe("NOT_STARTED");
  });

  it("weist vollständig eingelöste Codes ab", () => {
    const result = applyDiscount(
      code({ maxRedemptions: 10, usedCount: 10 }),
      5000,
    );

    expect(result.reason).toBe("EXHAUSTED");
  });

  it("prüft den Mindestbestellwert", () => {
    const result = applyDiscount(code({ minSubtotalCents: 5000 }), 4999);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("MIN_SUBTOTAL");
  });

  it("lässt den Code bei genau erreichtem Mindestwert zu", () => {
    const result = applyDiscount(code({ minSubtotalCents: 5000 }), 5000);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Versandkosten
// ---------------------------------------------------------------------------

describe("calculateShippingCents", () => {
  const standard = getShippingMethod("standard")!;

  it("berechnet die Standardkosten unterhalb der Freigrenze", () => {
    expect(calculateShippingCents(standard, 1000)).toBe(standard.priceCents);
  });

  it("liefert ab der Freigrenze kostenlos", () => {
    expect(calculateShippingCents(standard, standard.freeFromCents!)).toBe(0);
  });

  it("berücksichtigt den Gutschein für Gratisversand", () => {
    expect(calculateShippingCents(standard, 500, true)).toBe(0);
  });

  it("gewährt Gratisversand erst nach Abzug des Rabatts", () => {
    const express = getShippingMethod("express")!;
    // Express hat keine Freigrenze – der Preis bleibt bestehen.
    expect(calculateShippingCents(express, 100_000)).toBe(express.priceCents);
  });
});

describe("isSupportedCountry", () => {
  it("erkennt Lieferländer", () => {
    expect(isSupportedCountry("CH")).toBe(true);
    expect(isSupportedCountry("DE")).toBe(true);
  });

  it("weist nicht belieferte Länder ab", () => {
    expect(isSupportedCountry("US")).toBe(false);
    expect(isSupportedCountry("")).toBe(false);
  });
});
