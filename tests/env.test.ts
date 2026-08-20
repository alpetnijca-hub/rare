import { describe, expect, it } from "vitest";
import { envFlag, envInt, envText, envValue } from "@/lib/env";
import { includedTaxCents } from "@/lib/money";

/**
 * Leere Umgebungsvariablen.
 *
 * Genau dieser Fall entsteht beim Import in Vercel: Alle Schlüssel aus
 * `.env.example` werden vorgeschlagen, und wer eine Zeile ohne Wert stehen
 * lässt, setzt die Variable auf den leeren String. `??` greift dann nicht,
 * und `Number.parseInt("")` liefert NaN. Beides darf nicht durchschlagen.
 */

describe("envValue", () => {
  it("behandelt leere und reine Leerzeichen-Werte wie 'nicht gesetzt'", () => {
    expect(envValue("")).toBeUndefined();
    expect(envValue("   ")).toBeUndefined();
    expect(envValue("\n\t")).toBeUndefined();
    expect(envValue(undefined)).toBeUndefined();
  });

  it("entfernt umschliessende Leerzeichen", () => {
    expect(envValue("  wert  ")).toBe("wert");
  });
});

describe("envText", () => {
  it("nimmt bei leerem Wert den Rückfallwert", () => {
    expect(envText("", "http://localhost:3000")).toBe("http://localhost:3000");
    expect(envText(undefined, "http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  it("nimmt einen gesetzten Wert", () => {
    expect(envText("https://rare.ch", "http://localhost:3000")).toBe(
      "https://rare.ch",
    );
  });
});

describe("envInt", () => {
  it("liefert bei leerem Wert niemals NaN", () => {
    expect(envInt("", 0)).toBe(0);
    expect(envInt("   ", 810)).toBe(810);
    expect(envInt(undefined, 0)).toBe(0);
  });

  it("weist unlesbare und negative Werte ab", () => {
    expect(envInt("abc", 0)).toBe(0);
    expect(envInt("-5", 0)).toBe(0);
    expect(envInt("NaN", 810)).toBe(810);
  });

  it("liest gültige Werte", () => {
    expect(envInt("810", 0)).toBe(810);
    expect(envInt(" 1900 ", 0)).toBe(1900);
  });
});

describe("envFlag", () => {
  it("nimmt bei leerem Wert den Rückfallwert", () => {
    expect(envFlag("", true)).toBe(true);
    expect(envFlag(undefined, false)).toBe(false);
  });

  it("erkennt die üblichen Schreibweisen", () => {
    expect(envFlag("true", false)).toBe(true);
    expect(envFlag("TRUE", false)).toBe(true);
    expect(envFlag("1", false)).toBe(true);
    expect(envFlag("false", true)).toBe(false);
    expect(envFlag("irgendwas", true)).toBe(false);
  });
});

describe("Steuerberechnung mit kaputtem Steuersatz", () => {
  it("erzeugt niemals NaN als Betrag", () => {
    // Vor der Absicherung hätte ein leeres SHOP_TAX_RATE_BP hier NaN ergeben
    // und damit einen NaN-Betrag in die Bestellung geschrieben.
    const rateBp = envInt("", 0);
    const tax = includedTaxCents(10_000, rateBp);

    expect(Number.isNaN(tax)).toBe(false);
    expect(Number.isInteger(tax)).toBe(true);
    expect(tax).toBe(0);
  });

  it("rechnet bei gesetztem Satz korrekt weiter", () => {
    expect(includedTaxCents(10_000, envInt("810", 0))).toBe(749);
  });
});
