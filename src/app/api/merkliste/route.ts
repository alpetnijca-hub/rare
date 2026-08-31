import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { productCardSelect, toListItem } from "@/lib/products";
import { rateLimit, rateLimits, tooManyRequests } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/utils";
import { wishlistSchema } from "@/lib/validation";
import { productImageUrl } from "@/lib/product-image";

/**
 * Lädt die vorgemerkten Düfte.
 *
 * Die Merkliste selbst steht nur im Browser (siehe `wishlist-provider.tsx`).
 * Was ein Duft kostet, ob er noch lieferbar ist und wie er heisst, darf aber
 * nicht von dort kommen – deshalb schickt der Browser ausschliesslich IDs und
 * bekommt die Angaben frisch aus der Datenbank zurück.
 *
 * Inaktive oder gelöschte Düfte fallen dabei still heraus. Auf der Seite
 * steht dann ein Hinweis, dass etwas nicht mehr verfügbar ist – besser als
 * eine Karte, die ins Leere führt.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers) ?? "unbekannt";

  const limit = await rateLimit(
    `wishlist:${ip}`,
    rateLimits.wishlist.limit,
    rateLimits.wishlist.windowMs,
  );
  if (!limit.success) return tooManyRequests(limit);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = wishlistSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Die Merkliste konnte nicht gelesen werden." },
      { status: 400 },
    );
  }

  const { ids } = parsed.data;
  if (ids.length === 0) {
    return Response.json({ items: [], missing: 0 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: productCardSelect,
  });

  // Reihenfolge der Merkliste beibehalten – zuletzt Gemerktes steht oben.
  const rang = new Map(ids.map((id, index) => [id, index]));
  products.sort((a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0));

  const items = products.map((product) => {
    const eintrag = toListItem(product);
    const bild = product.images[0];

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      // Die Bildadresse wird serverseitig gebaut: Im Browser ist
      // SHOP_IMAGE_BACKGROUND nicht lesbar, dort käme eine andere Adresse
      // heraus als auf der Shopseite.
      imageUrl: bild ? productImageUrl(bild.url, "card", 1, product) : null,
      imageAlt: bild?.alt ?? "",
      topPriceCents: eintrag.topPriceCents,
      lowestPriceCents: eintrag.lowestPriceCents,
      sizeCount: eintrag.sizes.length,
      availabilityState: eintrag.availability?.state ?? null,
      availabilityLabel: eintrag.availability?.shortLabel ?? null,
    };
  });

  return Response.json({ items, missing: ids.length - items.length });
}
