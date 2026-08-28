"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { useCartQuote } from "@/components/cart/use-cart-quote";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/field";
import { useCurrency } from "@/components/currency/currency-provider";
import { CurrencyNotice } from "@/components/currency/currency-switcher";
import { formatPrice as formatBasePriceCents, formatTaxRate } from "@/lib/money";
import { formatDeliveryRange } from "@/lib/availability";
import { shippingCountries } from "@/lib/shipping";
import { cn } from "@/lib/utils";
import { productThumbUrl } from "@/lib/product-image";

/**
 * Kasse (Gastbestellung ohne Konto).
 *
 * Wichtig: Dieses Formular sendet keine Preise. Der Server berechnet den
 * Warenkorb erneut und erzeugt daraus die Stripe-Session. Angezeigte Beträge
 * stammen ebenfalls vom Server (`/api/warenkorb`).
 */

interface AddressState {
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  houseNumber: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
}

const emptyAddress: AddressState = {
  firstName: "",
  lastName: "",
  company: "",
  street: "",
  houseNumber: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  country: "CH",
  phone: "",
};

function AddressFields({
  prefix,
  legend,
  value,
  onChange,
  errors,
}: {
  prefix: string;
  legend: string;
  value: AddressState;
  onChange: (next: AddressState) => void;
  errors: Record<string, string>;
}) {
  function set<K extends keyof AddressState>(key: K, next: AddressState[K]) {
    onChange({ ...value, [key]: next });
  }

  const errorFor = (field: string) =>
    errors[`${prefix}.${field}`] ?? errors[field];

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="sr-only">{legend}</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${prefix}-vorname`}
          label="Vorname"
          required
          error={errorFor("firstName")}
        >
          {(aria) => (
            <TextInput
              {...aria}
              name={`${prefix}-vorname`}
              autoComplete="given-name"
              required
              value={value.firstName}
              onChange={(event) => set("firstName", event.target.value)}
            />
          )}
        </Field>

        <Field
          id={`${prefix}-nachname`}
          label="Nachname"
          required
          error={errorFor("lastName")}
        >
          {(aria) => (
            <TextInput
              {...aria}
              name={`${prefix}-nachname`}
              autoComplete="family-name"
              required
              value={value.lastName}
              onChange={(event) => set("lastName", event.target.value)}
            />
          )}
        </Field>
      </div>

      <Field id={`${prefix}-firma`} label="Firma" error={errorFor("company")}>
        {(aria) => (
          <TextInput
            {...aria}
            name={`${prefix}-firma`}
            autoComplete="organization"
            value={value.company}
            onChange={(event) => set("company", event.target.value)}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field
          id={`${prefix}-strasse`}
          label="Strasse"
          required
          error={errorFor("street")}
        >
          {(aria) => (
            <TextInput
              {...aria}
              name={`${prefix}-strasse`}
              autoComplete="address-line1"
              required
              value={value.street}
              onChange={(event) => set("street", event.target.value)}
            />
          )}
        </Field>

        <Field
          id={`${prefix}-hausnummer`}
          label="Nr."
          error={errorFor("houseNumber")}
        >
          {(aria) => (
            <TextInput
              {...aria}
              name={`${prefix}-hausnummer`}
              value={value.houseNumber}
              onChange={(event) => set("houseNumber", event.target.value)}
            />
          )}
        </Field>
      </div>

      <Field
        id={`${prefix}-zusatz`}
        label="Adresszusatz"
        hint="z. B. c/o, Stockwerk oder Postfach"
        error={errorFor("addressLine2")}
      >
        {(aria) => (
          <TextInput
            {...aria}
            name={`${prefix}-zusatz`}
            autoComplete="address-line2"
            value={value.addressLine2}
            onChange={(event) => set("addressLine2", event.target.value)}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <Field
          id={`${prefix}-plz`}
          label="PLZ"
          required
          error={errorFor("postalCode")}
        >
          {(aria) => (
            <TextInput
              {...aria}
              name={`${prefix}-plz`}
              autoComplete="postal-code"
              inputMode="numeric"
              required
              value={value.postalCode}
              onChange={(event) => set("postalCode", event.target.value)}
            />
          )}
        </Field>

        <Field id={`${prefix}-ort`} label="Ort" required error={errorFor("city")}>
          {(aria) => (
            <TextInput
              {...aria}
              name={`${prefix}-ort`}
              autoComplete="address-level2"
              required
              value={value.city}
              onChange={(event) => set("city", event.target.value)}
            />
          )}
        </Field>
      </div>

      <Field id={`${prefix}-land`} label="Land" required error={errorFor("country")}>
        {(aria) => (
          <Select
            {...aria}
            name={`${prefix}-land`}
            autoComplete="country"
            required
            value={value.country}
            onChange={(event) => set("country", event.target.value)}
          >
            {shippingCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </fieldset>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, ready, freeSampleVariantId } = useCart();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState<AddressState>(emptyAddress);
  const [billingDiffers, setBillingDiffers] = useState(false);
  const [billingAddress, setBillingAddress] = useState<AddressState>(emptyAddress);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptNoReturns, setAcceptNoReturns] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldIssues, setFieldIssues] = useState<Record<string, string>>({});

  const { format: formatPrice, isConverted } = useCurrency();
  const { quote, loading } = useCartQuote({
    shippingMethod,
    country: shippingAddress.country,
    discountCode: appliedCode,
  });

  // Ist die gewählte Versandart im Lieferland nicht verfügbar, greift die
  // erste verfügbare. Abgeleitet statt in einem Effekt gesetzt – der Server
  // wendet dieselbe Regel an, die Beträge bleiben also konsistent.
  const effectiveShippingMethod =
    quote && !quote.shippingOptions.some((option) => option.key === shippingMethod)
      ? (quote.shippingOptions[0]?.key ?? shippingMethod)
      : shippingMethod;

  // Leerer Warenkorb: zurück zur Warenkorbseite.
  useEffect(() => {
    if (ready && items.length === 0) router.replace("/warenkorb");
  }, [ready, items.length, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFormError(null);
    setFieldIssues({});

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Nur IDs und Mengen – keine Preise.
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          email,
          phone,
          shippingAddress,
          billingDiffers,
          billingAddress: billingDiffers ? billingAddress : undefined,
          shippingMethod: effectiveShippingMethod,
          discountCode: appliedCode || undefined,
          // Nur die Wahl. Ob sie zusteht und dass sie nichts kostet,
          // entscheidet der Server.
          freeSampleVariantId: freeSampleVariantId || undefined,
          customerNote,
          acceptTerms,
          acceptNoReturns,
          marketingOptIn,
        }),
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
        fields?: Record<string, string>;
        notices?: string[];
        requiresReview?: boolean;
      };

      if (!response.ok || !data.url) {
        setFormError(
          data.error ?? "Die Bestellung konnte nicht abgeschlossen werden.",
        );
        if (data.fields) setFieldIssues(data.fields);
        setSubmitting(false);

        // Warenkorb hat sich geändert – zurück zur Prüfung.
        if (data.requiresReview) {
          window.setTimeout(() => router.push("/warenkorb"), 2500);
        }
        return;
      }

      // Weiter zur gesicherten Bezahlseite von Stripe.
      window.location.assign(data.url);
    } catch {
      setFormError(
        "Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.",
      );
      setSubmitting(false);
    }
  }

  if (!ready || (loading && !quote)) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-11 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (!quote || quote.lines.length === 0) {
    return (
      <div className="border border-line bg-charcoal p-8 text-center">
        <h2 className="text-2xl">Dein Warenkorb ist leer</h2>
        <p className="mt-3 text-sm text-muted">
          Lege zuerst Artikel in den Warenkorb, um zur Kasse zu gehen.
        </p>
        <ButtonLink href="/shop" className="mt-6">
          Zum Shop
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
      <div className="flex flex-col gap-10">
        {/* Kontakt */}
        <section aria-labelledby="kontaktdaten">
          <h2 id="kontaktdaten" className="mb-1 text-2xl">
            Kontaktdaten
          </h2>
          <p className="mb-6 text-sm text-muted">
            Du bestellst als Gast – ein Kundenkonto ist nicht nötig. An diese
            Adresse senden wir die Bestellbestätigung.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="email"
              label="E-Mail-Adresse"
              required
              error={fieldIssues.email}
              hint="Für Bestellbestätigung und Versandinformationen"
            >
              {(aria) => (
                <TextInput
                  {...aria}
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>

            <Field
              id="telefon"
              label="Telefonnummer"
              error={fieldIssues.phone}
              hint="Nur für Rückfragen zur Lieferung"
            >
              {(aria) => (
                <TextInput
                  {...aria}
                  type="tel"
                  name="telefon"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              )}
            </Field>
          </div>
        </section>

        {/* Lieferadresse */}
        <section aria-labelledby="lieferadresse">
          <h2 id="lieferadresse" className="mb-6 text-2xl">
            Lieferadresse
          </h2>
          <AddressFields
            prefix="shippingAddress"
            legend="Lieferadresse"
            value={shippingAddress}
            onChange={setShippingAddress}
            errors={fieldIssues}
          />

          <div className="mt-6">
            <Checkbox
              id="abweichende-rechnungsadresse"
              checked={billingDiffers}
              onChange={(event) => setBillingDiffers(event.target.checked)}
              label="Die Rechnungsadresse weicht von der Lieferadresse ab"
            />
          </div>
        </section>

        {/* Rechnungsadresse */}
        {billingDiffers && (
          <section aria-labelledby="rechnungsadresse" className="animate-fade">
            <h2 id="rechnungsadresse" className="mb-6 text-2xl">
              Rechnungsadresse
            </h2>
            <AddressFields
              prefix="billingAddress"
              legend="Rechnungsadresse"
              value={billingAddress}
              onChange={setBillingAddress}
              errors={fieldIssues}
            />
          </section>
        )}

        {/* Versandart */}
        <section aria-labelledby="versandart">
          <h2 id="versandart" className="mb-6 text-2xl">
            Versandart
          </h2>

          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Versandart wählen</legend>

            {quote.shippingOptions.map((option) => {
              const selected = option.key === effectiveShippingMethod;
              const price =
                selected && quote.shippingCents === 0
                  ? "Kostenlos"
                  : option.priceCents === 0
                    ? "Kostenlos"
                    : formatPrice(option.priceCents);

              return (
                <label
                  key={option.key}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 border p-4 transition-colors duration-200",
                    selected
                      ? "border-gold bg-gold/8"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="versandart"
                    value={option.key}
                    checked={selected}
                    onChange={() => setShippingMethod(option.key)}
                    className="mt-1 size-4 shrink-0 cursor-pointer appearance-none rounded-full border border-line-strong bg-ink
                      checked:border-gold checked:bg-gold
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  />
                  <span className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
                    <span>
                      <span className="block text-sm font-medium text-cream">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                        {option.description}
                        {option.freeFromCents !== null && (
                          <> · Kostenlos ab {formatPrice(option.freeFromCents)}</>
                        )}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums text-gold-light">
                      {price}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        </section>

        {/* Anmerkung */}
        <section aria-labelledby="anmerkung">
          <h2 id="anmerkung" className="mb-6 text-2xl">
            Anmerkung zur Bestellung
          </h2>
          <Field
            id="anmerkung-feld"
            label="Nachricht an uns"
            hint="Optional, z. B. Wunschtermin oder Hinweis zur Zustellung (max. 500 Zeichen)"
          >
            {(aria) => (
              <TextArea
                {...aria}
                name="anmerkung"
                maxLength={500}
                value={customerNote}
                onChange={(event) => setCustomerNote(event.target.value)}
              />
            )}
          </Field>
        </section>

        {/* Zahlung */}
        <section aria-labelledby="zahlung">
          <h2 id="zahlung" className="mb-3 text-2xl">
            Zahlung
          </h2>
          <div className="border border-line bg-charcoal p-5">
            <p className="text-sm leading-relaxed text-muted">
              Die Bezahlung erfolgt im nächsten Schritt über unseren
              Zahlungsdienstleister <strong className="text-cream">Stripe</strong>.
              Verfügbar sind Kredit- und Debitkarte sowie – je nach Gerät –
              Apple&nbsp;Pay und Google&nbsp;Pay.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-subtle">
              Deine Zahlungsdaten werden ausschliesslich von Stripe verarbeitet
              und erreichen unsere Server zu keinem Zeitpunkt. Wir speichern
              keine vollständigen Kartendaten.
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {["Visa", "Mastercard", "American Express", "Apple Pay", "Google Pay"].map(
                (method) => (
                  <li
                    key={method}
                    className="border border-line-strong px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted"
                  >
                    {method}
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* Bestellübersicht */}
      <aside
        aria-label="Bestellübersicht"
        className="h-fit border border-line bg-charcoal p-6 lg:sticky lg:top-28"
      >
        <h2 className="mb-5 text-xl">Deine Bestellung</h2>

        <ul className="flex flex-col gap-4 border-b border-line pb-5">
          {quote.lines.map((line) => (
            <li
              key={`${line.variantId}-${line.isFreeSample ? "gratis" : "kauf"}`}
              className="flex gap-3"
            >
              <div className="relative size-14 shrink-0 overflow-hidden border border-line bg-ink">
                {line.imageUrl && (
                  <Image
                    src={productThumbUrl(line.imageUrl)}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
                <span
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-ink"
                  aria-hidden="true"
                >
                  {line.quantity}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-cream">{line.productName}</p>
                <p className="text-xs text-subtle">
                  {line.isFreeSample ? (
                    <>
                      {line.size} · <span className="text-gold">Geschenk</span>
                    </>
                  ) : (
                    <>
                      {line.size} · {line.quantity} ×{" "}
                      {formatPrice(line.unitPriceCents)}
                    </>
                  )}
                </p>
              </div>

              <p className="whitespace-nowrap text-sm tabular-nums text-cream">
                {line.isFreeSample ? "Gratis" : formatPrice(line.lineTotalCents)}
              </p>
            </li>
          ))}
        </ul>

        {/* Gutschein */}
        <div className="border-b border-line py-5">
          <label
            htmlFor="kasse-rabattcode"
            className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-muted"
          >
            Gutscheincode
          </label>
          <div className="flex gap-2">
            <TextInput
              id="kasse-rabattcode"
              value={discountInput}
              onChange={(event) => setDiscountInput(event.target.value)}
              placeholder="Code eingeben"
              autoComplete="off"
              className="uppercase"
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setAppliedCode(discountInput.trim().toUpperCase())}
            >
              Einlösen
            </Button>
          </div>
          {quote.discountValid && (
            <p className="mt-2 text-xs text-emerald-400">
              Code {quote.discountLabel} angewendet.
            </p>
          )}
          {appliedCode && !quote.discountValid && quote.discountMessage && (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {quote.discountMessage}
            </p>
          )}
        </div>

        {/* Summen */}
        <dl className="flex flex-col gap-3 border-b border-line py-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Zwischensumme</dt>
            <dd className="tabular-nums text-cream">
              {formatPrice(quote.subtotalCents)}
            </dd>
          </div>

          {quote.discountCents > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Rabatt</dt>
              <dd className="tabular-nums text-gold-light">
                −{formatPrice(quote.discountCents)}
              </dd>
            </div>
          )}

          <div className="flex justify-between gap-4">
            <dt className="text-muted">Versandkosten</dt>
            <dd className="tabular-nums text-cream">
              {quote.shippingCents === 0
                ? "Kostenlos"
                : formatPrice(quote.shippingCents)}
            </dd>
          </div>
        </dl>

        <div className="flex items-baseline justify-between gap-4 py-5">
          <span className="text-base text-cream">Gesamtsumme</span>
          <span className="font-display text-2xl tabular-nums text-gold-light">
            {formatPrice(quote.totalCents)}
          </span>
        </div>

        {/* Bei gewählter Fremdwährung steht der tatsächlich belastete
            CHF-Betrag zusätzlich und unmissverständlich daneben. */}
        {isConverted && (
          <p className="-mt-3 mb-5 text-right text-sm text-cream">
            Belastet werden{" "}
            <strong className="font-medium text-gold-light">
              {formatBasePriceCents(quote.totalCents)}
            </strong>
          </p>
        )}

        {quote.taxCents > 0 && (
          <p className="-mt-3 mb-5 text-right text-xs text-subtle">
            inkl. {formatPrice(quote.taxCents)} MwSt. (
            {formatTaxRate(quote.taxRateBp)})
          </p>
        )}

        <p className="mb-5 text-sm text-muted">
          Voraussichtliche Lieferung in{" "}
          {formatDeliveryRange(quote.deliveryMinDays, quote.deliveryMaxDays)}.
          {quote.hasPreorderItems &&
            " Deine Bestellung enthält vorbestellte Artikel; wir versenden vollständig, sobald alle Positionen bereitstehen."}
        </p>

        {/* Zustimmungen */}
        <div className="flex flex-col gap-4 border-t border-line pt-5">
          <Checkbox
            id="agb"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            required
            error={fieldIssues.acceptTerms}
            label={
              <>
                Ich habe die{" "}
                <Link href="/agb" target="_blank" className="text-gold underline underline-offset-2">
                  AGB
                </Link>{" "}
                und die{" "}
                <Link href="/datenschutz" target="_blank" className="text-gold underline underline-offset-2">
                  Datenschutzerklärung
                </Link>{" "}
                gelesen und akzeptiere sie.
              </>
            }
          />

          <Checkbox
            id="keine-rueckgabe"
            checked={acceptNoReturns}
            onChange={(event) => setAcceptNoReturns(event.target.checked)}
            required
            error={fieldIssues.acceptNoReturns}
            label={
              <>
                Mir ist bekannt, dass eine Rückgabe bei Parfüm aus
                Hygienegründen{" "}
                <Link href="/widerruf" target="_blank" className="text-gold underline underline-offset-2">
                  ausgeschlossen
                </Link>{" "}
                ist. Bei Mängeln oder Transportschäden gilt das nicht.
              </>
            }
          />

          <Checkbox
            id="newsletter-kasse"
            checked={marketingOptIn}
            onChange={(event) => setMarketingOptIn(event.target.checked)}
            label="Ich möchte gelegentlich über neue Düfte informiert werden (jederzeit widerrufbar)."
          />
        </div>

        {/* Mindestbestellwert: Der Grund gehört vor den Knopf, nicht erst in
            die Fehlermeldung nach dem Klick. */}
        {quote.belowMinimum && (
          <p
            role="status"
            className="mt-5 border border-amber-800/60 bg-amber-950/25 px-4 py-3 text-sm leading-relaxed text-amber-100/85"
          >
            Der Mindestbestellwert beträgt{" "}
            <strong className="font-medium">
              {formatPrice(quote.minOrderCents)}
            </strong>
            . Es fehlen noch {formatPrice(quote.missingForMinimumCents)}. Leg
            noch eine Abfüllung dazu, dann geht es weiter.
          </p>
        )}

        {formError && (
          <p
            role="alert"
            className="mt-5 border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          fullWidth
          className="mt-6"
          disabled={submitting || loading || !quote.valid}
        >
          {submitting ? "Wird weitergeleitet …" : "Zahlungspflichtig bestellen"}
        </Button>

        <p className="mt-4 text-xs leading-relaxed text-subtle">
          Mit Klick auf „Zahlungspflichtig bestellen“ gibst du eine
          verbindliche Bestellung ab. Anschliessend wirst du zur gesicherten
          Bezahlseite weitergeleitet. Es fallen keine weiteren Kosten an.
        </p>

        <CurrencyNotice className="mt-3" />
      </aside>
    </form>
  );
}
