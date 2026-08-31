/**
 * Was Leute anschauen – und was sie danach nicht kaufen.
 *
 * Bei zwölf Düften ist die interessante Zahl nicht, was verkauft wurde. Das
 * steht in den Bestellungen. Interessant ist das Gegenteil: Welcher Duft wird
 * ständig angeschaut, wandert aber nie in den Warenkorb? Dort steckt
 * entweder ein Preis, der nicht passt, eine fehlende Abfüllung oder eine
 * Beschreibung, die nicht überzeugt.
 *
 * **Was hier nicht gespeichert wird:** keine IP-Adresse, keine Kennung, kein
 * Cookie, kein Verlauf. Nur ein Zähler je Duft und Kalendertag. Damit lässt
 * sich kein Verhalten einer Person nachvollziehen – deshalb braucht es dafür
 * auch keine Einwilligung und keinen weiteren Eintrag im Cookie-Banner.
 *
 * Der Preis dieser Sparsamkeit ist Ehrlichkeit über die Aussagekraft: Zwei
 * Aufrufe können dieselbe Person sein. Die Zahlen taugen für den Vergleich
 * zwischen Düften, nicht als Besucherzählung.
 */

import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Was gezählt wird. */
export type StatEvent = "ansicht" | "warenkorb";

/**
 * Der Kalendertag zu einem Zeitpunkt, auf Mitternacht UTC gesetzt.
 *
 * Bewusst UTC und nicht Schweizer Zeit: Ein Zähler, dessen Tagesgrenze sich
 * mit der Sommerzeit verschiebt, liefert zweimal im Jahr einen Tag mit 23
 * oder 25 Stunden. Für den Vergleich zwischen Düften ist das ohne Belang,
 * für eine nachvollziehbare Tabelle nicht.
 */
export function statDay(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Zähler um eins erhöhen.
 *
 * `upsert` statt lesen-und-schreiben: Zwei gleichzeitige Aufrufe würden sonst
 * denselben Stand lesen und einer der beiden ginge verloren. Der eindeutige
 * Index auf (productId, day) macht daraus eine einzige Anweisung.
 */
export async function recordStat(
  productId: string,
  event: StatEvent,
  client: Pick<PrismaClient, "productStat"> = prisma,
): Promise<void> {
  const day = statDay();
  const feld = event === "ansicht" ? "views" : "cartAdds";

  await client.productStat.upsert({
    where: { productId_day: { productId, day } },
    create: { productId, day, [feld]: 1 },
    update: { [feld]: { increment: 1 } },
  });
}

/** Eine Zeile der Auswertung im Adminbereich. */
export interface ProductInterest {
  productId: string;
  name: string;
  slug: string;
  isActive: boolean;
  views: number;
  cartAdds: number;
  /** Verkaufte Stück im selben Zeitraum, aus bezahlten Bestellungen. */
  sold: number;
  /**
   * Wie viele von hundert Ansichten im Warenkorb landen.
   * `null`, solange es zu wenige Aufrufe für eine sinnvolle Aussage gibt.
   */
  cartRate: number | null;
}

/**
 * Ab wie vielen Aufrufen eine Quote überhaupt angezeigt wird.
 *
 * Bei drei Aufrufen und einem Warenkorb stünde dort „33 %“ – eine Zahl, die
 * nach Erkenntnis aussieht und keine ist. Lieber ein Strich.
 */
export const minViewsForRate = 20;

/** Statuswerte, die als verkauft zählen. */
const bezahlt = [
  "PAID",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
] as const;

/**
 * Auswertung über die letzten `days` Tage, absteigend nach Aufrufen.
 *
 * Verkäufe kommen aus den Bestellpositionen und nicht aus einem eigenen
 * Zähler: Was bezahlt wurde, steht ohnehin schon fest und muss nicht ein
 * zweites Mal mitgeschrieben werden, wo es auseinanderlaufen könnte.
 */
export async function productInterest(days = 30): Promise<ProductInterest[]> {
  const seit = statDay();
  seit.setUTCDate(seit.getUTCDate() - (days - 1));

  const [stats, produkte, verkauft] = await Promise.all([
    prisma.productStat.groupBy({
      by: ["productId"],
      where: { day: { gte: seit } },
      _sum: { views: true, cartAdds: true },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, slug: true, isActive: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { not: null },
        order: { status: { in: [...bezahlt] }, createdAt: { gte: seit } },
      },
      _sum: { quantity: true },
    }),
  ]);

  const nachId = new Map(produkte.map((produkt) => [produkt.id, produkt]));
  const verkaufNachId = new Map(
    verkauft.map((eintrag) => [eintrag.productId, eintrag._sum.quantity ?? 0]),
  );

  const zeilen: ProductInterest[] = [];

  for (const eintrag of stats) {
    const produkt = nachId.get(eintrag.productId);
    if (!produkt) continue;

    const views = eintrag._sum.views ?? 0;
    const cartAdds = eintrag._sum.cartAdds ?? 0;

    zeilen.push({
      productId: produkt.id,
      name: produkt.name,
      slug: produkt.slug,
      isActive: produkt.isActive,
      views,
      cartAdds,
      sold: verkaufNachId.get(produkt.id) ?? 0,
      cartRate:
        views >= minViewsForRate ? Math.round((cartAdds / views) * 100) : null,
    });
  }

  return zeilen.sort((a, b) => b.views - a.views || a.name.localeCompare(b.name));
}
