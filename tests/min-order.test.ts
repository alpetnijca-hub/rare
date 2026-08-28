import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Mindestbestellwert.
 *
 * Die Regel muss serverseitig greifen. Ein Wert, den nur das Formular prüft,
 * lässt sich mit einer selbst gebauten Anfrage umgehen – deshalb hängt sie an
 * `quote.valid` und damit an derselben Berechnung, aus der auch die Beträge
 * für Stripe stammen.
 */

async function ladeQuote(minRappen: string | undefined) {
  vi.resetModules();
  if (minRappen === undefined) {
    delete process.env.SHOP_MIN_ORDER_CENTS;
  } else {
    process.env.SHOP_MIN_ORDER_CENTS = minRappen;
  }
  return import("@/config/site");
}

afterEach(() => {
  delete process.env.SHOP_MIN_ORDER_CENTS;
  vi.resetModules();
});

describe("minOrderCents", () => {
  it("liegt ohne Konfiguration bei CHF 15", async () => {
    const { minOrderCents } = await ladeQuote(undefined);
    expect(minOrderCents).toBe(1500);
  });

  it("lässt sich über die Umgebung ändern", async () => {
    const { minOrderCents } = await ladeQuote("2500");
    expect(minOrderCents).toBe(2500);
  });

  it("lässt sich mit 0 abschalten", async () => {
    const { minOrderCents } = await ladeQuote("0");
    expect(minOrderCents).toBe(0);
  });

  it("fällt bei unsinnigen Werten auf die Vorgabe zurück", async () => {
    // Eine leere Umgebungsvariable auf Vercel darf nicht NaN ergeben – das
    // landete sonst als NaN im Bestellbetrag.
    for (const wert of ["", "   ", "abc", "-500"]) {
      const { minOrderCents } = await ladeQuote(wert);
      expect(minOrderCents, `Wert „${wert}“`).toBe(1500);
    }
  });
});

describe("buildQuote mit Mindestbestellwert", () => {
  const slug = "vitest-mindestbestellwert";

  async function raeumeAuf() {
    const { prisma } = await import("@/lib/prisma");
    await prisma.product.deleteMany({ where: { slug } });
  }

  async function legeAn() {
    const { prisma } = await import("@/lib/prisma");
    return prisma.product.create({
      data: {
        slug,
        name: "Testduft Mindestbestellwert",
        description: "Testduft.",
        fragranceFamily: "ORIENTAL",
        kind: "PARFUM",
        ingredients: "Alcohol Denat., Parfum.",
        usage: "Auftragen.",
        isActive: true,
        variants: {
          create: [
            {
              sku: "VT-MIN-2",
              size: "2 ml",
              volumeMl: 2,
              priceCents: 800,
              stock: 50,
              isSample: true,
            },
          ],
        },
      },
      include: { variants: true },
    });
  }

  it("blockiert einen zu kleinen Warenkorb und rechnet vor, was fehlt", async () => {
    await raeumeAuf();
    const produkt = await legeAn();
    const { buildQuote } = await import("@/lib/pricing");

    // Eine Abfüllung zu CHF 8 – unter dem Mindestbestellwert von CHF 15.
    const einzeln = await buildQuote({
      items: [{ variantId: produkt.variants[0].id, quantity: 1 }],
    });

    expect(einzeln.subtotalCents).toBe(800);
    expect(einzeln.belowMinimum).toBe(true);
    expect(einzeln.missingForMinimumCents).toBe(700);
    // Entscheidend: Der Warenkorb ist damit nicht bestellbar. Daran hängt die
    // Prüfung in der Kasse.
    expect(einzeln.valid).toBe(false);

    // Zwei Abfüllungen zu CHF 8 – über dem Mindestbestellwert.
    const zwei = await buildQuote({
      items: [{ variantId: produkt.variants[0].id, quantity: 2 }],
    });

    expect(zwei.subtotalCents).toBe(1600);
    expect(zwei.belowMinimum).toBe(false);
    expect(zwei.missingForMinimumCents).toBe(0);
    expect(zwei.valid).toBe(true);

    await raeumeAuf();
  });

  it("lässt einen leeren Warenkorb in Ruhe", async () => {
    const { buildQuote } = await import("@/lib/pricing");
    const leer = await buildQuote({ items: [] });

    // Ein leerer Warenkorb ist nicht „unter dem Mindestbestellwert“, sondern
    // schlicht leer – sonst stünde die Meldung schon auf der leeren Seite.
    expect(leer.belowMinimum).toBe(false);
    expect(leer.missingForMinimumCents).toBe(0);
  });
});
