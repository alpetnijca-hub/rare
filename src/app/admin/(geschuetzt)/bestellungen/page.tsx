import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, Card, EmptyRow } from "@/components/admin/layout-parts";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { orderStatusLabels, orderStatuses } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusTones: Record<string, "gold" | "neutral" | "success" | "warning" | "danger" | "info"> = {
  PENDING_PAYMENT: "warning",
  PAID: "success",
  PROCESSING: "info",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "neutral",
};

const PER_PAGE = 25;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; suche?: string; seite?: string }>;
}) {
  const { status, suche, seite } = await searchParams;

  const page = Math.max(1, Number.parseInt(seite ?? "1", 10) || 1);
  const searchTerm = (suche ?? "").trim().slice(0, 80);

  const where: Prisma.OrderWhereInput = {};

  if (status && (orderStatuses as readonly string[]).includes(status)) {
    where.status = status as Prisma.OrderWhereInput["status"];
  }

  if (searchTerm) {
    where.OR = [
      { orderNumber: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
      {
        shippingAddress: {
          is: {
            OR: [
              { lastName: { contains: searchTerm, mode: "insensitive" } },
              { firstName: { contains: searchTerm, mode: "insensitive" } },
              { city: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
      },
      { items: { some: { sku: { contains: searchTerm, mode: "insensitive" } } } },
    ];
  }

  const [orders, total, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        createdAt: true,
        paidAt: true,
        email: true,
        shippingAddress: { select: { firstName: true, lastName: true, city: true } },
        _count: { select: { items: true } },
        shipments: { select: { trackingNumber: true }, take: 1 },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = new Map(
    statusCounts.map((entry) => [entry.status, entry._count._all]),
  );
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  function filterHref(nextStatus?: string) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (searchTerm) params.set("suche", searchTerm);
    const query = params.toString();
    return query ? `/admin/bestellungen?${query}` : "/admin/bestellungen";
  }

  return (
    <>
      <AdminPageHeader
        title="Bestellungen"
        description="Alle Bestellungen mit Zahlungsstatus, Kundendaten und Versand."
      />

      {/* Suche */}
      <form method="get" role="search" className="mb-6 flex flex-wrap gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="bestellsuche" className="sr-only">
          Bestellungen durchsuchen
        </label>
        <input
          id="bestellsuche"
          type="search"
          name="suche"
          defaultValue={searchTerm}
          placeholder="Bestellnummer, Name, E-Mail oder Artikelnummer"
          className="min-h-11 w-full max-w-md border border-line bg-charcoal px-3.5 text-sm text-cream
            placeholder:text-subtle focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="min-h-11 border border-line-strong px-5 text-sm text-cream transition-colors hover:border-gold hover:text-gold-light"
        >
          Suchen
        </button>
        {(searchTerm || status) && (
          <Link
            href="/admin/bestellungen"
            className="flex min-h-11 items-center px-3 text-sm text-muted underline underline-offset-4 hover:text-gold-light"
          >
            Zurücksetzen
          </Link>
        )}
      </form>

      {/* Statusfilter */}
      <nav aria-label="Statusfilter" className="mb-6">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={filterHref()}
              className={cn(
                "flex min-h-9 items-center border px-3 text-xs transition-colors",
                !status
                  ? "border-gold bg-gold/10 text-gold-light"
                  : "border-line-strong text-muted hover:border-gold/60 hover:text-gold-light",
              )}
            >
              Alle ({total})
            </Link>
          </li>
          {orderStatuses.map((entry) => {
            const count = countByStatus.get(entry) ?? 0;
            if (count === 0 && status !== entry) return null;
            return (
              <li key={entry}>
                <Link
                  href={filterHref(entry)}
                  className={cn(
                    "flex min-h-9 items-center border px-3 text-xs transition-colors",
                    status === entry
                      ? "border-gold bg-gold/10 text-gold-light"
                      : "border-line-strong text-muted hover:border-gold/60 hover:text-gold-light",
                  )}
                >
                  {orderStatusLabels[entry]} ({count})
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Card>
        {orders.length === 0 ? (
          <EmptyRow>
            {searchTerm || status
              ? "Keine Bestellungen entsprechen diesen Kriterien."
              : "Noch keine Bestellungen vorhanden."}
          </EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <caption className="sr-only">
                Bestellübersicht mit Status, Kunde, Datum und Betrag
              </caption>
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                  <th scope="col" className="pb-3 pr-4 font-medium">Nummer</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Kunde</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">E-Mail</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Status</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Positionen</th>
                  <th scope="col" className="pb-3 pr-4 font-medium">Eingang</th>
                  <th scope="col" className="pb-3 text-right font-medium">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-line/60 transition-colors hover:bg-elevated/60"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/bestellungen/${order.id}`}
                        className="font-mono text-xs text-gold hover:text-gold-light"
                      >
                        {order.orderNumber}
                      </Link>
                      {order.shipments.length > 0 && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-subtle">
                          versendet
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-cream">
                      {order.shippingAddress.firstName}{" "}
                      {order.shippingAddress.lastName}
                      <span className="block text-xs text-subtle">
                        {order.shippingAddress.city}
                      </span>
                    </td>
                    <td className="max-w-48 truncate py-3 pr-4 text-xs text-muted">
                      {order.email}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={statusTones[order.status] ?? "neutral"}>
                        {orderStatusLabels[order.status] ?? order.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-muted">
                      {order._count.items}
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-cream">
                      {formatPrice(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pageCount > 1 && (
        <nav aria-label="Seitennavigation" className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((entry) => {
            const params = new URLSearchParams();
            if (status) params.set("status", status);
            if (searchTerm) params.set("suche", searchTerm);
            if (entry > 1) params.set("seite", String(entry));
            const query = params.toString();

            return (
              <Link
                key={entry}
                href={query ? `/admin/bestellungen?${query}` : "/admin/bestellungen"}
                aria-current={entry === page ? "page" : undefined}
                className={cn(
                  "flex size-10 items-center justify-center border text-sm transition-colors",
                  entry === page
                    ? "border-gold bg-gold/10 text-gold-light"
                    : "border-line-strong text-muted hover:border-gold hover:text-gold-light",
                )}
              >
                {entry}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
