import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, Card, EmptyRow } from "@/components/admin/layout-parts";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { formatPrice } from "@/lib/money";
import { availableStock } from "@/lib/availability";
import { familyLabels, kindLabels } from "@/lib/catalog";
import { productImageUrl } from "@/lib/product-image";
import { WarmImagesButton } from "@/components/admin/warm-images-button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ suche?: string; geloescht?: string }>;
}) {
  const { suche, geloescht } = await searchParams;
  const searchTerm = (suche ?? "").trim().slice(0, 80);

  const products = await prisma.product.findMany({
    where: searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { slug: { contains: searchTerm, mode: "insensitive" } },
            {
              variants: {
                some: { sku: { contains: searchTerm, mode: "insensitive" } },
              },
            },
          ],
        }
      : undefined,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      isBestseller: true,
      isNew: true,
      isAlternative: true,
      isDemo: true,
      fragranceFamily: true,
      topNotes: true,
      heartNotes: true,
      baseNotes: true,
      kind: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
      variants: {
        select: {
          priceCents: true,
          stock: true,
          reservedStock: true,
          isActive: true,
        },
      },
      categories: { select: { name: true } },
    },
  });

  return (
    <>
      <AdminPageHeader
        title="Produkte"
        description="Sortiment verwalten: Beschreibungen, Größen, Preise und Lagerbestände."
        actions={<ButtonLink href="/admin/produkte/neu">Neues Produkt</ButtonLink>}
      />

      <Card title="Produktbilder vorbereiten">
        <WarmImagesButton />
      </Card>

      {geloescht === "1" && (
        <p
          role="status"
          className="mb-6 border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200"
        >
          Das Produkt wurde gelöscht.
        </p>
      )}

      <form method="get" role="search" className="mb-6 flex flex-wrap gap-2">
        <label htmlFor="produktsuche" className="sr-only">
          Produkte durchsuchen
        </label>
        <input
          id="produktsuche"
          type="search"
          name="suche"
          defaultValue={searchTerm}
          placeholder="Name, Slug oder Artikelnummer"
          className="min-h-11 w-full max-w-md border border-line bg-charcoal px-3.5 text-sm text-cream
            placeholder:text-subtle focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="min-h-11 border border-line-strong px-5 text-sm text-cream transition-colors hover:border-gold hover:text-gold-light"
        >
          Suchen
        </button>
        {searchTerm && (
          <Link
            href="/admin/produkte"
            className="flex min-h-11 items-center px-3 text-sm text-muted underline underline-offset-4 hover:text-gold-light"
          >
            Zurücksetzen
          </Link>
        )}
      </form>

      <Card>
        {products.length === 0 ? (
          <EmptyRow>
            {searchTerm ? (
              "Keine Produkte gefunden."
            ) : (
              <>
                Noch keine Produkte angelegt.{" "}
                <Link
                  href="/admin/produkte/neu"
                  className="text-gold underline underline-offset-4"
                >
                  Erstes Produkt anlegen
                </Link>
                .
              </>
            )}
          </EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <caption className="sr-only">
                Produktübersicht mit Preisspanne, Bestand und Status
              </caption>
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                  <th scope="col" className="pb-3 pr-4 font-medium">Produkt</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Art</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Größen</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Preis ab</th>
                  <th scope="col" className="pb-3 pr-4 text-right font-medium">Bestand</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Status</th>
                  <th scope="col" className="pb-3 font-medium">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const activeVariants = product.variants.filter((v) => v.isActive);
                  const minPrice = activeVariants.length
                    ? Math.min(...activeVariants.map((v) => v.priceCents))
                    : null;
                  const totalStock = activeVariants.reduce(
                    (sum, variant) => sum + availableStock(variant),
                    0,
                  );

                  return (
                    <tr key={product.id} className="border-b border-line/60">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden border border-line bg-ink">
                            {product.images[0] && (
                              <Image
                                src={productImageUrl(product.images[0].url, "detail", 1, product)}
                                alt=""
                                aria-hidden="true"
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/produkte/${product.id}`}
                              className="block truncate text-cream hover:text-gold-light"
                            >
                              {product.name}
                            </Link>
                            <span className="block truncate text-xs text-subtle">
                              /{product.slug}
                              {product.categories.length > 0 &&
                                ` · ${product.categories.map((c) => c.name).join(", ")}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 pr-4 text-xs text-muted">
                        {kindLabels[product.kind]}
                        <span className="block text-subtle">
                          {familyLabels[product.fragranceFamily]}
                        </span>
                      </td>

                      <td className="py-3 pr-4 tabular-nums text-muted">
                        {activeVariants.length}
                        {product.variants.length !== activeVariants.length && (
                          <span className="text-subtle">
                            {" "}
                            / {product.variants.length}
                          </span>
                        )}
                      </td>

                      <td className="py-3 pr-4 tabular-nums text-cream">
                        {minPrice !== null ? formatPrice(minPrice) : "—"}
                      </td>

                      <td className="py-3 pr-4 text-right tabular-nums">
                        <span
                          className={
                            totalStock === 0 ? "text-red-400" : "text-cream"
                          }
                        >
                          {totalStock}
                        </span>
                      </td>

                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone={product.isActive ? "success" : "neutral"}>
                            {product.isActive ? "Sichtbar" : "Versteckt"}
                          </Badge>
                          {product.isBestseller && <Badge tone="gold">Bestseller</Badge>}
                          {product.isNew && <Badge tone="info">Neu</Badge>}
                          {product.isAlternative && (
                            <Badge tone="neutral">Alternative</Badge>
                          )}
                          {product.isDemo && <Badge tone="warning">Demo</Badge>}
                        </div>
                      </td>

                      <td className="py-3">
                        <ProductRowActions
                          productId={product.id}
                          slug={product.slug}
                          isActive={product.isActive}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
