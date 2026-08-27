import { describe, expect, it } from "vitest";
import { productImageUrl, productThumbUrl } from "@/lib/product-image";

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
