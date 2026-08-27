"use client";

import { useState } from "react";

/**
 * Direktupload zu Cloudinary.
 *
 * Der Ablauf ist bewusst dreistufig:
 *   1. Der Server erzeugt eine Signatur – das API-Secret verlässt ihn nie.
 *   2. Der Browser lädt die Datei direkt zu Cloudinary hoch.
 *   3. Nur die fertige Adresse kommt zurück in unser Formular.
 *
 * Dadurch läuft kein Bild über unseren Server, und der Upload funktioniert
 * auch, **bevor** das Produkt in der Datenbank existiert – die Signatur hängt
 * an keiner Produkt-ID.
 */

export interface UploadedImage {
  url: string;
  publicId: string;
}

/** Grösste zulässige Datei. Grössere lehnt Cloudinary ohnehin ab. */
export const maxUploadBytes = 10 * 1024 * 1024;

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<UploadedImage | null> {
    if (file.size > maxUploadBytes) {
      setError("Die Datei ist grösser als 10 MB.");
      return null;
    }

    setUploading(true);
    setError(null);

    try {
      const signatureResponse = await fetch("/api/admin/cloudinary-signatur", {
        method: "POST",
      });

      if (!signatureResponse.ok) {
        setError(
          "Der Bild-Upload ist nicht eingerichtet. Trage die Cloudinary-Zugangsdaten ein oder gib unten eine Bild-Adresse an.",
        );
        return null;
      }

      const signature = (await signatureResponse.json()) as {
        signature: string;
        timestamp: number;
        apiKey: string;
        folder: string;
        uploadUrl: string;
      };

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signature.apiKey);
      body.append("timestamp", String(signature.timestamp));
      body.append("signature", signature.signature);
      body.append("folder", signature.folder);

      const uploadResponse = await fetch(signature.uploadUrl, {
        method: "POST",
        body,
      });

      if (!uploadResponse.ok) {
        setError("Der Upload wurde von Cloudinary abgelehnt.");
        return null;
      }

      const uploaded = (await uploadResponse.json()) as {
        secure_url: string;
        public_id: string;
      };

      return { url: uploaded.secure_url, publicId: uploaded.public_id };
    } catch {
      setError("Der Upload ist fehlgeschlagen. Bitte erneut versuchen.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error, setError };
}
