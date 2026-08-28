"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { useCloudinaryUpload } from "@/components/admin/use-cloudinary-upload";
import { productImageUrl } from "@/lib/product-image";

/**
 * Kategoriebild im Adminbereich.
 *
 * Das Bild landet direkt bei Cloudinary (Signatur vom Server, Datei vom
 * Browser – das API-Secret bleibt serverseitig). Gespeichert wird nur die
 * fertige Adresse, und zwar über ein verborgenes Feld zusammen mit dem
 * restlichen Kategorieformular.
 *
 * Wer keinen Cloudinary-Zugang eingerichtet hat, kann stattdessen eine
 * Bildadresse eintragen – auch ein Pfad aus `public/` wie
 * `/produkte/kategorie-damen.svg` funktioniert.
 */
export function CategoryImageField({
  id,
  value,
  cloudinaryEnabled,
}: {
  id: string;
  value: string;
  cloudinaryEnabled: boolean;
}) {
  const [url, setUrl] = useState(value);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error, setError } = useCloudinaryUpload();

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await upload(file);
    if (fileRef.current) fileRef.current.value = "";
    if (result) setUrl(result.url);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Das eigentlich gespeicherte Feld. Das sichtbare Textfeld darunter
          hat bewusst kein `name`, damit nur ein Wert im Formular landet. */}
      <input type="hidden" name="heroImageUrl" value={url} />

      <p
        id={`${id}-label`}
        className="text-xs font-medium uppercase tracking-[0.14em] text-muted"
      >
        Kachelbild
        <span className="ml-1.5 normal-case tracking-normal text-subtle">
          (optional)
        </span>
      </p>

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative aspect-4/5 w-28 shrink-0 overflow-hidden border border-line bg-ink">
          {url ? (
            <Image
              src={productImageUrl(url, "card")}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-[11px] leading-tight text-subtle">
              Kein Bild
            </span>
          )}
        </div>

        <div className="flex min-w-56 flex-1 flex-col gap-3">
          {cloudinaryEnabled ? (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFileSelected}
                disabled={uploading}
                aria-label="Kategoriebild hochladen"
                className="block w-full text-sm text-muted
                  file:mr-4 file:cursor-pointer file:border file:border-line-strong file:bg-transparent
                  file:px-4 file:py-2 file:text-sm file:text-cream hover:file:border-gold"
              />
              <p className="mt-2 text-xs leading-relaxed text-subtle">
                {uploading
                  ? "Bild wird hochgeladen …"
                  : "Hochkant wirkt am besten (etwa 800 × 1000 Pixel). JPG, PNG oder WebP, bis 10 MB."}
              </p>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-subtle">
              Der Direktupload ist noch nicht eingerichtet – dafür fehlen die
              Cloudinary-Zugangsdaten in den Projekteinstellungen. Trage
              solange unten die Adresse eines Bildes ein, das bereits im Netz
              liegt.
            </p>
          )}

          <TextInput
            id={id}
            value={url}
            onChange={(event) => {
              setError(null);
              setUrl(event.target.value);
            }}
            placeholder="https://… oder /produkte/kategorie-damen.svg"
            aria-label="Adresse des Kategoriebilds"
          />

          {url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setUrl("")}
            >
              Bild entfernen
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
