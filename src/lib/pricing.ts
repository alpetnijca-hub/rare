import { prisma } from "@/lib/prisma";
import { taxConfig } from "@/config/site";
import { includedTaxCents } from "@/lib/money";
import {
  combinedDelivery,
  getAvailability,
  type Availability,
} from "@/lib/availability";
import {
  calculateShippingCents,
  getShippingMethod,
  availableShippingMethods,
  type ShippingMethod,
} from "@/lib/shipping";
import { validateDiscountCode, type DiscountResult } from "@/lib/discount";

/**
 * Preisberechnung – die einzige Stelle, an der Summen entstehen.
 *
 * Grundsatz: Aus dem Browser kommen ausschliesslich Varianten-IDs und Mengen.
 * Produktnamen, Preise, Versandkosten und Rabatte werden hier serverseitig
 * aus der Datenbank geladen. Vom Client gesendete Beträge werden ignoriert.
 */

export interface QuoteRequestItem {
  variantId: string;
  quantity: number;
}

export type LineIssue =
  | "NOT_FOUND"
  | "NOT_PURCHASABLE"
  | "QUANTITY_REDUCED"
  | "PRODUCT_INACTIVE";

export interface QuoteLine {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  size: string;
  sku: string;
  volumeMl: number;
  imageUrl: string | null;
  imageAlt: string | null;
  unitPriceCents: number;
  compareAtPriceCents: number | null;
  /** Tatsächlich bestellbare Menge (kann gegenüber dem Wunsch reduziert sein). */
  quantity: number;
  requestedQuantity: number;
  lineTotalCents: number;
  availability: Availability;
  isPreorder: boolean;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  issue: LineIssue | null;
  issueMessage: string | null;
}

export interface Quote {
  lines: QuoteLine[];
  /** Positionen, die komplett entfernt werden mussten. */
  removed: Array<{ variantId: string; message: string }>;
  subtotalCents: number;
  discountCents: number;
  discount: DiscountResult;
  shippingCents: number;
  shippingMethod: ShippingMethod | null;
  shippingOptions: ShippingMethod[];
  totalCents: number;
  taxCents: number;
  taxRateBp: number;
  delivery: { minDays: number; maxDays: number; mixed: boolean };
  hasPreorderItems: boolean;
  itemCount: number;
  /** Kann so bestellt werden? */
  valid: boolean;
  /** Meldungen, die dem Kunden angezeigt werden müssen. */
  notices: string[];
}

export interface QuoteOptions {
  items: QuoteRequestItem[];
  shippingMethodKey?: string;
  country?: string;
  discountCode?: string | null;
}

const emptyDiscount: DiscountResult = {
  valid: false,
  code: null,
  discountCents: 0,
  freeShipping: false,
};

/**
 * Berechnet den vollständigen Warenkorb.
 *
 * Nicht bestellbare Positionen werden entfernt, zu hohe Mengen werden auf den
 * verfügbaren Bestand reduziert. Beides wird über `notices` gemeldet.
 */
export async function buildQuote(options: QuoteOptions): Promise<Quote> {
  const { items, shippingMethodKey, country, discountCode } = options;

  // Doppelte Positionen zusammenführen.
  const merged = new Map<string, number>();
  for (const item of items) {
    if (item.quantity <= 0) continue;
    merged.set(item.variantId, (merged.get(item.variantId) ?? 0) + item.quantity);
  }

  const variantIds = [...merged.keys()];
  const notices: string[] = [];
  const removed: Quote["removed"] = [];
  const lines: QuoteLine[] = [];

  const variants =
    variantIds.length > 0
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: "asc" }, take: 1 },
              },
            },
          },
        })
      : [];

  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  for (const [variantId, requestedQuantity] of merged) {
    const variant = variantMap.get(variantId);

    if (!variant) {
      removed.push({
        variantId,
        message: "Ein Artikel ist nicht mehr verfügbar und wurde entfernt.",
      });
      continue;
    }

    if (!variant.product.isActive) {
      removed.push({
        variantId,
        message: `„${variant.product.name}“ ist nicht mehr im Sortiment und wurde entfernt.`,
      });
      continue;
    }

    const availability = getAvailability(variant);

    if (!availability.purchasable) {
      removed.push({
        variantId,
        message: `„${variant.product.name}“ (${variant.size}) ist derzeit nicht bestellbar und wurde entfernt.`,
      });
      continue;
    }

    const quantity = Math.min(requestedQuantity, availability.maxQuantity);
    let issue: LineIssue | null = null;
    let issueMessage: string | null = null;

    if (quantity < requestedQuantity) {
      issue = "QUANTITY_REDUCED";
      issueMessage = `Von „${variant.product.name}“ (${variant.size}) sind aktuell nur ${quantity} Stück verfügbar.`;
      notices.push(issueMessage);
    }

    if (quantity <= 0) {
      removed.push({
        variantId,
        message: `„${variant.product.name}“ (${variant.size}) ist ausverkauft und wurde entfernt.`,
      });
      continue;
    }

    const image = variant.product.images[0] ?? null;

    lines.push({
      variantId: variant.id,
      productId: variant.productId,
      productSlug: variant.product.slug,
      productName: variant.product.name,
      size: variant.size,
      sku: variant.sku,
      volumeMl: variant.volumeMl,
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt ?? variant.product.name,
      unitPriceCents: variant.priceCents,
      compareAtPriceCents: variant.compareAtPriceCents,
      quantity,
      requestedQuantity,
      lineTotalCents: variant.priceCents * quantity,
      availability,
      isPreorder: availability.isPreorder,
      deliveryMinDays: variant.deliveryMinDays,
      deliveryMaxDays: variant.deliveryMaxDays,
      issue,
      issueMessage,
    });
  }

  for (const entry of removed) notices.push(entry.message);

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);

  // Rabatt auf den Warenwert.
  const discount = discountCode
    ? await validateDiscountCode(discountCode, subtotalCents)
    : emptyDiscount;

  if (discountCode && !discount.valid && discount.message) {
    notices.push(discount.message);
  }

  const discountCents = discount.valid ? discount.discountCents : 0;
  const subtotalAfterDiscount = Math.max(0, subtotalCents - discountCents);

  // Versand.
  const deliveryCountry = country ?? "CH";
  const shippingOptions = availableShippingMethods(deliveryCountry);
  const requestedMethod = shippingMethodKey
    ? getShippingMethod(shippingMethodKey)
    : null;
  const shippingMethod =
    requestedMethod && shippingOptions.some((m) => m.key === requestedMethod.key)
      ? requestedMethod
      : (shippingOptions[0] ?? null);

  const shippingCents =
    shippingMethod && lines.length > 0
      ? calculateShippingCents(
          shippingMethod,
          subtotalAfterDiscount,
          discount.valid && discount.freeShipping,
        )
      : 0;

  const totalCents = subtotalAfterDiscount + shippingCents;

  // Lieferzeit: Ware + Transport, massgeblich ist die langsamste Position.
  const itemDelivery = combinedDelivery(lines);
  const delivery = {
    minDays: itemDelivery.minDays + (shippingMethod?.minDays ?? 0),
    maxDays: itemDelivery.maxDays + (shippingMethod?.maxDays ?? 0),
    mixed: itemDelivery.mixed,
  };

  return {
    lines,
    removed,
    subtotalCents,
    discountCents,
    discount,
    shippingCents,
    shippingMethod,
    shippingOptions,
    totalCents,
    taxCents: taxConfig.pricesIncludeTax
      ? includedTaxCents(totalCents, taxConfig.rateBp)
      : 0,
    taxRateBp: taxConfig.rateBp,
    delivery,
    hasPreorderItems: lines.some((line) => line.isPreorder),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    valid: lines.length > 0 && shippingMethod !== null,
    notices: [...new Set(notices)],
  };
}

