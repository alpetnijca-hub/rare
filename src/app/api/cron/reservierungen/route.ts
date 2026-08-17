import { NextRequest } from "next/server";
import { expireStaleReservations } from "@/lib/orders";

/**
 * Gibt abgelaufene Reservierungen frei.
 *
 * Aufruf durch Vercel Cron (siehe vercel.json) oder einen externen
 * Zeitplaner. Ohne gültiges CRON_SECRET wird nichts ausgeführt.
 */
export const dynamic = "force-dynamic";

async function run(request: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret) {
    return Response.json({ error: "CRON_SECRET ist nicht gesetzt." }, { status: 503 });
  }

  if (authorization !== `Bearer ${secret}`) {
    return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  try {
    const released = await expireStaleReservations();
    return Response.json({ ok: true, released });
  } catch (error) {
    console.error(
      "[cron] Reservierungen konnten nicht freigegeben werden:",
      error instanceof Error ? error.message : "unbekannt",
    );
    return Response.json({ error: "Ausführung fehlgeschlagen." }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
