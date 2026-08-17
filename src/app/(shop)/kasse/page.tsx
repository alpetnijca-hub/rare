import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Kasse",
  description: "Bestellung abschliessen – sicher bezahlen mit Stripe.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ abgebrochen?: string }>;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { abgebrochen } = await searchParams;

  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mb-10">
        <p className="eyebrow mb-3">Schritt 2 von 2</p>
        <h1 className="text-4xl md:text-5xl">Kasse</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Bestellung als Gast – ohne Kundenkonto. Alle Felder mit einem
          <span className="mx-1 text-gold">*</span> sind Pflichtfelder.
        </p>
      </div>

      {abgebrochen === "1" && (
        <div
          role="status"
          className="mb-8 border border-amber-800/60 bg-amber-950/30 px-5 py-4"
        >
          <p className="text-sm font-medium text-amber-200">
            Bezahlvorgang abgebrochen
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-100/85">
            Es wurde nichts abgebucht und deine Bestellung ist nicht
            verbindlich. Dein Warenkorb ist unverändert – du kannst den Kauf
            jederzeit erneut abschliessen. Bei Fragen erreichst du uns über die{" "}
            <Link href="/kontakt" className="underline underline-offset-2">
              Kontaktseite
            </Link>
            .
          </p>
        </div>
      )}

      <CheckoutForm />
    </div>
  );
}
