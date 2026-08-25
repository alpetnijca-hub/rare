"use client";

import { useActionState, useState } from "react";
import { idleState } from "@/app/admin/state";
import { commonSizes, variantDefaults } from "@/config/product-defaults";
import { buildSku } from "@/lib/utils";
import { deleteVariantAction, saveVariantAction } from "@/app/admin/actions";
import { ConfirmSubmit, FormMessage, SubmitButton } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, TextInput } from "@/components/ui/field";
import { AvailabilityBadge } from "@/components/ui/badge";
import { centsToInput, formatBasePrice, formatPrice } from "@/lib/money";
import type { AvailabilityState } from "@/lib/availability";

export interface VariantRow {
  id: string;
  sku: string;
  size: string;
  volumeMl: number;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isSample: boolean;
  preorderEnabled: boolean;
  restockDate: string | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  sortOrder: number;
  availabilityState: AvailabilityState;
  availabilityLabel: string;
}

/** Formular für eine einzelne Größe. */
function VariantForm({
  productId,
  productSlug,
  variant,
  existingSkus,
  onDone,
}: {
  productId: string;
  productSlug: string;
  variant?: VariantRow;
  existingSkus: string[];
  onDone?: () => void;
}) {
  const action = saveVariantAction.bind(null, variant?.id ?? null);
  const [state, formAction] = useActionState(action, idleState);
  const feldId = variant?.id ?? "neu";

  /**
   * Füllt Größe, Volumen, Artikelnummer und die Probenmarkierung auf einmal.
   * Spart beim Anlegen die vier Felder, die man ohnehin immer gleich ausfüllt.
   */
  function uebernehmeGroesse(vorgabe: (typeof commonSizes)[number]) {
    const setze = (name: string, wert: string) => {
      const feld = document.querySelector<HTMLInputElement>(
        `#${name}-${feldId}`,
      );
      if (feld) feld.value = wert;
    };
    setze("size", vorgabe.label);
    setze("volumeMl", String(vorgabe.volumeMl));
    setze("sku", buildSku(productSlug, vorgabe.volumeMl, existingSkus));

    const probe = document.querySelector<HTMLInputElement>(
      `#isSample-${feldId}`,
    );
    if (probe) probe.checked = vorgabe.isSample;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 border border-line bg-elevated p-5">
      <input type="hidden" name="productId" value={productId} />

      {!variant && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Gängige Größen
          </p>
          <div className="flex flex-wrap gap-2">
            {commonSizes.map((vorgabe) => (
              <button
                key={vorgabe.label}
                type="button"
                onClick={() => uebernehmeGroesse(vorgabe)}
                className="border border-line px-3 py-1.5 text-xs text-cream transition-colors
                  hover:border-gold hover:text-gold-light
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {vorgabe.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-subtle">
            Füllt Größe, Volumen und Artikelnummer aus. Preis und Bestand
            trägst du danach ein.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id={`size-${feldId}`} label="Größe" required error={state.fields?.size}>
          {(aria) => (
            <TextInput {...aria} name="size" required placeholder="10 ml" defaultValue={variant?.size} />
          )}
        </Field>

        <Field
          id={`volumeMl-${feldId}`}
          label="Volumen in ml"
          required
          error={state.fields?.volumeMl}
          hint="Basis für den Grundpreis"
        >
          {(aria) => (
            <TextInput
              {...aria}
              name="volumeMl"
              inputMode="numeric"
              required
              placeholder="10"
              defaultValue={variant?.volumeMl}
            />
          )}
        </Field>

        <Field id={`sku-${feldId}`} label="Artikelnummer (SKU)" required error={state.fields?.sku}>
          {(aria) => (
            <TextInput {...aria} name="sku" required placeholder="RS-GA-010" defaultValue={variant?.sku} />
          )}
        </Field>

        <Field id={`sortOrder-${variant?.id ?? "neu"}`} label="Reihenfolge">
          {(aria) => (
            <TextInput
              {...aria}
              name="sortOrder"
              inputMode="numeric"
              defaultValue={variant?.sortOrder ?? 0}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id={`price-${variant?.id ?? "neu"}`} label="Preis (€)" required error={state.fields?.price}>
          {(aria) => (
            <TextInput
              {...aria}
              name="price"
              inputMode="decimal"
              required
              placeholder="17.90"
              defaultValue={variant ? centsToInput(variant.priceCents) : ""}
            />
          )}
        </Field>

        <Field
          id={`compareAtPrice-${variant?.id ?? "neu"}`}
          label="Streichpreis (€)"
          error={state.fields?.compareAtPrice}
          hint="Optional, muss über dem Preis liegen"
        >
          {(aria) => (
            <TextInput
              {...aria}
              name="compareAtPrice"
              inputMode="decimal"
              placeholder="19.90"
              defaultValue={
                variant?.compareAtPriceCents
                  ? centsToInput(variant.compareAtPriceCents)
                  : ""
              }
            />
          )}
        </Field>

        <Field id={`stock-${variant?.id ?? "neu"}`} label="Lagerbestand" required error={state.fields?.stock}>
          {(aria) => (
            <TextInput
              {...aria}
              name="stock"
              inputMode="numeric"
              required
              defaultValue={variant?.stock ?? 0}
            />
          )}
        </Field>

        <Field
          id={`lowStockThreshold-${variant?.id ?? "neu"}`}
          label="Warnschwelle"
          hint="Ab diesem Bestand warnt das Dashboard"
        >
          {(aria) => (
            <TextInput
              {...aria}
              name="lowStockThreshold"
              inputMode="numeric"
              defaultValue={variant?.lowStockThreshold ?? variantDefaults.lowStockThreshold}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id={`deliveryMinDays-${variant?.id ?? "neu"}`}
          label="Lieferzeit min. (Werktage)"
          required
          error={state.fields?.deliveryMinDays}
        >
          {(aria) => (
            <TextInput
              {...aria}
              name="deliveryMinDays"
              inputMode="numeric"
              required
              defaultValue={variant?.deliveryMinDays ?? variantDefaults.deliveryMinDays}
            />
          )}
        </Field>

        <Field
          id={`deliveryMaxDays-${variant?.id ?? "neu"}`}
          label="Lieferzeit max. (Werktage)"
          required
          error={state.fields?.deliveryMaxDays}
        >
          {(aria) => (
            <TextInput
              {...aria}
              name="deliveryMaxDays"
              inputMode="numeric"
              required
              defaultValue={variant?.deliveryMaxDays ?? variantDefaults.deliveryMaxDays}
            />
          )}
        </Field>

        <Field
          id={`restockDate-${variant?.id ?? "neu"}`}
          label="Wieder verfügbar ab"
          error={state.fields?.restockDate}
          hint="Wird angezeigt, wenn kein Bestand vorhanden ist"
        >
          {(aria) => (
            <TextInput
              {...aria}
              type="date"
              name="restockDate"
              defaultValue={variant?.restockDate ?? ""}
            />
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <Checkbox
          id={`isActive-${variant?.id ?? "neu"}`}
          name="isActive"
          defaultChecked={variant?.isActive ?? true}
          label="Größe im Shop anbieten"
        />
        <Checkbox
          id={`isSample-${feldId}`}
          name="isSample"
          defaultChecked={variant?.isSample ?? false}
          label="Probe oder Abfüllung zum Testen"
          hint="Erscheint auf der Produktseite unter „Zum Testen“ statt bei den Flakons. Der Duft lässt sich damit auch über den Shopfilter „Mit Probengröße“ finden."
        />
        <Checkbox
          id={`preorderEnabled-${variant?.id ?? "neu"}`}
          name="preorderEnabled"
          defaultChecked={variant?.preorderEnabled ?? false}
          label="Vorbestellung erlauben, auch ohne Lagerbestand"
        />
      </div>

      <FormMessage state={state} />

      <div className="flex flex-wrap gap-3">
        <SubmitButton size="sm">
          {variant ? "Größe speichern" : "Größe hinzufügen"}
        </SubmitButton>
        {onDone && (
          <Button variant="ghost" size="sm" onClick={onDone}>
            Schliessen
          </Button>
        )}
      </div>
    </form>
  );
}

export function VariantManager({
  productId,
  productSlug,
  variants,
}: {
  productId: string;
  /** Grundlage für den Vorschlag der Artikelnummer. */
  productSlug: string;
  variants: VariantRow[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(variants.length === 0);
  const skus = variants.map((variant) => variant.sku);

  return (
    <div className="flex flex-col gap-5">
      {variants.length === 0 && !adding && (
        <p className="border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
          Für dieses Produkt ist noch keine Größe angelegt. Ohne mindestens eine
          aktive Größe erscheint das Produkt nicht im Shop.
        </p>
      )}

      {variants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <caption className="sr-only">
              Größen mit Preis, Bestand und Verfügbarkeit
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                <th scope="col" className="pb-3 pr-4 font-medium">Größe</th>
                <th scope="col" className="pb-3 pr-4 font-medium">SKU</th>
                <th scope="col" className="pb-3 pr-4 font-medium">Preis</th>
                <th scope="col" className="pb-3 pr-4 font-medium">Grundpreis</th>
                <th scope="col" className="pb-3 pr-4 text-right font-medium">Bestand</th>
                <th scope="col" className="pb-3 pr-4 font-medium">Verfügbarkeit</th>
                <th scope="col" className="pb-3 font-medium">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-b border-line/60 align-top">
                  <td className="py-3 pr-4 text-cream">
                    {variant.size}
                    {!variant.isActive && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-subtle">
                        inaktiv
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-subtle">
                    {variant.sku}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-cream">
                    {formatPrice(variant.priceCents)}
                    {variant.compareAtPriceCents && (
                      <span className="ml-2 text-xs text-subtle line-through">
                        {formatPrice(variant.compareAtPriceCents)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-xs text-subtle">
                    {formatBasePrice(variant.priceCents, variant.volumeMl)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    <span className={variant.stock <= 0 ? "text-red-400" : "text-cream"}>
                      {variant.stock}
                    </span>
                    {variant.reservedStock > 0 && (
                      <span className="block text-[11px] text-subtle">
                        {variant.reservedStock} reserviert
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <AvailabilityBadge
                      state={variant.availabilityState}
                      label={variant.availabilityLabel}
                    />
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setEditingId(editingId === variant.id ? null : variant.id)
                        }
                        aria-expanded={editingId === variant.id}
                      >
                        {editingId === variant.id ? "Schliessen" : "Bearbeiten"}
                      </Button>

                      <form action={deleteVariantAction}>
                        <input type="hidden" name="variantId" value={variant.id} />
                        <ConfirmSubmit message={`Größe „${variant.size}“ wirklich entfernen? Bereits bestellte Größen werden nur deaktiviert.`}>
                          Entfernen
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingId && (
        <VariantForm
          productId={productId}
          productSlug={productSlug}
          existingSkus={skus}
          variant={variants.find((variant) => variant.id === editingId)}
          onDone={() => setEditingId(null)}
        />
      )}

      {adding ? (
        <VariantForm
          productId={productId}
          productSlug={productSlug}
          existingSkus={skus}
          onDone={() => setAdding(false)}
        />
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          Weitere Größe hinzufügen
        </Button>
      )}
    </div>
  );
}
