"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Money } from "@/components/currency/money";
import { ButtonLink } from "@/components/ui/button";
import { useWishlist } from "@/components/wishlist/wishlist-provider";

/**
 * Die Merkliste als Seite.
 *
 * Die IDs stehen im Browser, alles Übrige kommt vom Server: Name, Preis,
 * Verfügbarkeit. Deshalb wird hier nachgeladen, statt die Angaben mit den IDs
 * zusammen zu speichern – ein gemerkter Preis von letzter Woche wäre falsch.
 */

interface WishlistEntry {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  imageUrl: string | null;
  imageAlt: string;
  topPriceCents: number;
  lowestPriceCents: number;
  sizeCount: number;
  availabilityState: string | null;
  availabilityLabel: string | null;
}

export function WishlistView() {
  const { ids, ready, remove, clear, count } = useWishlist();
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [status, setStatus] = useState<"laden" | "fertig" | "fehler">("laden");
  const [missing, setMissing] = useState(0);

  const schluessel = ids.join(",");

  useEffect(() => {
    // Nichts zu laden: Eine leere Liste beantwortet die Anzeige selbst, ohne
    // dass hier Zustand gesetzt werden muss.
    if (!ready || ids.length === 0) return;

    let abgebrochen = false;

    fetch("/api/merkliste", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { items: WishlistEntry[]; missing: number }) => {
        if (abgebrochen) return;
        setEntries(data.items);
        setMissing(data.missing);
        setStatus("fertig");
      })
      .catch(() => {
        if (!abgebrochen) setStatus("fehler");
      });

    return () => {
      abgebrochen = true;
    };
    // `schluessel` statt `ids`: Ein neues Array mit denselben IDs soll kein
    // weiteres Laden auslösen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel, ready]);

  // Reihenfolge der Fälle: Erst „leer“, dann „lädt“. Andersherum sähe eine
  // leere Merkliste für immer wie eine ladende aus, weil ohne IDs nie eine
  // Antwort kommt.
  if (ready && count === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-14 text-center">
        <p className="font-display text-2xl text-cream">Noch nichts gemerkt</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Klick beim Stöbern auf das Herz, dann sammeln sich deine Düfte hier.
          Praktisch, wenn du noch schwankst oder erst eine Abfüllung testen
          willst.
        </p>
        <div className="mt-7">
          <ButtonLink href="/shop">Düfte entdecken</ButtonLink>
        </div>
      </div>
    );
  }

  if (!ready || status === "laden") {
    return (
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col border border-line bg-charcoal">
            <div className="skeleton aspect-4/5" />
            <div className="flex flex-col gap-3 p-4">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (status === "fehler") {
    return (
      <p className="border border-line bg-charcoal px-5 py-8 text-center text-sm text-muted">
        Die Merkliste konnte gerade nicht geladen werden. Lade die Seite bitte
        neu.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="group relative flex flex-col border border-line bg-charcoal transition-colors duration-300 hover:border-gold/45"
          >
            <div className="relative aspect-4/5 overflow-hidden bg-ink">
              {entry.imageUrl ? (
                <Image
                  src={entry.imageUrl}
                  alt={entry.imageAlt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-subtle">
                  Kein Bild
                </div>
              )}

              <button
                type="button"
                onClick={() => remove(entry.id)}
                aria-label={`${entry.name} von der Merkliste nehmen`}
                className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center border border-line-strong bg-ink/80 text-muted transition-colors hover:border-gold/50 hover:text-gold-light"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
              <h2 className="text-lg leading-snug">
                <Link
                  href={`/produkt/${entry.slug}`}
                  className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                >
                  {entry.name}
                </Link>
              </h2>

              {entry.subtitle && (
                <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                  {entry.subtitle}
                </p>
              )}

              <div className="mt-auto flex flex-col gap-1 pt-2">
                <span className="font-display text-xl text-gold-light">
                  <Money cents={entry.topPriceCents} />
                </span>
                {entry.lowestPriceCents < entry.topPriceCents && (
                  <span className="text-[11px] text-subtle">
                    Kleinere Größen ab <Money cents={entry.lowestPriceCents} />
                  </span>
                )}
                {entry.availabilityLabel && (
                  <span className="text-[11px] text-subtle">
                    {entry.availabilityLabel}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {missing > 0 && (
        <p className="text-sm leading-relaxed text-subtle">
          {missing === 1
            ? "Ein gemerkter Duft ist nicht mehr im Sortiment und wird hier nicht angezeigt."
            : `${missing} gemerkte Düfte sind nicht mehr im Sortiment und werden hier nicht angezeigt.`}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button
          type="button"
          onClick={clear}
          className="min-h-11 text-sm text-muted underline underline-offset-4 transition-colors hover:text-gold-light"
        >
          Merkliste leeren
        </button>

        {/* Ehrlich sagen, wo die Liste liegt – sonst wundert sich jemand, warum
            sie auf dem Handy nicht da ist. */}
        <p className="text-xs leading-relaxed text-subtle">
          Deine Merkliste bleibt in diesem Browser. Sie wandert nicht auf
          andere Geräte mit und verschwindet, wenn du die Websitedaten
          löschst.
        </p>
      </div>
    </div>
  );
}
