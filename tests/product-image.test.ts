import { afterEach, describe, expect, it } from "vitest";
import { productImageUrl, productThumbUrl } from "@/lib/product-image";
import { signatureError } from "@/components/admin/use-cloudinary-upload";

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

    const zitrus = productImageUrl(cloudinary, "card", 1, "ZITRUS");
    const holzig = productImageUrl(cloudinary, "card", 1, "HOLZIG");

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
      expect(productImageUrl(cloudinary, "card", 1, familie)).toContain(
        "warm%20golden%20light",
      );
    }
  });

  it("polstert zuerst und erzeugt die Kulisse danach", () => {
    // Andersherum füllt die Kulisse nur den Ausschnitt des Originalfotos und
    // oben und unten blieben schwarze Balken stehen.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";
    const result = productImageUrl(cloudinary, "card", 1, "FLORAL");

    const pad = result.indexOf("c_pad");
    const scene = result.indexOf("e_gen_background_replace");
    expect(pad).toBeGreaterThan(-1);
    expect(scene).toBeGreaterThan(pad);
  });

  it("enthält kein Komma im Kulissentext", () => {
    // Ein Komma trennt in einer Cloudinary-Adresse die Anweisungen. Stünde
    // eines im Text, zerfiele die Adresse und Cloudinary antwortete mit 400.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";
    const result = productImageUrl(cloudinary, "card", 1, "GOURMAND");
    const teil = result.split("e_gen_background_replace:prompt_")[1].split("/")[0];

    expect(teil).not.toContain(",");
    expect(teil).not.toContain("%2C");
  });

  it("erzeugt für Karte und Produktseite dieselbe Adresse", () => {
    // Gleiche Adresse heisst ein einziges erzeugtes Bild – und damit nur
    // einmal Guthaben statt zweimal.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    expect(productImageUrl(cloudinary, "card", 1, "LEDER")).toBe(
      productImageUrl(cloudinary, "detail", 1, "LEDER"),
    );
  });

  it("stellt bei unbekannter Duftfamilie nur frei, statt eine Kulisse zu raten", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "scene";

    for (const familie of [null, undefined, "GIBTESNICHT"]) {
      const result = productImageUrl(cloudinary, "card", 1, familie);
      expect(result).toContain("e_background_removal/");
      expect(result).not.toContain("e_gen_background_replace");
    }
  });

  it("versteht auch die deutsche Schreibweise", () => {
    for (const wert of ["szene", "duftnoten", "SCENE"]) {
      process.env.SHOP_IMAGE_BACKGROUND = wert;
      expect(productImageUrl(cloudinary, "card", 1, "ZITRUS")).toContain(
        "e_gen_background_replace",
      );
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
