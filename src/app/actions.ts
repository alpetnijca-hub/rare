"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import { displayName, reviewableOrderStatuses } from "@/lib/reviews";
import { reviewSchema } from "@/lib/validation";
import type { ActionState } from "@/app/admin/state";

/**
 * Kundenseitige Server-Aktionen.
 *
 * Aus einem `"use server"`-Modul dürfen ausschliesslich async-Funktionen
 * exportiert werden – Konstanten und Typen gehören woandershin. Deshalb kommt
 * `ActionState` aus `src/app/admin/state.ts`.
 */

/**
 * Eine Bewertung abgeben.
 *
 * Die Bestellung kommt aus dem Token in der Adresse und nicht aus dem
 * Formular: Sonst könnte jemand eine fremde Bestellnummer eintragen und in
 * fremdem Namen bewerten. Aus demselben Grund wird geprüft, ob der Duft
 * überhaupt in dieser Bestellung war.
 *
 * Die Bewertung landet auf „wartet auf Freigabe“. Sichtbar wird sie erst nach
 * einem Blick im Adminbereich – gegen Beschimpfungen und Werbung, nicht gegen
 * Kritik.
 */
export async function submitReviewAction(
  token: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const limit = await rateLimit(
    `review:${token}`,
    rateLimits.review.limit,
    rateLimits.review.windowMs,
  );
  if (!limit.success) {
    return { ok: false, message: "Zu viele Versuche. Bitte später erneut." };
  }

  const parsed = reviewSchema.safeParse({
    productId: String(formData.get("productId") ?? ""),
    rating: String(formData.get("rating") ?? ""),
    body: String(formData.get("body") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.",
    };
  }

  const { productId, rating, body } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    select: {
      id: true,
      status: true,
      shippingAddress: { select: { firstName: true, lastName: true } },
      items: { select: { productId: true } },
    },
  });

  if (!order) {
    return { ok: false, message: "Diese Bestellung kennen wir nicht." };
  }

  if (!(reviewableOrderStatuses as readonly string[]).includes(order.status)) {
    return {
      ok: false,
      message:
        "Bewerten geht erst, sobald die Bestellung unterwegs ist. Melde dich " +
        "gern, wenn du glaubst, dass hier etwas nicht stimmt.",
    };
  }

  if (!order.items.some((item) => item.productId === productId)) {
    return { ok: false, message: "Dieser Duft war nicht in deiner Bestellung." };
  }

  const autor = displayName(
    order.shippingAddress.firstName,
    order.shippingAddress.lastName,
  );

  // Je Bestellung und Duft genau eine Bewertung. Wer noch einmal schreibt,
  // ersetzt die eigene – und sie geht erneut in die Freigabe.
  await prisma.review.upsert({
    where: { orderId_productId: { orderId: order.id, productId } },
    create: {
      orderId: order.id,
      productId,
      rating,
      authorName: autor,
      body: body || null,
    },
    update: {
      rating,
      body: body || null,
      status: "PENDING",
      publishedAt: null,
      moderationNote: null,
    },
  });

  revalidatePath(`/bewerten/${token}`);

  return {
    ok: true,
    message:
      "Danke! Deine Bewertung ist bei uns. Sie erscheint beim Duft, sobald " +
      "wir kurz daraufgeschaut haben.",
  };
}
