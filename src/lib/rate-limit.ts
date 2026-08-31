import { envValue } from "@/lib/env";
/**
 * Rate-Limiting.
 *
 * Standardmässig prozesslokal (In-Memory). Das reicht für einen einzelnen
 * Server und bremst Skript-Angriffe deutlich aus, ist auf Vercel mit mehreren
 * Instanzen aber nur eine Teilabsicherung: jede Instanz zählt eigenständig.
 *
 * Sind UPSTASH_REDIS_REST_URL und UPSTASH_REDIS_REST_TOKEN gesetzt, wird
 * automatisch ein verteiltes Limit über Redis verwendet. Für Produktion
 * empfohlen.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix-Zeit in Millisekunden, wann das Fenster zurückgesetzt wird. */
  reset: number;
}

interface Bucket {
  count: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();

/** Verhindert unbegrenztes Wachstum der Map. */
function pruneExpired(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.reset <= now) buckets.delete(key);
  }
}

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    const reset = now + windowMs;
    buckets.set(key, { count: 1, reset });
    return { success: true, limit, remaining: limit - 1, reset };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    success: bucket.count <= limit,
    limit,
    remaining,
    reset: bucket.reset,
  };
}

const redisUrl = envValue(process.env.UPSTASH_REDIS_REST_URL);
const redisToken = envValue(process.env.UPSTASH_REDIS_REST_TOKEN);

/**
 * Verteiltes Limit über die Upstash-REST-API.
 * Fällt bei Netzwerkfehlern bewusst auf "erlaubt" zurück, damit ein
 * Redis-Ausfall nicht den ganzen Shop blockiert.
 */
async function redisLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const reset = Date.now() + windowMs;

  try {
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSeconds), "NX"],
      ]),
      cache: "no-store",
    });

    if (!response.ok) return { success: true, limit, remaining: limit, reset };

    const data = (await response.json()) as Array<{ result: number }>;
    const count = Number(data[0]?.result ?? 0);

    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset,
    };
  } catch {
    return { success: true, limit, remaining: limit, reset };
  }
}

/**
 * Prüft und erhöht den Zähler für einen Schlüssel.
 *
 * @param identifier eindeutiger Schlüssel, üblicherweise `route:ip`
 * @param limit      erlaubte Anfragen im Zeitfenster
 * @param windowMs   Länge des Zeitfensters in Millisekunden
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const key = `rl:${identifier}`;
  if (redisUrl && redisToken) return redisLimit(key, limit, windowMs);
  return memoryLimit(key, limit, windowMs);
}

/** Vordefinierte Limits je Anwendungsfall. */
export const rateLimits = {
  checkout: { limit: 10, windowMs: 60_000 },
  cartQuote: { limit: 60, windowMs: 60_000 },
  wishlist: { limit: 60, windowMs: 60_000 },
  stats: { limit: 120, windowMs: 60_000 },
  newsletter: { limit: 5, windowMs: 60 * 60_000 },
  contact: { limit: 5, windowMs: 60 * 60_000 },
  backInStock: { limit: 10, windowMs: 60 * 60_000 },
  login: { limit: 8, windowMs: 15 * 60_000 },
  adminWrite: { limit: 120, windowMs: 60_000 },
} as const;

/** Standardisierte 429-Antwort inklusive Retry-After-Header. */
export function tooManyRequests(result: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return Response.json(
    {
      error:
        "Zu viele Anfragen. Bitte versuche es in einigen Minuten noch einmal.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
