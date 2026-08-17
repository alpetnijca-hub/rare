import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { backInStockSchema } from "@/lib/validation";
import { rateLimit, rateLimits, tooManyRequests } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/utils";

/**
 * Vormerkung für "wieder verfügbar".
 * Es wird genau eine E-Mail versendet, sobald wieder Bestand vorhanden ist.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers) ?? "unbekannt";

  const limit = await rateLimit(
    `backinstock:${ip}`,
    rateLimits.backInStock.limit,
    rateLimits.backInStock.windowMs,
  );
  if (!limit.success) return tooManyRequests(limit);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = backInStockSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Bitte E-Mail-Adresse und Einwilligung prüfen.",
      },
      { status: 400 },
    );
  }

  const { email, variantId } = parsed.data;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, isActive: true },
  });

  if (!variant?.isActive) {
    return Response.json(
      { error: "Diese Größe steht derzeit nicht zur Verfügung." },
      { status: 404 },
    );
  }

  try {
    await prisma.backInStockSubscription.upsert({
      where: { email_variantId: { email, variantId } },
      create: { email, variantId },
      // Erneute Anmeldung nach einer früheren Benachrichtigung erlauben.
      update: { notifiedAt: null },
    });

    return Response.json({
      message:
        "Wir melden uns per E-Mail, sobald diese Größe wieder verfügbar ist.",
    });
  } catch (error) {
    console.error(
      "[benachrichtigung] Speichern fehlgeschlagen:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return Response.json(
      { error: "Die Vormerkung hat nicht funktioniert." },
      { status: 500 },
    );
  }
}
