"use client";

import { useActionState } from "react";
import { idleState } from "@/app/admin/state";
import { warmProductImagesAction } from "@/app/admin/actions";
import { FormMessage, SubmitButton } from "@/components/admin/ui";

/**
 * „Bilder vorbereiten“.
 *
 * Löschen und neu hochladen muss man nie: Der Shop baut die Bildadresse bei
 * jedem Aufruf neu, eine geänderte Kulisse greift also von selbst. Cloudinary
 * erzeugt die Fassung aber erst beim ersten Abruf – dieser Knopf holt sie
 * vorab, damit die Wartezeit nicht die erste Kundin trifft.
 */
export function WarmImagesButton() {
  const [state, formAction] = useActionState(
    warmProductImagesAction,
    idleState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-muted">
        Nach einer Änderung an den Duftnoten oder an der Hintergrund-Einstellung
        entstehen die Kulissen von selbst neu – Bilder löschen und neu
        hochladen ist nie nötig. Cloudinary erzeugt sie allerdings erst beim
        ersten Aufruf, was einige Sekunden dauert. Dieser Knopf holt sie vorab,
        damit niemand darauf warten muss.
      </p>

      <FormMessage state={state} />

      <div>
        <SubmitButton
          variant="secondary"
          size="sm"
          pendingLabel="Bilder werden vorbereitet …"
        >
          Bilder vorbereiten
        </SubmitButton>
      </div>

      <p className="text-xs leading-relaxed text-subtle">
        Das dauert einen Moment. Kommen mehr Bilder zusammen, als in einem
        Durchgang möglich sind, sagt die Meldung es dir – dann einfach noch
        einmal drücken.
      </p>
    </form>
  );
}
