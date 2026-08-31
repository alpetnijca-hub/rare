import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordStat } from "@/lib/product-stats";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/utils";
import { statEventSchema } from "@/lib/validation";

/**
 * Zählt eine Ansicht oder einen Warenkorb-Eintrag.
 *
 * Warum aus dem Browser und nicht beim Rendern der Seite: Next.js lädt
 * Produktseiten im Voraus, sobald jemand mit der Maus über einen Link fährt.
 * Beim Rendern gezählt, stünden dort Aufrufe von Seiten, die nie jemand
 * geöffnet hat. Der Browser meldet sich erst, wenn die Seite wirklich
 * angezeigt wird.
 *
 * Gespeichert wird ausschliesslich ein Zähler je Duft und Tag – siehe
 * `src/lib/product-stats.ts`. Die IP-Adresse dient nur der Begrenzung der
 * Anfragen und wird nicht abgelegt.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFromHeaders(request.headers) ?? "unbekannt";

  const limit = await rateLimit(
    `stats:${ip}`,
    rateLimits.stats.limit,
    rateLimits.stats.windowMs,
  );
  // Still abweisen: Für den Besucher ändert sich nichts, und eine
  // Fehlermeldung im Browser wegen eines Zählers wäre unangemessen.
  if (!limit.success) return new Response(null, { status: 204 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const parsed = statEventSchema.safeParse(payload);
  if (!parsed.success) return new Response(null, { status: 204 });

  // Nur zählen, was es wirklich gibt – sonst schreibt ein erfundener
  // Fremdschlüssel jede Anfrage in einen Fehler.
  const produkt = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!produkt) return new Response(null, { status: 204 });

  try {
    await recordStat(produkt.id, parsed.data.event);
  } catch {
    // Ein verlorener Zähler ist kein Grund, dem Besucher etwas anzuzeigen.
  }

  return new Response(null, { status: 204 });
}
