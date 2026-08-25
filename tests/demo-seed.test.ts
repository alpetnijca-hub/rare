import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  demoDataStatus,
  installDemoData,
  removeDemoData,
} from "@/lib/demo-seed";
import {
  categories as demoCategories,
  discountCodes as demoDiscountCodes,
  products as demoProducts,
} from "@/lib/demo-data";

/**
 * Demo-Inhalte.
 *
 * Der wichtigste Punkt hier ist nicht das Einspielen, sondern das Entfernen:
 * `removeDemoData()` löscht Produkte. Wenn dabei je ein echtes Produkt oder
 * eine echte Bestellung mitginge, wäre das ein Datenverlust im laufenden
 * Betrieb. Genau das sichern diese Tests ab.
 */

const echterSlug = "vitest-echtes-produkt";

async function raeumeAuf() {
  await removeDemoData(prisma);
  await prisma.product.deleteMany({ where: { slug: echterSlug } });
}

async function legeEchtesProduktAn() {
  return prisma.product.create({
    data: {
      slug: echterSlug,
      name: "Echtes Testprodukt",
      subtitle: "Kein Demo-Inhalt",
      description: "Wird von den Demo-Funktionen nicht angefasst.",
      fragranceFamily: "ORIENTAL",
      kind: "PARFUM",
      ingredients: "Alcohol Denat., Parfum.",
      usage: "Auf die Haut auftragen.",
      isDemo: false,
      isActive: true,
      variants: {
        create: {
          sku: "VITEST-ECHT-001",
          size: "50 ml",
          volumeMl: 50,
          priceCents: 9900,
          stock: 5,
        },
      },
    },
    include: { variants: true },
  });
}

beforeEach(raeumeAuf);
afterAll(raeumeAuf);

describe("installDemoData", () => {
  it("spielt Kategorien, Produkte, Größen und Rabattcodes ein", async () => {
    const result = await installDemoData(prisma);

    // Gegen die Datenquelle prüfen statt gegen feste Zahlen: Inhalte ändern
    // sich, die Zusicherung "alles wird eingespielt" bleibt.
    expect(result.products).toBe(demoProducts.length);
    expect(result.categories).toBe(demoCategories.length);
    expect(result.discountCodes).toBe(demoDiscountCodes.length);
    expect(result.variants).toBeGreaterThan(0);

    const gespeichert = await prisma.product.count({ where: { isDemo: true } });
    expect(gespeichert).toBe(demoProducts.length);
  });

  it("kennzeichnet jedes Produkt als Demo-Inhalt", async () => {
    await installDemoData(prisma);

    const nichtGekennzeichnet = await prisma.product.count({
      where: { isDemo: false },
    });
    expect(nichtGekennzeichnet).toBe(0);
  });

  it("erzeugt beim zweiten Einspielen keine Dubletten", async () => {
    await installDemoData(prisma);
    const nachErstem = await prisma.productVariant.count();

    await installDemoData(prisma);
    const nachZweitem = await prisma.productVariant.count();

    expect(nachZweitem).toBe(nachErstem);
    expect(await prisma.product.count()).toBe(demoProducts.length);
  });
});

describe("removeDemoData", () => {
  it("entfernt alle Demo-Produkte", async () => {
    await installDemoData(prisma);
    await removeDemoData(prisma);

    expect(await prisma.product.count({ where: { isDemo: true } })).toBe(0);
  });

  it("lässt echte Produkte unangetastet", async () => {
    const echt = await legeEchtesProduktAn();
    await installDemoData(prisma);

    expect(await prisma.product.count()).toBe(demoProducts.length + 1);

    await removeDemoData(prisma);

    const uebrig = await prisma.product.findMany({
      include: { variants: true },
    });
    expect(uebrig).toHaveLength(1);
    expect(uebrig[0]!.id).toBe(echt.id);
    expect(uebrig[0]!.variants).toHaveLength(1);
  });

  it("behält Kategorien, in denen noch echte Produkte liegen", async () => {
    await installDemoData(prisma);

    // Echtes Produkt in eine Demo-Kategorie hängen.
    const kategorie = await prisma.category.findFirstOrThrow();
    await prisma.product.create({
      data: {
        slug: echterSlug,
        name: "Echtes Testprodukt",
        subtitle: "In einer Demo-Kategorie",
        description: "Bleibt bestehen.",
        fragranceFamily: "ORIENTAL",
        kind: "PARFUM",
        ingredients: "Alcohol Denat., Parfum.",
        usage: "Auf die Haut auftragen.",
        isDemo: false,
        categories: { connect: { id: kategorie.id } },
      },
    });

    await removeDemoData(prisma);

    const nochDa = await prisma.category.findUnique({
      where: { id: kategorie.id },
    });
    expect(nochDa).not.toBeNull();
  });
});

describe("demoDataStatus", () => {
  it("zählt Demo- und echte Produkte getrennt", async () => {
    await legeEchtesProduktAn();
    await installDemoData(prisma);

    const status = await demoDataStatus(prisma);
    expect(status.demoProducts).toBe(demoProducts.length);
    expect(status.realProducts).toBe(1);
  });
});
