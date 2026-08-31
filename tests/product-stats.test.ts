import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  minViewsForRate,
  productInterest,
  recordStat,
  statDay,
} from "@/lib/product-stats";
import { statEventSchema } from "@/lib/validation";

/**
 * Produktstatistik.
 *
 * Zwei Dinge müssen stimmen. Erstens: Es wird wirklich nur gezählt – kein
 * Cookie, keine IP, keine Kennung. Das prüft das Schema. Zweitens: Zwei
 * gleichzeitige Aufrufe dürfen sich nicht gegenseitig überschreiben, sonst
 * zählt die Tabelle bei jedem Andrang zu niedrig.
 */
const slug = "vitest-statistik-duft";

async function raeumeAuf() {
  await prisma.product.deleteMany({ where: { slug } });
}

let productId = "";

beforeEach(async () => {
  await raeumeAuf();
  const produkt = await prisma.product.create({
    data: {
      slug,
      name: "Statistikduft",
      description: "Ein Duft für die Prüfung der Zählung.",
      fragranceFamily: "ORIENTAL",
      kind: "PARFUM",
      isActive: true,
      variants: {
        create: [
          { sku: "VT-STAT-10", size: "10 ml", volumeMl: 10, priceCents: 1900, stock: 5 },
        ],
      },
    },
  });
  productId = produkt.id;
});

afterAll(raeumeAuf);

describe("Meldung aus dem Browser", () => {
  it("nimmt nur Duft und Ereignis entgegen", () => {
    const ergebnis = statEventSchema.safeParse({
      productId: "abc",
      event: "ansicht",
      // Alles Weitere fliegt raus – hier landet nichts über eine Person.
      ip: "1.2.3.4",
      sessionId: "xyz",
    });

    expect(ergebnis.success).toBe(true);
    expect(Object.keys(ergebnis.data ?? {}).sort()).toEqual(["event", "productId"]);
  });

  it("kennt nur die beiden erlaubten Ereignisse", () => {
    expect(statEventSchema.safeParse({ productId: "a", event: "kauf" }).success).toBe(
      false,
    );
  });
});

describe("Zählen", () => {
  it("legt den Tageszähler an und erhöht ihn", async () => {
    await recordStat(productId, "ansicht");
    await recordStat(productId, "ansicht");
    await recordStat(productId, "warenkorb");

    const eintrag = await prisma.productStat.findUniqueOrThrow({
      where: { productId_day: { productId, day: statDay() } },
    });

    expect(eintrag.views).toBe(2);
    expect(eintrag.cartAdds).toBe(1);
  });

  it("verliert bei gleichzeitigen Aufrufen nichts", async () => {
    // Lesen-und-schreiben würde hier zu wenig zählen: Beide Aufrufe läsen
    // denselben Stand. Der eindeutige Index macht daraus eine Anweisung.
    await Promise.all(
      Array.from({ length: 10 }, () => recordStat(productId, "ansicht")),
    );

    const eintrag = await prisma.productStat.findUniqueOrThrow({
      where: { productId_day: { productId, day: statDay() } },
    });

    expect(eintrag.views).toBe(10);
  });

  it("setzt den Tag auf Mitternacht UTC", () => {
    const tag = statDay(new Date("2026-08-31T22:45:00Z"));
    expect(tag.toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });
});

describe("Auswertung", () => {
  it("zeigt keine Quote bei zu wenigen Aufrufen", async () => {
    await recordStat(productId, "ansicht");
    await recordStat(productId, "warenkorb");

    const zeile = (await productInterest(30)).find(
      (eintrag) => eintrag.productId === productId,
    );

    // Ein Aufruf, ein Warenkorb – „100 %“ wäre hier eine Behauptung.
    expect(zeile?.views).toBe(1);
    expect(zeile?.cartRate).toBeNull();
  });

  it("rechnet die Quote ab genügend Aufrufen", async () => {
    for (let i = 0; i < minViewsForRate; i++) {
      await recordStat(productId, "ansicht");
    }
    await recordStat(productId, "warenkorb");

    const zeile = (await productInterest(30)).find(
      (eintrag) => eintrag.productId === productId,
    );

    expect(zeile?.cartRate).toBe(Math.round((1 / minViewsForRate) * 100));
  });
});
