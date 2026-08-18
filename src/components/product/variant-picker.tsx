"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/ui/badge";
import { BackInStockForm } from "@/components/product/back-in-stock-form";
import { useCurrency } from "@/components/currency/currency-provider";
import { formatTaxRate } from "@/lib/money";
import type { AvailabilityState } from "@/lib/availability";
import { cn } from "@/lib/utils";

/**
 * Größenauswahl, Mengenwahl und "In den Warenkorb".
 *
 * Preis, Lagerbestand und Lieferzeit hängen an der Variante – deshalb
 * aktualisiert jede Auswahl alle drei Angaben. Nicht bestellbare Varianten
 * lassen sich nicht in den Warenkorb legen (Button ist deaktiviert).
 */

export interface VariantOption {
  id: string;
  sku: string;
  size: string;
  volumeMl: number;
  priceCents: number;
  compareAtPriceCents: number | null;
  availabilityState: AvailabilityState;
  availabilityLabel: string;
  availabilityShortLabel: string;
  purchasable: boolean;
  maxQuantity: number;
  isPreorder: boolean;
  deliveryLabel: string;
  restockDateLabel: string | null;
  availableStock: number;
}

export function VariantPicker({
  productName,
  productSlug,
  variants,
  taxRateBp,
}: {
  productName: string;
  productSlug: string;
  variants: VariantOption[];
  taxRateBp: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const { format: formatPrice, formatBase } = useCurrency();
  const quantityId = useId();

  // Vorauswahl beim ersten Rendern: Variante aus der URL, sonst die erste
  // bestellbare. Danach ist die lokale Auswahl massgeblich – das hält den
  // Größenwechsel sofort spürbar, ohne auf den Server zu warten.
  const initialId = useMemo(() => {
    const fromUrl = searchParams.get("variante");
    if (fromUrl && variants.some((variant) => variant.id === fromUrl)) {
      return fromUrl;
    }
    return (
      variants.find((variant) => variant.purchasable)?.id ?? variants[0]?.id ?? ""
    );
    // Absichtlich nur beim ersten Rendern ausgewertet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedId, setSelectedId] = useState(initialId);
  // Wunschmenge; die tatsächlich zulässige Menge wird beim Rendern begrenzt.
  const [desiredQuantity, setDesiredQuantity] = useState(1);
  // Die Rückmeldung gehört zu genau einer Größe und verschwindet beim Wechsel.
  const [feedback, setFeedback] = useState<{ variantId: string; text: string } | null>(
    null,
  );

  const selected =
    variants.find((variant) => variant.id === selectedId) ?? variants[0];

  if (!selected) {
    return (
      <p className="border border-line bg-charcoal p-5 text-sm text-muted">
        Für dieses Produkt ist derzeit keine Größe hinterlegt.
      </p>
    );
  }

  // Abgeleitet statt in einem Effekt gesetzt: Die Menge kann nie über dem
  // liegen, was für die gewählte Größe bestellbar ist.
  const quantity = Math.min(
    Math.max(1, desiredQuantity),
    Math.max(1, selected.maxQuantity),
  );

  function selectVariant(variantId: string) {
    setSelectedId(variantId);
    // Auswahl in der URL spiegeln, damit sie teilbar bleibt.
    const params = new URLSearchParams(searchParams.toString());
    params.set("variante", variantId);
    router.replace(`/produkt/${productSlug}?${params.toString()}`, {
      scroll: false,
    });
  }

  function addToCart() {
    if (!selected.purchasable) return;
    addItem(selected.id, quantity);
    setFeedback({
      variantId: selected.id,
      text: `${quantity} × ${productName} (${selected.size}) wurde in den Warenkorb gelegt.`,
    });
  }

  const basePrice = formatBase(selected.priceCents, selected.volumeMl);
  const hasDiscount =
    selected.compareAtPriceCents !== null &&
    selected.compareAtPriceCents > selected.priceCents;

  return (
    <div className="flex flex-col gap-6">
      {/* Preis */}
      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="font-display text-3xl text-gold-light md:text-4xl">
            {formatPrice(selected.priceCents)}
          </p>
          {hasDiscount && (
            <p className="text-lg text-subtle line-through">
              {formatPrice(selected.compareAtPriceCents!)}
            </p>
          )}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-subtle">
          {taxRateBp > 0
            ? `inkl. ${formatTaxRate(taxRateBp)} MwSt.`
            : "keine MwSt. (nicht mehrwertsteuerpflichtig)"}
          , zzgl.{" "}
          <Link href="/versand" className="underline underline-offset-2 hover:text-gold-light">
            Versandkosten
          </Link>
          {basePrice && (
            <>
              {" · "}
              Grundpreis {basePrice}
            </>
          )}
        </p>
      </div>

      {/* Größen */}
      <fieldset>
        <legend className="eyebrow mb-3">
          Größe wählen
          <span className="sr-only">
            – Preis und Verfügbarkeit ändern sich je nach Größe
          </span>
        </legend>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {variants.map((variant) => {
            const isSelected = variant.id === selected.id;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => selectVariant(variant.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex min-h-16 flex-col items-start justify-center gap-0.5 border px-3 py-2 text-left transition-all duration-200",
                  isSelected
                    ? "border-gold bg-gold/10"
                    : "border-line hover:border-line-strong",
                  !variant.purchasable && "opacity-55",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-gold-light" : "text-cream",
                  )}
                >
                  {variant.size}
                </span>
                <span className="text-xs text-muted">
                  {formatPrice(variant.priceCents)}
                </span>
                {!variant.purchasable && (
                  <span className="text-[10px] uppercase tracking-wide text-subtle">
                    nicht bestellbar
                  </span>
                )}
                {variant.purchasable && variant.isPreorder && (
                  <span className="text-[10px] uppercase tracking-wide text-sky-400">
                    Vorbestellung
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Verfügbarkeit und Lieferzeit */}
      <div className="flex flex-col gap-2.5 border-y border-line py-5">
        <AvailabilityBadge
          state={selected.availabilityState}
          label={selected.availabilityLabel}
          className="self-start"
        />

        <dl className="flex flex-col gap-1 text-sm text-muted">
          <div className="flex gap-2">
            <dt className="text-subtle">Lieferzeit:</dt>
            <dd>{selected.deliveryLabel}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-subtle">Artikelnummer:</dt>
            <dd className="font-mono text-xs">{selected.sku}</dd>
          </div>
          {selected.restockDateLabel && (
            <div className="flex gap-2">
              <dt className="text-subtle">Wieder verfügbar ab:</dt>
              <dd>{selected.restockDateLabel}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Menge und Warenkorb */}
      {selected.purchasable ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label
                htmlFor={quantityId}
                className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-muted"
              >
                Menge
              </label>
              <div className="flex items-center border border-line">
                <button
                  type="button"
                  onClick={() =>
                    setDesiredQuantity(Math.max(1, quantity - 1))
                  }
                  disabled={quantity <= 1}
                  className="flex size-11 items-center justify-center text-cream transition-colors hover:text-gold disabled:opacity-30"
                >
                  <span className="sr-only">Menge verringern</span>
                  <span aria-hidden="true">−</span>
                </button>

                <input
                  id={quantityId}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={selected.maxQuantity}
                  value={quantity}
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (!Number.isFinite(parsed)) return;
                    setDesiredQuantity(
                      Math.min(Math.max(1, parsed), selected.maxQuantity),
                    );
                  }}
                  aria-describedby={`${quantityId}-max`}
                  className="h-11 w-14 border-x border-line bg-transparent text-center text-sm tabular-nums
                    focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold"
                />

                <button
                  type="button"
                  onClick={() =>
                    setDesiredQuantity(
                      Math.min(selected.maxQuantity, quantity + 1),
                    )
                  }
                  disabled={quantity >= selected.maxQuantity}
                  className="flex size-11 items-center justify-center text-cream transition-colors hover:text-gold disabled:opacity-30"
                >
                  <span className="sr-only">Menge erhöhen</span>
                  <span aria-hidden="true">+</span>
                </button>
              </div>
              <p id={`${quantityId}-max`} className="mt-1.5 text-xs text-subtle">
                max. {selected.maxQuantity} Stück
              </p>
            </div>

            <div className="flex-1 min-w-52">
              <Button onClick={addToCart} size="lg" fullWidth>
                In den Warenkorb
              </Button>
            </div>
          </div>

          {feedback && feedback.variantId === selected.id && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 border border-gold/40 bg-gold/5 px-4 py-3 text-sm"
            >
              <span className="text-cream">{feedback.text}</span>
              <Link
                href="/warenkorb"
                className="font-medium text-gold underline underline-offset-2 hover:text-gold-light"
              >
                Zum Warenkorb
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button disabled size="lg" fullWidth>
            {selected.availabilityState === "OUT_OF_STOCK"
              ? "Nicht auf Lager"
              : "Derzeit nicht bestellbar"}
          </Button>

          <BackInStockForm
            variantId={selected.id}
            productName={productName}
            size={selected.size}
          />
        </div>
      )}
    </div>
  );
}
