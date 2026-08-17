import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import {
  VariantPicker,
  type VariantOption,
} from "@/components/product/variant-picker";
import { siteConfig, taxConfig } from "@/config/site";
import {
  formatDeliveryRange,
  formatRestockDate,
  getAvailability,
} from "@/lib/availability";
import { formatPrice } from "@/lib/money";
import {
  familyLabels,
  getProductBySlug,
  getRelatedProducts,
  kindLabels,
} from "@/lib/products";

// Lagerbestände müssen aktuell sein.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produkt nicht gefunden",
      robots: { index: false, follow: false },
    };
  }

  const cheapest = product.variants.reduce<number | null>(
    (min, variant) =>
      min === null || variant.priceCents < min ? variant.priceCents : min,
    null,
  );

  const description =
    product.metaDesc ||
    product.subtitle ||
    `${product.name}: ${product.scentProfile ?? familyLabels[product.fragranceFamily]}. ${
      cheapest !== null ? `Ab ${formatPrice(cheapest)}.` : ""
    } Erhältlich in ${product.variants.length} Größen.`;

  return {
    title: product.metaTitle || product.name,
    description: description.slice(0, 180),
    alternates: { canonical: `/produkt/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.metaTitle || product.name,
      description: description.slice(0, 180),
      url: `${siteConfig.url}/produkt/${product.slug}`,
      images: product.images.slice(0, 1).map((image) => ({
        url: image.url,
        alt: image.alt,
      })),
    },
  };
}

/** Abschnitt mit Überschrift für den unteren Informationsbereich. */
function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line py-8 first:border-0 first:pt-0">
      <h2 className="mb-4 text-xl">{title}</h2>
      <div className="max-w-3xl text-sm leading-relaxed text-muted md:text-[15px]">
        {children}
      </div>
    </section>
  );
}

/** Duftpyramide: Kopf-, Herz- und Basisnote. */
function NotePyramid({
  top,
  heart,
  base,
}: {
  top: string[];
  heart: string[];
  base: string[];
}) {
  const rows = [
    { label: "Kopfnote", notes: top, hint: "Der erste Eindruck" },
    { label: "Herznote", notes: heart, hint: "Der Charakter des Dufts" },
    { label: "Basisnote", notes: base, hint: "Was am längsten bleibt" },
  ].filter((row) => row.notes.length > 0);

  if (rows.length === 0) return null;

  return (
    <dl className="flex flex-col gap-5">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <dt className="sm:w-32 sm:shrink-0">
            <span className="block text-xs uppercase tracking-[0.14em] text-gold">
              {row.label}
            </span>
            <span className="mt-0.5 block text-xs text-subtle">{row.hint}</span>
          </dt>
          <dd className="flex flex-wrap gap-2">
            {row.notes.map((note) => (
              <span
                key={note}
                className="border border-line bg-charcoal px-3 py-1.5 text-sm text-cream"
              >
                {note}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);

  // Varianten für die Client-Komponente aufbereiten – die Verfügbarkeit
  // wird hier serverseitig berechnet und nicht dem Browser überlassen.
  const variantOptions: VariantOption[] = product.variants.map((variant) => {
    const availability = getAvailability(variant);
    return {
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      volumeMl: variant.volumeMl,
      priceCents: variant.priceCents,
      compareAtPriceCents: variant.compareAtPriceCents,
      availabilityState: availability.state,
      availabilityLabel: availability.label,
      availabilityShortLabel: availability.shortLabel,
      purchasable: availability.purchasable,
      maxQuantity: availability.maxQuantity,
      isPreorder: availability.isPreorder,
      deliveryLabel: formatDeliveryRange(
        variant.deliveryMinDays,
        variant.deliveryMaxDays,
      ),
      restockDateLabel:
        variant.restockDate && !availability.purchasable
          ? formatRestockDate(variant.restockDate)
          : null,
      availableStock: availability.available,
    };
  });

  const cheapest = Math.min(
    ...product.variants.map((variant) => variant.priceCents),
  );
  const anyPurchasable = variantOptions.some((variant) => variant.purchasable);

  // Strukturierte Produktdaten nach schema.org.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.subtitle ?? product.description.slice(0, 300),
    sku: product.variants[0]?.sku,
    category: kindLabels[product.kind] ?? product.kind,
    image: product.images.map((image) => `${siteConfig.url}${image.url}`),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: product.variants.map((variant) => {
      const availability = getAvailability(variant);
      return {
        "@type": "Offer",
        url: `${siteConfig.url}/produkt/${product.slug}?variante=${variant.id}`,
        sku: variant.sku,
        name: `${product.name} – ${variant.size}`,
        price: (variant.priceCents / 100).toFixed(2),
        priceCurrency: siteConfig.currency,
        itemCondition: "https://schema.org/NewCondition",
        availability: availability.purchasable
          ? availability.isPreorder
            ? "https://schema.org/PreOrder"
            : "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: siteConfig.legalName },
      };
    }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Startseite", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteConfig.url}/shop` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${siteConfig.url}/produkt/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Nur serverseitig erzeugte Daten – kein Nutzereingabe-Inhalt.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container-shop py-8 md:py-12">
        {/* Brotkrumen */}
        <nav aria-label="Brotkrumen" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-subtle">
            <li>
              <Link href="/" className="transition-colors hover:text-gold-light">
                Startseite
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/shop" className="transition-colors hover:text-gold-light">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span className="text-muted" aria-current="page">
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Bilder */}
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <ProductGallery
              images={product.images.map((image) => ({
                url: image.url,
                alt: image.alt,
              }))}
              productName={product.name}
            />
          </div>

          {/* Kaufbereich */}
          <div className="flex flex-col gap-7">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {product.isNew && <Badge tone="gold">Neu</Badge>}
                {product.isBestseller && <Badge tone="neutral">Bestseller</Badge>}
                {product.isDemo && <Badge tone="neutral">Demo-Produkt</Badge>}
                <Badge tone="neutral">
                  {familyLabels[product.fragranceFamily] ?? product.fragranceFamily}
                </Badge>
                <Badge tone="neutral">{kindLabels[product.kind] ?? product.kind}</Badge>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl">{product.name}</h1>

              {product.subtitle && (
                <p className="mt-3 text-base leading-relaxed text-muted">
                  {product.subtitle}
                </p>
              )}

              {product.scentProfile && (
                <p className="mt-4 text-sm text-cream">
                  <span className="text-subtle">Duftrichtung: </span>
                  {product.scentProfile}
                </p>
              )}
            </div>

            {product.isAlternative && (
              <div className="border border-gold/30 bg-gold/5 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-gold">
                  Duftalternative
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Dies ist ein eigenständiges Produkt und keine Originalware. Es
                  besteht keine Verbindung zu Herstellern anderer Düfte, keine
                  Lizenz und keine Zusammenarbeit. Genannte Marken sind Eigentum
                  ihrer jeweiligen Inhaber.
                </p>
              </div>
            )}

            <VariantPicker
              productName={product.name}
              productSlug={product.slug}
              variants={variantOptions}
              taxRateBp={taxConfig.rateBp}
            />

            {/* Vertrauenshinweise */}
            <ul className="grid gap-3 border-t border-line pt-6 text-sm text-muted sm:grid-cols-2">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1 shrink-0 bg-gold" aria-hidden="true" />
                Versicherter Versand mit Sendungsnummer
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1 shrink-0 bg-gold" aria-hidden="true" />
                Sichere Zahlung über Stripe
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1 shrink-0 bg-gold" aria-hidden="true" />
                14 Tage Widerrufsrecht
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1 shrink-0 bg-gold" aria-hidden="true" />
                Persönliche Beratung per E-Mail
              </li>
            </ul>
          </div>
        </div>

        {/* Ausführliche Informationen */}
        <div className="mt-16 md:mt-24">
          <InfoSection title="Beschreibung">
            <div className="flex flex-col gap-4">
              {product.description.split("\n").filter(Boolean).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </InfoSection>

          <InfoSection title="Duftnoten">
            <NotePyramid
              top={product.topNotes}
              heart={product.heartNotes}
              base={product.baseNotes}
            />
          </InfoSection>

          {product.usage && (
            <InfoSection title="Anwendungshinweise">
              <p className="whitespace-pre-line">{product.usage}</p>
            </InfoSection>
          )}

          {product.ingredients && (
            <InfoSection title="Inhaltsstoffe und Pflichtangaben">
              <p className="whitespace-pre-line">{product.ingredients}</p>
              <p className="mt-4 text-xs leading-relaxed text-subtle">
                Angaben ohne Gewähr. Massgeblich sind stets die Angaben auf der
                Verpackung des gelieferten Produkts. Bei bekannten
                Unverträglichkeiten bitte vor der Anwendung prüfen.
              </p>
            </InfoSection>
          )}

          <InfoSection title="Größen, Preise und Verfügbarkeit">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <caption className="sr-only">
                  Übersicht aller Größen mit Preis, Grundpreis, Verfügbarkeit und
                  Lieferzeit
                </caption>
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                    <th scope="col" className="py-3 pr-4 font-medium">Größe</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Preis</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Grundpreis</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Verfügbarkeit</th>
                    <th scope="col" className="py-3 font-medium">Lieferzeit</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => {
                    const availability = getAvailability(variant);
                    return (
                      <tr key={variant.id} className="border-b border-line/60">
                        <th scope="row" className="py-3 pr-4 text-left font-normal text-cream">
                          {variant.size}
                        </th>
                        <td className="py-3 pr-4 text-cream">
                          {formatPrice(variant.priceCents)}
                        </td>
                        <td className="py-3 pr-4 text-subtle">
                          {formatPrice(
                            Math.round((variant.priceCents / variant.volumeMl) * 100),
                          )}{" "}
                          / 100 ml
                        </td>
                        <td className="py-3 pr-4 text-muted">{availability.label}</td>
                        <td className="py-3 text-muted">
                          {formatDeliveryRange(
                            variant.deliveryMinDays,
                            variant.deliveryMaxDays,
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-subtle">
              Alle Preise verstehen sich als Endpreise
              {taxConfig.rateBp > 0 ? " inklusive gesetzlicher Umsatzsteuer" : ""},
              zuzüglich Versandkosten. Lieferzeiten sind Schätzungen in
              Werktagen ab Zahlungseingang.
              {!anyPurchasable &&
                " Dieses Produkt ist derzeit in keiner Größe bestellbar."}
            </p>
          </InfoSection>

          {product.legalNotice && (
            <InfoSection title="Rechtlicher Hinweis">
              <p className="whitespace-pre-line text-xs leading-relaxed text-subtle">
                {product.legalNotice}
              </p>
            </InfoSection>
          )}
        </div>

        {/* Empfehlungen */}
        {related.length > 0 && (
          <section aria-labelledby="empfehlungen" className="mt-20 md:mt-24">
            <div className="mb-8">
              <p className="eyebrow mb-3">Passend dazu</p>
              <h2 id="empfehlungen" className="text-3xl">
                Das könnte dir ebenfalls gefallen
              </h2>
            </div>

            <Suspense fallback={null}>
              <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
                {related.map((item) => (
                  <ProductCard key={item.product.id} item={item} />
                ))}
              </div>
            </Suspense>
          </section>
        )}

        {/* Preisreferenz für Screenreader (ab-Preis) */}
        <p className="sr-only">
          {product.name} ist ab {formatPrice(cheapest)} erhältlich.
        </p>
      </div>
    </>
  );
}
