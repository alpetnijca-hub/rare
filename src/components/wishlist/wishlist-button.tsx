"use client";

import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { cn } from "@/lib/utils";

/**
 * Herz zum Vormerken.
 *
 * Zwei Erscheinungsformen aus demselben Zustand: als kleines Symbol in der
 * Ecke einer Produktkarte und als Knopf mit Beschriftung auf der
 * Produktseite.
 *
 * Warum `aria-pressed` und kein reines Symbol: Der Zustand ist die halbe
 * Information. Ohne diese Angabe hört eine Screenreader-Nutzerin nur
 * „Schaltfläche Merken“ und erfährt nie, ob der Duft schon drauf ist. Die
 * Farbe allein reicht dafür nicht – sie ist für Farbenblinde kein Signal,
 * deshalb wechselt zusätzlich die Füllung des Herzens.
 */
export function WishlistButton({
  productId,
  productName,
  variant = "icon",
  className,
}: {
  productId: string;
  productName: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const { has, toggle, ready } = useWishlist();
  const gemerkt = ready && has(productId);

  const label = gemerkt
    ? `${productName} von der Merkliste nehmen`
    : `${productName} auf die Merkliste setzen`;

  const heart = (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={variant === "icon" ? "size-4.5" : "size-4"}
      fill={gemerkt ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="M10 16.5S3.2 12.4 3.2 7.9A3.7 3.7 0 0 1 10 5.8a3.7 3.7 0 0 1 6.8 2.1c0 4.5-6.8 8.6-6.8 8.6Z"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={() => toggle(productId)}
        aria-pressed={gemerkt}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 border px-4 text-sm transition-colors",
          gemerkt
            ? "border-gold text-gold-light"
            : "border-line-strong text-muted hover:border-gold/50 hover:text-gold-light",
          className,
        )}
      >
        {heart}
        {gemerkt ? "Gemerkt" : "Merken"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={gemerkt}
      aria-label={label}
      title={label}
      className={cn(
        // Über der Karte liegt ein Link, der die ganze Fläche einnimmt –
        // ohne eigene Ebene käme der Klick nie hier an.
        "relative z-10 flex size-9 items-center justify-center border transition-colors",
        gemerkt
          ? "border-gold/60 bg-ink/85 text-gold-light"
          : "border-line-strong bg-ink/75 text-muted hover:border-gold/50 hover:text-gold-light",
        className,
      )}
    >
      {heart}
    </button>
  );
}
