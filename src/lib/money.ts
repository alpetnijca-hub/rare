import { siteConfig, taxConfig } from "@/config/site";
import { baseCurrency, type Currency } from "@/config/currencies";

/**
 * Geldbeträge werden ausschliesslich als Integer in der kleinsten Einheit
 * der Abrechnungswährung verarbeitet – bei CHF also in Rappen.
 * Fliesskommazahlen sind für Geld nicht zulässig (Rundungsfehler).
 *
 * Jeder Betrag, der durch dieses Modul läuft, ist ein CHF-Betrag.
 * `formatIn()` rechnet ihn nur für die Anzeige in eine andere Währung um;
 * berechnet, gespeichert und belastet wird immer CHF.
 */

const formatterCache = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: Currency): Intl.NumberFormat {
  const cached = formatterCache.get(currency.code);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
  });
  formatterCache.set(currency.code, formatter);
  return formatter;
}

/**
 * Formatiert Rappen als Betrag in der Abrechnungswährung,
 * z. B. 4990 -> "CHF 49.90".
 *
 * Diese Funktion ist die richtige Wahl überall dort, wo der tatsächlich
 * belastete Betrag stehen muss: Adminbereich, E-Mails, Rechnungen,
 * abgeschlossene Bestellungen.
 */
export function formatPrice(cents: number): string {
  return formatterFor(baseCurrency).format(cents / 100);
}

/**
 * Rechnet einen CHF-Betrag in die kleinste Einheit einer Anzeigewährung um.
 * Das Ergebnis bleibt ein Integer.
 */
export function convertFromBase(cents: number, currency: Currency): number {
  if (currency.isBase) return cents;
  return Math.round(cents * currency.unitsPerBase);
}

/**
 * Formatiert einen CHF-Betrag in der gewählten Anzeigewährung.
 *
 * Bei einer Fremdwährung wird «ca.» vorangestellt, weil der Kurs eine
 * hinterlegte Näherung ist und die Belastung in CHF erfolgt.
 */
export function formatIn(
  cents: number,
  currency: Currency,
  options: { approximate?: boolean } = {},
): string {
  const formatted = formatterFor(currency).format(
    convertFromBase(cents, currency) / 100,
  );
  if (currency.isBase) return formatted;
  return options.approximate === false ? formatted : `ca. ${formatted}`;
}

/** Wandelt eine Eingabe wie "49.90" oder "49,90" in 4990 Rappen um. */
export function parsePriceToCents(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number.parseFloat(normalized) * 100);
}

/** Wandelt Rappen für Formularfelder zurück, z. B. 4990 -> "49.90". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Errechnet die im Bruttopreis enthaltene Mehrwertsteuer.
 * Beispiel: 10'000 Rappen brutto bei 810 bp -> 749 Rappen enthaltene MwSt.
 *
 * Liefert 0, solange keine Steuerpflicht konfiguriert ist.
 */
export function includedTaxCents(
  grossCents: number,
  rateBp: number = taxConfig.rateBp,
): number {
  if (rateBp <= 0) return 0;
  return Math.round((grossCents * rateBp) / (10_000 + rateBp));
}

/** Formatiert einen Steuersatz, z. B. 810 -> "8.1 %". */
export function formatTaxRate(rateBp: number = taxConfig.rateBp): string {
  return `${(rateBp / 100).toLocaleString(siteConfig.priceLocale, {
    maximumFractionDigits: 2,
  })} %`;
}

/**
 * Grundpreis gemäss Preisbekanntgabeverordnung: Preis je 100 ml.
 * Liefert `null`, wenn kein sinnvolles Volumen hinterlegt ist.
 */
export function basePricePer100Ml(
  priceCents: number,
  volumeMl: number,
): number | null {
  if (!volumeMl || volumeMl <= 0) return null;
  return Math.round((priceCents / volumeMl) * 100);
}

/** Fertiger Anzeigetext für den Grundpreis, z. B. "CHF 99.00 / 100 ml". */
export function formatBasePrice(
  priceCents: number,
  volumeMl: number,
  currency: Currency = baseCurrency,
): string | null {
  const perHundred = basePricePer100Ml(priceCents, volumeMl);
  if (perHundred === null) return null;
  return `${formatIn(perHundred, currency)} / 100 ml`;
}

/** Rabatt in Prozent zwischen Streich- und Verkaufspreis. */
export function discountPercent(
  priceCents: number,
  compareAtPriceCents: number | null | undefined,
): number | null {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) return null;
  return Math.round(
    ((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100,
  );
}
