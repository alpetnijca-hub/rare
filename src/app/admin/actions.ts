"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { adjustStock, cancelOrder, restockOrder } from "@/lib/orders";
import {
  sendBackInStockEmails,
  sendOrderCancelledEmail,
  sendOrderConfirmationEmails,
  sendShippingConfirmationEmail,
} from "@/lib/email";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import {
  adminCategorySchema,
  adminDiscountSchema,
  adminOrderStatusSchema,
  adminProductSchema,
  adminShipmentSchema,
  adminStockAdjustSchema,
  adminVariantSchema,
  fieldErrors,
} from "@/lib/validation";
import { parsePriceToCents } from "@/lib/money";
import {
  demoDataStatus,
  installDemoData,
  removeDemoData,
} from "@/lib/demo-seed";

/**
 * Server Actions des Adminbereichs.
 *
 * Jede Aktion prüft zuerst die Sitzung (`requireAdmin`). Die Middleware
 * schützt zwar bereits den Pfad, aber Server Actions sind eigene
 * Einstiegspunkte und werden deshalb erneut geprüft.
 */

export interface ActionState {
  ok: boolean;
  message?: string;
  fields?: Record<string, string>;
}

export const idleState: ActionState = { ok: false };

function fail(message: string, fields?: Record<string, string>): ActionState {
  return { ok: false, message, fields };
}

function success(message: string): ActionState {
  return { ok: true, message };
}

/** Liest einen Checkbox-Wert aus FormData ("on" / "true" / fehlt). */
function checkbox(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Preisfelder kommen als "49,90" – hier in Cent umgewandelt. */
function priceCents(formData: FormData, name: string): number | null {
  const raw = text(formData, name);
  if (!raw.trim()) return null;
  return parsePriceToCents(raw);
}

// ---------------------------------------------------------------------------
// Produkte
// ---------------------------------------------------------------------------

export async function saveProductAction(
  productId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = adminProductSchema.safeParse({
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    subtitle: text(formData, "subtitle"),
    description: text(formData, "description"),
    scentProfile: text(formData, "scentProfile"),
    fragranceFamily: text(formData, "fragranceFamily"),
    kind: text(formData, "kind"),
    topNotes: text(formData, "topNotes"),
    heartNotes: text(formData, "heartNotes"),
    baseNotes: text(formData, "baseNotes"),
    ingredients: text(formData, "ingredients"),
    usage: text(formData, "usage"),
    legalNotice: text(formData, "legalNotice"),
    isAlternative: checkbox(formData, "isAlternative"),
    isDemo: checkbox(formData, "isDemo"),
    isActive: checkbox(formData, "isActive"),
    isBestseller: checkbox(formData, "isBestseller"),
    isNew: checkbox(formData, "isNew"),
    popularity: text(formData, "popularity") || "0",
    metaTitle: text(formData, "metaTitle"),
    metaDesc: text(formData, "metaDesc"),
    categoryIds: formData.getAll("categoryIds").map(String),
  });

  if (!parsed.success) {
    return fail("Bitte prüfe die Eingaben.", fieldErrors(parsed.error));
  }

  const data = parsed.data;

  // Slug muss eindeutig sein.
  const conflict = await prisma.product.findFirst({
    where: { slug: data.slug, ...(productId ? { NOT: { id: productId } } : {}) },
    select: { id: true },
  });
  if (conflict) {
    return fail("Dieser Slug wird bereits verwendet.", {
      slug: "Slug ist bereits vergeben.",
    });
  }

  const payload = {
    name: data.name,
    slug: data.slug,
    subtitle: data.subtitle || null,
    description: data.description,
    scentProfile: data.scentProfile || null,
    fragranceFamily: data.fragranceFamily,
    kind: data.kind,
    topNotes: data.topNotes,
    heartNotes: data.heartNotes,
    baseNotes: data.baseNotes,
    ingredients: data.ingredients || null,
    usage: data.usage || null,
    legalNotice: data.legalNotice || null,
    isAlternative: data.isAlternative,
    isDemo: data.isDemo,
    isActive: data.isActive,
    isBestseller: data.isBestseller,
    isNew: data.isNew,
    popularity: data.popularity,
    metaTitle: data.metaTitle || null,
    metaDesc: data.metaDesc || null,
  };

  let savedId = productId;

  if (productId) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        ...payload,
        categories: { set: data.categoryIds.map((id) => ({ id })) },
      },
    });
  } else {
    const created = await prisma.product.create({
      data: {
        ...payload,
        categories: { connect: data.categoryIds.map((id) => ({ id })) },
      },
      select: { id: true },
    });
    savedId = created.id;
  }

  revalidatePath("/admin/produkte");
  revalidatePath("/shop");
  revalidatePath(`/produkt/${data.slug}`);

  if (!productId && savedId) {
    redirect(`/admin/produkte/${savedId}?angelegt=1`);
  }

  return success("Produkt gespeichert.");
}

