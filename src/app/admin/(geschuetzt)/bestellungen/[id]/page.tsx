import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader, Card } from "@/components/admin/layout-parts";
import { Badge } from "@/components/ui/badge";
import {
  OrderStatusForm,
  ResendConfirmationForm,
  ShipmentForm,
} from "@/components/admin/order-actions";
import { formatPrice, formatTaxRate } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { orderStatusLabels } from "@/lib/catalog";
import { describePaymentMethod } from "@/lib/stripe";
import { formatDeliveryRange } from "@/lib/availability";
import { orderStatusUrl } from "@/lib/email";

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

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Ausstehend",
  SUCCEEDED: "Erfolgreich",
  FAILED: "Fehlgeschlagen",
  CANCELLED: "Abgebrochen",
  REFUNDED: "Erstattet",
  PARTIALLY_REFUNDED: "Teilweise erstattet",
};

const countryNames: Record<string, string> = {
  CH: "Schweiz",
  LI: "Liechtenstein",
  DE: "Deutschland",
  AT: "Österreich",
};

function AddressCard({
  title,
  address,
}: {
  title: string;
  address: {
    firstName: string;
    lastName: string;
    company: string | null;
    street: string;
    houseNumber: string | null;
    addressLine2: string | null;
    postalCode: string;
    city: string;
    country: string;
    phone: string | null;
  };
}) {
  return (
    <div>
      <h3 className="eyebrow mb-2">{title}</h3>
      <address className="text-sm not-italic leading-relaxed text-muted">
        {address.firstName} {address.lastName}
        <br />
        {address.company && (
          <>
            {address.company}
            <br />
          </>
        )}
        {address.street} {address.houseNumber}
        <br />
        {address.addressLine2 && (
          <>
            {address.addressLine2}
            <br />
          </>
        )}
        {address.postalCode} {address.city}
        <br />
        {countryNames[address.country] ?? address.country}
        {address.phone && (
          <>
            <br />
            Tel. {address.phone}
          </>
        )}
      </address>
    </div>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      shippingAddress: true,
      billingAddress: true,
      customer: true,
      payments: { orderBy: { createdAt: "desc" } },
      shipments: { orderBy: { shippedAt: "desc" } },
      movements: {
        orderBy: { createdAt: "desc" },
        include: { variant: { select: { sku: true, size: true } } },
      },
    },
  });

  if (!order) notFound();

  const payment = order.payments[0] ?? null;

  return (
    <>
      <AdminPageHeader
        title={`Bestellung ${order.orderNumber}`}
        description={`Eingegangen am ${formatDateTime(order.createdAt)}`}
        breadcrumb={[
          { href: "/admin", label: "Übersicht" },
          { href: "/admin/bestellungen", label: "Bestellungen" },
        ]}
        actions={
          <Badge tone={statusTones[order.status] ?? "neutral"}>
            {orderStatusLabels[order.status] ?? order.status}
          </Badge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* Positionen */}
          <Card title="Positionen">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                    <th scope="col" className="pb-3 pr-4 font-medium">Artikel</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Größe</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">SKU</th>
                    <th scope="col" className="pb-3 pr-4 text-right font-medium">Menge</th>
                    <th scope="col" className="pb-3 pr-4 text-right font-medium">Einzeln</th>
                    <th scope="col" className="pb-3 text-right font-medium">Summe</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-line/60">
                      <td className="py-3 pr-4 text-cream">
                        {item.productName}
                        {item.isPreorder && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-sky-400">
                            Vorbestellung
                          </span>
                        )}
                        <span className="block text-xs text-subtle">
                          Lieferzeit{" "}
                          {formatDeliveryRange(
                            item.deliveryMinDays,
                            item.deliveryMaxDays,
                          )}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted">{item.variantSize}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-subtle">
                        {item.sku}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-cream">
                        {item.quantity}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-muted">
                        {formatPrice(item.unitPriceCents)}
                      </td>
                      <td className="py-3 text-right tabular-nums text-cream">
                        {formatPrice(item.lineTotalCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-5 flex flex-col gap-2 border-t border-line pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Zwischensumme</dt>
                <dd className="tabular-nums text-cream">
                  {formatPrice(order.subtotalCents)}
                </dd>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">
                    Rabatt {order.discountCodeLabel && `(${order.discountCodeLabel})`}
                  </dt>
                  <dd className="tabular-nums text-gold-light">
                    −{formatPrice(order.discountCents)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted">
                  Versand ({order.shippingMethodLabel})
                </dt>
                <dd className="tabular-nums text-cream">
                  {order.shippingCents === 0
                    ? "Kostenlos"
                    : formatPrice(order.shippingCents)}
                </dd>
              </div>
              <div className="mt-2 flex justify-between gap-4 border-t border-line pt-3">
                <dt className="text-base text-cream">Gesamt</dt>
                <dd className="font-display text-xl tabular-nums text-gold-light">
                  {formatPrice(order.totalCents)}
                </dd>
              </div>
              {order.taxCents > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-xs text-subtle">
                    davon MwSt. ({formatTaxRate(order.taxRateBp)})
                  </dt>
                  <dd className="text-xs tabular-nums text-subtle">
                    {formatPrice(order.taxCents)}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Kunde und Adressen */}
          <Card title="Kunde und Adressen">
            <div className="mb-6 grid gap-2 text-sm">
              <p className="text-cream">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>
                <a
                  href={`mailto:${order.email}?subject=Deine%20Bestellung%20${order.orderNumber}`}
                  className="text-gold hover:text-gold-light"
                >
                  {order.email}
                </a>
              </p>
              {order.customer?.phone && (
                <p className="text-muted">Tel. {order.customer.phone}</p>
              )}
              <p className="text-xs text-subtle">
                Kundenstatus:{" "}
                {order.customerId ? "in der Datenbank erfasst" : "Gastbestellung"} ·
                Newsletter:{" "}
                {order.customer?.marketingOptIn ? "eingewilligt" : "keine Einwilligung"}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <AddressCard title="Lieferadresse" address={order.shippingAddress} />
              <AddressCard title="Rechnungsadresse" address={order.billingAddress} />
            </div>

            {order.customerNote && (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="eyebrow mb-2">Kundennotiz</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {order.customerNote}
                </p>
              </div>
            )}
          </Card>

          {/* Lagerjournal */}
          <Card
            title="Lagerbuchungen"
            description="Alle Bestandsänderungen, die zu dieser Bestellung gehören."
          >
            {order.movements.length === 0 ? (
              <p className="text-sm text-muted">Keine Buchungen vorhanden.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {order.movements.map((movement) => (
                  <li
                    key={movement.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2 last:border-0"
                  >
                    <span className="text-muted">
                      <span className="text-cream">{movement.reason}</span> ·{" "}
                      {movement.variant.sku} ({movement.variant.size})
                    </span>
                    <span className="text-xs tabular-nums text-subtle">
                      Bestand {movement.stockDelta >= 0 ? "+" : ""}
                      {movement.stockDelta} · reserviert{" "}
                      {movement.reservedDelta >= 0 ? "+" : ""}
                      {movement.reservedDelta} · danach {movement.stockAfter} /{" "}
                      {movement.reservedAfter} ·{" "}
                      {formatDateTime(movement.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Seitenspalte */}
        <div className="flex flex-col gap-6">
          <Card title="Zahlung">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Status</dt>
                <dd className="text-cream">
                  {payment
                    ? (paymentStatusLabels[payment.status] ?? payment.status)
                    : "Noch keine Zahlung erfasst"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Methode</dt>
                <dd className="text-cream">
                  {describePaymentMethod(
                    payment?.methodType,
                    payment?.methodBrand,
                    payment?.methodLast4,
                  )}
                </dd>
              </div>
              {order.paidAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Bezahlt am</dt>
                  <dd className="text-cream">{formatDateTime(order.paidAt)}</dd>
                </div>
              )}
              {payment?.refundedCents ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Erstattet</dt>
                  <dd className="text-cream">
                    {formatPrice(payment.refundedCents)}
                  </dd>
                </div>
              ) : null}
              {payment?.stripePaymentIntentId && (
                <div className="flex flex-col gap-1">
                  <dt className="text-muted">Stripe-Referenz</dt>
                  <dd className="break-all font-mono text-xs text-subtle">
                    {payment.stripePaymentIntentId}
                  </dd>
                </div>
              )}
              {payment?.failureMessage && (
                <div className="flex flex-col gap-1">
                  <dt className="text-muted">Fehlermeldung</dt>
                  <dd className="text-xs text-red-300">{payment.failureMessage}</dd>
                </div>
              )}
            </dl>

            <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
              Es werden keine vollständigen Kartendaten gespeichert – nur
              Kartenmarke und die letzten vier Ziffern zur Wiedererkennung.
            </p>
          </Card>

          <Card title="Status ändern">
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </Card>

          <Card title="Versand">
            {order.shipments.length > 0 && (
              <ul className="mb-5 flex flex-col gap-3 border-b border-line pb-5 text-sm">
                {order.shipments.map((shipment) => (
                  <li key={shipment.id}>
                    <p className="text-cream">{shipment.carrier}</p>
                    <p className="font-mono text-xs text-muted">
                      {shipment.trackingNumber}
                    </p>
                    <p className="text-xs text-subtle">
                      {formatDateTime(shipment.shippedAt)} ·{" "}
                      {shipment.notifiedAt
                        ? "Kunde benachrichtigt"
                        : "noch nicht benachrichtigt"}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <ShipmentForm orderId={order.id} />
          </Card>

          <Card title="Weitere Aktionen">
            <div className="flex flex-col gap-4">
              <Link
                href={orderStatusUrl(order.accessToken)}
                target="_blank"
                className="text-sm text-gold underline underline-offset-4 hover:text-gold-light"
              >
                Kundenansicht der Bestellung öffnen ↗
              </Link>

              <ResendConfirmationForm orderId={order.id} />

              <p className="text-xs leading-relaxed text-subtle">
                Bestätigungsmail versendet:{" "}
                {order.confirmationEmailSentAt
                  ? formatDateTime(order.confirmationEmailSentAt)
                  : "noch nicht"}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
