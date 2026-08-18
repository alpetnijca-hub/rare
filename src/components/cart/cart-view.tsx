"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useCartQuote } from "@/components/cart/use-cart-quote";
import { Button, ButtonLink } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { useCurrency } from "@/components/currency/currency-provider";
import { CurrencyNotice } from "@/components/currency/currency-switcher";
import { formatTaxRate } from "@/lib/money";
import { formatDeliveryRange } from "@/lib/availability";
import { cn } from "@/lib/utils";

/** Zeile im Warenkorb mit Mengensteuerung. */
function CartLine({
  line,
  onQuantityChange,
  onRemove,
}: {
  line: NonNullable<ReturnType<typeof useCartQuote>["quote"]>["lines"][number];
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { format: formatPrice } = useCurrency();

  return (
    <li className="flex gap-4 border-b border-line py-6 first:pt-0">
      <Link
        href={`/produkt/${line.productSlug}`}
        className="relative size-24 shrink-0 overflow-hidden border border-line bg-ink sm:size-28"
      >
        {line.imageUrl ? (
          <Image
            src={line.imageUrl}
            alt={line.imageAlt ?? line.productName}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[10px] uppercase tracking-wider text-subtle">
            Kein Bild
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h3 className="text-base leading-snug">
              <Link
                href={`/produkt/${line.productSlug}`}
                className="transition-colors hover:text-gold-light"
              >
                {line.productName}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted">
              Größe: {line.size}
              <span className="mx-2 text-subtle" aria-hidden="true">
                ·
              </span>
              {formatPrice(line.unitPriceCents)} je Stück
            </p>
          </div>

          <p className="whitespace-nowrap font-display text-lg text-cream">
            {formatPrice(line.lineTotalCents)}
          </p>
        </div>

        <p
          className={cn(
            "text-xs",
            line.isPreorder ? "text-sky-400" : "text-subtle",
          )}
        >
          {line.isPreorder ? "Vorbestellung · " : ""}
          Lieferzeit {formatDeliveryRange(line.deliveryMinDays, line.deliveryMaxDays)}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-4">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => onQuantityChange(line.quantity - 1)}
              className="flex size-10 items-center justify-center text-cream transition-colors hover:text-gold"
            >
              <span className="sr-only">
                Menge von {line.productName} verringern
              </span>
              <span aria-hidden="true">−</span>
            </button>

            <label className="sr-only" htmlFor={`menge-${line.variantId}`}>
              Menge von {line.productName}, Größe {line.size}
            </label>
            <input
              id={`menge-${line.variantId}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={line.maxQuantity}
              value={line.quantity}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                if (Number.isFinite(parsed)) onQuantityChange(parsed);
              }}
              className="h-10 w-12 border-x border-line bg-transparent text-center text-sm tabular-nums
                focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold"
            />

            <button
              type="button"
              onClick={() => onQuantityChange(line.quantity + 1)}
              disabled={line.quantity >= line.maxQuantity}
              className="flex size-10 items-center justify-center text-cream transition-colors hover:text-gold disabled:opacity-30"
            >
              <span className="sr-only">Menge von {line.productName} erhöhen</span>
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-subtle underline underline-offset-4 transition-colors hover:text-red-400"
          >
            Entfernen
            <span className="sr-only"> – {line.productName}, Größe {line.size}</span>
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartView() {
  const { items, ready, setQuantity, removeItem } = useCart();
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");

  const { quote, loading, error } = useCartQuote({ discountCode: appliedCode });
  const { format: formatPrice } = useCurrency();

  // Erstes Rendern vor dem Lesen des localStorage.
  if (!ready) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex gap-4">
              <div className="skeleton size-28 shrink-0" />
              <div className="flex flex-1 flex-col gap-3">
                <div className="skeleton h-5 w-2/3" />
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-10 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="skeleton h-72" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center border border-line bg-charcoal px-6 py-20 text-center">
        <svg
          width="44"
          height="46"
          viewBox="0 0 18 19"
          fill="none"
          aria-hidden="true"
          className="mb-6 text-line-strong"
        >
          <path
            d="M1 5.5h16l-1.2 12H2.2L1 5.5Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M6 7V4.5a3 3 0 1 1 6 0V7"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        <h2 className="text-2xl">Dein Warenkorb ist leer</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          Stöbere in unserem Sortiment – mit Abfüllungen ab 2 ml kannst du
          günstig testen, bevor du dich für einen ganzen Flakon entscheidest.
        </p>

        <ButtonLink href="/shop" size="lg" className="mt-8">
          Düfte entdecken
        </ButtonLink>
      </div>
    );
  }

  const mixedDelivery = quote?.deliveryMixed ?? false;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
      {/* Positionen */}
      <div>
        {error && (
          <p
            role="alert"
            className="mb-6 border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        {quote && quote.notices.length > 0 && (
          <div
            role="status"
            className="mb-6 border border-amber-800/60 bg-amber-950/30 px-4 py-3"
          >
            <p className="mb-1 text-sm font-medium text-amber-200">
              Der Warenkorb wurde angepasst
            </p>
            <ul className="flex flex-col gap-1 text-sm text-amber-100/85">
              {quote.notices.map((notice) => (
                <li key={notice}>{notice}</li>
              ))}
            </ul>
          </div>
        )}

        <ul className={cn("flex flex-col", loading && "opacity-60")}>
          {quote?.lines.map((line) => (
            <CartLine
              key={line.variantId}
              line={line}
              onQuantityChange={(quantity) =>
                setQuantity(line.variantId, quantity)
              }
              onRemove={() => removeItem(line.variantId)}
            />
          ))}
        </ul>

        {mixedDelivery && (
          <p className="mt-6 border border-line bg-charcoal px-4 py-3 text-sm leading-relaxed text-muted">
            <span className="text-cream">Hinweis zu unterschiedlichen Lieferzeiten:</span>{" "}
            Dein Warenkorb enthält Artikel mit verschiedenen Lieferzeiten. Wir
            versenden deine Bestellung vollständig in einem Paket, sobald alle
            Positionen bereitstehen. Möchtest du früher beliefert werden,
            bestelle die Artikel bitte getrennt.
          </p>
        )}

        <div className="mt-8">
          <Link
            href="/shop"
            className="text-sm text-gold transition-colors hover:text-gold-light"
          >
            ← Weiter einkaufen
          </Link>
        </div>
      </div>

      {/* Zusammenfassung */}
      <aside
        aria-label="Zusammenfassung"
        className="h-fit border border-line bg-charcoal p-6 lg:sticky lg:top-28"
      >
        <h2 className="mb-5 text-xl">Zusammenfassung</h2>

        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Zwischensumme</dt>
            <dd className="tabular-nums text-cream">
              {quote ? formatPrice(quote.subtotalCents) : "—"}
            </dd>
          </div>

          {quote && quote.discountCents > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">
                Rabatt {quote.discountLabel && `(${quote.discountLabel})`}
              </dt>
              <dd className="tabular-nums text-gold-light">
                −{formatPrice(quote.discountCents)}
              </dd>
            </div>
          )}

          <div className="flex justify-between gap-4">
            <dt className="text-muted">Versand</dt>
            <dd className="tabular-nums text-cream">
              {quote
                ? quote.shippingCents === 0
                  ? "Kostenlos"
                  : formatPrice(quote.shippingCents)
                : "—"}
            </dd>
          </div>

          <div className="mt-2 flex justify-between gap-4 border-t border-line pt-4">
            <dt className="text-base text-cream">Gesamtsumme</dt>
            <dd className="font-display text-2xl tabular-nums text-gold-light">
              {quote ? formatPrice(quote.totalCents) : "—"}
            </dd>
          </div>

          {quote && quote.taxCents > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-xs text-subtle">
                davon MwSt. ({formatTaxRate(quote.taxRateBp)})
              </dt>
              <dd className="text-xs tabular-nums text-subtle">
                {formatPrice(quote.taxCents)}
              </dd>
            </div>
          )}
        </dl>

        <CurrencyNotice className="mt-4" />

        {/* Gutscheincode */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedCode(discountInput.trim().toUpperCase());
          }}
          className="mt-6 border-t border-line pt-6"
        >
          <label
            htmlFor="rabattcode"
            className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-muted"
          >
            Rabattcode
          </label>
          <div className="flex gap-2">
            <TextInput
              id="rabattcode"
              name="rabattcode"
              value={discountInput}
              onChange={(event) => setDiscountInput(event.target.value)}
              placeholder="Code eingeben"
              autoComplete="off"
              className="uppercase"
            />
            <Button type="submit" variant="secondary" size="md">
              Einlösen
            </Button>
          </div>

          {quote?.discountValid && (
            <p className="mt-2 text-xs text-emerald-400">
              Code {quote.discountLabel} wurde angewendet.
            </p>
          )}
          {appliedCode && quote && !quote.discountValid && quote.discountMessage && (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {quote.discountMessage}
            </p>
          )}
        </form>

        {/* Lieferzeit */}
        {quote && (
          <p className="mt-6 border-t border-line pt-6 text-sm text-muted">
            Voraussichtliche Lieferung in{" "}
            <span className="text-cream">
              {formatDeliveryRange(quote.deliveryMinDays, quote.deliveryMaxDays)}
            </span>{" "}
            nach Zahlungseingang.
          </p>
        )}

        <ButtonLink
          href="/kasse"
          size="lg"
          fullWidth
          className={cn("mt-6", (!quote?.valid || loading) && "pointer-events-none opacity-50")}
          aria-disabled={!quote?.valid || loading}
        >
          Zur Kasse
        </ButtonLink>

        <p className="mt-4 text-center text-xs leading-relaxed text-subtle">
          Alle Preise sind Endpreise in Schweizer Franken. Es entstehen keine
          weiteren Kosten – Versandkosten sind oben ausgewiesen.
        </p>
      </aside>
    </div>
  );
}
