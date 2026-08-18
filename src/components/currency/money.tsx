"use client";

import { useCurrency } from "@/components/currency/currency-provider";

/**
 * Gibt einen CHF-Betrag in der gewählten Anzeigewährung aus.
 *
 * Absichtlich eine Client-Komponente: So können auch Server Components
 * Preise anzeigen, ohne selbst das Währungscookie lesen zu müssen. Der
 * Kontext kommt vom `CurrencyProvider` im Shop-Layout.
 */
export function Money({
  cents,
  exact = false,
}: {
  /** Betrag in Rappen (Abrechnungswährung CHF). */
  cents: number;
  /** true blendet das «ca.» bei Fremdwährungen aus. */
  exact?: boolean;
}) {
  const { format, formatExact } = useCurrency();
  return <>{exact ? formatExact(cents) : format(cents)}</>;
}

/** Grundpreis je 100 ml in der Anzeigewährung. */
export function BasePrice({
  priceCents,
  volumeMl,
}: {
  priceCents: number;
  volumeMl: number;
}) {
  const { formatBase } = useCurrency();
  const value = formatBase(priceCents, volumeMl);
  if (!value) return null;
  return <>{value}</>;
}