export async function toggleProductActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = text(formData, "productId");
  const product = await prisma.product.findUnique({
    where: { id },
    select: { isActive: true, slug: true },
  });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });

  revalidatePath("/admin/produkte");
  revalidatePath("/shop");
  revalidatePath(`/produkt/${product.slug}`);
}

/**
 * Löscht ein Produkt endgültig.
 * Bereits bestellte Positionen bleiben erhalten (OrderItem speichert
 * Schnappschüsse), damit die Bestellhistorie vollständig bleibt.
 */
export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = text(formData, "productId");
  const images = await prisma.productImage.findMany({
    where: { productId: id, publicId: { not: null } },
    select: { publicId: true },
  });

  await prisma.product.delete({ where: { id } });

  // Bilder erst nach dem erfolgreichen Löschen aus Cloudinary entfernen.
  for (const image of images) {
    if (image.publicId) await deleteCloudinaryImage(image.publicId);
  }

  revalidatePath("/admin/produkte");
  revalidatePath("/shop");
  redirect("/admin/produkte?geloescht=1");
}

// ---------------------------------------------------------------------------
// Varianten
// ---------------------------------------------------------------------------

export async function saveVariantAction(
  variantId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const price = priceCents(formData, "price");
  const compareAt = priceCents(formData, "compareAtPrice");

  if (price === null) {
    return fail("Bitte einen gültigen Preis eingeben.", {
      price: "Ungültiger Preis, z. B. 17,90",
    });
  }

  const parsed = adminVariantSchema.safeParse({
    productId: text(formData, "productId"),
    sku: text(formData, "sku"),
    size: text(formData, "size"),
    volumeMl: text(formData, "volumeMl"),
    priceCents: price,
    compareAtPriceCents: compareAt,
    stock: text(formData, "stock"),
    lowStockThreshold: text(formData, "lowStockThreshold") || "3",
    isActive: checkbox(formData, "isActive"),
    preorderEnabled: checkbox(formData, "preorderEnabled"),
    restockDate: text(formData, "restockDate"),
    deliveryMinDays: text(formData, "deliveryMinDays"),
    deliveryMaxDays: text(formData, "deliveryMaxDays"),
    sortOrder: text(formData, "sortOrder") || "0",
  });

  if (!parsed.success) {
    return fail("Bitte prüfe die Eingaben.", fieldErrors(parsed.error));
  }

  const data = parsed.data;

  if (data.deliveryMaxDays < data.deliveryMinDays) {
    return fail("Die maximale Lieferzeit darf nicht kleiner als die minimale sein.", {
      deliveryMaxDays: "Muss grösser oder gleich der minimalen Lieferzeit sein.",
    });
  }

  if (data.compareAtPriceCents && data.compareAtPriceCents <= data.priceCents) {
    return fail("Der Vergleichspreis muss über dem Verkaufspreis liegen.", {
      compareAtPrice: "Muss höher als der Verkaufspreis sein.",
    });
  }

  const skuConflict = await prisma.productVariant.findFirst({
    where: { sku: data.sku, ...(variantId ? { NOT: { id: variantId } } : {}) },
    select: { id: true },
  });
  if (skuConflict) {
    return fail("Diese Artikelnummer ist bereits vergeben.", {
      sku: "SKU ist bereits vergeben.",
    });
  }

  const payload = {
    sku: data.sku,
    size: data.size,
    volumeMl: data.volumeMl,
    priceCents: data.priceCents,
    compareAtPriceCents: data.compareAtPriceCents || null,
    lowStockThreshold: data.lowStockThreshold,
    isActive: data.isActive,
    preorderEnabled: data.preorderEnabled,
    restockDate: data.restockDate,
    deliveryMinDays: data.deliveryMinDays,
    deliveryMaxDays: data.deliveryMaxDays,
    sortOrder: data.sortOrder,
  };

  if (variantId) {
    // Bestand läuft über `adjustStock`, damit das Lagerjournal vollständig bleibt.
    await prisma.productVariant.update({ where: { id: variantId }, data: payload });
    await adjustStock({
      variantId,
      newStock: data.stock,
      userId: admin.id,
      note: "Korrektur über Variantenformular",
    });
  } else {
    const created = await prisma.productVariant.create({
      data: { ...payload, productId: data.productId, stock: 0 },
      select: { id: true },
    });
    if (data.stock > 0) {
      await adjustStock({
        variantId: created.id,
        newStock: data.stock,
        userId: admin.id,
        note: "Ersteinbuchung",
      });
    }
  }

  // Wieder verfügbar? Dann Vormerkungen benachrichtigen.
  if (variantId && data.stock > 0) {
    await sendBackInStockEmails(variantId);
  }

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { slug: true },
  });

  revalidatePath(`/admin/produkte/${data.productId}`);
  revalidatePath("/admin/lager");
  revalidatePath("/shop");
  if (product) revalidatePath(`/produkt/${product.slug}`);

  return success("Größe gespeichert.");
}

