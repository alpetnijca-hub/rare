import { describe, expect, it } from "vitest";
import {
  maxWorldsPerProduct,
  scentWorlds,
  scoreWorlds,
  worldsForProduct,
} from "@/lib/scent-worlds";

/**
 * Duftwelten aus den Duftnoten.
 *
 * Die Regeln stehen hier fest, weil sie sonst unbemerkt verrutschen: Ein Duft,
 * der plötzlich in fünf Kategorien auftaucht, hilft beim Stöbern nicht mehr.
 */

describe("worldsForProduct", () => {
  it("erkennt die naheliegende Welt", () => {
    const welten = worldsForProduct({
      topNotes: ["Vanille"],
      heartNotes: ["Tonkabohne"],
      baseNotes: ["Karamell"],
    });

    expect(welten.map((eintrag) => eintrag.world.slug)).toContain(
      "suess-gourmand",
    );
  });

  it("nennt die Noten, die den Ausschlag gaben", () => {
    const welten = worldsForProduct({ topNotes: ["Oud", "Zeder"] });

    expect(welten[0].world.slug).toBe("holzig-oud");
    expect(welten[0].matched).toEqual(["Oud", "Zeder"]);
  });

  it("ordnet höchstens zwei Welten zu", () => {
    // Sonst steht ein Duft am Ende in jeder Kategorie und die Einteilung
    // hilft niemandem mehr.
    const welten = worldsForProduct({
      topNotes: ["Zitrone", "Bergamotte", "Pfirsich", "Himbeere"],
      heartNotes: ["Rose", "Jasmin", "Pfeffer", "Zimt"],
      baseNotes: ["Vanille", "Karamell", "Oud", "Zeder"],
    });

    expect(welten.length).toBeLessThanOrEqual(maxWorldsPerProduct);
  });

  it("nimmt eine einzelne Note nur, wenn sie der beste Treffer ist", () => {
    // Ein Duft mit drei Holznoten und einer Pfeffernote ist holzig, nicht
    // würzig.
    const welten = worldsForProduct({
      topNotes: ["Pfeffer"],
      heartNotes: ["Zeder", "Sandelholz"],
      baseNotes: ["Vetiver"],
    });

    expect(welten.map((eintrag) => eintrag.world.slug)).toEqual(["holzig-oud"]);
  });

  it("zählt dieselbe Note nicht doppelt", () => {
    // „Rose“ steht oft in Kopf- und Herznote.
    const [treffer] = scoreWorlds({
      topNotes: ["Rose"],
      heartNotes: ["Rose"],
    });

    expect(treffer.score).toBe(1);
  });

  it("versteht Umlaute, Bindestriche und Grossschreibung", () => {
    expect(
      worldsForProduct({ topNotes: ["YLANG-YLANG"] })[0].world.slug,
    ).toBe("blumig");
    expect(worldsForProduct({ topNotes: ["Grüner Tee"] })[0].world.slug).toBe(
      "gruen-kraeuter",
    );
  });

  it("erkennt zusammengesetzte Notennamen aus echten Daten", () => {
    // So stehen sie tatsächlich in den Produkten: nicht „Oud“, sondern
    // „Oudholz“; nicht „Pfeffer“, sondern „Schwarzer Pfeffer“.
    const paare: Array<[string, string]> = [
      ["Oudholz", "holzig-oud"],
      ["Tabakblatt", "leder-rauch"],
      ["Muskatnuss", "wuerzig"],
      ["Schwarzer Pfeffer", "wuerzig"],
      ["Rosa Pfeffer", "wuerzig"],
      ["Vanilleschote", "suess-gourmand"],
      ["Zitronenschale", "frisch-zitrisch"],
    ];

    for (const [note, slug] of paare) {
      expect(
        worldsForProduct({ topNotes: [note] })[0]?.world.slug,
        `„${note}“`,
      ).toBe(slug);
    }
  });

  it("nimmt das längste passende Stichwort", () => {
    // „Eichenmoos“ enthält auch „Eiche“ – ohne diese Regel landete das Moos
    // beim Holz. „Orangenblüte“ enthält „Orange“, gehört aber zu den Blüten.
    expect(worldsForProduct({ topNotes: ["Eichenmoos"] })[0].world.slug).toBe(
      "gruen-kraeuter",
    );
    expect(worldsForProduct({ topNotes: ["Orangenblüte"] })[0].world.slug).toBe(
      "blumig",
    );
    expect(worldsForProduct({ topNotes: ["Birkenteer"] })[0].world.slug).toBe(
      "leder-rauch",
    );
  });

  it("verwechselt keine Note wegen eines kurzen Stichworts", () => {
    // Diese Fälle sind beim Erweitern der Listen tatsächlich aufgetaucht:
    // „Weisser Moschus“ enthält „eis“, „Sandelholz“ enthält „Sand“,
    // „Räucherwerk“ enthält „Rauch“ und „Rosenholz“ enthält „Rose“.
    expect(worldsForProduct({ topNotes: ["Weisser Moschus"] })).toEqual([]);

    const paare: Array<[string, string]> = [
      ["Sandelholz", "holzig-oud"],
      ["Räucherwerk", "amber-harzig"],
      ["Rosenholz", "holzig-oud"],
      ["Ebenholz", "holzig-oud"],
      ["Treibholz", "holzig-oud"],
      ["Granatapfel", "fruchtig-suess"],
      ["Zitronengras", "gruen-kraeuter"],
      ["Kokosmilch", "suess-gourmand"],
      ["Sternanis", "wuerzig"],
      ["Pfeifentabak", "leder-rauch"],
    ];

    for (const [note, slug] of paare) {
      expect(
        worldsForProduct({ topNotes: [note] })[0]?.world.slug,
        `„${note}“`,
      ).toBe(slug);
    }
  });

  it("erkennt das Meer als eigene Note", () => {
    // „Meerwasser“ enthält „Wasser“ – ohne eigenes Stichwort gäbe es statt des
    // Meeres nur ein paar Wassertropfen im Bild.
    for (const note of ["Meerwasser", "Meeresbrise", "Ozean", "Meersalz"]) {
      expect(
        worldsForProduct({ topNotes: [note] })[0]?.world.slug,
        `„${note}“`,
      ).toBe("frisch-zitrisch");
    }
  });

  it("ordnet nichts zu, wenn keine Note passt", () => {
    expect(worldsForProduct({ topNotes: ["Moschus", "Ambroxan"] })).toEqual([]);
    expect(worldsForProduct({})).toEqual([]);
  });
});

describe("scentWorlds", () => {
  it("hat eindeutige Kennungen", () => {
    const slugs = scentWorlds.map((world) => world.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("führt keine Note in zwei Welten", () => {
    // Sonst wäre nicht mehr vorhersagbar, wo ein Duft landet.
    const gesehen = new Map<string, string>();

    for (const world of scentWorlds) {
      for (const note of world.notes) {
        const schon = gesehen.get(note);
        expect(schon, `„${note}“ steht in ${schon} und ${world.slug}`).toBeUndefined();
        gesehen.set(note, world.slug);
      }
    }
  });

  it("nutzt nur kleingeschriebene Noten ohne Umlaute", () => {
    // Der Vergleich läuft über normalizeNote(); ein „Ä“ hier träfe nie.
    for (const world of scentWorlds) {
      for (const note of world.notes) {
        expect(note, `„${note}“ in ${world.slug}`).toMatch(/^[a-z]+$/);
      }
    }
  });
});
