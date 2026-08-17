import { prisma } from "@/lib/prisma";
import { AdminPageHeader, Card } from "@/components/admin/layout-parts";
import { DiscountManager } from "@/components/admin/discount-manager";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const codes = await prisma.discountCode.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <AdminPageHeader
        title="Rabattcodes"
        description="Aktionscodes anlegen, deaktivieren und ihre Einlösungen verfolgen."
      />

      <Card>
        <DiscountManager
          codes={codes.map((code) => ({
            id: code.id,
            code: code.code,
            description: code.description ?? "",
            type: code.type,
            value: code.value,
            minSubtotalCents: code.minSubtotalCents,
            maxRedemptions: code.maxRedemptions,
            usedCount: code.usedCount,
            startsAt: code.startsAt ? code.startsAt.toISOString().slice(0, 10) : "",
            endsAt: code.endsAt ? code.endsAt.toISOString().slice(0, 10) : "",
            isActive: code.isActive,
          }))}
        />
      </Card>
    </>
  );
}
