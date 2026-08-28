import { afterEach, describe, expect, it } from "vitest";
import {
  productImageUrl,
  productThumbUrl,
  sceneHint,
} from "@/lib/product-image";
import { signatureError } from "@/components/admin/use-cloudinary-upload";
import { fragranceFamilies } from "@/lib/catalog";
import { motifFromNotes, sceneMotif, usedNotes } from "@/config/scent-scenes";

/**
 * Einheitliche Produktbilder.
 *
 * Die Umformung passiert in der Bild-Adresse. Geht sie schief, sieht man das
 * erst im Shop – deshalb ist hier genau festgehalten, was hineingehört und
 * was unangetastet bleiben muss.
 */

const cloudinary =
  "https://res.cloudinary.com/demo/image/upload/v1699999999/rare-scents/flakon.jpg";

describe("productImageUrl", () => {
  it("setzt Format, Hintergrund und Polsterung ein", () => {
    const result = productImageUrl(cloudinary, "card");

    expect(result).toContain("/upload/c_pad,");
    expect(result).toContain("w_1000");
    expect(result).toContain("h_1250");
    expect(result).toContain("b_rgb:080808");
    expect(result).toContain("f_auto");
    // Der Bildpfad selbst muss erhalten bleiben.
    expect(result).toContain("rare-scents/flakon.jpg");
  });

  it("polstert statt zuzuschneiden", () => {
    // c_fill würde Flakonhälse abschneiden – das darf nie passieren.
    expect(productImageUrl(cloudinary)).not.toContain("c_fill");
    expect(productImageUrl(cloudinary)).not.toContain("c_crop");
  });

  it("nutzt je nach Fläche die passende Hintergrundfarbe", () => {
    expect(productImageUrl(cloudinary, "card")).toContain("b_rgb:080808");
    expect(productImageUrl(cloudinary, "detail")).toContain("b_rgb:151515");
  });

  it("lässt fremde Adressen unverändert", () => {
    // Von Hand eingetragene Bilder sollen weiter funktionieren.
    const fremd = "https://example.com/bilder/flakon.jpg";
    expect(productImageUrl(fremd)).toBe(fremd);

    const lokal = "/produkte/demo.svg";
    expect(productImageUrl(lokal)).toBe(lokal);
  });

  it("überschreibt vorhandene Transformationen nicht", () => {
    const bereitsBearbeitet =
      "https://res.cloudinary.com/demo/image/upload/w_500,c_fill/v1/flakon.jpg";
    expect(productImageUrl(bereitsBearbeitet)).toBe(bereitsBearbeitet);
  });

  it("skaliert auf Wunsch, behält aber das Seitenverhältnis", () => {
    const klein = productImageUrl(cloudinary, "card", 0.5);
    expect(klein).toContain("w_500");
    expect(klein).toContain("h_625");
  });

  it("kommt mit unerwarteten Adressen zurecht, statt zu stürzen", () => {
    expect(productImageUrl("")).toBe("");
    expect(productImageUrl("https://res.cloudinary.com/demo/")).toBe(
      "https://res.cloudinary.com/demo/",
    );
  });
});

describe("productThumbUrl", () => {
  it("erzeugt ein Quadrat", () => {
    const result = productThumbUrl(cloudinary, 240);
    expect(result).toContain("w_240");
    expect(result).toContain("h_240");
    expect(result).toContain("c_pad");
  });

  it("lässt fremde Adressen unverändert", () => {
    expect(productThumbUrl("/produkte/demo.svg")).toBe("/produkte/demo.svg");
  });
});

