"use client";

import { useActionState } from "react";
import { adjustStockAction, idleState } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/ui";

/**
 * Bestandskorrektur direkt in der Lagertabelle.
 * Der eingetragene Wert ist der neue absolute Bestand, nicht eine Differenz.
 */
export function StockAdjustForm({
  variantId,
  currentStock,
}: {
  variantId: string;
  currentStock: number;
}) {
  const [state, formAction] = useActionState(adjustStockAction, idleState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="variantId" value={variantId} />

      <label htmlFor={`stock-${variantId}`} className="sr-only">
        Neuer Lagerbestand
      </label>
      <input
        id={`stock-${variantId}`}
        type="number"
        name="stock"
        inputMode="numeric"
        min={0}
        defaultValue={Math.max(0, currentStock)}
        className="h-9 w-20 border border-line bg-ink px-2 text-center text-sm tabular-nums text-cream
          focus:border-gold focus:outline-none"
      />

      <SubmitButton variant="secondary" size="sm" pendingLabel="…">
        Setzen
      </SubmitButton>

      {state.message && (
        <span
          role="status"
          className={state.ok ? "text-xs text-emerald-400" : "text-xs text-red-400"}
        >
          {state.ok ? "Gespeichert" : state.message}
        </span>
      )}
    </form>
  );
}
