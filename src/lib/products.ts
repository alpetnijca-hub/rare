import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAvailability, type Availability } from "@/lib/availability";
import {
  familyLabels,
  fragranceFamilies,
  kindLabels,
  sortOptions,
  type SortKey,
} from "@/lib/catalog";
import { decantMaxMl, decantMinMl, decantsOf } from "@/lib/decants";

export { familyLabels, kindLabels, sortOptions };
export type { SortKey };

/**
 * Datenzugriff für den Katalog.
 *
 * Die Verfügbarkeit hängt von `stock - reservedStock` ab. Zwei Spalten lassen
 * sich in Prisma nicht direkt miteinander vergleichen, deshalb wird in zwei
 * Schritten gearbeitet:
 *   1. schmale Abfrage aller passenden Varianten (nur Zahlenfelder),
 *   2. exakte Auswertung in JavaScript, danach das Laden der Seite.
 * Das liefert korrekte Ergebnisse und bleibt bis in den vierstelligen
 * Produktbereich schnell.
 */

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  subtitle: true,
  scentProfile: true,
  fragranceFamily: true,
  // Die Duftnoten bestimmen die Kulisse hinter dem Flakon, siehe
  // src/config/scent-scenes.ts. Die Basisnoten gehören dazu: Dort steht meist,
  // wofür ein Duft bekannt ist – Oud, Vanille, Amber, Leder.
  topNotes: true,
  heartNotes: true,
  baseNotes: true,
  kind: true,
  isAlternative: true,
  isDemo: true,
  isBestseller: true,
  isNew: true,
  popularity: true,
  createdAt: true,
  images: {
    orderBy: { sortOrder: "asc" },
    take: 2,
    select: { url: true, alt: true, width: true, height: true },
  },
  variants: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      size: true,
      volumeMl: true,
      isSample: true,
      priceCents: true,
      compareAtPriceCents: true,
      stock: true,
      reservedStock: true,
      lowStockThreshold: true,
      isActive: true,
      preorderEnabled: true,
      restockDate: true,
      deliveryMinDays: true,
      deliveryMaxDays: true,
    },
  },
  categories: { select: { slug: true, name: true, kind: true } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

/** Produktkarte mit vorberechneten Anzeigewerten. */
export interface ProductListItem {
  product: ProductCardData;
  /** Günstigste aktive Variante – Basis für "ab X". */
  /**
   * Preis, der auf der Produktkarte steht: der der **teuersten** Größe.
   *
   * Bewusst nicht der günstigste. Steht auf einer Karte „ab CHF 4.90“, liest
   * man das als Preis des Parfüms – dabei ist es der Preis einer 2-ml-Probe.
   * Die grosse Zahl vorn beugt genau diesem Missverständnis vor.
   */
  topPriceCents: number;
  /** Streichpreis der teuersten Größe, falls gesetzt. */
  compareAtPriceCents: number | null;
  /** Millilitermenge der teuersten Größe – für den Grundpreis. */
  topVolumeMl: number;
  /**
   * Günstigste Größe. Steht klein unter dem Preis, damit trotzdem erkennbar
   * bleibt, dass es den Duft auch zum Ausprobieren gibt.
   */
  lowestPriceCents: number;
  /** Beste Verfügbarkeit über alle Varianten. */
  availability: Availability | null;
  sizes: string[];
  purchasable: boolean;
  /**
   * Die Größe, von der die Zahlen auf dieser Karte stammen – als Anhang an
   * den Link zur Produktseite.
   *
   * Nur in der Abteilung „Abfüllungen“ gesetzt: Wer dort eine Karte mit
   * „10 ml · CHF 19.00“ anklickt, soll auf der Produktseite auch 10 ml
   * ausgewählt vorfinden und nicht den 100-ml-Flakon. Sonst ist der Wert
   * `null`, denn im Normalfall wählt die Produktseite ohnehin die Größe, die
   * auf der Karte stand.
   */
  linkVariantId: string | null;
}

export interface ProductFilters {
  search?: string;
  categories?: string[];
  families?: string[];
  /** Volumen in ml, z. B. [2, 5, 10]. */
  volumes?: number[];
  minPriceCents?: number;
  maxPriceCents?: number;
  onlyAvailable?: boolean;
  /**
   * Nur Düfte, die es als Abfüllung gibt (1–10 ml).
   *
   * Ist dieser Filter gesetzt, rechnen die Karten auch nur mit den
   * Abfüllungen: Preis, Grundpreis, Größenliste und Verfügbarkeit beziehen
   * sich dann auf die kleinen Größen. Sonst stünde in der Abteilung
   * „Abfüllungen“ der Preis des 100-ml-Flakons.
   */
  onlyDecants?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface ProductListResult {
  items: ProductListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

/**
 * Worauf sich die Zahlen auf der Karte beziehen.
 *
 * `"alle"` ist der Normalfall: Der Preis der grössten Größe steht vorn.
 * `"abfuellung"` blendet die grossen Flakons aus – in der Abteilung
 * „Abfüllungen“ soll neben dem Wort „2 ml“ auch der Preis von 2 ml stehen und
 * nicht der des 100-ml-Flakons.
 */
export type PriceScope = "alle" | "abfuellung";

/**
 * Wandelt ein Produkt in die Anzeigeform für Karten und Listen.
 *
 * Bei `scope: "abfuellung"` wird durchgehend nur mit den Abfüllungen
 * gerechnet – Preis, Streichpreis, Grundpreis, Größenliste und
 * Verfügbarkeit. Halbe Sachen wären hier schlimmer als gar keine: Ein
 * Abfüllungspreis über einer Lagerampel, die vom 100-ml-Flakon stammt, ist
 * eine falsche Auskunft.
 */
export function toListItem(
  product: ProductCardData,
  scope: PriceScope = "alle",
): ProductListItem {
  // Gibt es keine Abfüllung, bleibt es bei allen Größen. Das kann über die
  // Shopliste nicht passieren – dort filtert schon die Abfrage –, wohl aber
  // über Empfehlungen und die Startseite.
  const decants = decantsOf(product.variants);
  const variants =
    scope === "abfuellung" && decants.length > 0 ? decants : product.variants;

  if (variants.length === 0) {
    return {
      product,
      topPriceCents: 0,
      compareAtPriceCents: null,
      topVolumeMl: 0,
      lowestPriceCents: 0,
      availability: null,
      sizes: [],
      purchasable: false,
      linkVariantId: null,
    };
  }

  const cheapest = variants.reduce((min, variant) =>
    variant.priceCents < min.priceCents ? variant : min,
  );

  // Teuerste Größe: Bei Gleichstand gewinnt die grössere Menge, damit der
  // Grundpreis daneben zur wirklich grössten Flasche gehört.
  const dearest = variants.reduce((max, variant) =>
    variant.priceCents > max.priceCents ||
    (variant.priceCents === max.priceCents && variant.volumeMl > max.volumeMl)
      ? variant
      : max,
  );

  // Beste Verfügbarkeit gewinnt: lieferbar schlägt vorbestellbar schlägt nicht verfügbar.
  const rank: Record<string, number> = {
    IN_STOCK: 0,
    LOW_STOCK: 1,
    PREORDER: 2,
    OUT_OF_STOCK: 3,
    UNAVAILABLE: 4,
  };

  const availabilities = variants.map((variant) => getAvailability(variant));
  const best = availabilities.reduce((bestSoFar, current) =>
    rank[current.state] < rank[bestSoFar.state] ? current : bestSoFar,
  );

  return {
    product,
    topPriceCents: dearest.priceCents,
    compareAtPriceCents: dearest.compareAtPriceCents,
    topVolumeMl: dearest.volumeMl,
    lowestPriceCents: cheapest.priceCents,
    availability: best,
    sizes: variants.map((variant) => variant.size),
    purchasable: availabilities.some((entry) => entry.purchasable),
    linkVariantId: scope === "abfuellung" ? dearest.id : null,
  };
}

function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.search) {
    const term = filters.search.trim().slice(0, 80);
    if (term) {
      and.push({
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { subtitle: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { scentProfile: { contains: term, mode: "insensitive" } },
          { topNotes: { has: term } },
          { heartNotes: { has: term } },
          { baseNotes: { has: term } },
          { variants: { some: { sku: { contains: term, mode: "insensitive" } } } },
        ],
      });
    }
  }

  if (filters.categories?.length) {
    // Mehrere Kategorien wirken additiv (ODER) – Kunden erwarten eine
    // grössere Auswahl, nicht eine leere Ergebnisliste.
    and.push({ categories: { some: { slug: { in: filters.categories } } } });
  }

  if (filters.families?.length) {
    const valid = filters.families.filter((family) =>
      (fragranceFamilies as readonly string[]).includes(family),
    ) as Prisma.EnumFragranceFamilyFilter["in"];
    if (valid && valid.length > 0) {
      and.push({ fragranceFamily: { in: valid } });
    }
  }

  const variantConditions: Prisma.ProductVariantWhereInput = { isActive: true };

  if (filters.volumes?.length) {
    variantConditions.volumeMl = { in: filters.volumes };
  }

  if (filters.onlyDecants) {
    // Mit einer zusätzlich gewählten Größe schneidet sich beides: Wer 5 ml
    // angehakt hat und „Abfüllungen“ ansieht, will 5-ml-Abfüllungen sehen.
    variantConditions.volumeMl = {
      ...(typeof variantConditions.volumeMl === "object" &&
      variantConditions.volumeMl !== null
        ? variantConditions.volumeMl
        : {}),
      gte: decantMinMl,
      lte: decantMaxMl,
    };
  }

  if (filters.minPriceCents !== undefined || filters.maxPriceCents !== undefined) {
    variantConditions.priceCents = {
      ...(filters.minPriceCents !== undefined ? { gte: filters.minPriceCents } : {}),
      ...(filters.maxPriceCents !== undefined ? { lte: filters.maxPriceCents } : {}),
    };
  }

  if (Object.keys(variantConditions).length > 1) {
    and.push({ variants: { some: variantConditions } });
  } else {
    and.push({ variants: { some: { isActive: true } } });
  }

  if (and.length > 0) where.AND = and;
  return where;
}

/** Sortierschlüssel in eine Prisma-Sortierung übersetzen. */
function buildOrderBy(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "neu":
      return [{ createdAt: "desc" }, { name: "asc" }];
    case "name":
      return [{ name: "asc" }];
    case "beliebt":
    default:
      return [{ popularity: "desc" }, { isBestseller: "desc" }, { name: "asc" }];
  }
}

