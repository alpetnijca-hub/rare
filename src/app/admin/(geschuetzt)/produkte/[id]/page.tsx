import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, Card } from "@/components/admin/layout-parts";
import { ProductForm } from "@/components/admin/product-form";
import { VariantManager, type VariantRow } from "@/components/admin/variant-manager";
import { ImageManager } from "@/components/admin/image-manager";
import { DeleteProductForm } from "@/components/admin/delete-product-form";
import { getAvailability } from "@/lib/availability";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

/** Datum für `<input type="date">` aufbereiten. */
function toDateInput(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ angelegt?: string }>;
}) {
  const { id } = await params;
  const { angelegt } = await searchParams;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: [{ sortOrder: "asc" }, { volumeMl: "asc" }] },
        images: { orderBy: { sortOrder: "asc" } },
        categories: { select: { id: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, kind: true },
    }),
  ]);

  if (!product) notFound();

  const variantRows: VariantRow[] = product.variants.map((variant) => {
    const availability = getAvailability(variant);
    return {
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      volumeMl: variant.volumeMl,
      priceCents: variant.priceCents,
      compareAtPriceCents: variant.compareAtPriceCents,
      stock: variant.stock,
      reservedStock: variant.reservedStock,
      lowStockThreshold: variant.lowStockThreshold,
      isActive: variant.isActive,
      isSample: variant.isSample,
      preorderEnabled: variant.preorderEnabled,
      restockDate: toDateInput(variant.restockDate),
      deliveryMinDays: variant.deliveryMinDays,
      deliveryMaxDays: variant.deliveryMaxDays,
      sortOrder: variant.sortOrder,
      availabilityState: availability.state,
      availabilityLabel: availability.shortLabel,
    };
  });

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={`Slug: /produkt/${product.slug}`}
        breadcrumb={[
          { href: "/admin", label: "Übersicht" },
          { href: "/admin/produkte", label: "Produkte" },
        ]}
        actions={
          <Link
            href={`/produkt/${product.slug}`}
            target="_blank"
            className="flex min-h-11 items-center border border-line-strong px-5 text-sm text-cream transition-colors hover:border-gold hover:text-gold-light"
          >
            Im Shop ansehen ↗
          </Link>
        }
      />

      {angelegt === "1" && (
        <p
          role="status"
          className="mb-6 border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200"
        >
          Produkt angelegt. Lege jetzt mindestens eine Größe an, damit es im
          Shop erscheint.
        </p>
      )}

      <div className="flex flex-col gap-6">
        <Card
          title="Größen, Preise und Lagerbestand"
          description="Jede Größe hat einen eigenen Preis, Bestand und eine eigene Lieferzeit."
        >
          <VariantManager
            productId={product.id}
            productSlug={product.slug}
            variants={variantRows}
          />
        </Card>

        <Card
          title="Produktbilder"
          description="Das erste Bild ist das Hauptbild in Shop und Suchergebnissen."
        >
          <ImageManager
            productId={product.id}
            images={product.images.map((image) => ({
              id: image.id,
              url: image.url,
              alt: image.alt,
              publicId: image.publicId,
            }))}
            cloudinaryEnabled={isCloudinaryConfigured()}
          />
        </Card>

        <ProductForm
          cloudinaryEnabled={isCloudinaryConfigured()}
          values={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            subtitle: product.subtitle ?? "",
            description: product.description,
            scentProfile: product.scentProfile ?? "",
            fragranceFamily: product.fragranceFamily,
            kind: product.kind,
            topNotes: product.topNotes.join(", "),
            heartNotes: product.heartNotes.join(", "),
            baseNotes: product.baseNotes.join(", "),
            ingredients: product.ingredients ?? "",
            usage: product.usage ?? "",
            legalNotice: product.legalNotice ?? "",
            isAlternative: product.isAlternative,
            isDemo: product.isDemo,
            isActive: product.isActive,
            isBestseller: product.isBestseller,
            isNew: product.isNew,
            popularity: product.popularity,
            metaTitle: product.metaTitle ?? "",
            metaDesc: product.metaDesc ?? "",
            categoryIds: product.categories.map((category) => category.id),
          }}
          categories={categories}
        />

        <Card title="Produkt löschen">
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">
            Das Löschen entfernt das Produkt samt Größen und Bildern endgültig.
            Bereits abgeschlossene Bestellungen bleiben vollständig erhalten,
            da jede Bestellposition die Produktdaten zum Bestellzeitpunkt
            speichert. Möchtest du das Produkt nur vorübergehend ausblenden,
            entferne stattdessen oben den Haken bei „Im Shop sichtbar“.
          </p>
          <DeleteProductForm productId={product.id} productName={product.name} />
        </Card>
      </div>
    </>
  );
}
