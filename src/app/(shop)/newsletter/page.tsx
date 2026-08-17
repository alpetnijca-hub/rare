import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { NewsletterForm } from "@/components/newsletter-form";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Neue Düfte, Abfüllungen und Wiederverfügbarkeiten per E-Mail.",
  alternates: { canonical: "/newsletter" },
};

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  if (status === "bestaetigt") {
    return (
      <div className="container-shop py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Anmeldung bestätigt</p>
          <h1 className="text-4xl md:text-5xl">Willkommen bei Rare Scents</h1>
          <p className="mt-5 text-sm leading-relaxed text-muted md:text-base">
            Deine Anmeldung ist bestätigt. Du erhältst ab sofort gelegentlich
            Nachrichten zu neuen Düften, Abfüllungen und Wiederverfügbarkeiten.
            Abmelden kannst du dich jederzeit über den Link in jeder E-Mail.
          </p>
          <ButtonLink href="/shop" size="lg" className="mt-8">
            Düfte entdecken
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (status === "ungueltig") {
    return (
      <div className="container-shop py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow mb-4">Bestätigung fehlgeschlagen</p>
          <h1 className="text-4xl md:text-5xl">Der Link ist nicht mehr gültig</h1>
          <p className="mt-5 text-sm leading-relaxed text-muted md:text-base">
            Bestätigungslinks lassen sich nur einmal verwenden. Möglicherweise
            hast du deine Anmeldung bereits bestätigt. Falls nicht, melde dich
            hier einfach erneut an.
          </p>

          <div className="mx-auto mt-10 max-w-md text-left">
            <NewsletterForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mx-auto max-w-xl">
        <header className="mb-8">
          <p className="eyebrow mb-3">Newsletter</p>
          <h1 className="text-4xl md:text-5xl">Neue Düfte zuerst entdecken</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
            Wir schreiben selten – dafür mit Inhalt: neue Abfüllungen,
            limitierte Sets und Nachricht, wenn ein ausverkaufter Duft wieder
            verfügbar ist. Keine Rabattflut, kein Weiterverkauf deiner Adresse.
          </p>
        </header>

        <NewsletterForm />

        <div className="mt-10 border-t border-line pt-6">
          <h2 className="mb-3 text-lg">So läuft die Anmeldung</h2>
          <ol className="flex flex-col gap-2 text-sm leading-relaxed text-muted">
            <li className="flex gap-3">
              <span className="text-gold">1.</span>
              Du trägst deine E-Mail-Adresse ein und stimmst der Verarbeitung zu.
            </li>
            <li className="flex gap-3">
              <span className="text-gold">2.</span>
              Wir senden dir eine E-Mail mit einem Bestätigungslink.
            </li>
            <li className="flex gap-3">
              <span className="text-gold">3.</span>
              Erst nach deinem Klick auf diesen Link bist du angemeldet
              (Double-Opt-in).
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
