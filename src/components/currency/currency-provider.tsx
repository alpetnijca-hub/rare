"use client";

import { createContext, useContext, useMemo } from "react";
import { baseCurrency, type Currency } from "@/config/currencies";
import { convertFromBase, formatBasePrice, formatIn } from "@/lib/money";

/**
 * Stellt die gewählte Anzeigewährung an Client Components bereit.
 *
 * Die Währung kommt als Prop vom Server (aus dem Cookie gelesen), nicht aus
 * dem localStorage. Deshalb rendern Server und Client von Anfang an denselben
 * Betrag – kein Flackern, keine Hydration-Abweichung.
 */

interface CurrencyContextValue {
  currency: Currency;
  /** Formatiert einen CHF-Betrag in der Anzeigewährung. */
  format: (cents: number) => string;
  /** Wie `format`, aber ohne das «ca.» davor (z. B. für Tabellen). */
  formatExact: (cents: number) => string;
  /** Grundpreis je 100 ml in der Anzeigewährung. */
  formatBase: (priceCents: number, volumeMl: number) => string | null;
  /** Rechnet einen CHF-Betrag in die kleinste Einheit der Anzeigewährung um. */
  convert: (cents: number) => number;
  /** true, wenn gerade nicht in der Abrechnungswährung angezeigt wird. */
  isConverted: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: Currency;
  children: React.ReactNode;
}) {
  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      format: (cents) => formatIn(cents, currency),
      formatExact: (cents) => formatIn(cents, currency, { approximate: false }),
      formatBase: (priceCents, volumeMl) =>
        formatBasePrice(priceCents, volumeMl, currency),
      convert: (cents) => convertFromBase(cents, currency),
      isConverted: !currency.isBase,
    }),
    [currency],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Zugriff auf die Anzeigewährung.
 *
 * Ausserhalb eines Providers (z. B. im Adminbereich) gilt bewusst die
 * Abrechnungswährung – dort sollen immer echte CHF-Beträge stehen.
 */
export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (context) return context;

  return {
    currency: baseCurrency,
    format: (cents) => formatIn(cents, baseCurrency),
    formatExact: (cents) => formatIn(cents, baseCurrency),
    formatBase: (priceCents, volumeMl) =>
      formatBasePrice(priceCents, volumeMl, baseCurrency),
    convert: (cents) => cents,
    isConverted: false,
  };
}