describe("Hintergrund im Foto", () => {
  const original = process.env.SHOP_IMAGE_BACKGROUND;
  const originalTol = process.env.SHOP_IMAGE_BACKGROUND_TOLERANCE;

  afterEach(() => {
    if (original === undefined) delete process.env.SHOP_IMAGE_BACKGROUND;
    else process.env.SHOP_IMAGE_BACKGROUND = original;
    if (originalTol === undefined) delete process.env.SHOP_IMAGE_BACKGROUND_TOLERANCE;
    else process.env.SHOP_IMAGE_BACKGROUND_TOLERANCE = originalTol;
  });

  it("lässt das Foto ohne Einstellung unangetastet", () => {
    delete process.env.SHOP_IMAGE_BACKGROUND;
    const result = productImageUrl(cloudinary);
    expect(result).not.toContain("e_make_transparent");
    expect(result).not.toContain("e_background_removal");
  });

  it("entfernt eine einfarbige Fläche, wenn eingeschaltet", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "transparent";
    const result = productImageUrl(cloudinary);
    expect(result).toContain("e_make_transparent:30/");
    // Die Reihenfolge zählt: erst freistellen, dann polstern.
    expect(result.indexOf("e_make_transparent")).toBeLessThan(
      result.indexOf("c_pad"),
    );
  });

  it("übernimmt eine eigene Toleranz", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "transparent";
    process.env.SHOP_IMAGE_BACKGROUND_TOLERANCE = "55";
    expect(productImageUrl(cloudinary)).toContain("e_make_transparent:55/");
  });

  it("weist unsinnige Toleranzen ab, statt ein kaputtes Bild zu erzeugen", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "transparent";
    for (const wert of ["0", "-5", "500", "viel", ""]) {
      process.env.SHOP_IMAGE_BACKGROUND_TOLERANCE = wert;
      expect(productImageUrl(cloudinary)).toContain("e_make_transparent:30/");
    }
  });

  it("nutzt das Freistellen per KI, wenn eingeschaltet", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "ai";
    expect(productImageUrl(cloudinary)).toContain("e_background_removal/");
  });

  it("fällt bei unbekannter Einstellung auf 'unverändert' zurück", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "irgendwas";
    const result = productImageUrl(cloudinary);
    expect(result).not.toContain("e_make_transparent");
    expect(result).not.toContain("e_background_removal");
  });
});

