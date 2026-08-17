"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { SerializedQuote } from "@/lib/pricing";

/**
 * Holt die verbindliche Warenkorbberechnung vom Server.
 *
 * Der Browser kennt keine Preise – er sendet Varianten-IDs und Mengen und
 * bekommt fertig berechnete Beträge zurück. Positionen, die der Server als
 * nicht mehr bestellbar meldet, werden lokal entfernt.
 */
export interface UseCartQuoteOptions {
  shippingMethod?: string;
  country?: string;
  discountCode?: string;
}

export interface UseCartQuoteResult {
  quote: SerializedQuote | null;
  loading: boolean;
  error: string | null;
  /** Neuberechnung manuell auslösen. */
  refresh: () => void;
}

export function useCartQuote(
  options: UseCartQuoteOptions = {},
): UseCartQuoteResult {
  const { items, ready, revision, removeMany } = useCart();
  const { shippingMethod, country, discountCode } = options;

  const [quote, setQuote] = useState<SerializedQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualRefresh, setManualRefresh] = useState(0);

  // Laufende Anfragen abbrechen, damit veraltete Antworten nichts überschreiben.
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => setManualRefresh((value) => value + 1), []);

  const isEmpty = items.length === 0;

  useEffect(() => {
    // Ein leerer Warenkorb braucht keine Serveranfrage – das Ergebnis wird
    // unten direkt abgeleitet.
    if (!ready || isEmpty) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Entprellt: Erst wenn die Anfrage tatsächlich startet, wird der
    // Ladezustand gesetzt. Bei schnellen Mengenänderungen flackert dadurch
    // nichts.
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/warenkorb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            items: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            })),
            shippingMethod,
            country,
            discountCode: discountCode || undefined,
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(
            data?.error ?? "Der Warenkorb konnte nicht berechnet werden.",
          );
          setLoading(false);
          return;
        }

        const data = (await response.json()) as SerializedQuote;
        setQuote(data);
        setError(null);
        setLoading(false);

        // Vom Server entfernte Positionen auch lokal löschen.
        if (data.removedVariantIds.length > 0) {
          removeMany(data.removedVariantIds);
        }
      } catch {
        if (controller.signal.aborted) return;
        setError("Verbindung fehlgeschlagen. Bitte Seite neu laden.");
        setLoading(false);
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    ready,
    isEmpty,
    items,
    revision,
    shippingMethod,
    country,
    discountCode,
    manualRefresh,
    removeMany,
  ]);

  // Bei leerem Warenkorb gibt es nichts zu laden und nichts anzuzeigen.
  if (isEmpty) {
    return { quote: null, loading: false, error: null, refresh };
  }

  return { quote, loading, error, refresh };
}
