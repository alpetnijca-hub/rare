import { siteConfig, taxConfig } from "@/config/site";

/**
 * Geldbeträge werden ausschliesslich als Integer in Cent verarbeitet.
 * Fliesskommazahlen sind für Geld nicht zulässig (Rundungsfehler).
 */

const currencyFormatter = new Intl.NumberFormat(siteConfig.priceLocale, {
  style: "currency",
  currency: siteConfig.currency,
});

/** Formatiert Cent als Währungsbetrag, z. B. 4990 -> "49,90 €". */
export function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Wandelt eine Eingabe wie "49,90" oder "49.90" in 4990 Cent um. */
export function parsePriceToCents(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number.parseFloat(normalized) * 100);
}

/** Wandelt Cent für Formularfelder zurück, z. B. 4990 -> "49.90". */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Errechnet die im Bruttopreis enthaltene Umsatzsteuer.
 * Beispiel: 10'000 Cent brutto bei 810 bp -> 749 Cent enthaltene MwSt.
 */
export function includedTaxCents(
  grossCents: number,
  rateBp: number = taxConfig.rateBp,
): number {
  if (rateBp <= 0) return 0;
  return Math.round((grossCents * rateBp) / (10_000 + rateBp));
}

/** Formatiert einen Steuersatz, z. B. 810 -> "8,1 %". */
export function formatTaxRate(rateBp: number = taxConfig.rateBp): string {
  return `${(rateBp / 100).toLocaleString(siteConfig.priceLocale, {
    maximumFractionDigits: 2,
  })} %`;
}

/**
 * Grundpreis gemäss Preisangabenverordnung: Preis je 100 ml.
 * Liefert `null`, wenn kein sinnvolles Volumen hinterlegt ist.
 */
export function basePricePer100Ml(
  priceCents: number,
  volumeMl: number,
): number | null {
  if (!volumeMl || volumeMl <= 0) return null;
  return Math.round((priceCents / volumeMl) * 100);
}

/** Fertiger Anzeigetext für den Grundpreis, z. B. "€ 99.00 / 100 ml". */
export function formatBasePrice(
  priceCents: number,
  volumeMl: number,
): string | null {
  const perHundred = basePricePer100Ml(priceCents, volumeMl);
  if (perHundred === null) return null;
  return `${formatPrice(perHundred)} / 100 ml`;
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
