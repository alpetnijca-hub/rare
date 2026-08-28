"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  /**
   * Fertige Bildadressen. Sie werden **auf dem Server** gebaut, weil die
   * Einstellung SHOP_IMAGE_BACKGROUND nur dort lesbar ist: Im Browser wäre
   * `process.env.SHOP_IMAGE_BACKGROUND` leer, die Galerie würde nach der
   * Hydration andere Adressen erzeugen als der Server – und damit ein anderes
   * Bild anzeigen als die Produktkarte daneben.
   */
  url: string;
  thumbUrl: string;
  alt: string;
}

/**
 * Bildergalerie der Produktdetailseite.
 * Vollständig mit der Tastatur bedienbar (Pfeiltasten in der Miniaturliste).
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-4/5 items-center justify-center border border-line bg-charcoal text-xs uppercase tracking-[0.2em] text-subtle">
        Kein Bild vorhanden
      </div>
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];

  function onThumbKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveIndex((index + 1) % images.length);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveIndex((index - 1 + images.length) % images.length);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-4/5 overflow-hidden border border-line bg-charcoal">
        <Image
          key={active.url}
          src={active.url}
          alt={active.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="animate-fade object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul
          className="grid grid-cols-4 gap-3 sm:grid-cols-5"
          aria-label={`Weitere Ansichten von ${productName}`}
        >
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => onThumbKeyDown(event, index)}
                aria-current={index === activeIndex}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden border transition-colors duration-200",
                  index === activeIndex
                    ? "border-gold"
                    : "border-line hover:border-line-strong",
                )}
              >
                <span className="sr-only">
                  Ansicht {index + 1} von {images.length} anzeigen
                </span>
                <Image
                  src={image.thumbUrl}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