export async function deleteVariantAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const variantId = text(formData, "variantId");
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true, _count: { select: { orderItems: true } } },
  });
  if (!variant) return;

  if (variant._count.orderItems > 0) {
    // Bereits bestellt: nur deaktivieren, damit die Historie erhalten bleibt.
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
    });
  } else {
    await prisma.productVariant.delete({ where: { id: variantId } });
  }

  revalidatePath(`/admin/produkte/${variant.productId}`);
  revalidatePath("/shop");
}

export async function adjustStockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = adminStockAdjustSchema.safeParse({
    variantId: text(formData, "variantId"),
    stock: text(formData, "stock"),
    note: text(formData, "note"),
  });

  if (!parsed.success) {
    return fail("Bitte eine gültige Bestandsmenge eingeben.");
  }

  await adjustStock({
    variantId: parsed.data.variantId,
    newStock: parsed.data.stock,
    userId: admin.id,
    note: parsed.data.note || "Manuelle Korrektur im Dashboard",
  });

  if (parsed.data.stock > 0) {
    await sendBackInStockEmails(parsed.data.variantId);
  }

  revalidatePath("/admin/lager");
  revalidatePath("/shop");

  return success("Bestand aktualisiert.");
}

// ---------------------------------------------------------------------------
// Produktbilder
// ---------------------------------------------------------------------------

export async function addProductImageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const productId = text(formData, "productId");
  const url = text(formData, "url").trim();
  const alt = text(formData, "alt").trim();
  const publicId = text(formData, "publicId").trim();

  if (!url || !/^https?:\/\/|^\//.test(url)) {
    return fail("Bitte eine gültige Bild-URL angeben.", { url: "Ungültige URL." });
  }
  if (alt.length < 3) {
    return fail("Bitte einen aussagekräftigen Alternativtext angeben.", {
      alt: "Alternativtext ist für die Barrierefreiheit erforderlich.",
    });
  }

  const count = await prisma.productImage.count({ where: { productId } });

  await prisma.productImage.create({
    data: {
      productId,
      url,
      alt: alt.slice(0, 200),
      publicId: publicId || null,
      sortOrder: count,
    },
  });

  revalidatePath(`/admin/produkte/${productId}`);
  revalidatePath("/shop");

  return success("Bild hinzugefügt.");
}

export async function deleteProductImageAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const imageId = text(formData, "imageId");
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return;

  await prisma.productImage.delete({ where: { id: imageId } });
  if (image.publicId) await deleteCloudinaryImage(image.publicId);

  revalidatePath(`/admin/produkte/${image.productId}`);
  revalidatePath("/shop");
}

// ---------------------------------------------------------------------------
// Kategorien
// ---------------------------------------------------------------------------

