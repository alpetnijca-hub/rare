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

/**
 * Übersetzt die Antwort der Signatur-Schnittstelle in einen Satz, der sagt,
 * was zu tun ist.
 *
 * Vorher stand bei jedem Fehler „Cloudinary ist nicht eingerichtet“ – auch
 * dann, wenn die Zugangsdaten längst hinterlegt waren und in Wahrheit nur die
 * Anmeldung abgelaufen war. Das schickt einen auf die falsche Fährte, deshalb
 * unterscheidet diese Funktion die Fälle.
 */
export function signatureError(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return "Deine Anmeldung ist abgelaufen. Lade die Seite neu, melde dich erneut an und versuch es dann noch einmal.";
    case 429:
      return "Zu viele Anfragen kurz hintereinander. Warte eine Minute und lade das Bild dann erneut hoch.";
    case 503:
      return "Cloudinary ist noch nicht eingerichtet. Trage CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY und CLOUDINARY_API_SECRET in den Projekteinstellungen ein und starte danach einen neuen Deploy – Änderungen an Umgebungsvariablen greifen erst dann.";
    default:
      return `Der Upload konnte nicht vorbereitet werden (Serverantwort ${status}). Versuch es noch einmal; bleibt es dabei, stimmt etwas an den Cloudinary-Zugangsdaten nicht.`;
  }
}

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
        setError(signatureError(signatureResponse.status));
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
        // Cloudinary schreibt in die Antwort, woran es lag – etwa an einem
        // falschen API-Secret oder einem überschrittenen Kontingent.
        const grund = await uploadResponse
          .json()
          .then((data: { error?: { message?: string } }) => data.error?.message)
          .catch(() => undefined);

        setError(
          grund
            ? `Cloudinary hat den Upload abgelehnt: ${grund}`
            : `Cloudinary hat den Upload abgelehnt (Antwort ${uploadResponse.status}).`,
        );
        return null;
      }

      const uploaded = (await uploadResponse.json()) as {
        secure_url: string;
        public_id: string;
      };

      return { url: uploaded.secure_url, publicId: uploaded.public_id };
    } catch {
      setError(
        "Der Upload ist fehlgeschlagen – vermutlich ein Netzwerkproblem. Bitte erneut versuchen.",
      );
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error, setError };
}
