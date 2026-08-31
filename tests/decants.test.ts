import { describe, expect, it } from "vitest";
import {
  decantCategory,
  decantMaxMl,
  decantMinMl,
  decantsOf,
  isDecantSearch,
  isDecantVolume,
} from "@/lib/decants";

/**
 * Was als Abfüllung zählt.
 *
 * Die Grenze steht an genau einer Stelle. Ohne diese Tests wandert sie beim
 * nächsten Umbau auseinander – die Abfrage filtert dann anders als die
 * Preisanzeige, und in der Abteilung „Abfüllungen“ stehen Flakonpreise.
 */
describe("Grenze der Abfüllung", () => {
  it("zählt 1 bis 10 ml dazu", () => {
    for (const menge of [1, 2, 3, 5, 8, 10]) {
      expect(isDecantVolume(menge), `${menge} ml`).toBe(true);
    }
  });

  it("zählt alles darüber nicht dazu", () => {
    for (const menge of [11, 15, 30, 50, 100, 125]) {
      expect(isDecantVolume(menge), `${menge} ml`).toBe(false);
    }
  });

  it("hält die Grenzen selbst für Abfüllungen", () => {
    expect(isDecantVolume(decantMinMl)).toBe(true);
    expect(isDecantVolume(decantMaxMl)).toBe(true);
  });

  it("trennt eine gemischte Größenliste", () => {
    const groessen = [
      { volumeMl: 2 },
      { volumeMl: 10 },
      { volumeMl: 50 },
      { volumeMl: 100 },
    ];

    expect(decantsOf(groessen)).toEqual([{ volumeMl: 2 }, { volumeMl: 10 }]);
  });
});

describe("Suche nach Abfüllungen", () => {
  it("erkennt die naheliegenden Schreibweisen", () => {
    for (const eingabe of [
      "Abfüllung",
      "Abfüllungen",
      "abfuellungen",
      "ABFÜLLUNGEN",
      "  Abfüllungen  ",
      "Probe",
      "Duftproben",
      "Tester",
      "Decant",
      "samples",
    ]) {
      expect(isDecantSearch(eingabe), `„${eingabe}“`).toBe(true);
    }
  });

  it("lässt eine echte Duftsuche in Ruhe", () => {
    // Wichtig: „Abfüllung Oud“ ist eine Suche nach Oud und darf nicht
    // stillschweigend zur ganzen Abteilung aufgeblasen werden.
    for (const eingabe of ["Oud", "Abfüllung Oud", "Vanille", "Tom", ""]) {
      expect(isDecantSearch(eingabe), `„${eingabe}“`).toBe(false);
    }
  });
});

describe("Kategorie", () => {
  it("hat einen Slug ohne Umlaut", () => {
    // Der Slug steht in der Adresszeile und in Links – Umlaute machen dort
    // nur Ärger.
    expect(decantCategory.slug).toMatch(/^[a-z-]+$/);
  });
});
