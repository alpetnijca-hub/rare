"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteDemoData, loadDemoData } from "@/app/admin/actions";

/**
 * Demo-Inhalte im Adminbereich verwalten.
 *
 * Bewusst deutlich als Demo gekennzeichnet: Die Produkte sind erfunden, die
 * Bilder selbst gezeichnet. Sie dienen nur dazu, den frisch aufgesetzten Shop
 * einmal vollständig zu sehen, und lassen sich rückstandslos entfernen.
 */
export function DemoDataPanel({
  demoProducts,
  realProducts,
}: {
  demoProducts: number;
  realProducts: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const hasDemo = demoProducts > 0;
  const hasReal = realProducts > 0;

  // Ist der Shop bereits mit echten Produkten gefüllt und enthält keine
  // Demo-Inhalte mehr, hat dieser Kasten seinen Zweck erfüllt.
  if (hasReal && !hasDemo) return null;

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setConfirmingRemoval(false);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Die Aktion ist fehlgeschlagen.",
        );
      }
    });
  }

  return (
    <section className="border border-amber-800/60 bg-amber-950/20 p-6">
      <h2 className="mb-2 text-lg text-amber-200">
        {hasDemo ? "Demo-Inhalte sind aktiv" : "Der Shop ist noch leer"}
      </h2>

      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-amber-100/85">
        {hasDemo ? (
          <>
            Aktuell stehen {demoProducts} Demo-Produkte im Shop. Die Namen sind
            frei erfunden, die Abbildungen selbst gezeichnet – es handelt sich
            nicht um echte Ware.{" "}
            <strong className="font-medium">
              Vor dem Livegang entfernen.
            </strong>
          </>
        ) : (
          <>
            Es sind noch keine Produkte erfasst. Du kannst die Demo-Inhalte
            einspielen, um den Shop einmal vollständig zu sehen – mit
            Kategorien, allen Verfügbarkeitszuständen und Rabattcodes. Sie
            lassen sich später mit einem Klick wieder entfernen.
          </>
        )}
      </p>

      {error && (
        <p
          role="alert"
          className="mb-4 border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {!hasDemo && (
          <Button
            size="md"
            disabled={pending}
            onClick={() => run(loadDemoData)}
          >
            {pending ? "Wird eingespielt …" : "Demo-Inhalte einspielen"}
          </Button>
        )}

        {hasDemo &&
          (confirmingRemoval ? (
            <>
              <Button
                size="md"
                variant="danger"
                disabled={pending}
                onClick={() => run(deleteDemoData)}
              >
                {pending ? "Wird entfernt …" : "Ja, alle Demo-Inhalte löschen"}
              </Button>
              <Button
                size="md"
                variant="ghost"
                disabled={pending}
                onClick={() => setConfirmingRemoval(false)}
              >
                Abbrechen
              </Button>
            </>
          ) : (
            <Button
              size="md"
              variant="secondary"
              onClick={() => setConfirmingRemoval(true)}
            >
              Demo-Inhalte entfernen
            </Button>
          ))}
      </div>

      {hasDemo && confirmingRemoval && (
        <p className="mt-4 text-xs leading-relaxed text-amber-100/70">
          Entfernt werden nur Produkte mit der Kennzeichnung &bdquo;Demo&ldquo;. Selbst
          erfasste Produkte und bereits eingegangene Bestellungen bleiben
          unverändert erhalten.
        </p>
      )}
    </section>
  );
}
