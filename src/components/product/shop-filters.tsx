"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, TextInput } from "@/components/ui/field";
import { centsToInput, parsePriceToCents } from "@/lib/money";
import { sortOptions } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Filter- und Sortiersteuerung des Shops.
 *
 * Der Zustand liegt vollständig in der URL. Dadurch sind Filter teilbar,
 * über den Zurück-Button bedienbar und serverseitig auswertbar.
 *
 * Zwei Einstiegspunkte:
 *   <ShopToolbar />  – Suche, Sortierung, Filterschublade (mobil)
 *   <ShopSidebar />  – dieselben Filter als Seitenleiste ab Desktop
 */

interface FacetOption {
  value: string;
  label: string;
  count?: number;
}

export interface ShopFilterData {
  categories: FacetOption[];
  families: FacetOption[];
  sizes: Array<{ volumeMl: number; label: string }>;
  minPriceCents: number;
  maxPriceCents: number;
}

/** Gemeinsamer Lesezugriff auf die aktuellen Filter aus der URL. */
function useCurrentFilters() {
  const searchParams = useSearchParams();

  return useMemo(
    () => ({
      searchParams,
      search: searchParams.get("suche") ?? "",
      categories: searchParams.getAll("kategorie"),
      families: searchParams.getAll("familie"),
      sizes: searchParams.getAll("groesse"),
      priceMin: searchParams.get("preis-min") ?? "",
      priceMax: searchParams.get("preis-max") ?? "",
      onlyAvailable: searchParams.get("verfuegbar") === "1",
      sort: searchParams.get("sortierung") ?? "beliebt",
    }),
    [searchParams],
  );
}

/**
 * Hält einen Eingabe-Entwurf mit dem Wert aus der URL synchron.
 *
 * Umgesetzt als Zustandsanpassung während des Renderns – das offizielle
 * React-Muster für "Zustand zurücksetzen, wenn sich eine Eingabe ändert".
 * Ein Effekt wäre hier ein zusätzlicher Renderdurchlauf ohne Nutzen.
 */
function useSyncedDraft(external: string) {
  const [draft, setDraft] = useState(external);
  const [lastExternal, setLastExternal] = useState(external);

  if (external !== lastExternal) {
    setLastExternal(external);
    setDraft(external);
  }

  return [draft, setDraft] as const;
}

function useFilterNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    // Bei jeder Änderung zurück auf Seite 1.
    params.delete("seite");
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/shop?${query}` : "/shop", { scroll: false });
    });
  }

  function toggleMulti(key: string, value: string, checked: boolean) {
    pushParams((params) => {
      const values = params.getAll(key).filter((entry) => entry !== value);
      if (checked) values.push(value);
      params.delete(key);
      for (const entry of values) params.append(key, entry);
    });
  }

  function reset() {
    startTransition(() => router.push("/shop", { scroll: false }));
  }

  return { pushParams, toggleMulti, reset, isPending };
}

export function activeFilterCount(params: {
  categories: string[];
  families: string[];
  sizes: string[];
  priceMin: string;
  priceMax: string;
  onlyAvailable: boolean;
}) {
  return (
    params.categories.length +
    params.families.length +
    params.sizes.length +
    (params.priceMin ? 1 : 0) +
    (params.priceMax ? 1 : 0) +
    (params.onlyAvailable ? 1 : 0)
  );
}

function FilterGroup({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-b border-line py-5 first:pt-0 last:border-0">
      <legend className="eyebrow mb-3.5">{legend}</legend>
      {children}
    </fieldset>
  );
}

function CheckboxRow({
  id,
  label,
  count,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  count?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 cursor-pointer appearance-none border border-line-strong bg-ink
          checked:border-gold checked:bg-gold
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      />
      <label
        htmlFor={id}
        className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm text-cream transition-colors hover:text-gold-light"
      >
        <span>{label}</span>
        {count !== undefined && (
          <span className="text-xs tabular-nums text-subtle">{count}</span>
        )}
      </label>
    </div>
  );
}

/** Das eigentliche Filterformular – identisch in Seitenleiste und Schublade. */
function FilterPanel({
  data,
  idPrefix,
}: {
  data: ShopFilterData;
  idPrefix: string;
}) {
  const current = useCurrentFilters();
  const { pushParams, toggleMulti, reset, isPending } = useFilterNavigation();

  const [priceMinDraft, setPriceMinDraft] = useSyncedDraft(current.priceMin);
  const [priceMaxDraft, setPriceMaxDraft] = useSyncedDraft(current.priceMax);

  function applyPrice() {
    pushParams((params) => {
      const min = parsePriceToCents(priceMinDraft);
      const max = parsePriceToCents(priceMaxDraft);
      if (priceMinDraft && min !== null) params.set("preis-min", String(min));
      else params.delete("preis-min");
      if (priceMaxDraft && max !== null) params.set("preis-max", String(max));
      else params.delete("preis-max");
    });
  }

  const count = activeFilterCount(current);

  return (
    <div
      className={cn(
        "flex flex-col transition-opacity duration-200",
        isPending && "opacity-60",
      )}
    >
      <FilterGroup legend="Kategorie">
        {data.categories.map((option) => (
          <CheckboxRow
            key={option.value}
            id={`${idPrefix}-kat-${option.value}`}
            label={option.label}
            checked={current.categories.includes(option.value)}
            onChange={(checked) => toggleMulti("kategorie", option.value, checked)}
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Duftfamilie">
        {data.families.map((option) => (
          <CheckboxRow
            key={option.value}
            id={`${idPrefix}-fam-${option.value}`}
            label={option.label}
            count={option.count}
            checked={current.families.includes(option.value)}
            onChange={(checked) => toggleMulti("familie", option.value, checked)}
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Größe">
        <div className="flex flex-wrap gap-2">
          {data.sizes.map((size) => {
            const value = String(size.volumeMl);
            const active = current.sizes.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleMulti("groesse", value, !active)}
                className={cn(
                  "min-h-9 border px-3 text-xs transition-colors duration-200",
                  active
                    ? "border-gold bg-gold/12 text-gold-light"
                    : "border-line-strong text-cream hover:border-gold/60 hover:text-gold-light",
                )}
              >
                {size.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup legend="Preis">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label
              htmlFor={`${idPrefix}-preis-min`}
              className="mb-1 block text-xs text-subtle"
            >
              von (€)
            </label>
            <TextInput
              id={`${idPrefix}-preis-min`}
              inputMode="decimal"
              placeholder={centsToInput(data.minPriceCents)}
              value={priceMinDraft}
              onChange={(event) => setPriceMinDraft(event.target.value)}
              onBlur={applyPrice}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyPrice();
                }
              }}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor={`${idPrefix}-preis-max`}
              className="mb-1 block text-xs text-subtle"
            >
              bis (€)
            </label>
            <TextInput
              id={`${idPrefix}-preis-max`}
              inputMode="decimal"
              placeholder={centsToInput(data.maxPriceCents)}
              value={priceMaxDraft}
              onChange={(event) => setPriceMaxDraft(event.target.value)}
              onBlur={applyPrice}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyPrice();
                }
              }}
            />
          </div>
        </div>
      </FilterGroup>

      <FilterGroup legend="Verfügbarkeit">
        <CheckboxRow
          id={`${idPrefix}-verfuegbar`}
          label="Nur sofort bestellbare Artikel"
          checked={current.onlyAvailable}
          onChange={(checked) =>
            pushParams((params) => {
              if (checked) params.set("verfuegbar", "1");
              else params.delete("verfuegbar");
            })
          }
        />
      </FilterGroup>

      {count > 0 && (
        <div className="pt-5">
          <Button onClick={reset} variant="secondary" size="sm" fullWidth>
            Filter zurücksetzen ({count})
          </Button>
        </div>
      )}
    </div>
  );
}

/** Seitenleiste ab Desktop. */
export function ShopSidebar({ data }: { data: ShopFilterData }) {
  return (
    <aside
      aria-label="Filter"
      className="hidden lg:sticky lg:top-28 lg:block lg:h-fit lg:w-64 lg:shrink-0"
    >
      <FilterPanel data={data} idPrefix="sidebar" />
    </aside>
  );
}

/** Suche, Sortierung und Filterschublade. */
export function ShopToolbar({
  data,
  resultCount,
}: {
  data: ShopFilterData;
  resultCount: number;
}) {
  const baseId = useId();
  const current = useCurrentFilters();
  const { pushParams } = useFilterNavigation();
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useSyncedDraft(current.search);

  // Schublade sperrt den Hintergrund und reagiert auf Escape.
  useEffect(() => {
    if (!panelOpen) return;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPanelOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen]);

  const count = activeFilterCount(current);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    pushParams((params) => {
      const term = searchDraft.trim();
      if (term) params.set("suche", term);
      else params.delete("suche");
    });
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form
          onSubmit={submitSearch}
          role="search"
          className="flex w-full gap-2 lg:max-w-md"
        >
          <div className="relative flex-1">
            <label htmlFor={`${baseId}-suche`} className="sr-only">
              Düfte durchsuchen
            </label>
            <TextInput
              id={`${baseId}-suche`}
              type="search"
              name="suche"
              placeholder="Duft, Note oder Artikelnummer"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="pl-10"
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
            >
              <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M11.5 11.5 16.5 16.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </div>
          <Button type="submit" variant="secondary" size="md">
            Suchen
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <p aria-live="polite" className="hidden whitespace-nowrap text-sm text-subtle sm:block">
            {resultCount} {resultCount === 1 ? "Produkt" : "Produkte"}
          </p>

          <div className="flex flex-1 items-center gap-2 lg:flex-none">
            <label
              htmlFor={`${baseId}-sortierung`}
              className="whitespace-nowrap text-xs uppercase tracking-[0.14em] text-subtle"
            >
              Sortieren
            </label>
            <Select
              id={`${baseId}-sortierung`}
              value={current.sort}
              onChange={(event) =>
                pushParams((params) => params.set("sortierung", event.target.value))
              }
              className="min-w-40"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <Button
            onClick={() => setPanelOpen(true)}
            variant="secondary"
            size="md"
            className="lg:hidden"
            aria-expanded={panelOpen}
            aria-controls="filter-schublade"
          >
            Filter{count > 0 ? ` (${count})` : ""}
          </Button>
        </div>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Filter schliessen"
            onClick={() => setPanelOpen(false)}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          />
          <div
            id="filter-schublade"
            role="dialog"
            aria-modal="true"
            aria-label="Filter"
            className="animate-fade absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col border-l border-line bg-charcoal"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg">Filter</h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="flex size-11 items-center justify-center text-muted transition-colors hover:text-gold"
              >
                <span className="sr-only">Schliessen</span>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterPanel data={data} idPrefix="drawer" />
            </div>

            <div className="border-t border-line p-5">
              <Button onClick={() => setPanelOpen(false)} fullWidth>
                {resultCount} {resultCount === 1 ? "Produkt" : "Produkte"} anzeigen
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
