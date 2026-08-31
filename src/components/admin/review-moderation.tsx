"use client";

import { useActionState } from "react";
import { moderateReviewAction } from "@/app/admin/actions";
import { idleState } from "@/app/admin/state";
import { FormMessage, SubmitButton } from "@/components/admin/ui";

/**
 * Freigeben oder ablehnen.
 *
 * Zwei Formulare statt einer Auswahl: Der häufige Fall – freigeben – ist
 * damit ein einziger Klick.
 */
export function ReviewModeration({ reviewId }: { reviewId: string }) {
  const [state, formAction] = useActionState(moderateReviewAction, idleState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="reviewId" value={reviewId} />

      <FormMessage state={state} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-52 flex-1 flex-col gap-1.5">
          <span className="text-xs uppercase tracking-[0.12em] text-subtle">
            Grund bei Ablehnung (intern)
          </span>
          <input
            type="text"
            name="grund"
            maxLength={200}
            placeholder="z. B. Werbung, Beschimpfung"
            className="min-h-11 w-full border border-line bg-ink px-3 text-sm text-cream placeholder:text-subtle focus:border-gold focus:outline-none"
          />
        </label>

        <SubmitButton
          name="entscheidung"
          value="freigeben"
          size="sm"
          pendingLabel="…"
        >
          Freigeben
        </SubmitButton>

        <SubmitButton
          name="entscheidung"
          value="ablehnen"
          variant="secondary"
          size="sm"
          pendingLabel="…"
        >
          Ablehnen
        </SubmitButton>
      </div>
    </form>
  );
}
