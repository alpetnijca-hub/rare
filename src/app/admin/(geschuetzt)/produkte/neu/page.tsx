import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/layout-parts";
import { ProductForm, emptyProduct } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    select: { id: true, name: true, kind: true },
  });

  return (
    <>
      <AdminPageHeader
        title="Neues Produkt"
        description="Zuerst die Grunddaten anlegen – Größen, Preise und Bilder folgen danach."
        breadcrumb={[
          { href: "/admin", label: "Übersicht" },
          { href: "/admin/produkte", label: "Produkte" },
        ]}
      />

      <ProductForm values={emptyProduct} categories={categories} />
    </>
  );
}
