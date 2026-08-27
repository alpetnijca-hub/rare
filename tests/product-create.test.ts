import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { buildSku } from "@/lib/utils";
import { parsePriceToCents } from "@/lib/money";

/**
 * Duft mit Bildern und erster Größe in einem Schritt anlegen.
 *
 * Die Zusicherung, die hier zählt: Nach einem einzigen Speichern ist der Duft
 * vollständig – Bilder in der richtigen Reihenfolge, eine bestellbare Größe
 * mit gültiger Artikelnummer.
 */

const slug = "vitest-neuer-duft";

afterEach(async () => {
  await prisma.product.deleteMany({ where: { slug } });
});

async function legeAn(options: {
  bilder?: Array<{ url: string; alt: string; publicId: string | null }>;
  groesse?: { size: string; volumeMl: number; preis: string; stock: number };
}) {
  const { bilder = [], groesse } = options;

  return prisma.product.create({
    data: {
      slug,
      name: "Neuer Testduft",
      description: "Beschreibung.",
      fragranceFamily: "ORIENTAL",
      kind: "PARFUM",
      ingredients: "Alcohol Denat., Parfum.",
      usage: "Auftragen.",
      isActive: true,
      ...(bilder.length > 0
        ? {
            images: {
              create: bilder.map((bild, index) => ({ ...bild, sortOrder: index })),
            },
          }
        : {}),
      ...(groesse
        ? {
            variants: {
              create: {
                sku: buildSku(slug, groesse.volumeMl),
                size: groesse.size,
                volumeMl: groesse.volumeMl,
                priceCents: parsePriceToCents(groesse.preis)!,
                stock: groesse.stock,
              },
            },
          }
        : {}),
    },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
  });
}

describe("Anlegen mit Bildern", () => {
  it("behält die Reihenfolge – das erste Bild ist das Hauptbild", async () => {
    const produkt = await legeAn({
      bilder: [
        { url: "https://res.cloudinary.com/x/eins.jpg", alt: "Vorne", publicId: "x/eins" },
        { url: "https://res.cloudinary.com/x/zwei.jpg", alt: "Hinten", publicId: "x/zwei" },
      ],
    });

    expect(produkt.images).toHaveLength(2);
    expect(produkt.images[0]!.url).toContain("eins.jpg");
    expect(produkt.images[0]!.sortOrder).toBe(0);
    expect(produkt.images[1]!.sortOrder).toBe(1);
  });

  it("kommt ohne Bilder aus", async () => {
    const produkt = await legeAn({});
    expect(produkt.images).toHaveLength(0);
  });

  it("erlaubt Bilder ohne Cloudinary-Kennung", async () => {
    // Von Hand eingetragene Adressen haben keine publicId.
    const produkt = await legeAn({
      bilder: [{ url: "https://example.com/bild.jpg", alt: "Extern", publicId: null }],
    });
    expect(produkt.images[0]!.publicId).toBeNull();
  });
});

describe("Anlegen mit erster Größe", () => {
  it("macht den Duft sofort bestellbar", async () => {
    const produkt = await legeAn({
      groesse: { size: "50 ml", volumeMl: 50, preis: "49.90", stock: 8 },
    });

    expect(produkt.variants).toHaveLength(1);
    const variante = produkt.variants[0]!;
    expect(variante.size).toBe("50 ml");
    expect(variante.priceCents).toBe(4990);
    expect(variante.stock).toBe(8);
  });

  it("vergibt eine gültige Artikelnummer", async () => {
    const produkt = await legeAn({
      groesse: { size: "50 ml", volumeMl: 50, preis: "49.90", stock: 0 },
    });
    // Muss dem Muster entsprechen, das die Validierung serverseitig verlangt.
    expect(produkt.variants[0]!.sku).toMatch(/^[A-Za-z0-9._-]+$/);
  });

  it("legt ohne Angaben keine Größe an", async () => {
    const produkt = await legeAn({});
    expect(produkt.variants).toHaveLength(0);
  });
});

describe("Preiseingabe", () => {
  it("versteht Komma und Punkt", () => {
    expect(parsePriceToCents("49,90")).toBe(4990);
    expect(parsePriceToCents("49.90")).toBe(4990);
    expect(parsePriceToCents("5")).toBe(500);
  });

  it("weist Unsinn ab, statt still 0 zu speichern", () => {
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("gratis")).toBeNull();
    expect(parsePriceToCents("-5")).toBeNull();
  });
});
