"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { idleState } from "@/app/admin/state";
import { addProductImageAction, deleteProductImageAction } from "@/app/admin/actions";
import { ConfirmSubmit, FormMessage, SubmitButton } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

export interface ImageRow {
  id: string;
  url: string;
  alt: string;
  publicId: string | null;
}

/**
 * Bildverwaltung.
 *
 * Der Upload läuft direkt vom Browser zu Cloudinary. Die Signatur kommt vom
 * Server (`/api/admin/cloudinary-signatur`) – das API-Secret verlässt den
 * Server dabei nie. Alternativ lässt sich eine Bild-URL manuell eintragen.
 */
export function ImageManager({
  productId,
  images,
  cloudinaryEnabled,
}: {
  productId: string;
  images: ImageRow[];
  cloudinaryEnabled: boolean;
}) {
  const [state, formAction] = useActionState(addProductImageAction, idleState);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const publicIdRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Die Datei ist grösser als 10 MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Signatur vom Server holen.
      const signatureResponse = await fetch("/api/admin/cloudinary-signatur", {
        method: "POST",
      });

      if (!signatureResponse.ok) {
        setUploadError("Signatur konnte nicht erzeugt werden.");
        setUploading(false);
        return;
      }

      const signature = (await signatureResponse.json()) as {
        signature: string;
        timestamp: number;
        apiKey: string;
        folder: string;
        uploadUrl: string;
      };

      // 2. Datei direkt zu Cloudinary hochladen.
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
        setUploadError("Der Upload wurde von Cloudinary abgelehnt.");
        setUploading(false);
        return;
      }

      const uploaded = (await uploadResponse.json()) as {
        secure_url: string;
        public_id: string;
      };

      // 3. URL in die Formularfelder übernehmen.
      if (urlRef.current) urlRef.current.value = uploaded.secure_url;
      if (publicIdRef.current) publicIdRef.current.value = uploaded.public_id;
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setUploadError("Der Upload ist fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="flex flex-col gap-2">
              <div className="relative aspect-4/5 overflow-hidden border border-line bg-ink">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-2 top-2 bg-gold px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink">
                    Hauptbild
                  </span>
                )}
              </div>

              <p className="line-clamp-2 text-xs leading-relaxed text-subtle">
                {image.alt}
              </p>

              <form action={deleteProductImageAction}>
                <input type="hidden" name="imageId" value={image.id} />
                <ConfirmSubmit message="Dieses Bild wirklich löschen?">
                  Löschen
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
          Noch kein Bild hinterlegt. Das erste Bild wird als Hauptbild verwendet.
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-5 border-t border-line pt-6">
        <input type="hidden" name="productId" value={productId} />

        {cloudinaryEnabled ? (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="bilddatei"
              className="text-xs font-medium uppercase tracking-[0.14em] text-muted"
            >
              Bilddatei hochladen
            </label>
            <input
              ref={fileRef}
              id="bilddatei"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={onFileSelected}
              disabled={uploading}
              className="w-full border border-line bg-charcoal px-3.5 py-2.5 text-sm text-cream
                file:mr-4 file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink
                hover:file:bg-gold-light"
            />
            <p className="text-xs text-subtle">
              JPG, PNG, WebP oder AVIF, max. 10 MB. Empfohlen: Hochformat 4:5,
              mindestens 1200 px Breite. Nach dem Upload erscheint die URL
              automatisch im Feld darunter.
            </p>
            {uploading && (
              <p role="status" className="text-xs text-gold">
                Bild wird hochgeladen …
              </p>
            )}
            {uploadError && (
              <p role="alert" className="text-xs text-red-400">
                {uploadError}
              </p>
            )}
          </div>
        ) : (
          <p className="border border-amber-800/60 bg-amber-950/25 px-4 py-3 text-xs leading-relaxed text-amber-100/85">
            Cloudinary ist nicht konfiguriert. Du kannst Bild-URLs weiterhin
            manuell eintragen – für den direkten Datei-Upload trage die
            Cloudinary-Zugangsdaten in der <code>.env</code> ein.
          </p>
        )}

        <input ref={publicIdRef} type="hidden" name="publicId" />

        <Field
          id="bild-url"
          label="Bild-URL"
          required
          error={state.fields?.url}
          hint="Vollständige https-Adresse oder ein Pfad wie /produkte/beispiel.svg"
        >
          {(aria) => <TextInput {...aria} ref={urlRef} name="url" required />}
        </Field>

        <Field
          id="bild-alt"
          label="Alternativtext"
          required
          error={state.fields?.alt}
          hint="Beschreibt das Bild für Screenreader und Suchmaschinen – Pflicht für Barrierefreiheit."
        >
          {(aria) => (
            <TextInput
              {...aria}
              name="alt"
              required
              placeholder="Goldener Flakon vor dunklem Hintergrund"
            />
          )}
        </Field>

        <FormMessage state={state} />

        <div className="flex gap-3">
          <SubmitButton size="sm">Bild hinzufügen</SubmitButton>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (urlRef.current) urlRef.current.value = "";
              if (publicIdRef.current) publicIdRef.current.value = "";
            }}
          >
            Felder leeren
          </Button>
        </div>
      </form>
    </div>
  );
}
