/**
 * Katalog-Konstanten und Beschriftungen.
 *
 * Bewusst ohne Datenbankzugriff: Diese Datei wird auch von Client
 * Components importiert. Alles, was Prisma benötigt, gehört in
 * `src/lib/products.ts`.
 */

export const sortOptions = [
  { key: "beliebt", label: "Beliebtheit" },
  { key: "neu", label: "Neu eingetroffen" },
  { key: "preis-auf", label: "Preis aufsteigend" },
  { key: "preis-ab", label: "Preis absteigend" },
  { key: "name", label: "Name A–Z" },
] as const;

export type SortKey = (typeof sortOptions)[number]["key"];

export function isSortKey(value: string | undefined): value is SortKey {
  return sortOptions.some((option) => option.key === value);
}

/** Duftfamilien – Reihenfolge entspricht dem Prisma-Enum. */
export const fragranceFamilies = [
  "FLORAL",
  "ORIENTAL",
  "HOLZIG",
  "FRISCH",
  "ZITRUS",
  "GOURMAND",
  "AROMATISCH",
  "CHYPRE",
  "LEDER",
] as const;

export type FragranceFamilyValue = (typeof fragranceFamilies)[number];

export const familyLabels: Record<string, string> = {
  FLORAL: "Floral",
  ORIENTAL: "Orientalisch",
  HOLZIG: "Holzig",
  FRISCH: "Frisch",
  ZITRUS: "Zitrisch",
  GOURMAND: "Gourmand",
  AROMATISCH: "Aromatisch",
  CHYPRE: "Chypre",
  LEDER: "Leder",
};

export const productKinds = ["PARFUM", "ABFUELLUNG", "PROBE", "SET"] as const;

export type ProductKindValue = (typeof productKinds)[number];

export const kindLabels: Record<string, string> = {
  PARFUM: "Parfüm",
  ABFUELLUNG: "Abfüllung",
  PROBE: "Duftprobe",
  SET: "Set",
};

export const orderStatuses = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatusValue = (typeof orderStatuses)[number];

export const orderStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Zahlung ausstehend",
  PAID: "Bezahlt",
  PROCESSING: "In Bearbeitung",
  READY_TO_SHIP: "Versandbereit",
  SHIPPED: "Versendet",
  DELIVERED: "Zugestellt",
  CANCELLED: "Storniert",
  REFUNDED: "Erstattet",
};

/** Statusübergänge, die im Dashboard sinnvoll sind. */
export const nextOrderStatuses: Record<string, OrderStatusValue[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PROCESSING", "READY_TO_SHIP", "CANCELLED"],
  PROCESSING: ["READY_TO_SHIP", "SHIPPED", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "PROCESSING", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};
