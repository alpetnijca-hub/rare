import { NextRequest } from "next/server";
import { cartQuoteSchema } from "@/lib/validation";
import { buildQuote, serializeQuote } from "@/lib/pricing";
import { rateLimit, rateLimits, tooManyRequests } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/utils";

/**
 * Berechnet den Warenkorb serverseitig neu.
 *
 * Der Browser sendet ausschliesslich Varianten-IDs und Mengen. Preise,
 * Versandkosten und Rabatte stammen immer aus der Datenbank.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers) ?? "unbekannt";

  const limit = await rateLimit(
    `cart:${ip}`,
    rateLimits.cartQuote.limit,
    rateLimits.cartQuote.windowMs,
  );
  if (!limit.success) return tooManyRequests(limit);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const parsed = cartQuoteSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Der Warenkorb konnte nicht gelesen werden." },
      { status: 400 },
    );
  }

  try {
    const quote = await buildQuote({
      items: parsed.data.items,
      shippingMethodKey: parsed.data.shippingMethod,
      country: parsed.data.country,
      discountCode: parsed.data.discountCode || null,
    });

    return Response.json(serializeQuote(quote), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(
      "[warenkorb] Berechnung fehlgeschlagen:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return Response.json(
      { error: "Der Warenkorb konnte nicht berechnet werden." },
      { status: 500 },
    );
  }
}