export async function listProducts(
  filters: ProductFilters = {},
): Promise<ProductListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(48, Math.max(6, filters.perPage ?? 12));
  const sort: SortKey = filters.sort ?? "beliebt";
  const where = buildWhere(filters);
  const scope: PriceScope = filters.onlyDecants ? "abfuellung" : "alle";

  // Schritt 1: schmale Abfrage für die exakte Verfügbarkeits- und Preislogik.
  const candidates = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      popularity: true,
      isBestseller: true,
      createdAt: true,
      variants: {
        where: { isActive: true },
        select: {
          priceCents: true,
          stock: true,
          reservedStock: true,
          lowStockThreshold: true,
          isActive: true,
          preorderEnabled: true,
          restockDate: true,
          deliveryMinDays: true,
          deliveryMaxDays: true,
          volumeMl: true,
          isSample: true,
        },
      },
    },
    orderBy: buildOrderBy(sort),
  });

  let filtered = candidates.filter((product) => product.variants.length > 0);

  if (filters.onlyAvailable) {
    filtered = filtered.filter((product) =>
      product.variants.some((variant) => getAvailability(variant).purchasable),
    );
  }

  // Preissortierung: nach dem Preis, der auch auf der Karte steht – dem der
  // teuersten Größe. Sortierte man nach dem günstigsten, stünden Düfte in
  // einer Reihenfolge, die zu den angezeigten Zahlen nicht passt. In der
  // Abteilung „Abfüllungen“ gilt dasselbe, dort aber nur unter den kleinen
  // Größen: Sonst sortierte die Liste nach Flakonpreisen, die gar nicht zu
  // sehen sind.
  if (sort === "preis-auf" || sort === "preis-ab") {
    const priceOf = (product: (typeof filtered)[number]) => {
      const decants = decantsOf(product.variants);
      const relevant =
        scope === "abfuellung" && decants.length > 0
          ? decants
          : product.variants;
      return Math.max(...relevant.map((variant) => variant.priceCents));
    };

    filtered.sort((a, b) =>
      sort === "preis-auf" ? priceOf(a) - priceOf(b) : priceOf(b) - priceOf(a),
    );
  }

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pageCount);
  const pageIds = filtered
    .slice((safePage - 1) * perPage, safePage * perPage)
    .map((product) => product.id);

  if (pageIds.length === 0) {
    return { items: [], total, page: safePage, perPage, pageCount };
  }

  // Schritt 2: vollständige Daten nur für die sichtbare Seite laden.
  const products = await prisma.product.findMany({
    where: { id: { in: pageIds } },
    select: productCardSelect,
  });

  // Reihenfolge aus Schritt 1 beibehalten.
  const order = new Map(pageIds.map((id, index) => [id, index]));
  products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return {
    items: products.map((product) => toListItem(product, scope)),
    total,
    page: safePage,
    perPage,
    pageCount,
  };
}