export async function saveCategoryAction(
  categoryId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = adminCategorySchema.safeParse({
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    kind: text(formData, "kind"),
    sortOrder: text(formData, "sortOrder") || "0",
    isActive: checkbox(formData, "isActive"),
  });

  if (!parsed.success) {
    return fail("Bitte prüfe die Eingaben.", fieldErrors(parsed.error));
  }

  const data = parsed.data;

  const conflict = await prisma.category.findFirst({
    where: { slug: data.slug, ...(categoryId ? { NOT: { id: categoryId } } : {}) },
    select: { id: true },
  });
  if (conflict) {
    return fail("Dieser Slug wird bereits verwendet.", { slug: "Slug vergeben." });
  }

  const payload = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    kind: data.kind,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
  };

  if (categoryId) {
    await prisma.category.update({ where: { id: categoryId }, data: payload });
  } else {
    await prisma.category.create({ data: payload });
  }

  revalidatePath("/admin/kategorien");
  revalidatePath("/shop");

  return success("Kategorie gespeichert.");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = text(formData, "categoryId");
  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/kategorien");
  revalidatePath("/shop");
}

// ---------------------------------------------------------------------------
// Rabattcodes
// ---------------------------------------------------------------------------

export async function saveDiscountAction(
  discountId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const type = text(formData, "type");

  // Prozente kommen als "10" und werden in Basispunkte umgerechnet,
  // Festbeträge als "5,00" in Cent.
  let value = 0;
  if (type === "PERCENT") {
    const percent = Number.parseFloat(text(formData, "valuePercent").replace(",", "."));
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      return fail("Bitte einen Prozentwert zwischen 1 und 100 angeben.", {
        value: "Ungültiger Prozentwert.",
      });
    }
    value = Math.round(percent * 100);
  } else if (type === "FIXED") {
    const cents = priceCents(formData, "valueAmount");
    if (cents === null || cents <= 0) {
      return fail("Bitte einen gültigen Rabattbetrag angeben.", {
        value: "Ungültiger Betrag.",
      });
    }
    value = cents;
  }

  const parsed = adminDiscountSchema.safeParse({
    code: text(formData, "code"),
    description: text(formData, "description"),
    type,
    value,
    minSubtotalCents: priceCents(formData, "minSubtotal") ?? 0,
    maxRedemptions: text(formData, "maxRedemptions") || null,
    startsAt: text(formData, "startsAt"),
    endsAt: text(formData, "endsAt"),
    isActive: checkbox(formData, "isActive"),
  });

  if (!parsed.success) {
    return fail("Bitte prüfe die Eingaben.", fieldErrors(parsed.error));
  }

  const data = parsed.data;

  const conflict = await prisma.discountCode.findFirst({
    where: { code: data.code, ...(discountId ? { NOT: { id: discountId } } : {}) },
    select: { id: true },
  });
  if (conflict) {
    return fail("Dieser Code existiert bereits.", { code: "Code bereits vergeben." });
  }

  const payload = {
    code: data.code,
    description: data.description || null,
    type: data.type,
    value: data.value,
    minSubtotalCents: data.minSubtotalCents,
    maxRedemptions: data.maxRedemptions ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
    isActive: data.isActive,
  };

  if (discountId) {
    await prisma.discountCode.update({ where: { id: discountId }, data: payload });
  } else {
    await prisma.discountCode.create({ data: payload });
  }

  revalidatePath("/admin/rabattcodes");
  return success("Rabattcode gespeichert.");
}

export async function toggleDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = text(formData, "discountId");
  const code = await prisma.discountCode.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!code) return;

  await prisma.discountCode.update({
    where: { id },
    data: { isActive: !code.isActive },
  });

  revalidatePath("/admin/rabattcodes");
}

export async function deleteDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = text(formData, "discountId");
  const used = await prisma.order.count({ where: { discountCodeId: id } });

  if (used > 0) {
    // Bereits verwendet: nur deaktivieren, sonst geht die Zuordnung verloren.
    await prisma.discountCode.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.discountCode.delete({ where: { id } });
  }

  revalidatePath("/admin/rabattcodes");
}

// ---------------------------------------------------------------------------
// Bestellungen
// ---------------------------------------------------------------------------

