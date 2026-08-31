import { describe, expect, it } from "vitest";
import { wishlistSchema } from "@/lib/validation";
import { rateLimits } from "@/lib/rate-limit";

/**
 * Merkliste.
 *
 * Die Liste selbst steht im Browser. Entscheidend ist, was der Server davon
 * annimmt: ausschliesslich Produkt-IDs. Kämen von dort Namen oder Preise,
 * stünden auf der Merklistenseite Zahlen, die niemand geprüft hat.
 */
describe("Anfrage der Merkliste", () => {
  it("nimmt eine Liste von IDs entgegen", () => {
    const ergebnis = wishlistSchema.safeParse({ ids: ["abc", "def"] });

    expect(ergebnis.success).toBe(true);
    expect(ergebnis.data?.ids).toEqual(["abc", "def"]);
  });

  it("nimmt eine leere Liste entgegen", () => {
    expect(wishlistSchema.safeParse({ ids: [] }).success).toBe(true);
  });

  it("nimmt nichts ausser IDs an", () => {
    // Ein Browser, der Preise mitschickt, bekommt sie nicht zurück – das
    // Schema wirft alles Zusätzliche weg.
    const ergebnis = wishlistSchema.safeParse({
      ids: ["abc"],
      priceCents: 1,
      name: "Geschenkt",
    });

    expect(ergebnis.success).toBe(true);
    expect(Object.keys(ergebnis.data ?? {})).toEqual(["ids"]);
  });

  it("weist unsinnige Einträge ab", () => {
    for (const eingabe of [
      { ids: "abc" },
      { ids: [123] },
      { ids: [""] },
      { ids: ["x".repeat(65)] },
      {},
    ]) {
      expect(wishlistSchema.safeParse(eingabe).success, JSON.stringify(eingabe)).toBe(
        false,
      );
    }
  });

  it("deckelt die Länge", () => {
    // Ein defektes Skript soll die Abfrage nicht ins Unermessliche treiben.
    const zuViele = Array.from({ length: 201 }, (_, i) => `id-${i}`);
    expect(wishlistSchema.safeParse({ ids: zuViele }).success).toBe(false);
  });

  it("ist gegen zu häufige Abfragen abgesichert", () => {
    expect(rateLimits.wishlist.limit).toBeGreaterThan(0);
    expect(rateLimits.wishlist.windowMs).toBeGreaterThan(0);
  });
});