/** Bestseller für die Startseite. */
export async function getBestsellers(limit = 4): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isBestseller: true, variants: { some: { isActive: true } } },
    select: productCardSelect,
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
    take: limit,
  });
  return products.map((product) => toListItem(product));
}

/** Neu eingetroffene Produkte. */
export async function getNewArrivals(limit = 4): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isNew: true, variants: { some: { isActive: true } } },
    select: productCardSelect,
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });
  return products.map((product) => toListItem(product));
}

export const productDetailInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  variants: {
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { volumeMl: "asc" }],
  },
  categories: true,
} satisfies Prisma.ProductInclude;

export type ProductDetail = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: productDetailInclude,
  });
}

/**
 * Passende Empfehlungen: zuerst gleiche Duftfamilie, danach gleiche
 * Kategorie, aufgefüllt mit Bestsellern.
 */
export async function getRelatedProducts(
  product: ProductDetail,
  limit = 4,
): Promise<ProductListItem[]> {
  const categorySlugs = product.categories.map((category) => category.slug);

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      variants: { some: { isActive: true } },
      OR: [
        { fragranceFamily: product.fragranceFamily },
        ...(categorySlugs.length
          ? [{ categories: { some: { slug: { in: categorySlugs } } } }]
          : []),
      ],
    },
    select: productCardSelect,
    orderBy: [{ isBestseller: "desc" }, { popularity: "desc" }],
    take: limit,
  });

  if (related.length >= limit) {
    return related.map((product) => toListItem(product));
  }

  // Auffüllen, damit der Bereich nie halbleer wirkt.
  const fillers = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { notIn: [product.id, ...related.map((entry) => entry.id)] },
      variants: { some: { isActive: true } },
    },
    select: productCardSelect,
    orderBy: [{ popularity: "desc" }],
    take: limit - related.length,
  });

  return [...related, ...fillers].map((product) => toListItem(product));
}

/** Kategorien für Navigation und Filter. */
export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
  });
}

/** Verfügbare Filterwerte (Größen, Duftfamilien, Preisspanne). */
export async function getFilterFacets() {
  const [variants, families] = await Promise.all([
    prisma.productVariant.findMany({
      where: { isActive: true, product: { isActive: true } },
      select: { volumeMl: true, size: true, priceCents: true },
    }),
    prisma.product.groupBy({
      by: ["fragranceFamily"],
      where: { isActive: true },
      _count: { _all: true },
    }),
  ]);

  const sizeMap = new Map<number, string>();
  for (const variant of variants) {
    if (!sizeMap.has(variant.volumeMl)) sizeMap.set(variant.volumeMl, variant.size);
  }

  const prices = variants.map((variant) => variant.priceCents);

  return {
    sizes: [...sizeMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([volumeMl, label]) => ({ volumeMl, label })),
    families: families
      .map((entry) => ({
        value: entry.fragranceFamily,
        label: familyLabels[entry.fragranceFamily] ?? entry.fragranceFamily,
        count: entry._count._all,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "de")),
    minPriceCents: prices.length ? Math.min(...prices) : 0,
    maxPriceCents: prices.length ? Math.max(...prices) : 0,
  };
}