export async function updateOrderStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = adminOrderStatusSchema.safeParse({
    orderId: text(formData, "orderId"),
    status: text(formData, "status"),
  });

  if (!parsed.success) return fail("Ungültiger Status.");

  const { orderId, status } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, stockCommitted: true },
  });
  if (!order) return fail("Bestellung nicht gefunden.");

  if (status === "CANCELLED") {
    // Storno gibt reservierte oder bereits abgebuchte Ware wieder frei.
    await cancelOrder(orderId, {
      restock: true,
      userId: admin.id,
      note: "Storno über Dashboard",
    });
    await sendOrderCancelledEmail(orderId, {
      reason: text(formData, "reason") || null,
      refunded: order.stockCommitted,
    });
    revalidatePath("/admin/bestellungen");
    revalidatePath(`/admin/bestellungen/${orderId}`);
    return success("Bestellung storniert und Bestand zurückgebucht.");
  }

  if (status === "REFUNDED") {
    await restockOrder(orderId, admin.id, "Erstattung über Dashboard");
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "REFUNDED", refundedAt: new Date() },
    });
    revalidatePath("/admin/bestellungen");
    revalidatePath(`/admin/bestellungen/${orderId}`);
    return success(
      "Bestellung als erstattet markiert. Die Rückzahlung selbst muss im " +
        "Stripe-Dashboard ausgelöst werden.",
    );
  }

  await prisma.order.update({ where: { id: orderId }, data: { status } });

  revalidatePath("/admin/bestellungen");
  revalidatePath(`/admin/bestellungen/${orderId}`);

  return success("Status aktualisiert.");
}

export async function createShipmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = adminShipmentSchema.safeParse({
    orderId: text(formData, "orderId"),
    carrier: text(formData, "carrier"),
    trackingNumber: text(formData, "trackingNumber"),
    trackingUrl: text(formData, "trackingUrl"),
    notifyCustomer: checkbox(formData, "notifyCustomer"),
  });

  if (!parsed.success) {
    return fail("Bitte prüfe die Versandangaben.", fieldErrors(parsed.error));
  }

  const data = parsed.data;

  const shipment = await prisma.shipment.create({
    data: {
      orderId: data.orderId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl || null,
    },
    select: { id: true },
  });

  await prisma.order.update({
    where: { id: data.orderId },
    data: { status: "SHIPPED" },
  });

  if (data.notifyCustomer) {
    await sendShippingConfirmationEmail(shipment.id);
  }

  revalidatePath("/admin/bestellungen");
  revalidatePath(`/admin/bestellungen/${data.orderId}`);

  return success(
    data.notifyCustomer
      ? "Versand erfasst und Versandbestätigung versendet."
      : "Versand erfasst.",
  );
}

export async function resendConfirmationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const orderId = text(formData, "orderId");

  // Sperre lösen, damit der erneute Versand tatsächlich erfolgt.
  await prisma.order.updateMany({
    where: { id: orderId },
    data: { confirmationEmailSentAt: null },
  });

  await sendOrderConfirmationEmails(orderId);

  revalidatePath(`/admin/bestellungen/${orderId}`);
  return success("Bestätigungsmail wurde erneut versendet.");
}

// ---------------------------------------------------------------------------
// Demo-Inhalte
// ---------------------------------------------------------------------------

/**
 * Spielt die Demo-Produkte ein.
 *
 * Gedacht für den ersten Blick auf einen frisch aufgesetzten Shop. Sobald
 * echte Produkte erfasst sind, wird abgelehnt – niemand soll versehentlich
 * Demo-Inhalte in einen laufenden Shop kippen.
 */
export async function loadDemoData(): Promise<void> {
  await requireAdmin();

  const { realProducts } = await demoDataStatus(prisma);
  if (realProducts > 0) {
    throw new Error(
      "Es sind bereits echte Produkte erfasst. Demo-Inhalte werden deshalb nicht eingespielt.",
    );
  }

  await installDemoData(prisma);
  revalidatePath("/admin");
  revalidatePath("/admin/produkte");
  revalidatePath("/");
  revalidatePath("/shop");
}

/** Entfernt sämtliche Demo-Inhalte wieder. Echte Produkte bleiben unberührt. */
export async function deleteDemoData(): Promise<void> {
  await requireAdmin();

  await removeDemoData(prisma);
  revalidatePath("/admin");
  revalidatePath("/admin/produkte");
  revalidatePath("/");
  revalidatePath("/shop");
}
