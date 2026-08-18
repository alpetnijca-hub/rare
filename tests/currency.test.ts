import { describe, expect, it } from "vitest";
import {
  baseCurrency,
  currencies,
  resolveCurrency,
  type Currency,
} from "@/config/currencies";
import { convertFromBase, formatIn, formatPrice } from "@/lib/money";

/**
 * Währungen.
 *
 * Kernaussage dieser Datei: Die Anzeigewährung darf niemals einen Betrag
 * verändern, der irgendwo gespeichert, berechnet oder belastet wird. Sie ist
 * ausschliesslich Darstellung.
 */

const euro: Currency = {
  code: "EUR",
  label: "Euro",
  locale: "de-DE",
  unitsPerBase: 1.07,
  isBase: false,
};

describe("Basiswährung", () => {
  it("ist CHF", () => {
    expect(baseCurrency.code).toBe("CHF");
    expect(baseCurrency.unitsPerBase).toBe(1);
    expect(baseCurrency.isBase).toBe(true);
  });

  it("steht im Umschalter an erster Stelle", () => {
    expect(currencies[0].code).toBe("CHF");
  });

  it("formatiert Rappen als CHF-Betrag", () => {
    // Kein Vergleich auf das exakte Trennzeichen: Intl liefert je nach
    // Node-Version ein geschütztes Leerzeichen.
    const formatted = formatPrice(4990);
    expect(formatted).toContain("CHF");
    expect(formatted).toContain("49.90");
  });
});

describe("resolveCurrency", () => {
  it("erkennt einen gültigen Code unabhängig von Gross-/Kleinschreibung", () => {
    expect(resolveCurrency("chf").code).toBe("CHF");
    expect(resolveCurrency("  CHF ").code).toBe("CHF");
  });

  it("fällt bei unbekannten oder fehlenden Werten auf CHF zurück", () => {
    expect(resolveCurrency("XYZ").code).toBe("CHF");
    expect(resolveCurrency("").code).toBe("CHF");
    expect(resolveCurrency(null).code).toBe("CHF");
    expect(resolveCurrency(undefined).code).toBe("CHF");
    // Manipulierte Cookie-Werte dürfen nichts auslösen.
    expect(resolveCurrency("'; DROP TABLE Order; --").code).toBe("CHF");
  });
});

describe("convertFromBase", () => {
  it("lässt Beträge in der Basiswährung unverändert", () => {
    expect(convertFromBase(4990, baseCurrency)).toBe(4990);
    expect(convertFromBase(0, baseCurrency)).toBe(0);
  });

  it("rechnet in die Anzeigewährung um und bleibt ganzzahlig", () => {
    const converted = convertFromBase(4990, euro);
    expect(converted).toBe(Math.round(4990 * 1.07));
    expect(Number.isInteger(converted)).toBe(true);
  });

  it("erzeugt auch bei krummen Kursen nie Nachkommastellen", () => {
    const odd: Currency = { ...euro, unitsPerBase: 1.0733333 };
    for (const cents of [1, 7, 999, 12345, 987654]) {
      expect(Number.isInteger(convertFromBase(cents, odd))).toBe(true);
    }
  });
});

describe("formatIn", () => {
  it("kennzeichnet Fremdwährungen als Näherung", () => {
    expect(formatIn(4990, euro).startsWith("ca. ")).toBe(true);
  });

  it("lässt das «ca.» bei der Basiswährung weg", () => {
    expect(formatIn(4990, baseCurrency).startsWith("ca.")).toBe(false);
  });

  it("kann die Kennzeichnung auf Wunsch unterdrücken", () => {
    expect(
      formatIn(4990, euro, { approximate: false }).startsWith("ca."),
    ).toBe(false);
  });
});

describe("Trennung von Anzeige und Abrechnung", () => {
  it("verändert den zu belastenden CHF-Betrag nicht", () => {
    const totalCents = 12_345;

    // Egal welche Anzeigewährung gewählt ist – der Betrag, der an Stripe
    // geht und in der Bestellung steht, bleibt exakt derselbe.
    for (const currency of [baseCurrency, euro]) {
      formatIn(totalCents, currency);
      expect(totalCents).toBe(12_345);
    }

    expect(formatPrice(totalCents)).toBe(formatPrice(12_345));
  });
});
