import { createHash } from "node:crypto";

/**
 * Cloudinary-Anbindung für Produktbilder.
 *
 * Der Upload läuft als "signed direct upload": Der Browser lädt die Datei
 * direkt zu Cloudinary hoch, die Signatur kommt aber vom Server. Das
 * API-Secret verlässt den Server dadurch nie.
 */

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Erzeugt eine Upload-Signatur. Cloudinary erwartet die zu signierenden
 * Parameter alphabetisch sortiert, mit dem API-Secret angehängt.
 */
export function createUploadSignature(): CloudinarySignature {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary ist nicht vollständig konfiguriert.");
  }

  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "rare-scents/produkte";
  const timestamp = Math.floor(Date.now() / 1000);

  const params: Record<string, string> = {
    folder,
    timestamp: String(timestamp),
  };

  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const signature = createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex");

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}

/** Löscht ein Bild anhand seiner public_id (serverseitig, signiert). */
export async function deleteCloudinaryImage(publicId: string): Promise<boolean> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return false;

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: "POST", body },
    );
    const data = (await response.json()) as { result?: string };
    return data.result === "ok" || data.result === "not found";
  } catch {
    return false;
  }
}

/**
 * Baut eine optimierte Auslieferungs-URL.
 * `f_auto` und `q_auto` liefern automatisch AVIF/WebP in passender Qualität.
 */
export function cloudinaryUrl(
  url: string,
  options: { width?: number; height?: number; crop?: string } = {},
): string {
  if (!url.includes("/upload/")) return url;

  const parts = [
    "f_auto",
    "q_auto",
    options.width ? `w_${options.width}` : null,
    options.height ? `h_${options.height}` : null,
    options.crop ? `c_${options.crop}` : "c_limit",
    "dpr_auto",
  ].filter(Boolean);

  return url.replace("/upload/", `/upload/${parts.join(",")}/`);
}