/** Kompakte, JSON-taugliche Darstellung für Client Components. */
export interface SerializedQuote {
  lines: Array<{
    variantId: string;
    productSlug: string;
    productName: string;
    size: string;
    imageUrl: string | null;
    imageAlt: string | null;
    unitPriceCents: number;
    compareAtPriceCents: number | null;
    quantity: number;
    lineTotalCents: number;
    maxQuantity: number;
    availabilityLabel: string;
    availabilityState: string;
    isPreorder: boolean;
    deliveryMinDays: number;
    deliveryMaxDays: number;
    volumeMl: number;
  }>;
  subtotalCents: number;
  discountCents: number;
  discountLabel: string | null;
  discountValid: boolean;
  discountMessage: string | null;
  shippingCents: number;
  shippingMethodKey: string | null;
  shippingOptions: Array<{
    key: string;
    label: string;
    description: string;
    priceCents: number;
    freeFromCents: number | null;
  }>;
  totalCents: number;
  taxCents: number;
  taxRateBp: number;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  deliveryMixed: boolean;
  hasPreorderItems: boolean;
  itemCount: number;
  valid: boolean;
  notices: string[];
  removedVariantIds: string[];
}

export function serializeQuote(quote: Quote): SerializedQuote {
  return {
    lines: quote.lines.map((line) => ({
      variantId: line.variantId,
      productSlug: line.productSlug,
      productName: line.productName,
      size: line.size,
      imageUrl: line.imageUrl,
      imageAlt: line.imageAlt,
      unitPriceCents: line.unitPriceCents,
      compareAtPriceCents: line.compareAtPriceCents,
      quantity: line.quantity,
      lineTotalCents: line.lineTotalCents,
      maxQuantity: line.availability.maxQuantity,
      availabilityLabel: line.availability.label,
      availabilityState: line.availability.state,
      isPreorder: line.isPreorder,
      deliveryMinDays: line.deliveryMinDays,
      deliveryMaxDays: line.deliveryMaxDays,
      volumeMl: line.volumeMl,
    })),
    subtotalCents: quote.subtotalCents,
    discountCents: quote.discountCents,
    discountLabel: quote.discount.code?.code ?? null,
    discountValid: quote.discount.valid,
    discountMessage: quote.discount.message ?? null,
    shippingCents: quote.shippingCents,
    shippingMethodKey: quote.shippingMethod?.key ?? null,
    shippingOptions: quote.shippingOptions.map((method) => ({
      key: method.key,
      label: method.label,
      description: method.description,
      priceCents: method.priceCents,
      freeFromCents: method.freeFromCents,
    })),
    totalCents: quote.totalCents,
    taxCents: quote.taxCents,
    taxRateBp: quote.taxRateBp,
    deliveryMinDays: quote.delivery.minDays,
    deliveryMaxDays: quote.delivery.maxDays,
    deliveryMixed: quote.delivery.mixed,
    hasPreorderItems: quote.hasPreorderItems,
    itemCount: quote.itemCount,
    valid: quote.valid,
    notices: quote.notices,
    removedVariantIds: quote.removed.map((entry) => entry.variantId),
  };
}
