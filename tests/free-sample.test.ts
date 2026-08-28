import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { buildQuote } from "@/lib/pricing";
import { freeSampleFromCents } from "@/config/site";

/**
 * Gratis-Abfüllung ab dem Aktionsbetrag.
 *
 * Die gewünschte Variante kommt aus dem Browser. Entscheidend ist deshalb
 * nicht, was das Formular anzeigt, sondern was `buildQuote()` daraus macht:
 * Der Preis 0 wird hier gesetzt, und hier wird geprüft, ob es überhaupt eine
 * Probe ist.
 */

const slug = "vitest-gratisprobe";

async function raeumeAuf() {
  await prisma.product.deleteMany({ where: { slug } });
}

async function legeAn() {
  return prisma.product.create({
    data: {
      slug,
      name: "Testduft Gratisprobe",
      description: "Testduft.",
      fragranceFamily: "ORIENTAL",
      kind: "PARFUM",
      ingredients: "Alcohol Denat., Parfum.",
      usage: "Auftragen.",
      isActive: true,
      variants: {
        create: [
          {
            sku: "VT-GRATIS-2",
            size: "2 ml",
            volumeMl: 2,
            priceCents: 490,
            stock: 20,
            isSample: true,
            sortOrder: 1,
          },
          {
            sku: "VT-GRATIS-100",
            size: "100 ml",
            volumeMl: 100,
            priceCents: 25000,
            stock: 5,
            isSample: false,
            sortOrder: 2,
          },
        ],
      },
    },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
}

let probe: string;
let flakon: string;

beforeEach(async () => {
  await raeumeAuf();
  const produkt = await legeAn();
  probe = produkt.variants[0].id;
  flakon = produkt.variants[1].id;
});

afterAll(async () => {
  await raeumeAuf();
});

describe("Gratis-Abfüllung", () => {
  it("wird erst ab dem Aktionsbetrag angeboten", async () => {
    const klein = await buildQuote({ items: [{ variantId: probe, quantity: 4 }] });
    expect(klein.subtotalCents).toBeLessThan(freeSampleFromCents);
    expect(klein.freeSampleEligible).toBe(false);
    expect(klein.freeSampleOptions).toEqual([]);

    const gross = await buildQuote({ items: [{ variantId: flakon, quantity: 1 }] });
    expect(gross.subtotalCents).toBeGreaterThanOrEqual(freeSampleFromCents);
    expect(gross.freeSampleEligible).toBe(true);
    expect(
      gross.freeSampleOptions.some((option) => option.variantId === probe),
    ).toBe(true);
  });

  it("legt die gewählte Abfüllung zum Preis 0 dazu", async () => {
    const quote = await buildQuote({
      items: [{ variantId: flakon, quantity: 1 }],
      freeSampleVariantId: probe,
    });

    const geschenk = quote.lines.find((line) => line.isFreeSample);
    expect(geschenk).toBeDefined();
    expect(geschenk?.unitPriceCents).toBe(0);
    expect(geschenk?.lineTotalCents).toBe(0);
    expect(geschenk?.quantity).toBe(1);

    // Der Warenwert darf sich durch das Geschenk nicht ändern.
    expect(quote.subtotalCents).toBe(25000);
    expect(quote.totalCents).toBe(25000 + quote.shippingCents);
  });

  it("nimmt keinen Flakon als Geschenk", async () => {
    // Der Kern der Sache: Wer die Anfrage selbst baut, könnte statt einer
    // 2-ml-Probe einen 100-ml-Flakon als „Geschenk“ anfordern.
    const quote = await buildQuote({
      items: [{ variantId: flakon, quantity: 1 }],
      freeSampleVariantId: flakon,
    });

    expect(quote.lines.some((line) => line.isFreeSample)).toBe(false);
    expect(quote.freeSampleVariantId).toBeNull();
    expect(quote.totalCents).toBe(25000 + quote.shippingCents);
  });

  it("ignoriert die Wahl unterhalb des Aktionsbetrags", async () => {
    const quote = await buildQuote({
      items: [{ variantId: probe, quantity: 4 }],
      freeSampleVariantId: probe,
    });

    expect(quote.lines.some((line) => line.isFreeSample)).toBe(false);
    expect(quote.freeSampleVariantId).toBeNull();
  });

  it("meldet eine ausverkaufte Wahl, statt sie stillschweigend wegzulassen", async () => {
    await prisma.productVariant.update({
      where: { id: probe },
      data: { stock: 0 },
    });

    const quote = await buildQuote({
      items: [{ variantId: flakon, quantity: 1 }],
      freeSampleVariantId: probe,
    });

    expect(quote.lines.some((line) => line.isFreeSample)).toBe(false);
    expect(quote.notices.join(" ")).toContain("Gratis-Abfüllung");
  });
});
