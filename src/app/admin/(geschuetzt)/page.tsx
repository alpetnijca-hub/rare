import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, Card, EmptyRow, StatTile } from "@/components/admin/layout-parts";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { orderStatusLabels } from "@/lib/catalog";
import { availableStock } from "@/lib/availability";
import { isEmailConfigured } from "@/lib/email";
import { isStripeConfigured } from "@/lib/stripe";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { envValue } from "@/lib/env";
import { demoDataStatus } from "@/lib/demo-seed";
import { DemoDataPanel } from "@/components/admin/demo-data-panel";

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

export default async function AdminOverviewPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const demoStatus = await demoDataStatus(prisma);

  const [
    revenueMonth,
    ordersLast30,
    openOrders,
    pendingPayment,
    recentOrders,
    lowStockVariants,
    productCount,
    newsletterCount,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        paidAt: { gte: startOfMonth },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: { paidAt: { gte: last30Days }, status: { notIn: ["CANCELLED"] } },
    }),
    prisma.order.count({
      where: { status: { in: ["PAID", "PROCESSING", "READY_TO_SHIP"] } },
    }),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        createdAt: true,
        email: true,
        shippingAddress: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, product: { isActive: true } },
      orderBy: { stock: "asc" },
      take: 30,
      select: {
        id: true,
        sku: true,
        size: true,
        stock: true,
        reservedStock: true,
        lowStockThreshold: true,
        preorderEnabled: true,
        product: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.newsletterSubscription.count({
      where: { confirmedAt: { not: null }, unsubscribedAt: null },
    }),
  ]);

  // Nur Varianten unterhalb ihrer individuellen Warnschwelle anzeigen.
  const lowStock = lowStockVariants.filter(
    (variant) =>
      availableStock(variant) <= variant.lowStockThreshold &&
      !variant.preorderEnabled,
  );

  const setupChecks = [
    { label: "Stripe (Zahlungen)", ok: isStripeConfigured() },
    { label: "Resend (E-Mails)", ok: isEmailConfigured() },
    { label: "Cloudinary (Bilder)", ok: isCloudinaryConfigured() },
    {
      label: "Stripe-Webhook-Secret",
      ok: Boolean(envValue(process.env.STRIPE_WEBHOOK_SECRET)),
    },
  ];
  const openSetup = setupChecks.filter((check) => !check.ok);

  return (
    <>
      <AdminPageHeader
        title="Übersicht"
        description="Aktueller Stand von Bestellungen, Umsatz und Lagerbestand."
      />

      <div className="mb-8">
        <DemoDataPanel
          demoProducts={demoStatus.demoProducts}
          realProducts={demoStatus.realProducts}
        />
      </div>

      {openSetup.length > 0 && (
        <div className="mb-8 border border-amber-800/60 bg-amber-950/25 px-5 py-4">
          <p className="text-sm font-medium text-amber-200">
            Einrichtung noch nicht abgeschlossen
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-100/85">
            Folgende Dienste sind nicht konfiguriert:{" "}
            {openSetup.map((check) => check.label).join(", ")}. Ohne sie
            funktionieren Zahlungen, E-Mails oder Bild-Uploads nicht. Die
            benötigten Werte stehen in der Datei <code>.env.example</code>.
          </p>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Umsatz laufender Monat"
          value={formatPrice(revenueMonth._sum.totalCents ?? 0)}
          hint={`${revenueMonth._count._all} bezahlte Bestellungen`}
          tone="gold"
        />
        <StatTile
          label="Bestellungen (30 Tage)"
          value={ordersLast30}
          hint="Bezahlt oder in Bearbeitung"
        />
        <StatTile
          label="Offen zu bearbeiten"
          value={openOrders}
          hint="Bezahlt, aber noch nicht versendet"
          tone={openOrders > 0 ? "success" : "neutral"}
          href="/admin/bestellungen?status=PAID"
        />
        <StatTile
          label="Knapper Bestand"
          value={lowStock.length}
          hint="Größen unter der Warnschwelle"
          tone={lowStock.length > 0 ? "warning" : "neutral"}
          href="/admin/lager"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Letzte Bestellungen */}
        <Card
          title="Letzte Bestellungen"
          actions={
            <Link
              href="/admin/bestellungen"
              className="text-sm text-gold transition-colors hover:text-gold-light"
            >
              Alle ansehen →
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <EmptyRow>
              Noch keine Bestellungen. Sobald die erste Bestellung eingeht,
              erscheint sie hier.
            </EmptyRow>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                    <th scope="col" className="pb-3 pr-4 font-medium">Nummer</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Kunde</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Status</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Datum</th>
                    <th scope="col" className="pb-3 text-right font-medium">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-line/60">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/bestellungen/${order.id}`}
                          className="font-mono text-xs text-gold hover:text-gold-light"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-cream">
                        {order.shippingAddress.firstName}{" "}
                        {order.shippingAddress.lastName}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={statusTones[order.status] ?? "neutral"}>
                          {orderStatusLabels[order.status] ?? order.status}
                        </Badge>
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

        <div className="flex flex-col gap-6">
          {/* Lagerwarnungen */}
          <Card
            title="Lagerwarnungen"
            actions={
              <Link
                href="/admin/lager"
                className="text-sm text-gold transition-colors hover:text-gold-light"
              >
                Lager →
              </Link>
            }
          >
            {lowStock.length === 0 ? (
              <EmptyRow>Alle Bestände liegen über der Warnschwelle.</EmptyRow>
            ) : (
              <ul className="flex flex-col gap-3">
                {lowStock.slice(0, 8).map((variant) => (
                  <li
                    key={variant.id}
                    className="flex items-center justify-between gap-3 border-b border-line/60 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/produkte/${variant.product.id}`}
                        className="block truncate text-sm text-cream hover:text-gold-light"
                      >
                        {variant.product.name}
                      </Link>
                      <p className="text-xs text-subtle">
                        {variant.size} · {variant.sku}
                      </p>
                    </div>
                    <span
                      className={
                        availableStock(variant) === 0
                          ? "shrink-0 text-sm font-medium tabular-nums text-red-400"
                          : "shrink-0 text-sm font-medium tabular-nums text-amber-300"
                      }
                    >
                      {availableStock(variant)} Stk.
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Weitere Kennzahlen */}
          <Card title="Weitere Kennzahlen">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Aktive Produkte</dt>
                <dd className="tabular-nums text-cream">{productCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Zahlung ausstehend</dt>
                <dd className="tabular-nums text-cream">{pendingPayment}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Newsletter (bestätigt)</dt>
                <dd className="tabular-nums text-cream">{newsletterCount}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
