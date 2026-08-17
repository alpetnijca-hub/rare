"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Auffangseite für unerwartete Fehler.
 *
 * Es werden bewusst keine technischen Details angezeigt – Fehlermeldungen
 * können interne Informationen enthalten. Für die Fehlersuche steht die
 * `digest`-Kennung im Serverprotokoll.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Unerwarteter Fehler:", error.digest ?? "ohne Kennung");
  }, [error]);

  return (
    <div className="container-shop flex min-h-[70vh] items-center py-20">
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="eyebrow mb-4">Fehler</p>

        <h1 className="text-3xl md:text-4xl">Da ist etwas schiefgelaufen</h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">
          Die Seite konnte nicht vollständig geladen werden. Versuche es bitte
          erneut. Falls das Problem bestehen bleibt, melde dich kurz bei uns –
          wir schauen uns das an.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} size="lg">
            Erneut versuchen
          </Button>
          <Link
            href="/"
            className="flex min-h-13 items-center justify-center border border-line-strong px-8 text-sm uppercase tracking-[0.16em] text-cream transition-colors hover:border-gold hover:text-gold-light"
          >
            Zur Startseite
          </Link>
        </div>

        {error.digest && (
          <p className="mt-10 text-xs text-subtle">
            Fehlerkennung für den Support:{" "}
            <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
