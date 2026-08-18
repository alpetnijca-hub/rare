import { siteConfig } from "@/config/site";
import { formatPrice, formatTaxRate } from "@/lib/money";
import { formatDeliveryRange, estimatedDeliveryWindow } from "@/lib/availability";
import { formatDate } from "@/lib/utils";
import {
  addressBlock,
  emailColors,
  escapeHtml,
  keyValueTable,
  paragraph,
  renderEmail,
  sectionTitle,
  toPlainText,
} from "@/emails/layout";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface OrderEmailAddress {
  firstName: string;
  lastName: string;
  company?: string | null;
  street: string;
  houseNumber?: string | null;
  addressLine2?: string | null;
  postalCode: string;
  city: string;
  state?: string | null;
  country: string;
  phone?: string | null;
}

export interface OrderEmailItem {
  productName: string;
  size: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  isPreorder: boolean;
  deliveryMinDays: number;
  deliveryMaxDays: number;
}

export interface OrderEmailData {
  orderNumber: string;
  orderUrl: string;
  email: string;
  createdAt: Date;
  items: OrderEmailItem[];
  subtotalCents: number;
  discountCents: number;
  discountLabel: string | null;
  shippingCents: number;
  totalCents: number;
  taxCents: number;
  taxRateBp: number;
  shippingMethodLabel: string;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  shippingAddress: OrderEmailAddress;
  billingAddress: OrderEmailAddress;
  paymentMethodLabel: string;
  paymentStatusLabel: string;
  customerNote?: string | null;
}

const fontStack = "'Helvetica Neue', Helvetica, Arial, 'Segoe UI', sans-serif";

const countryNames: Record<string, string> = {
  CH: "Schweiz",
  LI: "Liechtenstein",
  DE: "Deutschland",
  AT: "Österreich",
};

function addressLines(address: OrderEmailAddress): string[] {
  return [
    `${address.firstName} ${address.lastName}`,
    address.company ?? "",
    [address.street, address.houseNumber].filter(Boolean).join(" "),
    address.addressLine2 ?? "",
    `${address.postalCode} ${address.city}`,
    address.state ?? "",
    countryNames[address.country] ?? address.country,
    address.phone ? `Tel. ${address.phone}` : "",
  ].filter(Boolean);
}

/** Positionstabelle mit Größe, Menge und Einzelpreis. */
function itemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${emailColors.border};font-family:${fontStack};font-size:14px;color:${emailColors.cream};">
          <strong style="color:${emailColors.white};font-weight:600;">${escapeHtml(item.productName)}</strong><br />
          <span style="color:${emailColors.muted};font-size:13px;">
            Größe: ${escapeHtml(item.size)} · Art.-Nr. ${escapeHtml(item.sku)}<br />
            Einzelpreis: ${formatPrice(item.unitPriceCents)}${
              item.isPreorder
                ? `<br /><span style="color:${emailColors.gold};">Vorbestellung – Versand in ${formatDeliveryRange(
                    item.deliveryMinDays,
                    item.deliveryMaxDays,
                  )}</span>`
                : ""
            }
          </span>
        </td>
        <td align="center" style="padding:12px 8px;border-bottom:1px solid ${emailColors.border};font-family:${fontStack};font-size:14px;color:${emailColors.cream};white-space:nowrap;">
          ${item.quantity}&nbsp;×
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid ${emailColors.border};font-family:${fontStack};font-size:14px;color:${emailColors.white};white-space:nowrap;">
          ${formatPrice(item.lineTotalCents)}
        </td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;
}

