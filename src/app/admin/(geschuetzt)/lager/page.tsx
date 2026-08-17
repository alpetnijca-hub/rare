import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, Card, EmptyRow, StatTile } from "@/components/admin/layout-parts";
import { StockAdjustForm } from "@/components/admin/stock-adjust-form";
import { AvailabilityBadge } from "@/components/ui/badge";
import { availableStock, getAvailability } from "@/lib/availability";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const [variants, movements] = await Promise.all([
    prisma.productVariant.findMany({
      where: { product: { isActive: true } },
      orderBy: [{ stock: "asc" }, { sku: "asc" }],
      include: { product: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        variant: { select: { sku: true, size: true, product: { select: { name: true } } } },
        order: { select: { id: true, orderNumber: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const active = variants.filter((variant) => variant.isActive);

  const lowStock = active.filter(
    (variant) =>
      !variant.preorderEnabled &&
      availableStock(variant) <= variant.lowStockThreshold,
  );
  const outOfStock = active.filter((variant) => availableStock(variant) === 0);
  const backorders = variants.filter((variant) => variant.stock < 0);
  const totalReserved = variants.reduce(
    (sum, variant) => sum + variant.reservedStock,
    0,
  );

  const reasonLabels: Record<string, string> = {
    RESTOCK: "Wareneingang",
    MANUAL_ADJUSTMENT: "Korrektur",
    RESERVATION: "Reservierung",
    RELEASE: "Freigabe",
    SALE: "Verkauf",
    RETURN: "Rückbuchung",
  };

  return (
    <>
      <AdminPageHeader
        title="Lager"
        description="Bestände je Größe, Reservierungen und das vollständige Lagerjournal."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Aktive Größen" value={active.length} />
        <StatTile
          label="Knapper Bestand"
          value={lowStock.length}
          hint="Unter der jeweiligen Warnschwelle"
          tone={lowStock.length > 0 ? "warning" : "neutral"}
        />
        <StatTile
          label="Ausverkauft"
          value={outOfStock.length}
          hint="Kein frei verfügbarer Bestand"
          tone={outOfStock.length > 0 ? "warning" : "neutral"}
        />
        <StatTile
          label="Reserviert"
          value={totalReserved}
          hint="Durch offene Bestellungen blockiert"
        />
      </div>

      {backorders.length > 0 && (
        <div className="mb-8 border border-sky-900/60 bg-sky-950/25 px-5 py-4">
          <p className="text-sm font-medium text-sky-200">
            Offene Vorbestellungen
          </p>
          <p className="mt-1 text-sm leading-relaxed text-sky-100/85">
            Bei {backorders.length}{" "}
            {backorders.length === 1 ? "Größe" : "Größen"} ist der Bestand
            negativ. Das ist der Rückstand aus bezahlten Vorbestellungen: Sobald
            Ware eintrifft, buchst du sie hier ein, und der Wert steigt wieder
            auf null oder darüber.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Card
          title="Bestände"
          description="Der Bestand lässt sich hier direkt korrigieren. Jede Änderung wird im Lagerjournal protokolliert."
        >
          {active.length === 0 ? (
            <EmptyRow>Keine aktiven Größen vorhanden.</EmptyRow>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] border-collapse text-sm">
                <caption className="sr-only">
                  Lagerbestand je Größe mit Korrekturmöglichkeit
                </caption>
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                    <th scope="col" className="pb-3 pr-4 font-medium">Produkt</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Größe</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">SKU</th>
                    <th scope="col" className="pb-3 pr-4 text-right font-medium">Bestand</th>
                    <th scope="col" className="pb-3 pr-4 text-right font-medium">Reserviert</th>
                    <th scope="col" className="pb-3 pr-4 text-right font-medium">Verfügbar</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Status</th>
                    <th scope="col" className="pb-3 font-medium">Korrektur</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((variant) => {
                    const availability = getAvailability(variant);
                    const free = availableStock(variant);
                    const isLow =
                      !variant.preorderEnabled && free <= variant.lowStockThreshold;

                    return (
                      <tr key={variant.id} className="border-b border-line/60">
                        <td className="py-3 pr-4">
                          <Link
                            href={`/admin/produkte/${variant.product.id}`}
                            className="text-cream hover:text-gold-light"
                          >
                            {variant.product.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-muted">{variant.size}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-subtle">
                          {variant.sku}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          <span
                            className={
                              variant.stock < 0 ? "text-sky-300" : "text-cream"
                            }
                          >
                            {variant.stock}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-muted">
                          {variant.reservedStock}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          <span
                            className={
                              free === 0
                                ? "text-red-400"
                                : isLow
                                  ? "text-amber-300"
                                  : "text-cream"
                            }
                          >
                            {free}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <AvailabilityBadge
                            state={availability.state}
                            label={availability.shortLabel}
                          />
                        </td>
                        <td className="py-3">
                          <StockAdjustForm
                            variantId={variant.id}
                            currentStock={variant.stock}
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

        <Card
          title="Lagerjournal"
          description="Die letzten 40 Buchungen – lückenlos nachvollziehbar."
        >
          {movements.length === 0 ? (
            <EmptyRow>Noch keine Buchungen vorhanden.</EmptyRow>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                    <th scope="col" className="pb-3 pr-4 font-medium">Zeitpunkt</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Grund</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Artikel</th>
                    <th scope="col" className="pb-3 pr-4 text-right font-medium">Bestand</th>
                    <th scope="col" className="pb-3 pr-4 text-right font-medium">Reserviert</th>
                    <th scope="col" className="pb-3 font-medium">Bezug</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-b border-line/60">
                      <td className="py-3 pr-4 text-xs text-muted">
                        {formatDateTime(movement.createdAt)}
                      </td>
                      <td className="py-3 pr-4 text-cream">
                        {reasonLabels[movement.reason] ?? movement.reason}
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {movement.variant.product.name}
                        <span className="block text-xs text-subtle">
                          {movement.variant.size} · {movement.variant.sku}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-xs tabular-nums text-muted">
                        {movement.stockDelta >= 0 ? "+" : ""}
                        {movement.stockDelta}
                        <span className="block text-subtle">
                          → {movement.stockAfter}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-xs tabular-nums text-muted">
                        {movement.reservedDelta >= 0 ? "+" : ""}
                        {movement.reservedDelta}
                        <span className="block text-subtle">
                          → {movement.reservedAfter}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-subtle">
                        {movement.order ? (
                          <Link
                            href={`/admin/bestellungen/${movement.order.id}`}
                            className="text-gold hover:text-gold-light"
                          >
                            {movement.order.orderNumber}
                          </Link>
                        ) : (
                          (movement.note ?? "—")
                        )}
                        {movement.user && (
                          <span className="block">{movement.user.name}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
