"use client";

import { useActionState, useState } from "react";
import { submitReviewAction } from "@/app/actions";
import { idleState } from "@/app/admin/state";
import { Star } from "@/components/review/stars";
import { Button } from "@/components/ui/button";
import { ratingMax } from "@/lib/reviews";

/**
 * Formular für eine Bewertung.
 *
 * Die Sterne sind Radiobuttons und keine Schaltflächen: Damit funktionieren
 * Tastatur, Screenreader und ein Absenden ohne JavaScript von selbst. Das
 * sichtbare Sternbild liegt als Beschriftung darüber.
 */
export function ReviewForm({
  token,
  productId,
  productName,
  existingRating,
  existingBody,
}: {
  token: string;
  productId: string;
  productName: string;
  existingRating?: number;
  existingBody?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    submitReviewAction.bind(null, token),
    idleState,
  );
  const [rating, setRating] = useState(existingRating ?? 0);

  if (state.ok) {
    return (
      <p
        role="status"
        className="border border-emerald-800/60 bg-emerald-950/25 px-4 py-3 text-sm leading-relaxed text-emerald-100/85"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />

      <fieldset>
        <legend className="text-sm text-muted">
          Wie viele Sterne gibst du {productName}?
        </legend>

        <div className="mt-2 flex items-center gap-1">
          {Array.from({ length: ratingMax }, (_, index) => {
            const wert = index + 1;
            return (
              <label
                key={wert}
                className="cursor-pointer p-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold"
              >
                <input
                  type="radio"
                  name="rating"
                  value={wert}
                  checked={rating === wert}
                  onChange={() => setRating(wert)}
                  required
                  className="sr-only"
                />
                <span className="sr-only">
                  {wert} {wert === 1 ? "Stern" : "Sterne"}
                </span>
                <Star filled={wert <= rating} className="size-7" />
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-muted">
          Magst du kurz schreiben, wie er sich trägt? (optional)
        </span>
        <textarea
          name="body"
          rows={4}
          maxLength={1500}
          defaultValue={existingBody ?? ""}
          placeholder="Wie lange hält er bei dir, wozu trägst du ihn, was ist dir aufgefallen?"
          className="w-full border border-line bg-ink px-3 py-2.5 text-sm text-cream placeholder:text-subtle focus:border-gold focus:outline-none"
        />
      </label>

      {state.message && !state.ok && (
        <p
          role="alert"
          className="border border-red-900/60 bg-red-950/25 px-4 py-3 text-sm leading-relaxed text-red-100/85"
        >
          {state.message}
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gesendet …" : "Bewertung abschicken"}
        </Button>
      </div>
    </form>
  );
}
