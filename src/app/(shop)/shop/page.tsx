import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/product/product-card";
import { ShopSidebar, ShopToolbar } from "@/components/product/shop-filters";
import { getCategories, getFilterFacets, listProducts } from "@/lib/products";
import { isSortKey, type SortKey } from "@/lib/catalog";
import {
  decantCategory,
  decantMaxMl,
  decantMinMl,
  isDecantSearch,
} from "@/lib/decants";

export const metadata: Metadata = {
  title: "Shop – alle Düfte",
  description:
    "Parfüms, Duftalternativen und Abfüllungen. Filtere nach Kategorie, Duftfamilie, Größe, Preis und Verfügbarkeit.",
  alternates: { canonical: "/shop" },
};

// Lagerbestände müssen aktuell sein – keine statische Zwischenspeicherung.
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function asArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function asNumber(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Leerer Zustand mit konkreten nächsten Schritten. */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center border border-line bg-charcoal px-6 py-16 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="mb-5 text-line-strong"
      >
        <circle cx="17" cy="17" r="12" stroke="currentColor" strokeWidth="1.5" />
        <path d="M26 26l10 10" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <h2 className="text-2xl">Keine Düfte gefunden</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        {hasFilters
          ? "Mit dieser Kombination aus Filtern haben wir nichts im Sortiment. Nimm einen Filter heraus oder starte eine neue Suche."
          : "Aktuell sind keine Produkte hinterlegt. Sobald Artikel angelegt sind, erscheinen sie hier."}
      </p>

      {hasFilters && (
        <ButtonLink href="/shop" variant="secondary" className="mt-7">
          Filter zurücksetzen
        </ButtonLink>
      )}
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  params,
}: {
  page: number;
  pageCount: number;
  params: URLSearchParams;
}) {
  if (pageCount <= 1) return null;

  function hrefFor(target: number) {
    const next = new URLSearchParams(params.toString());
    if (target <= 1) next.delete("seite");
    else next.set("seite", String(target));
    const query = next.toString();
    return query ? `/shop?${query}` : "/shop";
  }

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (entry) =>
      entry === 1 ||
      entry === pageCount ||
      Math.abs(entry - page) <= 1,
  );

  return (
    <nav aria-label="Seitennavigation" className="mt-14 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1)}
              rel="prev"
              className="flex min-h-11 items-center border border-line-strong px-4 text-sm text-cream transition-colors hover:border-gold hover:text-gold-light"
            >
              Zurück
            </Link>
          ) : (
            <span className="flex min-h-11 items-center border border-line px-4 text-sm text-subtle">
              Zurück
            </span>
          )}
        </li>

        {pages.map((entry, index) => (
          <li key={entry} className="flex items-center gap-2">
            {index > 0 && entry - pages[index - 1] > 1 && (
              <span className="text-subtle" aria-hidden="true">
                …
              </span>
            )}
            {entry === page ? (
              <span
                aria-current="page"
                className="flex size-11 items-center justify-center border border-gold bg-gold/10 text-sm text-gold-light"
              >
                {entry}
              </span>
            ) : (
              <Link
                href={hrefFor(entry)}
                className="flex size-11 items-center justify-center border border-line-strong text-sm text-cream transition-colors hover:border-gold hover:text-gold-light"
              >
                {entry}
              </Link>
            )}
          </li>
        ))}

        <li>
          {page < pageCount ? (
            <Link
              href={hrefFor(page + 1)}
              rel="next"
              className="flex min-h-11 items-center border border-line-strong px-4 text-sm text-cream transition-colors hover:border-gold hover:text-gold-light"
            >
              Weiter
            </Link>
          ) : (
            <span className="flex min-h-11 items-center border border-line px-4 text-sm text-subtle">
              Weiter
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;

  const sortParam = Array.isArray(resolved.sortierung)
    ? resolved.sortierung[0]
    : resolved.sortierung;

  const sort: SortKey = isSortKey(sortParam) ? sortParam : "beliebt";

  const suchbegriff = Array.isArray(resolved.suche)
    ? resolved.suche[0]
    : resolved.suche;

  // „Abfüllungen“ ist keine Kategorie in der Datenbank, sondern ergibt sich
  // aus den Größen: jeder Duft mit 1–10 ml. Sie lässt sich auf drei Wegen
  // erreichen, und alle drei landen bei demselben Filter:
  //
  //   1. der Kategorie in der Filterliste (?kategorie=abfuellungen),
  //   2. dem Suchfeld – wer „Abfüllungen“ eintippt, sucht keinen Duft
  //      dieses Namens, sondern die kleinen Größen,
  //   3. ?probe=1 aus früheren Links, die im Umlauf sein können.
  const alsKategorie = asArray(resolved.kategorie).includes(
    decantCategory.slug,
  );
  const alsSuche = Boolean(suchbegriff && isDecantSearch(suchbegriff));
  const onlyDecants = alsKategorie || alsSuche || resolved.probe === "1";

  const filters = {
    // Beim Suchwort „Abfüllungen“ wäre eine Textsuche zusätzlich sinnlos –
    // kein Produkt heisst so, und die Liste bliebe leer.
    search: alsSuche ? undefined : suchbegriff,
    // Den reservierten Slug nicht als echte Kategorie weiterreichen: In der
    // Datenbank gibt es ihn nicht, die Abfrage käme leer zurück.
    categories: asArray(resolved.kategorie).filter(
      (slug) => slug !== decantCategory.slug,
    ),
    families: asArray(resolved.familie),
    volumes: asArray(resolved.groesse)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value)),
    minPriceCents: asNumber(resolved["preis-min"]),
    maxPriceCents: asNumber(resolved["preis-max"]),
    onlyAvailable: resolved.verfuegbar === "1",
    onlyDecants,
    sort,
    page: asNumber(resolved.seite) ?? 1,
    perPage: 12,
  };

  const [result, categories, facets] = await Promise.all([
    listProducts(filters),
    getCategories(),
    getFilterFacets(),
  ]);

  // Für die Links der Seitennavigation.
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (key === "seite" || value === undefined) continue;
    for (const entry of asArray(value)) urlParams.append(key, entry);
  }

  const filterData = {
    categories: [
      // „Abfüllungen“ steht oben und kommt nicht aus der Datenbank – sie
      // ergibt sich aus den Größen. Eine gleichnamige Kategorie im
      // Adminbereich würde hier sonst zweimal auftauchen.
      { value: decantCategory.slug, label: decantCategory.name },
      ...categories
        .filter((category) => category.slug !== decantCategory.slug)
        .map((category) => ({ value: category.slug, label: category.name })),
    ],
    families: facets.families,
    sizes: facets.sizes,
    minPriceCents: facets.minPriceCents,
    maxPriceCents: facets.maxPriceCents,
  };

  const hasFilters =
    Boolean(filters.search) ||
    filters.categories.length > 0 ||
    filters.families.length > 0 ||
    filters.volumes.length > 0 ||
    filters.minPriceCents !== undefined ||
    filters.maxPriceCents !== undefined ||
    filters.onlyAvailable ||
    filters.onlyDecants;

  return (
    <div className="container-shop py-12 md:py-16">
      {/* Kopfbereich */}
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow mb-3">Sortiment</p>
        <h1 className="text-4xl md:text-5xl">
          {onlyDecants ? decantCategory.name : "Alle Düfte"}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
          {onlyDecants
            ? `Alle Düfte, die es als Abfüllung gibt – von ${decantMinMl} bis ${decantMaxMl} ml, von Hand abgefüllt. Die Preise auf den Karten sind die der Abfüllungen, nicht die der grossen Flakons.`
            : "Parfüms, klar gekennzeichnete Duftalternativen, handabgefüllte Proben. Jede Größe hat einen eigenen Preis und einen eigenen Lagerbestand – die Verfügbarkeit siehst du direkt am Produkt."}
        </p>
      </div>

      <Suspense fallback={<div className="skeleton mb-8 h-11 w-full" />}>
        <ShopToolbar data={filterData} resultCount={result.total} />
      </Suspense>

      <div className="flex gap-10">
        <Suspense fallback={<div className="hidden lg:block lg:w-64 lg:shrink-0" />}>
          <ShopSidebar data={filterData} />
        </Suspense>

        <div className="min-w-0 flex-1">
          <p className="mb-5 text-sm text-subtle sm:hidden" aria-live="polite">
            {result.total} {result.total === 1 ? "Produkt" : "Produkte"}
          </p>

          <Suspense fallback={<ProductGridSkeleton />}>
            {result.items.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-3">
                {result.items.map((item, index) => (
                  <ProductCard
                    key={item.product.id}
                    item={item}
                    priority={index < 3}
                  />
                ))}
              </div>
            )}
          </Suspense>

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            params={urlParams}
          />
        </div>
      </div>
    </div>
  );
}
