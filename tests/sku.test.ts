import { describe, expect, it } from "vitest";
import { buildSku } from "@/lib/utils";

/**
 * Vorschlag für die Artikelnummer.
 *
 * Muss vor allem eines: eindeutig sein. Der Server weist doppelte
 * Artikelnummern ab, und das mitten im Anlegen einer Größe wäre genau die
 * Art von Reibung, die dieser Vorschlag beseitigen soll.
 */

describe("buildSku", () => {
  it("bildet ein Kürzel aus den Wortanfängen und dem Volumen", () => {
    expect(buildSku("golden-amber", 10)).toBe("GA-010");
    expect(buildSku("midnight-oud", 2)).toBe("MO-002");
    expect(buildSku("velvet-rose", 100)).toBe("VR-100");
  });

  it("kommt mit einwortigen Namen zurecht", () => {
    expect(buildSku("oud", 50)).toBe("O-050");
  });

  it("begrenzt das Kürzel auf vier Zeichen", () => {
    expect(buildSku("ein-sehr-langer-duft-name-hier", 5)).toBe("ESLD-005");
  });

  it("weicht aus, wenn die Nummer schon vergeben ist", () => {
    expect(buildSku("golden-amber", 10, ["GA-010"])).toBe("GA-010-2");
    expect(buildSku("golden-amber", 10, ["GA-010", "GA-010-2"])).toBe("GA-010-3");
  });

  it("erkennt vergebene Nummern unabhängig von der Schreibweise", () => {
    expect(buildSku("golden-amber", 10, ["ga-010"])).toBe("GA-010-2");
  });

  it("liefert auch bei leerem Slug etwas Brauchbares", () => {
    expect(buildSku("", 5)).toBe("RS-005");
  });

  it("erzeugt nur erlaubte Zeichen", () => {
    // Der Server lässt nur Buchstaben, Zahlen, Punkt, Unterstrich und Minus zu.
    for (const slug of ["golden-amber", "élan-citrus", "duft & co", ""]) {
      expect(buildSku(slug, 30)).toMatch(/^[A-Za-z0-9._-]+$/);
    }
  });
});
