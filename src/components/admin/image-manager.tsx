"use client";

import Image from "next/image";
import { useActionState, useRef } from "react";
import { idleState } from "@/app/admin/state";
import { addProductImageAction, deleteProductImageAction } from "@/app/admin/actions";
import { ConfirmSubmit, FormMessage, SubmitButton } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { useCloudinaryUpload } from "@/components/admin/use-cloudinary-upload";
import { productImageUrl } from "@/lib/product-image";

export interface ImageRow {
  id: string;
  url: string;
  alt: string;
  publicId: string | null;
}

/**
 * Bildverwaltung.
 *
 * Der Upload läuft über `useCloudinaryUpload`: direkt vom Browser zu
 * Cloudinary, die Signatur kommt vom Server – das API-Secret verlässt ihn
 * dabei nie. Alternativ lässt sich eine Bild-URL manuell eintragen.
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
  const { upload, uploading, error: uploadError } = useCloudinaryUpload();
  const urlRef = useRef<HTMLInputElement>(null);
  const publicIdRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await upload(file);
    if (!result) return;

    // Die fertige Adresse landet in den Feldern, die das Formular abschickt.
    if (urlRef.current) urlRef.current.value = result.url;
    if (publicIdRef.current) publicIdRef.current.value = result.publicId;
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="flex flex-col gap-2">
              <div className="relative aspect-4/5 overflow-hidden border border-line bg-ink">
                <Image
                  src={productImageUrl(image.url, "detail")}
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
            manuell eintragen – für den direkten Datei-Upload trage
            CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY und
            CLOUDINARY_API_SECRET in den Projekteinstellungen ein und starte
            danach einen neuen Deploy.
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
