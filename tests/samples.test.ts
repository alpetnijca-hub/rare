import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";

/**
 * Abfüllungen.
 *
 * Abfüllungen sind keine eigenen Produkte, sondern Größen desselben Dufts.
 * Die Abteilung „Abfüllungen“ muss deshalb auf der Größe filtern und nicht
 * auf dem Produkt – sonst tauchen Düfte auf, die es nur im Flakon gibt.
 *
 * Und sie muss auch die Preise umstellen: Neben „2 ml“ gehört der Preis von
 * 2 ml, nicht der des 50-ml-Flakons.
 */

const mitProbe = "vitest-duft-mit-probe";
const ohneProbe = "vitest-duft-ohne-probe";
const ohneHaekchen = "vitest-duft-ohne-haekchen";

async function raeumeAuf() {
  await prisma.product.deleteMany({
    where: { slug: { in: [mitProbe, ohneProbe, ohneHaekchen] } },
  });
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
          { sku: "VT-PROBE-10", size: "10 ml", volumeMl: 10, priceCents: 1900, stock: 6, isSample: true },
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

  // Dieselbe kleine Größe, aber ohne gesetztes Häkchen „Probengröße“.
  await prisma.product.create({
    data: {
      ...basis,
      slug: ohneHaekchen,
      name: "Duft ohne Haekchen",
      variants: {
        create: [
          { sku: "VT-OHNE-5", size: "5 ml", volumeMl: 5, priceCents: 990, stock: 9, isSample: false },
          { sku: "VT-OHNE-50", size: "50 ml", volumeMl: 50, priceCents: 7900, stock: 3, isSample: false },
        ],
      },
    },
  });
});

afterAll(raeumeAuf);

describe("Abteilung „Abfüllungen“", () => {
  it("liefert nur Düfte, die es wirklich als Abfüllung gibt", async () => {
    const { items } = await listProducts({ onlyDecants: true, perPage: 48 });
    const slugs = items.map((item) => item.product.slug);

    expect(slugs).toContain(mitProbe);
    expect(slugs).not.toContain(ohneProbe);
  });

  it("geht nach der Menge und nicht nach dem Häkchen", async () => {
    // Das Häkchen „Probengröße“ wird von Hand gesetzt und irgendwann
    // vergessen. 5 ml sind 5 ml – der Duft gehört in die Abteilung.
    const { items } = await listProducts({ onlyDecants: true, perPage: 48 });

    expect(items.map((item) => item.product.slug)).toContain(ohneHaekchen);
  });

  it("liefert ohne den Filter alle Düfte", async () => {
    const { items } = await listProducts({ perPage: 48 });
    const slugs = items.map((item) => item.product.slug);

    expect(slugs).toContain(mitProbe);
    expect(slugs).toContain(ohneProbe);
  });

  it("lässt sich mit anderen Filtern kombinieren", async () => {
    // Abfüllung UND ein Volumen, das es nur als Flakon gibt -> leer.
    const { items } = await listProducts({
      onlyDecants: true,
      volumes: [50],
      perPage: 48,
    });
    expect(items.map((i) => i.product.slug)).not.toContain(ohneProbe);
  });
});

describe("Preise in der Abteilung „Abfüllungen“", () => {
  async function hole(slug: string, onlyDecants: boolean) {
    const { items } = await listProducts({ onlyDecants, perPage: 48 });
    return items.find((item) => item.product.slug === slug);
  }

  it("zeigt den Preis der grössten Abfüllung statt des Flakons", async () => {
    const eintrag = await hole(mitProbe, true);

    // 10 ml für CHF 19.00 – nicht die 50 ml für CHF 89.00.
    expect(eintrag?.topPriceCents).toBe(1900);
    expect(eintrag?.topVolumeMl).toBe(10);
    // Und darunter weiterhin die kleinste Abfüllung.
    expect(eintrag?.lowestPriceCents).toBe(490);
  });

  it("nennt in der Abteilung nur die kleinen Größen", async () => {
    const eintrag = await hole(mitProbe, true);

    expect(eintrag?.sizes).toEqual(["2 ml", "10 ml"]);
    expect(eintrag?.sizes).not.toContain("50 ml");
  });

  it("zeigt ohne den Filter wieder den Flakonpreis", async () => {
    const eintrag = await hole(mitProbe, false);

    expect(eintrag?.topPriceCents).toBe(8900);
    expect(eintrag?.topVolumeMl).toBe(50);
    expect(eintrag?.sizes).toContain("50 ml");
  });
});

describe("Abfüllungen am Produkt", () => {
  it("stehen als Größe desselben Produkts zur Verfügung", async () => {
    const produkt = await prisma.product.findUniqueOrThrow({
      where: { slug: mitProbe },
      include: { variants: { orderBy: { volumeMl: "asc" } } },
    });

    // Kernaussage der Umstellung: eine Produktseite, alle Größen.
    expect(produkt.variants).toHaveLength(3);
  });

  it("markiert neue Größen standardmässig nicht als Probe", async () => {
    const variante = await prisma.productVariant.findUniqueOrThrow({
      where: { sku: "VT-FLAK-50" },
    });
    expect(variante.isSample).toBe(false);
  });
});
