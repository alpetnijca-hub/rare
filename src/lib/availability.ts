import { maxPreorderQuantity, maxQuantityPerItem } from "@/config/site";

/**
 * Verfügbarkeitslogik – die einzige Quelle der Wahrheit dafür,
 * ob und in welcher Menge eine Variante bestellt werden kann.
 *
 * Diese Funktionen laufen sowohl im Frontend (Anzeige) als auch im
 * Checkout (Durchsetzung). Der Server prüft immer erneut.
 */

export type AvailabilityState =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "PREORDER"
  | "OUT_OF_STOCK"
  | "UNAVAILABLE";

/** Minimale Felder, die zur Beurteilung nötig sind. */
export interface AvailabilityInput {
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  preorderEnabled: boolean;
  restockDate: Date | string | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
}

export interface Availability {
  state: AvailabilityState;
  /** Darf in den Warenkorb gelegt werden? */
  purchasable: boolean;
  /** Frei verfügbarer Bestand (physisch minus reserviert), nie negativ. */
  available: number;
  /** Höchstmenge, die bestellt werden darf. */
  maxQuantity: number;
  /** Kundentauglicher Verfügbarkeitstext. */
  label: string;
  /** Kurzform für Produktkarten. */
  shortLabel: string;
  /** Lieferzeit in Werktagen. */
  deliveryMinDays: number;
  deliveryMaxDays: number;
  restockDate: Date | null;
  isPreorder: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatRestockDate(date: Date): string {
  return dateFormatter.format(date);
}

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Freier Bestand: physisch vorhanden minus bereits reserviert. */
export function availableStock(input: {
  stock: number;
  reservedStock: number;
}): number {
  return Math.max(0, input.stock - input.reservedStock);
}

export function getAvailability(variant: AvailabilityInput): Availability {
  const available = availableStock(variant);
  const restockDate = toDate(variant.restockDate);
  const deliveryMinDays = variant.deliveryMinDays;
  const deliveryMaxDays = variant.deliveryMaxDays;

  const base = {
    available,
    deliveryMinDays,
    deliveryMaxDays,
    restockDate,
  };

  // Deaktivierte Varianten sind nie bestellbar.
  if (!variant.isActive) {
    return {
      ...base,
      state: "UNAVAILABLE",
      purchasable: false,
      maxQuantity: 0,
      isPreorder: false,
      label: "Derzeit nicht bestellbar",
      shortLabel: "Nicht bestellbar",
    };
  }

  if (available > 0) {
    const isLow = available <= Math.max(1, variant.lowStockThreshold);
    return {
      ...base,
      state: isLow ? "LOW_STOCK" : "IN_STOCK",
      purchasable: true,
      maxQuantity: Math.min(available, maxQuantityPerItem),
      isPreorder: false,
      label: isLow
        ? `Nur noch ${available} ${available === 1 ? "Stück" : "Stück"} verfügbar`
        : `Auf Lager – Versand in ${formatDeliveryRange(deliveryMinDays, deliveryMaxDays)}`,
      shortLabel: isLow ? `Nur noch ${available} verfügbar` : "Auf Lager",
    };
  }

  // Kein freier Bestand mehr – Vorbestellung möglich?
  if (variant.preorderEnabled) {
    return {
      ...base,
      state: "PREORDER",
      purchasable: true,
      maxQuantity: maxPreorderQuantity,
      isPreorder: true,
      label: `Vorbestellbar – voraussichtlicher Versand in ${formatDeliveryRange(
        deliveryMinDays,
        deliveryMaxDays,
      )}`,
      shortLabel: "Vorbestellbar",
    };
  }

  if (restockDate && restockDate.getTime() > Date.now()) {
    return {
      ...base,
      state: "OUT_OF_STOCK",
      purchasable: false,
      maxQuantity: 0,
      isPreorder: false,
      label: `Nicht auf Lager – voraussichtlich wieder verfügbar ab ${formatRestockDate(
        restockDate,
      )}`,
      shortLabel: "Nicht auf Lager",
    };
  }

  return {
    ...base,
    state: "UNAVAILABLE",
    purchasable: false,
    maxQuantity: 0,
    isPreorder: false,
    label: "Derzeit nicht bestellbar",
    shortLabel: "Nicht bestellbar",
  };
}

/** "1–2 Werktagen" bzw. "2 Werktagen", wenn Min und Max gleich sind. */
export function formatDeliveryRange(minDays: number, maxDays: number): string {
  if (minDays === maxDays) {
    return `${minDays} ${minDays === 1 ? "Werktag" : "Werktagen"}`;
  }
  return `${minDays}–${maxDays} Werktagen`;
}

/**
 * Fasst die Lieferzeiten mehrerer Positionen zusammen.
 * Massgeblich ist die langsamste Position.
 */
export function combinedDelivery(
  items: Array<{ deliveryMinDays: number; deliveryMaxDays: number }>,
): { minDays: number; maxDays: number; mixed: boolean } {
  if (items.length === 0) return { minDays: 0, maxDays: 0, mixed: false };

  const minDays = Math.max(...items.map((item) => item.deliveryMinDays));
  const maxDays = Math.max(...items.map((item) => item.deliveryMaxDays));
  const mixed = items.some(
    (item) =>
      item.deliveryMinDays !== items[0].deliveryMinDays ||
      item.deliveryMaxDays !== items[0].deliveryMaxDays,
  );

  return { minDays, maxDays, mixed };
}

/**
 * Addiert Werktage (Mo–Fr) auf ein Datum.
 * Feiertage werden bewusst nicht berücksichtigt – die Angabe ist eine
 * Schätzung und wird als solche kommuniziert.
 */
export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result;
}

/** Voraussichtliches Lieferfenster als Text, z. B. "18.08.2026 – 20.08.2026". */
export function estimatedDeliveryWindow(
  minDays: number,
  maxDays: number,
  from: Date = new Date(),
): string {
  const earliest = addBusinessDays(from, minDays);
  const latest = addBusinessDays(from, maxDays);
  if (minDays === maxDays) return formatRestockDate(earliest);
  return `${formatRestockDate(earliest)} – ${formatRestockDate(latest)}`;
}
