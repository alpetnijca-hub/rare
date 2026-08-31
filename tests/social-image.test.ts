import { afterEach, describe, expect, it } from "vitest";
import {
  productSocialImageUrl,
  socialImageRatio,
} from "@/lib/product-image";

/**
 * Vorschaubild beim Teilen.
 *
 * Der Shop lebt über Instagram: Fast jeder Besuch beginnt mit einem Link in
 * einer Nachricht oder Story. Was dort als Bild erscheint, ist damit die
 * erste Begegnung mit dem Shop – und war vorher die rohe Datei so wie
 * hochgeladen, hochkant und ohne die Kulisse aus den Duftnoten.
 */
const cloudinary =
  "https://res.cloudinary.com/demo/image/upload/v1699999999/rare-scents/flakon.jpg";

const duft = {
  fragranceFamily: "ZITRUS",
  topNotes: ["Zitrone"],
  heartNotes: [],
  baseNotes: [],
};

afterEach(() => {
  delete process.env.SHOP_IMAGE_BACKGROUND;
});

describe("Vorschaubild beim Teilen", () => {
  it("liefert das Querformat, das die Netzwerke erwarten", () => {
    const result = productSocialImageUrl(cloudinary, duft);

    expect(result).toContain(`w_${socialImageRatio.width}`);
    expect(result).toContain(`h_${socialImageRatio.height}`);
  });

  it("polstert statt zu beschneiden", () => {
    // An einem echten Produktbild geprüft: Ein Zuschnitt auf 1200×630
    // schneidet dem Flakon Deckel und Sockel ab.
    const result = productSocialImageUrl(cloudinary, duft);

    expect(result).toContain("c_pad");
    expect(result).not.toContain("c_fill");
  });

  it("nimmt die Kulisse aus den Duftnoten mit", () => {
    process.env.SHOP_IMAGE_BACKGROUND = "scene";
    const result = productSocialImageUrl(cloudinary, duft);

    expect(result).toContain("e_gen_background_replace");
    expect(result).toContain("fresh%20lemons");
  });

  it("erzeugt die Kulisse zeichengleich mit der Produktseite", () => {
    // Sonst hielte Cloudinary es für ein anderes Bild und erzeugte die
    // Kulisse ein zweites Mal – auf Kosten des Guthabens.
    process.env.SHOP_IMAGE_BACKGROUND = "scene";
    const result = productSocialImageUrl(cloudinary, duft);

    expect(result).toContain("c_pad,w_1000,h_1250,b_rgb:080808/e_gen_background_replace");
  });

  it("lässt fremde Adressen unangetastet", () => {
    const fremd = "https://example.com/bild.jpg";
    expect(productSocialImageUrl(fremd, duft)).toBe(fremd);
  });
});
