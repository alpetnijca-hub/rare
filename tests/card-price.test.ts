import { describe, expect, it } from "vitest";
import { toListItem } from "@/lib/products";

/**
 * Preis auf der Produktkarte.
 *
 * Steht dort „ab CHF 4.90“, liest man das als Preis des Parfüms – dabei ist es
 * der Preis einer 2-ml-Probe. Deshalb steht vorn der Preis der teuersten
 * Größe, und der Grundpreis daneben muss sich auf genau diese Größe beziehen.
 */

type Variante = {
  id: string;
  size: string;
  volumeMl: number;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  preorderEnabled: boolean;
  restockDate: Date | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  isSample: boolean;
  sku: string;
  sortOrder: number;
};

function variante(teil: Partial<Variante> & { id: string; priceCents: number; volumeMl: number }): Variante {
  return {
    size: `${teil.volumeMl} ml`,
    sku: `SKU-${teil.id}`,
    compareAtPriceCents: null,
    stock: 10,
    reservedStock: 0,
    lowStockThreshold: 2,
    isActive: true,
    preorderEnabled: false,
    restockDate: null,
    deliveryMinDays: 1,
    deliveryMaxDays: 3,
    isSample: false,
    sortOrder: 0,
    ...teil,
  };
}

function produkt(varianten: Variante[]) {
  return {
    id: "p1",
    slug: "testduft",
    name: "Testduft",
    subtitle: null,
    scentProfile: null,
    fragranceFamily: "ORIENTAL" as const,
    topNotes: [],
    heartNotes: [],
    baseNotes: [],
    kind: "PARFUM" as const,
    isAlternative: false,
    isDemo: false,
    isBestseller: false,
    isNew: false,
    popularity: 0,
    createdAt: new Date(),
    images: [],
    variants: varianten,
    categories: [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("toListItem", () => {
  it("zeigt den Preis der teuersten Größe", () => {
    const item = toListItem(
      produkt([
        variante({ id: "a", volumeMl: 2, priceCents: 490, isSample: true }),
        variante({ id: "b", volumeMl: 10, priceCents: 1490 }),
        variante({ id: "c", volumeMl: 100, priceCents: 8900 }),
      ]),
    );

    expect(item.topPriceCents).toBe(8900);
    expect(item.topVolumeMl).toBe(100);
    // Die günstigste Größe bleibt bekannt – sie steht klein darunter.
    expect(item.lowestPriceCents).toBe(490);
  });

  it("nimmt bei gleichem Preis die grössere Menge", () => {
    // Sonst gehörte der Grundpreis daneben zur kleineren Flasche.
    const item = toListItem(
      produkt([
        variante({ id: "a", volumeMl: 30, priceCents: 5000 }),
        variante({ id: "b", volumeMl: 50, priceCents: 5000 }),
      ]),
    );

    expect(item.topVolumeMl).toBe(50);
  });

  it("nimmt den Streichpreis der teuersten Größe", () => {
    const item = toListItem(
      produkt([
        variante({ id: "a", volumeMl: 2, priceCents: 490, compareAtPriceCents: 600 }),
        variante({ id: "b", volumeMl: 100, priceCents: 8900, compareAtPriceCents: 9900 }),
      ]),
    );

    expect(item.topPriceCents).toBe(8900);
    expect(item.compareAtPriceCents).toBe(9900);
  });

  it("kommt mit einer einzigen Größe zurecht", () => {
    const item = toListItem(produkt([variante({ id: "a", volumeMl: 50, priceCents: 5490 })]));

    expect(item.topPriceCents).toBe(5490);
    expect(item.lowestPriceCents).toBe(5490);
  });

  it("kommt ohne Größen zurecht, statt zu stürzen", () => {
    const item = toListItem(produkt([]));

    expect(item.topPriceCents).toBe(0);
    expect(item.lowestPriceCents).toBe(0);
    expect(item.purchasable).toBe(false);
    expect(item.availability).toBeNull();
  });
});
