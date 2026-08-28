import { z } from "zod";
import { maxQuantityPerItem } from "@/config/site";
import { shippingCountries } from "@/lib/shipping";
import { fragranceFamilies, orderStatuses, productKinds } from "@/lib/catalog";

export { fragranceFamilies, productKinds };

/**
 * Alle Eingaben aus dem Browser werden hier validiert, bevor sie
 * die Datenbank oder einen Zahlungsdienst erreichen.
 */

const countryCodes = shippingCountries.map((country) => country.code) as [
  string,
  ...string[],
];

const trimmed = (min: number, max: number, field: string) =>
  z
    .string()
    .trim()
    .min(min, `${field} ist erforderlich.`)
    .max(max, `${field} ist zu lang.`);

export const emailSchema = z
  .email("Bitte eine gültige E-Mail-Adresse angeben.")
  .max(255)
  .transform((value) => value.trim().toLowerCase());

/** Locker gehaltene Telefonprüfung – international, optional. */
export const phoneSchema = z
  .string()
  .trim()
  .max(32, "Telefonnummer ist zu lang.")
  .regex(/^[+0-9 ()/.-]*$/, "Telefonnummer enthält ungültige Zeichen.")
  .optional()
  .or(z.literal(""));

export const addressSchema = z.object({
  firstName: trimmed(1, 80, "Vorname"),
  lastName: trimmed(1, 80, "Nachname"),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  street: trimmed(1, 120, "Strasse"),
  houseNumber: z.string().trim().max(20).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: trimmed(2, 12, "Postleitzahl"),
  city: trimmed(1, 80, "Ort"),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.enum(countryCodes, {
    message: "In dieses Land liefern wir derzeit nicht.",
  }),
  phone: phoneSchema,
});

export type AddressInput = z.infer<typeof addressSchema>;

/**
 * Warenkorbposition. Der Browser sendet ausschliesslich Varianten-ID und
 * Menge – niemals Preise. Preise werden serverseitig nachgeschlagen.
 */
export const cartItemSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: z.coerce
    .number()
    .int("Menge muss eine ganze Zahl sein.")
    .min(1, "Menge muss mindestens 1 betragen.")
    .max(maxQuantityPerItem, `Maximal ${maxQuantityPerItem} Stück je Position.`),
});

export const cartSchema = z
  .array(cartItemSchema)
  .min(1, "Der Warenkorb ist leer.")
  .max(50, "Zu viele Positionen im Warenkorb.");

export const discountCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[A-Za-z0-9_-]+$/, "Ungültiger Gutscheincode.")
  .transform((value) => value.toUpperCase());

export const checkoutSchema = z
  .object({
    items: cartSchema,
    email: emailSchema,
    phone: phoneSchema,
    shippingAddress: addressSchema,
    /** Abweichende Rechnungsadresse aktiv? */
    billingDiffers: z.boolean().default(false),
    billingAddress: addressSchema.optional(),
    shippingMethod: z.string().min(1).max(40),
    discountCode: discountCodeSchema.optional().or(z.literal("")),
    customerNote: z.string().trim().max(500).optional().or(z.literal("")),
    acceptTerms: z.literal(true, {
      message: "Bitte AGB und Datenschutzerklärung bestätigen.",
    }),
    acceptWithdrawal: z.literal(true, {
      message: "Bitte die Rückgabe- und Widerrufsinformationen bestätigen.",
    }),
    marketingOptIn: z.boolean().default(false),
  })
  .refine(
    (data) => !data.billingDiffers || data.billingAddress !== undefined,
    {
      message: "Bitte die abweichende Rechnungsadresse vollständig ausfüllen.",
      path: ["billingAddress"],
    },
  );

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Live-Neuberechnung des Warenkorbs (Zwischensumme, Versand, Rabatt). */
export const cartQuoteSchema = z.object({
  items: z.array(cartItemSchema).max(50),
  shippingMethod: z.string().min(1).max(40).optional(),
  country: z.enum(countryCodes).optional(),
  discountCode: discountCodeSchema.optional().or(z.literal("")),
});

