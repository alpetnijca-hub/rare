import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusPoller } from "@/components/checkout/order-status-poller";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { formatPrice, formatTaxRate } from "@/lib/money";
import { estimatedDeliveryWindow, formatDeliveryRange } from "@/lib/availability";
import { formatDate, formatDateTime } from "@/lib/utils";
import { describePaymentMethod } from "@/lib/stripe";
import { orderStatusLabel } from "@/lib/email";
import { productThumbUrl } from "@/lib/product-image";

export const metadata: Metadata = {
  title: "Deine Bestellung",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ bezahlt?: string }>;
}

const countryNames: Record<string, string> = {
  CH: "Schweiz",
  LI: "Liechtenstein",
};

const statusTones: Record<
  string,
  "gold" | "neutral" | "success" | "warning" | "danger" | "info"
> = {
  PENDING_PAYMENT: "warning",
  PAID: "success",
  PROCESSING: "info",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "neutral",
};

function AddressBlock({
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
      <h3 className="eyebrow mb-3">{title}</h3>
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

export default async function OrderPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { bezahlt } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: {
      items: true,
      shippingAddress: true,
      billingAddress: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      shipments: { orderBy: { shippedAt: "desc" } },
    },
  });

  if (!order) notFound();

  const payment = order.payments[0] ?? null;
  const shipment = order.shipments[0] ?? null;
  const isPaid = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";

  // Zahlung wird erst durch den verifizierten Webhook bestätigt. Kommt der
  // Kunde direkt von Stripe zurück, kann das wenige Sekunden dauern.
  const awaitingConfirmation = bezahlt === "1" && order.status === "PENDING_PAYMENT";

  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Statuskopf */}
        {awaitingConfirmation ? (
          <div className="mb-10 border border-amber-800/60 bg-amber-950/30 p-6 md:p-8">
            <p className="eyebrow mb-2">Zahlung wird geprüft</p>
            <h1 className="text-3xl md:text-4xl">Einen Moment bitte</h1>
            <p className="mt-4 text-sm leading-relaxed text-amber-100/85">
              Wir warten auf die Bestätigung deiner Zahlung durch unseren
              Zahlungsdienstleister. Das dauert in der Regel nur wenige
              Sekunden. Diese Seite aktualisiert sich automatisch – du kannst
              sie geöffnet lassen.
            </p>
            <OrderStatusPoller />
          </div>
        ) : (
          <div className="mb-10">
            <p className="eyebrow mb-3">
              {isPaid ? "Bestellung bestätigt" : "Bestellstatus"}
            </p>
            <h1 className="text-3xl md:text-4xl">
              {order.status === "CANCELLED"
                ? "Diese Bestellung wurde storniert"
                : isPaid
                  ? "Vielen Dank für deine Bestellung"
                  : "Zahlung ausstehend"}
            </h1>
            {isPaid && (
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Wir haben deine Bestellung erhalten und bereiten sie sorgfältig
                vor. Eine Bestätigung mit allen Angaben ist an{" "}
                <span className="text-cream">{order.email}</span> unterwegs.
                Falls sie nicht ankommt, sieh bitte auch im Spam-Ordner nach.
              </p>
            )}
          </div>
        )}

        {/* Eckdaten */}
        <dl className="mb-10 grid gap-5 border-y border-line py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-subtle">
              Bestellnummer
            </dt>
            <dd className="mt-1 font-mono text-sm text-cream">
              {order.orderNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-subtle">
              Datum
            </dt>
            <dd className="mt-1 text-sm text-cream">{formatDate(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-subtle">
              Status
            </dt>
            <dd className="mt-1">
              <Badge tone={statusTones[order.status] ?? "neutral"}>
                {orderStatusLabel(order.status)}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-subtle">
              Zahlungsart
            </dt>
            <dd className="mt-1 text-sm text-cream">
              {describePaymentMethod(
                payment?.methodType,
                payment?.methodBrand,
                payment?.methodLast4,
              )}
            </dd>
          </div>
        </dl>

        {/* Sendungsverfolgung */}
        {shipment && (
          <div className="mb-10 border border-gold/30 bg-gold/5 p-6">
            <p className="eyebrow mb-2">Versandinformationen</p>
            <p className="text-sm leading-relaxed text-cream">
              Versendet am {formatDateTime(shipment.shippedAt)} mit{" "}
              {shipment.carrier}.
            </p>
            <p className="mt-1 text-sm text-muted">
              Sendungsnummer:{" "}
              <span className="font-mono text-cream">
                {shipment.trackingNumber}
              </span>
            </p>
            {shipment.trackingUrl && (
              <ButtonLink
                href={shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="sm"
                className="mt-4"
              >
                Sendung verfolgen
              </ButtonLink>
            )}
          </div>
        )}

        {/* Positionen */}
        <section aria-labelledby="positionen" className="mb-10">
          <h2 id="positionen" className="mb-5 text-xl">
            Bestellte Artikel
          </h2>

          <ul className="flex flex-col">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex gap-4 border-b border-line py-4 first:pt-0"
              >
                <div className="relative size-16 shrink-0 overflow-hidden border border-line bg-ink">
                  {item.imageUrl && (
                    <Image
                      src={productThumbUrl(item.imageUrl)}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-cream">{item.productName}</p>
                  <p className="mt-0.5 text-xs text-subtle">
                    Größe {item.variantSize} · Art.-Nr. {item.sku}
                    {item.isPreorder && " · Vorbestellung"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {item.quantity} × {formatPrice(item.unitPriceCents)}
                  </p>
                </div>

                <p className="whitespace-nowrap text-sm tabular-nums text-cream">
                  {formatPrice(item.lineTotalCents)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-col gap-2.5 text-sm">
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
              <dt className="text-muted">Versand ({order.shippingMethodLabel})</dt>
              <dd className="tabular-nums text-cream">
                {order.shippingCents === 0
                  ? "Kostenlos"
                  : formatPrice(order.shippingCents)}
              </dd>
            </div>

            <div className="mt-2 flex justify-between gap-4 border-t border-line pt-4">
              <dt className="text-base text-cream">Gesamtsumme</dt>
              <dd className="font-display text-2xl tabular-nums text-gold-light">
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
        </section>

        {/* Adressen */}
        <section aria-labelledby="adressen" className="mb-10 border-t border-line pt-8">
          <h2 id="adressen" className="sr-only">
            Adressen
          </h2>
          <div className="grid gap-8 sm:grid-cols-2">
            <AddressBlock title="Lieferadresse" address={order.shippingAddress} />
            <AddressBlock title="Rechnungsadresse" address={order.billingAddress} />
          </div>
        </section>

        {/* Lieferzeit */}
        {isPaid && order.status !== "DELIVERED" && (
          <section className="mb-10 border-t border-line pt-8">
            <h2 className="eyebrow mb-3">Voraussichtliche Lieferung</h2>
            <p className="text-sm leading-relaxed text-muted">
              Versand in{" "}
              {formatDeliveryRange(order.shippingMinDays, order.shippingMaxDays)} –
              voraussichtliche Zustellung:{" "}
              <span className="text-cream">
                {estimatedDeliveryWindow(
                  order.shippingMinDays,
                  order.shippingMaxDays,
                  order.paidAt ?? order.createdAt,
                )}
              </span>
              . Sobald dein Paket unterwegs ist, senden wir dir die
              Sendungsnummer per E-Mail.
            </p>
          </section>
        )}

        {/* Hilfe */}
        <section className="border-t border-line pt-8">
          <h2 className="eyebrow mb-3">Fragen zur Bestellung?</h2>
          <p className="text-sm leading-relaxed text-muted">
            Schreib uns an{" "}
            <a
              href={`mailto:${siteConfig.contact.email}?subject=Bestellung%20${order.orderNumber}`}
              className="text-gold underline underline-offset-2 hover:text-gold-light"
            >
              {siteConfig.contact.email}
            </a>{" "}
            und nenne dabei deine Bestellnummer. Wir antworten{" "}
            {siteConfig.supportResponseTime}.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/shop" variant="secondary">
              Weiter einkaufen
            </ButtonLink>
            <Link
              href="/widerruf"
              className="flex min-h-11 items-center text-sm text-muted underline underline-offset-4 transition-colors hover:text-gold-light"
            >
              Rückgabe &amp; Widerruf
            </Link>
          </div>
        </section>

        {/* Link zum Wiederfinden */}
        <p className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-subtle">
          Bewahre diesen Link auf, um den Status deiner Bestellung jederzeit
          abzurufen. Er ist persönlich – teile ihn nicht öffentlich.
        </p>
      </div>
    </div>
  );
}
