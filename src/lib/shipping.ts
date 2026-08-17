/**
 * Versandarten und Versandkosten.
 *
 * Die Preise werden ausschliesslich hier (serverseitig) definiert.
 * Vom Browser gesendete Versandkosten werden niemals übernommen –
 * der Checkout akzeptiert nur den `key` und schlägt den Preis hier nach.
 */

export interface ShippingMethod {
  key: string;
  label: string;
  description: string;
  priceCents: number;
  /** Ab diesem Warenwert (nach Rabatt) entfällt der Versand. `null` = nie. */
  freeFromCents: number | null;
  /** Zusätzliche Transportzeit in Werktagen. */
  minDays: number;
  maxDays: number;
  /** Erlaubte Lieferländer (ISO-3166-1 alpha-2). */
  countries: string[];
  isActive: boolean;
}

export const shippingMethods: ShippingMethod[] = [
  {
    key: "standard",
    label: "Standardversand",
    description: "Versicherter Versand mit Sendungsverfolgung.",
    priceCents: 590,
    freeFromCents: 6000,
    minDays: 1,
    maxDays: 3,
    countries: ["CH", "LI", "DE", "AT"],
    isActive: true,
  },
  {
    key: "express",
    label: "Expressversand",
    description: "Priorisierte Zustellung, Bestellungen bis 12 Uhr am selben Tag.",
    priceCents: 1290,
    freeFromCents: null,
    minDays: 1,
    maxDays: 1,
    countries: ["CH", "LI", "DE", "AT"],
    isActive: true,
  },
];

/** Lieferländer für die Adressauswahl im Checkout. */
export const shippingCountries = [
  { code: "CH", name: "Schweiz" },
  { code: "LI", name: "Liechtenstein" },
  { code: "DE", name: "Deutschland" },
  { code: "AT", name: "Österreich" },
] as const;

export type ShippingCountryCode = (typeof shippingCountries)[number]["code"];

export function isSupportedCountry(code: string): boolean {
  return shippingCountries.some((country) => country.code === code);
}

export function getShippingMethod(key: string): ShippingMethod | null {
  return (
    shippingMethods.find((method) => method.key === key && method.isActive) ??
    null
  );
}

export function availableShippingMethods(country: string): ShippingMethod[] {
  return shippingMethods.filter(
    (method) => method.isActive && method.countries.includes(country),
  );
}

/**
 * Errechnet die Versandkosten in Cent.
 *
 * @param method            gewählte Versandart
 * @param subtotalAfterDiscountCents Warenwert nach Rabatt
 * @param freeShipping      erzwungener Gratisversand (Rabattcode)
 */
export function calculateShippingCents(
  method: ShippingMethod,
  subtotalAfterDiscountCents: number,
  freeShipping = false,
): number {
  if (freeShipping) return 0;
  if (
    method.freeFromCents !== null &&
    subtotalAfterDiscountCents >= method.freeFromCents
  ) {
    return 0;
  }
  return method.priceCents;
}

/** Betrag, der noch bis zum Gratisversand fehlt (`null`, wenn erreicht). */
export function amountUntilFreeShipping(
  subtotalCents: number,
  methodKey = "standard",
): number | null {
  const method = getShippingMethod(methodKey);
  if (!method?.freeFromCents) return null;
  const missing = method.freeFromCents - subtotalCents;
  return missing > 0 ? missing : null;
}
