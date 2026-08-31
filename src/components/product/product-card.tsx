import Image from "next/image";
import Link from "next/link";
import { AvailabilityBadge, Badge } from "@/components/ui/badge";
import { BasePrice, Money } from "@/components/currency/money";
import { basePricePer100Ml, discountPercent } from "@/lib/money";
import { familyLabels, kindLabels, type ProductListItem } from "@/lib/products";
import { cn } from "@/lib/utils";
import { productImageUrl } from "@/lib/product-image";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

/**
 * Produktkarte für Startseite, Shop und Empfehlungen.
 * Die gesamte Karte ist ein Link; zusätzliche Kennzeichnungen
 * (Bestseller, Duftalternative) sind Text, nicht nur Farbe.
 */
export function ProductCard({
  item,
  priority = false,
  className,
}: {
  item: ProductListItem;
  priority?: boolean;
  className?: string;
}) {
  const {
    product,
    topPriceCents,
    compareAtPriceCents,
    topVolumeMl,
    lowestPriceCents,
    availability,
    sizes,
    linkVariantId,
  } = item;
  const image = product.images[0];
  const hoverImage = product.images[1];
  const savings = discountPercent(topPriceCents, compareAtPriceCents);
  // Der Grundpreis muss sich auf den angezeigten Preis beziehen – sonst passen
  // die beiden Zahlen nebeneinander nicht zusammen.
  const hasBasePrice =
    basePricePer100Ml(topPriceCents, topVolumeMl) !== null;
  const hasCheaperSize = lowestPriceCents > 0 && lowestPriceCents < topPriceCents;

  return (
    <article
      className={cn(
        "group relative flex flex-col border border-line bg-charcoal",
        "transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
        "hover:-translate-y-0.5 hover:border-gold/45 focus-within:border-gold/45",
        className,
      )}
    >
      <div className="relative aspect-4/5 overflow-hidden bg-ink">
        {image ? (
          <>
            <Image
              src={productImageUrl(image.url, "card", 1, product)}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              className={cn(
                "object-cover transition-opacity duration-500",
                hoverImage && "group-hover:opacity-0",
              )}
            />
            {hoverImage && (
              <Image
                src={productImageUrl(hoverImage.url, "card", 1, product)}
                alt=""
                aria-hidden="true"
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-subtle">
            Kein Bild
          </div>
        )}

        {/* Kennzeichnungen oben links */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNew && <Badge tone="gold">Neu</Badge>}
          {product.isBestseller && <Badge tone="neutral">Bestseller</Badge>}
          {savings !== null && <Badge tone="danger">−{savings}%</Badge>}
        </div>

        <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
          {product.isDemo && (
            <Badge tone="neutral" className="bg-ink/80">
              Demo
            </Badge>
          )}
          <WishlistButton productId={product.id} productName={product.name} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-[0.14em] text-subtle">
          <span>{familyLabels[product.fragranceFamily] ?? product.fragranceFamily}</span>
          <span aria-hidden="true">·</span>
          <span>{kindLabels[product.kind] ?? product.kind}</span>
        </div>

        <h3 className="text-lg leading-snug">
          <Link
            href={
              // In der Abteilung „Abfüllungen“ zeigt die Karte den Preis einer
              // kleinen Größe – dann soll die Produktseite auch diese Größe
              // ausgewählt haben und nicht den grossen Flakon.
              linkVariantId
                ? `/produkt/${product.slug}?variante=${linkVariantId}`
                : `/produkt/${product.slug}`
            }
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>

        {product.subtitle && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {product.subtitle}
          </p>
        )}

        {product.isAlternative && (
          <p className="text-[11px] leading-relaxed text-subtle">
            Duftalternative – eigenständiges Produkt, keine Originalware
          </p>
        )}

        {sizes.length > 0 && (
          <p className="text-xs text-subtle">
            {sizes.length === 1
              ? sizes[0]
              : `${sizes.length} Größen: ${sizes.slice(0, 4).join(" · ")}${sizes.length > 4 ? " …" : ""}`}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-display text-xl text-gold-light">
              <Money cents={topPriceCents} />
            </span>
            {compareAtPriceCents && compareAtPriceCents > topPriceCents && (
              <span className="text-sm text-subtle line-through">
                <Money cents={compareAtPriceCents} />
              </span>
            )}
          </div>

          {/* Der kleine Preis gehört dazu: Die grosse Zahl ist der Preis der
              grössten Größe, nicht der einzige Preis. Wer nur probieren will,
              soll trotzdem sehen, dass es günstiger geht. */}
          {hasCheaperSize && (
            <p className="text-[11px] text-subtle">
              Kleinere Größen ab <Money cents={lowestPriceCents} />
            </p>
          )}

          {hasBasePrice && (
            <p className="text-[11px] text-subtle">
              Grundpreis{" "}
              <BasePrice priceCents={topPriceCents} volumeMl={topVolumeMl} />
            </p>
          )}

          {availability && (
            <AvailabilityBadge
              state={availability.state}
              label={availability.shortLabel}
              className="self-start"
            />
          )}
        </div>
      </div>
    </article>
  );
}

/** Ladeplatzhalter mit identischen Abmessungen – verhindert Layoutsprünge. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col border border-line bg-charcoal">
      <div className="skeleton aspect-4/5" />
      <div className="flex flex-col gap-3 p-4 md:p-5">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-6 w-28" />
      </div>
    </div>
  );
}
