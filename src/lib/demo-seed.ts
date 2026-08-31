import type { PrismaClient } from "@prisma/client";
import {
  categories as demoCategories,
  discountCodes as demoDiscountCodes,
  products as demoProducts,
  retiredCategorySlugs,
} from "@/lib/demo-data";

/**
 * Demo-Inhalte einspielen und wieder entfernen.
 *
 * Wird von zwei Stellen genutzt: vom Seed-Skript (`npm run db:seed`) und vom
 * Adminbereich. Der Prisma-Client kommt deshalb als Parameter – das Skript
 * bringt seinen eigenen mit, die Anwendung den aus `@/lib/prisma`.
 *
 * Alle Produkte werden mit `isDemo: true` gespeichert. Daran hängt das
 * spätere Entfernen: Echte Produkte werden dabei nie angefasst.
 */

export interface DemoSeedResult {
  categories: number;
  products: number;
  variants: number;
  discountCodes: number;
}

export async function installDemoData(
  prisma: PrismaClient,
): Promise<DemoSeedResult> {
  for (const category of demoCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        name: category.name,
        description: category.description,
        kind: category.kind,
        sortOrder: category.sortOrder,
        heroImageUrl: category.heroImageUrl,
      },
    });
  }

  let variantCount = 0;

  for (const product of demoProducts) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle,
        description: product.description,
        scentProfile: product.scentProfile,
        longevity: product.longevity ?? null,
        sillage: product.sillage ?? null,
        fragranceFamily: product.fragranceFamily,
        kind: product.kind,
        topNotes: product.topNotes,
        heartNotes: product.heartNotes,
        baseNotes: product.baseNotes,
        ingredients: product.ingredients,
        usage: product.usage,
        legalNotice: product.legalNotice ?? null,
        isAlternative: product.isAlternative,
        isDemo: true,
        isActive: true,
        isBestseller: product.isBestseller,
        isNew: product.isNew,
        popularity: product.popularity,
        metaTitle: `${product.name} – ${product.subtitle}`,
        metaDesc: product.subtitle,
        categories: {
          connect: product.categorySlugs.map((slug) => ({ slug })),
        },
      },
      update: {
        name: product.name,
        subtitle: product.subtitle,
        description: product.description,
        isDemo: true,
      },
    });

    // Bilder und Varianten werden ersetzt, damit ein erneutes Einspielen
    // keine Dubletten erzeugt.
    await prisma.productImage.deleteMany({ where: { productId: created.id } });
    await prisma.productImage.createMany({
      data: product.images.map((image, index) => ({
        productId: created.id,
        url: image.url,
        alt: image.alt,
        sortOrder: index,
      })),
    });

    for (const variant of product.variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        create: { ...variant, productId: created.id },
        update: { ...variant, productId: created.id },
      });
      variantCount += 1;
    }
  }

  for (const code of demoDiscountCodes) {
    await prisma.discountCode.upsert({
      where: { code: code.code },
      create: code,
      update: {
        description: code.description,
        type: code.type,
        value: code.value,
        minSubtotalCents: code.minSubtotalCents,
        maxRedemptions: code.maxRedemptions,
        isActive: code.isActive,
      },
    });
  }

  return {
    categories: demoCategories.length,
    products: demoProducts.length,
    variants: variantCount,
    discountCodes: demoDiscountCodes.length,
  };
}

/**
 * Entfernt alle Demo-Inhalte.
 *
 * Bestellungen bleiben unangetastet: `OrderItem` speichert Produktname und
 * Grösse als Schnappschuss, und die Fremdschlüssel stehen auf `SetNull`.
 * Eine bereits erfasste Bestellung verliert dadurch keine Angaben.
 */
export async function removeDemoData(
  prisma: PrismaClient,
): Promise<{ products: number; discountCodes: number }> {
  const products = await prisma.product.deleteMany({ where: { isDemo: true } });

  const discountCodes = await prisma.discountCode.deleteMany({
    where: {
      code: { in: demoDiscountCodes.map((code) => code.code) },
      // Bereits eingelöste Codes bleiben stehen – sie gehören zu echten
      // Bestellungen und werden für die Nachvollziehbarkeit gebraucht.
      usedCount: 0,
    },
  });

  // Leere Demo-Kategorien und abgeschaffte Kategorien entfernen, belegte
  // behalten.
  const aufraeumen = [
    ...demoCategories.map((category) => category.slug),
    ...retiredCategorySlugs,
  ];
  for (const slug of aufraeumen) {
    const inUse = await prisma.product.count({
      where: { categories: { some: { slug } } },
    });
    if (inUse === 0) {
      // deleteMany statt delete: wirft nicht, wenn die Kategorie gar nicht
      // (mehr) existiert, und erzeugt dadurch kein Fehlerprotokoll.
      await prisma.category.deleteMany({ where: { slug } });
    }
  }

  return { products: products.count, discountCodes: discountCodes.count };
}

/** Übersicht für den Adminbereich. */
export async function demoDataStatus(prisma: PrismaClient): Promise<{
  demoProducts: number;
  realProducts: number;
}> {
  const [demoProductCount, realProducts] = await Promise.all([
    prisma.product.count({ where: { isDemo: true } }),
    prisma.product.count({ where: { isDemo: false } }),
  ]);
  return { demoProducts: demoProductCount, realProducts };
}
