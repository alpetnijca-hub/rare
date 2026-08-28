import { prisma } from "@/lib/prisma";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { AdminPageHeader, Card, EmptyRow } from "@/components/admin/layout-parts";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <AdminPageHeader
        title="Kategorien"
        description="Zielgruppen (Damen, Herren, Unisex) und Produktarten für Navigation und Filter. Das Kachelbild erscheint auf der Startseite."
      />

      <Card>
        {categories.length === 0 ? (
          <EmptyRow>Noch keine Kategorien angelegt.</EmptyRow>
        ) : (
          <CategoryManager
            cloudinaryEnabled={isCloudinaryConfigured()}
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description ?? "",
              kind: category.kind,
              heroImageUrl: category.heroImageUrl ?? "",
              sortOrder: category.sortOrder,
              isActive: category.isActive,
              productCount: category._count.products,
            }))}
          />
        )}
      </Card>
    </>
  );
}