describe("Kulisse aus den Duftnoten", () => {
  afterEach(() => {
    delete process.env.SHOP_IMAGE_BACKGROUND;
  });

  it("setzt zur Duftfamilie passende Motive ein", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    const zitrus = productImageUrl(cloudinary, "card", 1, { fragranceFamily: "ZITRUS" });
    const holzig = productImageUrl(cloudinary, "card", 1, { fragranceFamily: "HOLZIG" });

    expect(zitrus).toContain("lemons");
    expect(holzig).toContain("cedar");
    // Der Wortlaut darf sich ändern, die Zuordnung nicht: Jede Familie muss
    // ihr eigenes Motiv bekommen.
    expect(zitrus).not.toBe(holzig);
  });

  it("gibt allen Kulissen dieselbe Bildsprache", () => {
    // Sonst sehen die Produktbilder nebeneinander aus wie zufällig
    // zusammengesuchte Fotos statt wie eine Serie.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    for (const familie of ["ZITRUS", "HOLZIG", "LEDER", "FLORAL"]) {
      expect(productImageUrl(cloudinary, "card", 1, { fragranceFamily: familie })).toContain(
        "warm%20golden%20light",
      );
    }
  });

  it("polstert zuerst und erzeugt die Kulisse danach", () => {
    // Andersherum füllt die Kulisse nur den Ausschnitt des Originalfotos und
    // oben und unten blieben schwarze Balken stehen.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";
    const result = productImageUrl(cloudinary, "card", 1, { fragranceFamily: "FLORAL" });

    const pad = result.indexOf("c_pad");
    const scene = result.indexOf("e_gen_background_replace");
    expect(pad).toBeGreaterThan(-1);
    expect(scene).toBeGreaterThan(pad);
  });

  it("enthält kein Komma im Kulissentext", () => {
    // Ein Komma trennt in einer Cloudinary-Adresse die Anweisungen. Stünde
    // eines im Text, zerfiele die Adresse und Cloudinary antwortete mit 400.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";
    const result = productImageUrl(cloudinary, "card", 1, { fragranceFamily: "GOURMAND" });
    const teil = result.split("e_gen_background_replace:prompt_")[1].split("/")[0];

    expect(teil).not.toContain(",");
    expect(teil).not.toContain("%2C");
  });

  it("erzeugt für Karte und Produktseite dieselbe Adresse", () => {
    // Gleiche Adresse heisst ein einziges erzeugtes Bild – und damit nur
    // einmal Guthaben statt zweimal.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    expect(productImageUrl(cloudinary, "card", 1, { fragranceFamily: "LEDER" })).toBe(
      productImageUrl(cloudinary, "detail", 1, { fragranceFamily: "LEDER" }),
    );
  });

  it("stellt bei unbekannter Duftfamilie nur frei, statt eine Kulisse zu raten", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    for (const familie of [null, undefined, "GIBTESNICHT"]) {
      const result = productImageUrl(cloudinary, "card", 1, { fragranceFamily: familie });
      expect(result).toContain("e_background_removal/");
      expect(result).not.toContain("e_gen_background_replace");
    }
  });

  it("versteht auch die deutsche Schreibweise", () => {
    for (const wert of ["szene", "duftnoten", "SCENE"]) {
      process.env.SHOP_IMAGE_BACKGROUND = wert;
      expect(productImageUrl(cloudinary, "card", 1, { fragranceFamily: "ZITRUS" })).toContain(
        "e_gen_background_replace",
      );
    }
  });

  it("baut die Kulisse aus Kopf- und Herznoten", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    const result = productImageUrl(cloudinary, "card", 1, {
      fragranceFamily: "HOLZIG",
      topNotes: ["Zitrone"],
      heartNotes: ["Rose"],
    });

    expect(result).toContain("lemons");
    expect(result).toContain("rose");
    // Die Duftnoten schlagen die Duftfamilie – sonst wäre der Eintrag im
    // Adminbereich wirkungslos.
    expect(result).not.toContain("cedar");
  });

  it("fällt ohne darstellbare Note auf die Duftfamilie zurück", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    // Moschus und Ambroxan sind Gerüche ohne Gegenstand – dafür gibt es
    // bewusst kein Motiv.
    const result = productImageUrl(cloudinary, "card", 1, {
      fragranceFamily: "HOLZIG",
      topNotes: ["Moschus"],
      heartNotes: ["Ambroxan"],
    });

    expect(result).toContain("cedar");
  });

  it("nimmt höchstens zwei Noten ins Bild", () => {
    // Mit drei Motiven wird die Beschreibung so lang, dass das Bildmodell die
    // dunkle Bildsprache am Ende überliest – im Test kam eine helle blaue
    // Kulisse heraus statt der dunklen.
    const motiv = motifFromNotes(["Zitrone", "Rose", "Vanille", "Leder"]);

    expect(motiv).not.toBeNull();
    expect(motiv).toContain("lemons");
    expect(motiv).toContain("rose");
    expect(motiv).not.toContain("vanilla");
    expect(motiv).not.toContain("leather");
  });

  it("stellt die dunkle Bildsprache an den Anfang", () => {
    // Das Modell gewichtet den Anfang der Beschreibung am stärksten. Stand
    // "dark" nur hinten, kam eine helle Kulisse heraus.
    expect(motifFromNotes(["Zitrone"])).toMatch(/^dark moody/);
  });

  it("versteht Umlaute, Grossschreibung und Leerzeichen", () => {
    for (const schreibweise of ["Vanille", "vanille", " VANILLE "]) {
      expect(motifFromNotes([schreibweise])).toContain("vanilla pods");
    }
    expect(motifFromNotes(["Grüner Tee"])).toContain("green tea");
  });

  it("nennt dieselbe Note nicht zweimal", () => {
    // „Rose“ steht oft in Kopf- und Herznote.
    const motiv = motifFromNotes(["Rose", "Rose", "Zitrone"]);
    expect(motiv?.match(/rose petals/g)).toHaveLength(1);
  });

  it("meldet für den Adminbereich, welche Noten verwendet werden", () => {
    expect(usedNotes(["Zitrone", "Moschus", "Vanille"])).toEqual([
      "Zitrone",
      "Vanille",
    ]);
    expect(usedNotes(["Zitrone", "Rose", "Vanille"])).toEqual([
      "Zitrone",
      "Rose",
    ]);
    expect(usedNotes(["Moschus", "Ambroxan"])).toEqual([]);
  });

  it("lässt keine Duftnote die Bildadresse zerlegen", () => {
    // Die Noten kommen aus einem Eingabefeld. Ein Komma oder Schrägstrich
    // darin würde in einer Cloudinary-Adresse als Trenner gelesen.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    const result = productImageUrl(cloudinary, "card", 1, {
      topNotes: ["Zitrone, mit Komma / und Schrägstrich"],
      heartNotes: ["Vanille"],
    });
    const teil = result.split("e_gen_background_replace:prompt_")[1].split("/")[0];

    expect(teil).not.toContain(",");
    expect(teil).not.toContain("%2C");
    expect(teil).not.toContain("%2F");
  });

  it("hat für jede Duftfamilie ein Motiv", () => {
    // Ohne diesen Test fällt eine neu angelegte Duftfamilie erst auf, wenn ein
    // Produkt im Shop ohne Kulisse dasteht – und niemand weiss, warum.
    for (const familie of fragranceFamilies) {
      expect(
        sceneMotif({ fragranceFamily: familie }),
        `Kulisse fehlt für ${familie}`,
      ).not.toBeNull();
    }
  });

  it("lässt Vorschaubilder ohne Kulisse", () => {
    // Ein anderes Format wäre ein weiteres erzeugtes Bild und damit doppeltes
    // Guthaben – für 240 Pixel lohnt sich das nicht.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";
    const result = productThumbUrl(cloudinary);

    expect(result).not.toContain("e_gen_background_replace");
    expect(result).toContain("e_background_removal/");
  });
});

