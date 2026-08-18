"use client";

import { useRef } from "react";
import { currencies, currencySwitchingEnabled } from "@/config/currencies";
import { useCurrency } from "@/components/currency/currency-provider";
import { setDisplayCurrency } from "@/lib/actions/currency";

/**
 * Umschalter für die Anzeigewährung.
 *
 * Es ist ein echtes Formular mit Server Action: Ohne JavaScript funktioniert
 * es über den Absende-Button, mit JavaScript wird beim Wechsel automatisch
 * abgeschickt. Die Auswahl landet in einem Cookie und wird beim nächsten
 * Rendern serverseitig gelesen.
 */
export function CurrencySwitcher({
  className = "",
  label = "Anzeigewährung",
  showLabel = false,
}: {
  className?: string;
  label?: string;
  showLabel?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { currency } = useCurrency();

  if (!currencySwitchingEnabled) return null;

  return (
    <form
      ref={formRef}
      action={setDisplayCurrency}
      className={`flex items-center gap-2 ${className}`}
    >
      <label
        htmlFor="currency-switcher"
        className={
          showLabel
            ? "text-xs uppercase tracking-[0.14em] text-subtle"
            : "sr-only"
        }
      >
        {label}
      </label>

      <select
        id="currency-switcher"
        name="currency"
        defaultValue={currency.code}
        onChange={() => formRef.current?.requestSubmit()}
        className="cursor-pointer border border-line bg-transparent px-2 py-1 text-xs uppercase
          tracking-[0.12em] text-muted transition-colors hover:border-gold/50 hover:text-cream
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {currencies.map((option) => (
          <option key={option.code} value={option.code} className="bg-charcoal">
            {option.code}
          </option>
        ))}
      </select>

      {/* Ohne JavaScript bleibt der Umschalter über diesen Button bedienbar. */}
      <noscript>
        <button
          type="submit"
          className="border border-line px-2 py-1 text-xs uppercase tracking-[0.12em] text-muted"
        >
          Übernehmen
        </button>
      </noscript>
    </form>
  );
}

/** Hinweis, dass die Belastung unabhängig von der Anzeige in CHF erfolgt. */
export function CurrencyNotice({ className = "" }: { className?: string }) {
  const { currency, isConverted } = useCurrency();
  if (!isConverted) return null;

  return (
    <p className={`text-xs leading-relaxed text-subtle ${className}`}>
      Beträge in {currency.label} ({currency.code}) sind unverbindlich
      umgerechnet. Verbindlich ist der Preis in Schweizer Franken – die
      Belastung erfolgt in CHF.
    </p>
  );
}
