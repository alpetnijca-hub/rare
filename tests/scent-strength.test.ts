import { describe, expect, it } from "vitest";
import { adminProductSchema } from "@/lib/validation";
import {
  isStrength,
  strengthLabel,
  strengthMax,
  strengthMin,
  strengthSteps,
} from "@/lib/scent-strength";

/**
 * Haltbarkeit und Sillage.
 *
 * Wichtigster Punkt: „keine Angabe“ muss durchgehen und als `null` ankommen.
 * Landet stattdessen eine 0 oder eine 1 in der Datenbank, behauptet die
 * Produktseite eine Einschätzung, die nie jemand getroffen hat – und das bei
 * einem Shop, der keine Rückgabe annimmt.
 */
describe("Skala", () => {
  it("erkennt gültige Werte", () => {
    for (const wert of strengthSteps) {
      expect(isStrength(wert), `${wert}`).toBe(true);
    }
  });

  it("weist alles ausserhalb ab", () => {
    for (const wert of [0, -1, strengthMax + 1, 2.5, null, undefined, NaN]) {
      expect(isStrength(wert as number), `${wert}`).toBe(false);
    }
  });

  it("hat für jede Stufe einen Text", () => {
    for (const wert of strengthSteps) {
      expect(strengthLabel("longevity", wert), `Haltbarkeit ${wert}`).toBeTruthy();
      expect(strengthLabel("sillage", wert), `Sillage ${wert}`).toBeTruthy();
    }
  });

  it("gibt ohne Angabe nichts zurück", () => {
    expect(strengthLabel("longevity", null)).toBeNull();
    expect(strengthLabel("sillage", undefined)).toBeNull();
  });
});

describe("Eingabe im Adminbereich", () => {
  const basis = {
    name: "Testduft",
    slug: "testduft",
    description: "Eine ausreichend lange Beschreibung für die Prüfung.",
    fragranceFamily: "ORIENTAL",
    kind: "PARFUM",
    topNotes: "Zitrone",
    heartNotes: "",
    baseNotes: "",
  };

  it("nimmt eine Stufe entgegen", () => {
    const ergebnis = adminProductSchema.safeParse({
      ...basis,
      longevity: "4",
      sillage: "2",
    });

    expect(ergebnis.success).toBe(true);
    expect(ergebnis.data?.longevity).toBe(4);
    expect(ergebnis.data?.sillage).toBe(2);
  });

  it("macht aus „keine Angabe“ ein leeres Feld und keine Null", () => {
    const ergebnis = adminProductSchema.safeParse({
      ...basis,
      longevity: "",
      sillage: "",
    });

    expect(ergebnis.success).toBe(true);
    expect(ergebnis.data?.longevity).toBeNull();
    expect(ergebnis.data?.sillage).toBeNull();
  });

  it("kommt auch ohne die Felder aus", () => {
    // Bestehende Formulare und Skripte senden sie nicht mit.
    const ergebnis = adminProductSchema.safeParse(basis);

    expect(ergebnis.success).toBe(true);
    expect(ergebnis.data?.longevity).toBeNull();
  });

  it("weist Werte ausserhalb der Skala ab", () => {
    for (const wert of ["0", "6", "-2"]) {
      const ergebnis = adminProductSchema.safeParse({ ...basis, longevity: wert });
      expect(ergebnis.success, `„${wert}“`).toBe(false);
    }
    expect(strengthMin).toBe(1);
  });
});
