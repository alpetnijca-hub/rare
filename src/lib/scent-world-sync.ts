import type { PrismaClient } from "@prisma/client";
import {
  scentWorldSlugs,
  scentWorlds,
  worldsForProduct,
  type ScentWorld,
} from "@/lib/scent-worlds";

/**
 * Duftwelten auf den Bestand anwenden.
 *
 * Zwei Schritte, bewusst getrennt: `planScentWorlds()` rechnet nur und ändert
 * nichts – der Adminbereich zeigt damit vorher an, was passieren würde.
 * `applyScentWorlds()` führt genau diesen Plan aus.
 *
 * Angefasst werden ausschliesslich die Kategorien aus `scentWorlds`. Von Hand
 * vergebene Zuordnungen wie „Damen“ oder „Herren“ bleiben unberührt – auch
 * dann, wenn die Duftnoten etwas anderes nahelegen würden.
 */

export interface PlannedProduct {
  id: string;
  name: string;
  /** Welten, in die der Duft künftig gehört. */
  worlds: Array<{ world: ScentWorld; matched: string[] }>;
  /** Zuordnungen, die entfernt würden, weil die Noten nicht mehr passen. */
  removed: ScentWorld[];
  /** true, wenn sich für dieses Produkt etwas ändert. */
  changed: boolean;
}

export interface ScentWorldPlan {
  products: PlannedProduct[];
  /** Welten, für die noch keine Kategorie existiert. */
  missingCategories: ScentWorld[];
  /** Produkte, deren Noten keiner Welt zugeordnet werden konnten. */
  withoutWorld: Array<{ id: string; name: string }>;
  /** Anzahl Produkte mit einer Änderung. */
  changedCount: number;
}

const produktAuswahl = {
  id: true,
  name: true,
  topNotes: true,
  heartNotes: true,
  baseNotes: true,
  categories: { select: { slug: true } },
} as const;

export async function planScentWorlds(
  prisma: PrismaClient,
): Promise<ScentWorldPlan> {
  const [produkte, vorhandene] = await Promise.all([
    prisma.product.findMany({
      where: { isDemo: false },
      orderBy: { name: "asc" },
      select: produktAuswahl,
    }),
    prisma.category.findMany({
      where: { slug: { in: [...scentWorldSlugs] } },
      select: { slug: true },
    }),
  ]);

  const vorhandeneSlugs = new Set(vorhandene.map((eintrag) => eintrag.slug));
  const gebraucht = new Set<string>();

  const products: PlannedProduct[] = [];
  const withoutWorld: Array<{ id: string; name: string }> = [];

  for (const produkt of produkte) {
    const treffer = worldsForProduct(produkt);

    if (treffer.length === 0) {
      withoutWorld.push({ id: produkt.id, name: produkt.name });
      continue;
    }

    const neueSlugs = treffer.map((eintrag) => eintrag.world.slug);
    for (const slug of neueSlugs) gebraucht.add(slug);

    // Nur Duftwelten vergleichen. „Damen“ und „Herren“ gehen uns nichts an.
    const bisherige = produkt.categories
      .map((kategorie) => kategorie.slug)
      .filter((slug) => scentWorldSlugs.includes(slug));

    const removed = scentWorlds.filter(
      (world) =>
        bisherige.includes(world.slug) && !neueSlugs.includes(world.slug),
    );
    const hinzu = neueSlugs.filter((slug) => !bisherige.includes(slug));

    products.push({
      id: produkt.id,
      name: produkt.name,
      worlds: treffer.map((eintrag) => ({
        world: eintrag.world,
        matched: eintrag.matched,
      })),
      removed,
      changed: hinzu.length > 0 || removed.length > 0,
    });
  }

  return {
    products,
    missingCategories: scentWorlds.filter(
      (world) => gebraucht.has(world.slug) && !vorhandeneSlugs.has(world.slug),
    ),
    withoutWorld,
    changedCount: products.filter((produkt) => produkt.changed).length,
  };
}

export interface ScentWorldResult {
  createdCategories: number;
  updatedProducts: number;
}

export async function applyScentWorlds(
  prisma: PrismaClient,
): Promise<ScentWorldResult> {
  const plan = await planScentWorlds(prisma);

  for (const world of plan.missingCategories) {
    await prisma.category.upsert({
      where: { slug: world.slug },
      create: {
        slug: world.slug,
        name: world.name,
        description: world.description,
        kind: "TYPE",
        sortOrder: world.sortOrder,
      },
      // Namen und Beschreibung nicht überschreiben: Wer sie im Adminbereich
      // angepasst hat, soll das nicht bei jedem Durchlauf verlieren.
      update: {},
    });
  }

  let updatedProducts = 0;

  for (const produkt of plan.products) {
    if (!produkt.changed) continue;

    await prisma.product.update({
      where: { id: produkt.id },
      data: {
        categories: {
          connect: produkt.worlds.map((eintrag) => ({
            slug: eintrag.world.slug,
          })),
          disconnect: produkt.removed.map((world) => ({ slug: world.slug })),
        },
      },
    });
    updatedProducts += 1;
  }

  return {
    createdCategories: plan.missingCategories.length,
    updatedProducts,
  };
}
