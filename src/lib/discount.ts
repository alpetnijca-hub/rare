import type { DiscountCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Rabattcodes werden ausschliesslich serverseitig geprüft und berechnet.
 */

export type DiscountRejection =
  | "NOT_FOUND"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "EXHAUSTED"
  | "MIN_SUBTOTAL";

export interface DiscountResult {
  valid: boolean;
  code: DiscountCode | null;
  /** Rabattbetrag auf den Warenwert in Cent. */
  discountCents: number;
  /** Versandkosten entfallen vollständig. */
  freeShipping: boolean;
  reason?: DiscountRejection;
  message?: string;
}

const rejectionMessages: Record<DiscountRejection, string> = {
  NOT_FOUND: "Dieser Gutscheincode ist ungültig.",
  INACTIVE: "Dieser Gutscheincode ist nicht mehr aktiv.",
  NOT_STARTED: "Dieser Gutscheincode ist noch nicht gültig.",
  EXPIRED: "Dieser Gutscheincode ist abgelaufen.",
  EXHAUSTED: "Dieser Gutscheincode wurde bereits vollständig eingelöst.",
  MIN_SUBTOTAL: "Der Mindestbestellwert für diesen Gutschein ist nicht erreicht.",
};

function reject(reason: DiscountRejection, code: DiscountCode | null = null): DiscountResult {
  return {
    valid: false,
    code,
    discountCents: 0,
    freeShipping: false,
    reason,
    message: rejectionMessages[reason],
  };
}

export const noDiscount: DiscountResult = {
  valid: false,
  code: null,
  discountCents: 0,
  freeShipping: false,
};

/**
 * Berechnet den Rabatt für einen bereits geladenen Code.
 * Der Rabatt kann den Warenwert nie übersteigen.
 */
export function applyDiscount(
  code: DiscountCode,
  subtotalCents: number,
  now = new Date(),
): DiscountResult {
  if (!code.isActive) return reject("INACTIVE", code);
  if (code.startsAt && code.startsAt > now) return reject("NOT_STARTED", code);
  if (code.endsAt && code.endsAt < now) return reject("EXPIRED", code);
  if (code.maxRedemptions !== null && code.usedCount >= code.maxRedemptions) {
    return reject("EXHAUSTED", code);
  }
  if (subtotalCents < code.minSubtotalCents) return reject("MIN_SUBTOTAL", code);

  if (code.type === "FREE_SHIPPING") {
    return { valid: true, code, discountCents: 0, freeShipping: true };
  }

  const raw =
    code.type === "PERCENT"
      ? Math.round((subtotalCents * code.value) / 10_000)
      : code.value;

  // Ein Rabatt darf den Warenwert nicht übersteigen (kein negativer Betrag).
  const discountCents = Math.max(0, Math.min(raw, subtotalCents));

  return { valid: true, code, discountCents, freeShipping: false };
}

/** Lädt einen Code aus der Datenbank und wendet ihn an. */
export async function validateDiscountCode(
  rawCode: string | null | undefined,
  subtotalCents: number,
  now = new Date(),
): Promise<DiscountResult> {
  if (!rawCode) return noDiscount;

  const code = await prisma.discountCode.findUnique({
    where: { code: rawCode.trim().toUpperCase() },
  });

  if (!code) return reject("NOT_FOUND");
  return applyDiscount(code, subtotalCents, now);
}

/** Beschreibt einen Code fürs Frontend, z. B. "10 % Rabatt". */
export function describeDiscount(code: DiscountCode): string {
  switch (code.type) {
    case "PERCENT":
      return `${(code.value / 100).toLocaleString("de-CH", {
        maximumFractionDigits: 2,
      })} % Rabatt`;
    case "FIXED":
      return `${(code.value / 100).toFixed(2)} Rabatt`;
    case "FREE_SHIPPING":
      return "Gratisversand";
  }
}
