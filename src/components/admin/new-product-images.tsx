"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { useCloudinaryUpload } from "@/components/admin/use-cloudinary-upload";
import { productImageUrl } from "@/lib/product-image";

interface DraftImage {
  url: string;
  alt: string;
  publicId: string;
}

/**
 * Bilder beim Anlegen eines Dufts.
 *
 * Die Bilder liegen zunächst nur im Browser. Weil der Upload zu Cloudinary
 * unabhängig von unserer Datenbank läuft, kann er stattfinden, bevor das
 * Produkt existiert; gespeichert werden die Adressen dann zusammen mit dem
 * Produkt über verborgene Formularfelder.
 *
 * Wird das Formular abgebrochen, bleibt höchstens eine verwaiste Datei bei
 * Cloudinary liegen – das ist der bewusst in Kauf genommene Preis dafür, dass
 * man Bilder nicht erst in einem zweiten Schritt nachtragen muss.
 */
export function NewProductImages({
  cloudinaryEnabled,
}: {
  cloudinaryEnabled: boolean;
}) {
  const [images, setImages] = useState<DraftImage[]>([]);
  const [manualUrl, setManualUrl] = useState("");
  const [manualAlt, setManualAlt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error, setError } = useCloudinaryUpload();

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await upload(file);
    if (fileRef.current) fileRef.current.value = "";
    if (!result) return;

    setImages((current) => [
      ...current,
      { url: result.url, alt: "", publicId: result.publicId },
    ]);
  }

  function addManual() {
    const url = manualUrl.trim();
    if (!url) return;
    setError(null);
    setImages((current) => [
      ...current,
      { url, alt: manualAlt.trim(), publicId: "" },
    ]);
    setManualUrl("");
    setManualAlt("");
  }

  function remove(index: number) {
    setImages((current) => current.filter((_, position) => position !== index));
  }

  function setAlt(index: number, alt: string) {
    setImages((current) =>
      current.map((image, position) =>
        position === index ? { ...image, alt } : image,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Werden mit dem Produkt zusammen abgeschickt. */}
      {images.map((image, index) => (
        <div key={`${image.url}-${index}`}>
          <input type="hidden" name="newImageUrl" value={image.url} />
          <input type="hidden" name="newImageAlt" value={image.alt} />
          <input type="hidden" name="newImagePublicId" value={image.publicId} />
        </div>
      ))}

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`} className="flex flex-col gap-2">
              <div className="relative aspect-4/5 overflow-hidden border border-line bg-ink">
                <Image
                  src={productImageUrl(image.url, "detail")}
                  alt={image.alt || "Vorschau"}
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized
                />
                {index === 0 && (
                  <span className="absolute left-0 top-0 bg-gold px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink">
                    Hauptbild
                  </span>
                )}
              </div>

              <TextInput
                aria-label={`Bildbeschreibung ${index + 1}`}
                value={image.alt}
                onChange={(event) => setAlt(index, event.target.value)}
                placeholder="Kurze Bildbeschreibung"
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
              >
                Entfernen
              </Button>
            </li>
          ))}
        </ul>
      )}

      {cloudinaryEnabled ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFileSelected}
            disabled={uploading}
            className="block w-full text-sm text-muted
              file:mr-4 file:cursor-pointer file:border file:border-line-strong file:bg-transparent
              file:px-4 file:py-2 file:text-sm file:text-cream hover:file:border-gold"
          />
          <p className="mt-2 text-xs leading-relaxed text-subtle">
            {uploading
              ? "Bild wird hochgeladen …"
              : "JPG, PNG oder WebP, bis 10 MB. Das erste Bild ist das Hauptbild."}
          </p>
        </div>
      ) : (
        <p className="border border-amber-800/60 bg-amber-950/25 px-4 py-3 text-sm leading-relaxed text-amber-100/85">
          Der Direktupload ist noch nicht eingerichtet. Trage die
          Cloudinary-Zugangsdaten in den Projekteinstellungen ein – oder gib
          unten die Adresse eines Bildes an, das bereits im Netz liegt.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <details className="border border-line">
        <summary className="cursor-pointer px-4 py-2.5 text-sm text-muted hover:text-cream">
          Stattdessen eine Bild-Adresse eintragen
        </summary>
        <div className="flex flex-col gap-3 border-t border-line px-4 py-4">
          <Field id="manual-image-url" label="Bild-Adresse">
            {(aria) => (
              <TextInput
                {...aria}
                value={manualUrl}
                onChange={(event) => setManualUrl(event.target.value)}
                placeholder="https://…"
              />
            )}
          </Field>
          <Field id="manual-image-alt" label="Bildbeschreibung">
            {(aria) => (
              <TextInput
                {...aria}
                value={manualAlt}
                onChange={(event) => setManualAlt(event.target.value)}
              />
            )}
          </Field>
          <Button type="button" variant="secondary" size="sm" onClick={addManual}>
            Bild übernehmen
          </Button>
        </div>
      </details>
    </div>
  );
}
