import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";

/**
 * Probengrößen.
 *
 * Proben sind keine eigenen Produkte, sondern Größen desselben Dufts. Der
 * Shopfilter "Mit Probengröße" muss deshalb auf der Variante filtern, nicht
 * auf dem Produkt – sonst tauchen Düfte auf, die es nur im Flakon gibt.
 */

const mitProbe = "vitest-duft-mit-probe";
const ohneProbe = "vitest-duft-ohne-probe";

async function raeumeAuf() {
  await prisma.product.deleteMany({ where: { slug: { in: [mitProbe, ohneProbe] } } });
}

const basis = {
  description: "Testduft.",
  fragranceFamily: "ORIENTAL" as const,
  kind: "PARFUM" as const,
  ingredients: "Alcohol Denat., Parfum.",
  usage: "Auftragen.",
  isActive: true,
};

beforeEach(async () => {
  await raeumeAuf();

  await prisma.product.create({
    data: {
      ...basis,
      slug: mitProbe,
      name: "Duft mit Probe",
      variants: {
        create: [
          { sku: "VT-PROBE-2", size: "2 ml", volumeMl: 2, priceCents: 490, stock: 10, isSample: true },
          { sku: "VT-PROBE-50", size: "50 ml", volumeMl: 50, priceCents: 8900, stock: 4, isSample: false },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      ...basis,
      slug: ohneProbe,
      name: "Duft ohne Probe",
      variants: {
        create: [
          { sku: "VT-FLAK-50", size: "50 ml", volumeMl: 50, priceCents: 9900, stock: 4, isSample: false },
        ],
      },
    },
  });
});

afterAll(raeumeAuf);

describe("Filter „Mit Probengröße“", () => {
  it("liefert nur Düfte, die tatsächlich eine Probengröße haben", async () => {
    const { items } = await listProducts({ onlySamples: true, perPage: 48 });
    const slugs = items.map((item) => item.product.slug);

    expect(slugs).toContain(mitProbe);
    expect(slugs).not.toContain(ohneProbe);
  });

  it("liefert ohne den Filter beide Düfte", async () => {
    const { items } = await listProducts({ perPage: 48 });
    const slugs = items.map((item) => item.product.slug);

    expect(slugs).toContain(mitProbe);
    expect(slugs).toContain(ohneProbe);
  });

  it("lässt sich mit anderen Filtern kombinieren", async () => {
    // Probengröße UND ein Volumen, das es nur als Flakon gibt -> leer.
    const { items } = await listProducts({
      onlySamples: true,
      volumes: [50],
      perPage: 48,
    });
    expect(items.map((i) => i.product.slug)).not.toContain(ohneProbe);
  });
});

describe("Probengrößen am Produkt", () => {
  it("stehen als Variante desselben Produkts zur Verfügung", async () => {
    const produkt = await prisma.product.findUniqueOrThrow({
      where: { slug: mitProbe },
      include: { variants: { orderBy: { volumeMl: "asc" } } },
    });

    // Kernaussage der Umstellung: eine Produktseite, alle Größen.
    expect(produkt.variants).toHaveLength(2);
    expect(produkt.variants.filter((v) => v.isSample)).toHaveLength(1);
    expect(produkt.variants.filter((v) => !v.isSample)).toHaveLength(1);
  });

  it("markiert neue Größen standardmässig nicht als Probe", async () => {
    const variante = await prisma.productVariant.findUniqueOrThrow({
      where: { sku: "VT-FLAK-50" },
    });
    expect(variante.isSample).toBe(false);
  });
});
