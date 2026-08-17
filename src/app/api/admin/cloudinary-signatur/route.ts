import { requireAdminApi } from "@/lib/auth-guard";
import { createUploadSignature, isCloudinaryConfigured } from "@/lib/cloudinary";
import { rateLimit, rateLimits, tooManyRequests } from "@/lib/rate-limit";

/**
 * Erzeugt eine kurzlebige Signatur für den direkten Bild-Upload zu Cloudinary.
 *
 * Nur für angemeldete Administratoren. Das API-Secret bleibt serverseitig –
 * der Browser erhält ausschliesslich die Signatur, den Zeitstempel und den
 * öffentlichen API-Key.
 */
export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const limit = await rateLimit(
    `cloudinary:${auth.user.id}`,
    rateLimits.adminWrite.limit,
    rateLimits.adminWrite.windowMs,
  );
  if (!limit.success) return tooManyRequests(limit);

  if (!isCloudinaryConfigured()) {
    return Response.json(
      { error: "Cloudinary ist nicht konfiguriert." },
      { status: 503 },
    );
  }

  try {
    const signature = createUploadSignature();
    return Response.json(signature, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Signatur konnte nicht erzeugt werden." },
      { status: 500 },
    );
  }
}