export const newsletterSchema = z.object({
  email: emailSchema,
  consent: z.literal(true, {
    message: "Bitte der Verarbeitung deiner E-Mail-Adresse zustimmen.",
  }),
  /** Honeypot – muss leer bleiben. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: trimmed(2, 80, "Name"),
  email: emailSchema,
  subject: trimmed(3, 140, "Betreff"),
  message: trimmed(10, 2000, "Nachricht"),
  privacy: z.literal(true, {
    message: "Bitte die Datenschutzerklärung bestätigen.",
  }),
  /** Honeypot – muss leer bleiben. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export const backInStockSchema = z.object({
  email: emailSchema,
  variantId: z.string().min(1).max(64),
  consent: z.literal(true, {
    message: "Bitte der einmaligen Benachrichtigung zustimmen.",
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben.").max(200),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const notesSchema = z
  .string()
  .max(400)
  .optional()
  .or(z.literal(""))
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((note) => note.trim())
      .filter(Boolean)
      .slice(0, 20),
  );

export const adminProductSchema = z.object({
  name: trimmed(2, 120, "Produktname"),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(90)
    .regex(/^[a-z0-9-]+$/, "Slug darf nur Kleinbuchstaben, Zahlen und - enthalten."),
  subtitle: z.string().trim().max(160).optional().or(z.literal("")),
  description: trimmed(20, 5000, "Beschreibung"),
  scentProfile: z.string().trim().max(200).optional().or(z.literal("")),
  fragranceFamily: z.enum(fragranceFamilies),
  kind: z.enum(productKinds),
  topNotes: notesSchema,
  heartNotes: notesSchema,
  baseNotes: notesSchema,
  ingredients: z.string().trim().max(3000).optional().or(z.literal("")),
  usage: z.string().trim().max(2000).optional().or(z.literal("")),
  legalNotice: z.string().trim().max(2000).optional().or(z.literal("")),
  isAlternative: z.coerce.boolean().default(false),
  isDemo: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  isBestseller: z.coerce.boolean().default(false),
  isNew: z.coerce.boolean().default(false),
  popularity: z.coerce.number().int().min(0).max(100000).default(0),
  metaTitle: z.string().trim().max(70).optional().or(z.literal("")),
  metaDesc: z.string().trim().max(180).optional().or(z.literal("")),
  categoryIds: z.array(z.string().min(1)).max(20).default([]),
});

export const adminVariantSchema = z.object({
  productId: z.string().min(1),
  sku: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/, "SKU darf nur Buchstaben, Zahlen, . _ - enthalten.")
    .transform((value) => value.toUpperCase()),
  size: trimmed(1, 40, "Größe"),
  volumeMl: z.coerce.number().int().min(1).max(10000),
  priceCents: z.coerce.number().int().min(1, "Preis muss grösser als 0 sein.").max(10_000_000),
  compareAtPriceCents: z.coerce
    .number()
    .int()
    .min(0)
    .max(10_000_000)
    .optional()
    .nullable(),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000).default(3),
  isActive: z.coerce.boolean().default(true),
  isSample: z.coerce.boolean().default(false),
  preorderEnabled: z.coerce.boolean().default(false),
  restockDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? new Date(value) : null))
    .refine((value) => value === null || !Number.isNaN(value.getTime()), {
      message: "Ungültiges Datum.",
    }),
  deliveryMinDays: z.coerce.number().int().min(0).max(365),
  deliveryMaxDays: z.coerce.number().int().min(0).max(365),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
});

export const adminCategorySchema = z.object({
  name: trimmed(2, 60, "Name"),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug darf nur Kleinbuchstaben, Zahlen und - enthalten."),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  kind: z.enum(["GENDER", "TYPE"]),
  /**
   * Bild der Kachel auf der Startseite. Erlaubt sind eine vollständige
   * Adresse (Cloudinary) oder ein Pfad aus `public/`.
   */
  heroImageUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || /^(https?:\/\/|\/)/.test(value),
      "Bitte eine Adresse mit https:// oder einen Pfad wie /produkte/bild.jpg angeben.",
    )
    .default(""),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const adminDiscountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, "Nur Buchstaben, Zahlen, _ und - erlaubt.")
      .transform((value) => value.toUpperCase()),
    description: z.string().trim().max(200).optional().or(z.literal("")),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    /** Bei PERCENT in Basispunkten, bei FIXED in Cent. */
    value: z.coerce.number().int().min(0).max(1_000_000),
    minSubtotalCents: z.coerce.number().int().min(0).max(10_000_000).default(0),
    maxRedemptions: z.coerce.number().int().min(1).max(1_000_000).optional().nullable(),
    startsAt: z.string().trim().optional().or(z.literal("")),
    endsAt: z.string().trim().optional().or(z.literal("")),
    isActive: z.coerce.boolean().default(true),
  })
  .refine(
    (data) => data.type !== "PERCENT" || (data.value > 0 && data.value <= 10_000),
    { message: "Prozentwert muss zwischen 1 und 10000 Basispunkten liegen.", path: ["value"] },
  )
  .refine((data) => data.type !== "FIXED" || data.value > 0, {
    message: "Betrag muss grösser als 0 sein.",
    path: ["value"],
  });

export const adminOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(orderStatuses),
});

export const adminShipmentSchema = z.object({
  orderId: z.string().min(1),
  carrier: trimmed(2, 60, "Versanddienstleister"),
  trackingNumber: trimmed(3, 80, "Sendungsnummer"),
  trackingUrl: z.url("Ungültige URL.").max(500).optional().or(z.literal("")),
  notifyCustomer: z.coerce.boolean().default(true),
});

export const adminStockAdjustSchema = z.object({
  variantId: z.string().min(1),
  /** Neuer physischer Bestand (absolut, nicht relativ). */
  stock: z.coerce.number().int().min(0).max(1_000_000),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

/** Wandelt Zod-Fehler in ein einfaches Feld -> Meldung-Objekt. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