describe("Hinweis im Adminbereich", () => {
  afterEach(() => {
    delete process.env.SHOP_IMAGE_BACKGROUND;
  });

  it("schweigt, solange keine Kulisse eingeschaltet ist", () => {
    expect(sceneHint({ topNotes: ["Zitrone"] })).toBeNull();
  });

  it("nennt die Noten, die tatsächlich im Bild landen", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    const hinweis = sceneHint({
      topNotes: ["Zitrone", "Moschus"],
      heartNotes: ["Vanille"],
    });

    expect(hinweis).toContain("Zitrone");
    expect(hinweis).toContain("Vanille");
    // Moschus hat kein Aussehen und darf nicht als verwendet gemeldet werden.
    expect(hinweis).not.toContain("Moschus");
  });

  it("erklärt, warum die Duftfamilie einspringt", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    const hinweis = sceneHint({
      fragranceFamily: "HOLZIG",
      topNotes: ["Moschus"],
    });

    expect(hinweis).toContain("Duftfamilie");
  });

  it("sagt, was zu tun ist, wenn gar nichts hinterlegt ist", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "scene";
    expect(sceneHint({})).toContain("Kopf- oder Herznote");
  });
});

describe("signatureError", () => {
  /**
   * Vorher stand bei jedem fehlgeschlagenen Upload „Cloudinary ist nicht
   * eingerichtet“ – auch bei abgelaufener Anmeldung. Das schickt einen in die
   * falsche Richtung, deshalb ist hier festgehalten, dass die Fälle
   * auseinandergehalten werden.
   */
  it("nennt bei 503 die fehlenden Zugangsdaten und den nötigen Deploy", () => {
    const meldung = signatureError(503);
    expect(meldung).toContain("CLOUDINARY_API_SECRET");
    expect(meldung).toContain("Deploy");
  });

  it("nennt bei 401 und 403 die abgelaufene Anmeldung, nicht Cloudinary", () => {
    for (const status of [401, 403]) {
      const meldung = signatureError(status);
      expect(meldung).toContain("Anmeldung");
      expect(meldung).not.toContain("Cloudinary");
    }
  });

  it("nennt bei 429 die Wartezeit", () => {
    expect(signatureError(429)).toContain("Warte");
  });

  it("nennt bei unbekannten Fehlern den Statuscode", () => {
    expect(signatureError(500)).toContain("500");
  });
});