/** Summenblock, bei bestehender Steuerpflicht inklusive ausgewiesener MwSt. */
function totalsTable(data: OrderEmailData): string {
  const rows: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: "Zwischensumme", value: formatPrice(data.subtotalCents) },
  ];

  if (data.discountCents > 0) {
    rows.push({
      label: `Rabatt${data.discountLabel ? ` (${data.discountLabel})` : ""}`,
      value: `−${formatPrice(data.discountCents)}`,
    });
  }

  rows.push({
    label: `Versand (${data.shippingMethodLabel})`,
    value:
      data.shippingCents === 0 ? "Kostenlos" : formatPrice(data.shippingCents),
  });

  rows.push({ label: "Gesamtbetrag", value: formatPrice(data.totalCents), strong: true });

  if (data.taxCents > 0) {
    rows.push({
      label: `davon MwSt. (${formatTaxRate(data.taxRateBp)})`,
      value: formatPrice(data.taxCents),
    });
  }

  return keyValueTable(rows);
}

function twoColumnBlock(leftTitle: string, left: string, rightTitle: string, right: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td width="50%" valign="top" style="padding:0 12px 16px 0;">
          ${sectionTitle(leftTitle)}
          ${left}
        </td>
        <td width="50%" valign="top" style="padding:0 0 16px 12px;">
          ${sectionTitle(rightTitle)}
          ${right}
        </td>
      </tr>
    </table>`;
}

function finish(subject: string, html: string): RenderedEmail {
  return { subject, html, text: toPlainText(html) };
}

// ---------------------------------------------------------------------------
// 1. Bestellbestätigung (Kunde)
// ---------------------------------------------------------------------------

export function orderConfirmationEmail(data: OrderEmailData): RenderedEmail {
  const deliveryWindow = estimatedDeliveryWindow(
    data.deliveryMinDays,
    data.deliveryMaxDays,
    data.createdAt,
  );

  const body = `
    ${paragraph(
      `Vielen Dank für deine Bestellung, ${escapeHtml(data.shippingAddress.firstName)}. Wir haben deine Zahlung erhalten und bereiten alles sorgfältig für dich vor.`,
    )}
    ${keyValueTable([
      { label: "Bestellnummer", value: escapeHtml(data.orderNumber), strong: true },
      { label: "Bestelldatum", value: formatDate(data.createdAt) },
      { label: "Zahlungsart", value: escapeHtml(data.paymentMethodLabel) },
      { label: "Zahlungsstatus", value: escapeHtml(data.paymentStatusLabel) },
    ])}
    <div style="height:24px;"></div>
    ${sectionTitle("Deine Artikel")}
    ${itemsTable(data.items)}
    <div style="height:20px;"></div>
    ${totalsTable(data)}
    <div style="height:28px;"></div>
    ${twoColumnBlock(
      "Lieferadresse",
      addressBlock(addressLines(data.shippingAddress)),
      "Rechnungsadresse",
      addressBlock(addressLines(data.billingAddress)),
    )}
    ${sectionTitle("Voraussichtliche Lieferung")}
    ${paragraph(
      `Versand in ${formatDeliveryRange(data.deliveryMinDays, data.deliveryMaxDays)} – voraussichtliche Zustellung: <strong style="color:${emailColors.goldLight};">${deliveryWindow}</strong>. Sobald dein Paket unterwegs ist, erhältst du eine Versandbestätigung mit Sendungsnummer.`,
    )}
    ${
      data.items.some((item) => item.isPreorder)
        ? paragraph(
            `Deine Bestellung enthält vorbestellte Artikel. Wir versenden dein Paket vollständig, sobald alle Positionen verfügbar sind.`,
            true,
          )
        : ""
    }
    ${
      data.customerNote
        ? `${sectionTitle("Deine Nachricht an uns")}${paragraph(escapeHtml(data.customerNote), true)}`
        : ""
    }
  `;

  return finish(
    `Bestellbestätigung ${data.orderNumber} – ${siteConfig.name}`,
    renderEmail({
      preheader: `Deine Bestellung ${data.orderNumber} ist bei uns eingegangen.`,
      eyebrow: "Bestellbestätigung",
      heading: "Deine Bestellung ist bestätigt",
      bodyHtml: body,
      cta: { label: "Bestellung ansehen", url: data.orderUrl },
      footnote: `Fragen zu deiner Bestellung? Antworte einfach auf diese E-Mail oder schreib uns an <a href="mailto:${escapeHtml(siteConfig.contact.email)}" style="color:${emailColors.gold};">${escapeHtml(siteConfig.contact.email)}</a>. Erreichbarkeit: ${escapeHtml(siteConfig.supportHours)}.`,
    }),
  );
}

// ---------------------------------------------------------------------------
// 2. Interne Benachrichtigung
// ---------------------------------------------------------------------------

export function internalOrderNotificationEmail(
  data: OrderEmailData & { adminUrl: string; customerName: string },
): RenderedEmail {
  const body = `
    ${paragraph(`Es ist eine neue Bestellung eingegangen.`)}
    ${keyValueTable([
      { label: "Bestellnummer", value: escapeHtml(data.orderNumber), strong: true },
      { label: "Kunde", value: escapeHtml(data.customerName) },
      { label: "E-Mail", value: escapeHtml(data.email) },
      { label: "Zahlungsstatus", value: escapeHtml(data.paymentStatusLabel) },
      { label: "Zahlungsart", value: escapeHtml(data.paymentMethodLabel) },
      { label: "Gesamtbetrag", value: formatPrice(data.totalCents), strong: true },
      { label: "Versandart", value: escapeHtml(data.shippingMethodLabel) },
    ])}
    <div style="height:24px;"></div>
    ${sectionTitle("Positionen")}
    ${itemsTable(data.items)}
    <div style="height:24px;"></div>
    ${sectionTitle("Lieferadresse")}
    ${addressBlock(addressLines(data.shippingAddress))}
    ${
      data.customerNote
        ? `<div style="height:20px;"></div>${sectionTitle("Kundennotiz")}${paragraph(escapeHtml(data.customerNote), true)}`
        : ""
    }
  `;

  return finish(
    `Neue Bestellung ${data.orderNumber} · ${formatPrice(data.totalCents)}`,
    renderEmail({
      preheader: `Neue Bestellung ${data.orderNumber} über ${formatPrice(data.totalCents)}.`,
      eyebrow: "Interne Benachrichtigung",
      heading: "Neue Bestellung eingegangen",
      bodyHtml: body,
      cta: { label: "Im Dashboard öffnen", url: data.adminUrl },
    }),
  );
}

// ---------------------------------------------------------------------------
// 3. Zahlung fehlgeschlagen
// ---------------------------------------------------------------------------

export function paymentFailedEmail(data: {
  orderNumber: string;
  firstName: string;
  totalCents: number;
  retryUrl: string;
  reason?: string | null;
}): RenderedEmail {
  const body = `
    ${paragraph(`Hallo ${escapeHtml(data.firstName)}, leider konnte deine Zahlung nicht abgeschlossen werden.`)}
    ${keyValueTable([
      { label: "Bestellnummer", value: escapeHtml(data.orderNumber), strong: true },
      { label: "Betrag", value: formatPrice(data.totalCents) },
      ...(data.reason ? [{ label: "Hinweis", value: escapeHtml(data.reason) }] : []),
    ])}
    <div style="height:20px;"></div>
    ${paragraph(
      "Deine Artikel sind noch nicht verbindlich bestellt. Du kannst den Kauf jederzeit erneut abschliessen – am schnellsten über den Button unten.",
    )}
    ${paragraph(
      "Es wurde kein Betrag von deinem Konto abgebucht. Sollte dennoch eine Belastung erscheinen, handelt es sich um eine Reservierung, die von deiner Bank automatisch aufgehoben wird.",
      true,
    )}
  `;

  return finish(
    `Zahlung fehlgeschlagen – Bestellung ${data.orderNumber}`,
    renderEmail({
      preheader: `Deine Zahlung für ${data.orderNumber} konnte nicht verarbeitet werden.`,
      eyebrow: "Zahlung fehlgeschlagen",
      heading: "Wir konnten deine Zahlung nicht verarbeiten",
      bodyHtml: body,
      cta: { label: "Zahlung erneut versuchen", url: data.retryUrl },
    }),
  );
}

// ---------------------------------------------------------------------------
// 4. Bestellung storniert
// ---------------------------------------------------------------------------

export function orderCancelledEmail(data: {
  orderNumber: string;
  firstName: string;
  totalCents: number;
  reason?: string | null;
  refunded: boolean;
}): RenderedEmail {
  const body = `
    ${paragraph(`Hallo ${escapeHtml(data.firstName)}, deine Bestellung wurde storniert.`)}
    ${keyValueTable([
      { label: "Bestellnummer", value: escapeHtml(data.orderNumber), strong: true },
      { label: "Betrag", value: formatPrice(data.totalCents) },
      ...(data.reason ? [{ label: "Grund", value: escapeHtml(data.reason) }] : []),
    ])}
    <div style="height:20px;"></div>
    ${paragraph(
      data.refunded
        ? "Der Betrag wird vollständig erstattet. Je nach Zahlungsanbieter dauert die Gutschrift 5 bis 10 Werktage."
        : "Es wurde kein Betrag abgebucht.",
    )}
    ${paragraph("Wenn du Fragen zur Stornierung hast, melde dich jederzeit bei uns.", true)}
  `;

  return finish(
    `Bestellung ${data.orderNumber} storniert`,
    renderEmail({
      preheader: `Deine Bestellung ${data.orderNumber} wurde storniert.`,
      eyebrow: "Stornierung",
      heading: "Deine Bestellung wurde storniert",
      bodyHtml: body,
      cta: { label: "Zum Shop", url: `${siteConfig.url}/shop` },
    }),
  );
}

// ---------------------------------------------------------------------------
// 5. Versandbestätigung
// ---------------------------------------------------------------------------

export function shippingConfirmationEmail(data: {
  orderNumber: string;
  firstName: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  items: OrderEmailItem[];
  shippingAddress: OrderEmailAddress;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  orderUrl: string;
}): RenderedEmail {
  const body = `
    ${paragraph(`Gute Nachrichten, ${escapeHtml(data.firstName)} – dein Paket ist unterwegs.`)}
    ${keyValueTable([
      { label: "Bestellnummer", value: escapeHtml(data.orderNumber) },
      { label: "Versanddienstleister", value: escapeHtml(data.carrier) },
      { label: "Sendungsnummer", value: escapeHtml(data.trackingNumber), strong: true },
      {
        label: "Voraussichtliche Zustellung",
        value: formatDeliveryRange(data.deliveryMinDays, data.deliveryMaxDays),
      },
    ])}
    <div style="height:24px;"></div>
    ${sectionTitle("Inhalt der Sendung")}
    ${itemsTable(data.items)}
    <div style="height:24px;"></div>
    ${sectionTitle("Lieferadresse")}
    ${addressBlock(addressLines(data.shippingAddress))}
  `;

  return finish(
    `Deine Bestellung ${data.orderNumber} ist unterwegs`,
    renderEmail({
      preheader: `Sendungsnummer ${data.trackingNumber} – dein Paket ist unterwegs.`,
      eyebrow: "Versandbestätigung",
      heading: "Dein Paket ist unterwegs",
      bodyHtml: body,
      cta: data.trackingUrl
        ? { label: "Sendung verfolgen", url: data.trackingUrl }
        : { label: "Bestellung ansehen", url: data.orderUrl },
      footnote:
        "Die Sendungsverfolgung wird vom Versanddienstleister aktualisiert und kann einige Stunden benötigen, bis erste Daten sichtbar sind.",
    }),
  );
}

// ---------------------------------------------------------------------------
// 6. Rückerstattung
// ---------------------------------------------------------------------------

export function refundEmail(data: {
  orderNumber: string;
  firstName: string;
  refundedCents: number;
  totalCents: number;
  partial: boolean;
}): RenderedEmail {
  const body = `
    ${paragraph(`Hallo ${escapeHtml(data.firstName)}, wir haben deine Rückerstattung veranlasst.`)}
    ${keyValueTable([
      { label: "Bestellnummer", value: escapeHtml(data.orderNumber) },
      { label: "Bestellwert", value: formatPrice(data.totalCents) },
      {
        label: data.partial ? "Teilerstattung" : "Erstatteter Betrag",
        value: formatPrice(data.refundedCents),
        strong: true,
      },
    ])}
    <div style="height:20px;"></div>
    ${paragraph(
      "Die Gutschrift erfolgt auf das ursprünglich verwendete Zahlungsmittel. Je nach Bank oder Zahlungsanbieter dauert es 5 bis 10 Werktage, bis der Betrag sichtbar ist.",
    )}
  `;

  return finish(
    `Rückerstattung zu Bestellung ${data.orderNumber}`,
    renderEmail({
      preheader: `${formatPrice(data.refundedCents)} werden dir zurückerstattet.`,
      eyebrow: "Rückerstattung",
      heading: "Deine Rückerstattung ist unterwegs",
      bodyHtml: body,
    }),
  );
}

// ---------------------------------------------------------------------------
// 7. Produkt wieder verfügbar
// ---------------------------------------------------------------------------

export function backInStockEmail(data: {
  productName: string;
  size: string;
  priceCents: number;
  productUrl: string;
  unsubscribeUrl: string;
}): RenderedEmail {
  const body = `
    ${paragraph(`<strong style="color:${emailColors.white};">${escapeHtml(data.productName)}</strong> in der Größe ${escapeHtml(data.size)} ist wieder verfügbar.`)}
    ${keyValueTable([
      { label: "Größe", value: escapeHtml(data.size) },
      { label: "Preis", value: formatPrice(data.priceCents), strong: true },
    ])}
    <div style="height:20px;"></div>
    ${paragraph(
      "Unsere Abfüllungen sind in begrenzter Stückzahl verfügbar. Wenn du zugreifen möchtest, lohnt es sich, nicht zu lange zu warten.",
      true,
    )}
  `;

  return finish(
    `Wieder verfügbar: ${data.productName}`,
    renderEmail({
      preheader: `${data.productName} (${data.size}) ist wieder auf Lager.`,
      eyebrow: "Wieder verfügbar",
      heading: `${data.productName} ist zurück`,
      bodyHtml: body,
      cta: { label: "Jetzt ansehen", url: data.productUrl },
      footnote: `Du erhältst diese einmalige Benachrichtigung, weil du sie für dieses Produkt angefordert hast. <a href="${escapeHtml(data.unsubscribeUrl)}" style="color:${emailColors.gold};">Benachrichtigungen abbestellen</a>.`,
    }),
  );
}

// ---------------------------------------------------------------------------
// 8. Newsletter – Double-Opt-in
// ---------------------------------------------------------------------------

export function newsletterConfirmEmail(data: {
  confirmUrl: string;
}): RenderedEmail {
  const body = `
    ${paragraph("Bitte bestätige deine Anmeldung zu unserem Newsletter mit einem Klick auf den Button.")}
    ${paragraph(
      "Ohne diese Bestätigung senden wir dir keine E-Mails. Du kannst dich jederzeit über den Abmeldelink in jeder Nachricht wieder austragen.",
      true,
    )}
  `;

  return finish(
    `Bitte bestätige deine Newsletter-Anmeldung`,
    renderEmail({
      preheader: "Ein Klick fehlt noch zur Bestätigung.",
      eyebrow: "Newsletter",
      heading: "Anmeldung bestätigen",
      bodyHtml: body,
      cta: { label: "Anmeldung bestätigen", url: data.confirmUrl },
      footnote:
        "Wenn du dich nicht angemeldet hast, ignoriere diese E-Mail einfach – es passiert dann nichts weiter.",
    }),
  );
}
