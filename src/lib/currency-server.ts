import { cookies } from "next/headers";
import {
  baseCurrency,
  currencyCookieName,
  resolveCurrency,
  type Currency,
} from "@/config/currencies";
import { formatIn } from "@/lib/money";

/**
 * Serverseitige Ermittlung der Anzeigewährung.
 *
 * Die Auswahl steht in einem Cookie und wird schon beim Rendern gelesen.
 * Dadurch stimmt das Server-Markup mit dem Client-Markup überein: keine
 * Hydration-Warnung und kein sichtbares Umspringen der Preise.
 *
 * Achtung: Der Aufruf von `cookies()` macht die aufrufende Route dynamisch.
 * Das ist beabsichtigt – die Shopseiten lesen ohnehin aus der Datenbank.
 */
export async function getDisplayCurrency(): Promise<Currency> {
  try {
    const store = await cookies();
    return resolveCurrency(store.get(currencyCookieName)?.value);
  } catch {
    // Statisch gerenderter Kontext ohne Request – dann gilt die Basiswährung.
    return baseCurrency;
  }
}

/**
 * Bequemer Formatierer für Server Components.
 *
 * ```tsx
 * const { format, currency } = await getPriceFormatter();
 * <p>{format(variant.priceCents)}</p>
 * ```
 */
export async function getPriceFormatter(): Promise<{
  currency: Currency;
  format: (cents: number) => string;
}> {
  const currency = await getDisplayCurrency();
  return {
    currency,
    format: (cents: number) => formatIn(cents, currency),
  };
}
