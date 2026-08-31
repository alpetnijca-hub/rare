/**
 * Datenbankzugriffe für Bewertungen.
 *
 * Getrennt von `src/lib/reviews.ts`, weil dort die reinen Regeln stehen, die
 * auch das Formular im Browser braucht. Prisma gehört nicht ins Browserpaket.
 */

import { prisma } from "@/lib/prisma";
import { ratingMax, reviewableOrderStatuses, type ReviewSummary } from "@/lib/reviews";

/** Freigegebene Bewertungen eines Dufts, neueste zuerst. */
export async function publishedReviews(productId: string, take = 20) {
  return prisma.review.findMany({
    where: { productId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take,
    select: {
      id: true,
      rating: true,
      authorName: true,
      body: true,
      publishedAt: true,
    },
  });
}

/** Durchschnitt und Verteilung – nur über freigegebene Bewertungen. */
export async function reviewSummary(productId: string): Promise<ReviewSummary> {
  const gruppen = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, status: "PUBLISHED" },
    _count: { _all: true },
  });

  const distribution = Array.from({ length: ratingMax }, (_, index) => {
    const rating = ratingMax - index;
    const treffer = gruppen.find((gruppe) => gruppe.rating === rating);
    return { rating, count: treffer?._count._all ?? 0 };
  });

  const count = distribution.reduce((summe, eintrag) => summe + eintrag.count, 0);
  if (count === 0) return { count: 0, average: null, distribution };

  const summe = distribution.reduce(
    (wert, eintrag) => wert + eintrag.rating * eintrag.count,
    0,
  );

  return {
    count,
    average: Math.round((summe / count) * 10) / 10,
    distribution,
  };
}

/**
 * Die Bestellung zu einem Token, sofern sie bewertet werden darf.
 *
 * Gibt auch zurück, was schon bewertet wurde – damit die Seite nicht zweimal
 * dasselbe Formular anbietet.
 */
export async function reviewableOrder(token: string) {
  if (!token) return null;

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      shippingAddress: { select: { firstName: true, lastName: true } },
      items: {
        where: { productId: { not: null } },
        select: {
          productId: true,
          productName: true,
          imageUrl: true,
          product: { select: { slug: true, isActive: true } },
        },
      },
      reviews: { select: { productId: true, rating: true, status: true } },
    },
  });

  if (!order) return null;
  if (!(reviewableOrderStatuses as readonly string[]).includes(order.status)) {
    return { ...order, tooEarly: true as const };
  }

  return { ...order, tooEarly: false as const };
}
