import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsPanel } from "@/components/cookie-settings-panel";
import { necessaryCookies, optionalServices } from "@/config/cookies";

export const metadata: Metadata = {
  title: "Cookie-Einstellungen",
  description:
    "Welche Cookies dieser Shop verwendet und wie du deine Auswahl änderst.",
  alternates: { canonical: "/cookie-einstellungen" },
};

export default function CookieSettingsPage() {
  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="eyebrow mb-3">Datenschutz</p>
          <h1 className="text-4xl md:text-5xl">Cookie-Einstellungen</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
            Hier siehst du genau, was dieser Shop auf deinem Gerät speichert –
            und kannst deine Auswahl jederzeit ändern.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="mb-3 text-2xl">Aktueller Stand</h2>

          {optionalServices.length === 0 ? (
            <div className="border border-gold/30 bg-gold/5 p-6">
              <p className="mb-2 text-sm font-medium text-gold-light">
                Wir setzen keine Tracking-Dienste ein
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Dieser Shop verwendet ausschliesslich technisch notwendige
                Cookies und Einträge im lokalen Speicher deines Browsers. Es
                gibt keine Analyse-, Werbe- oder Social-Media-Dienste, keine
                Profilbildung und kein Tracking über Websites hinweg.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Deshalb erscheint auch kein Einwilligungsbanner: Ein Banner ohne
                zustimmungspflichtige Dienste wäre überflüssig. Sollten wir
                künftig solche Dienste einsetzen, fragen wir vorher um deine
                Einwilligung – und laden sie erst danach.
              </p>
            </div>
          ) : (
            <CookieSettingsPanel />
          )}
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl">Technisch notwendig</h2>
          <p className="mb-5 text-sm leading-relaxed text-muted">
            Diese Einträge sind für den Betrieb erforderlich. Ohne sie
            funktionieren Warenkorb, Bezahlvorgang oder die interne Anmeldung
            nicht. Sie benötigen keine Einwilligung.
          </p>

          <ul className="flex flex-col gap-4">
            {necessaryCookies.map((cookie) => (
              <li key={cookie.name} className="border border-line bg-charcoal p-5">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-sm text-cream">{cookie.name}</p>
                  <span className="text-[11px] uppercase tracking-wide text-subtle">
                    {cookie.type}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted">
                  {cookie.purpose}
                </p>
                <p className="mt-2 text-xs text-subtle">
                  Speicherdauer: {cookie.duration}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="mb-3 text-xl">Cookies selbst löschen</h2>
          <p className="text-sm leading-relaxed text-muted">
            Du kannst gespeicherte Daten jederzeit in den Einstellungen deines
            Browsers löschen. Beachte, dass dabei auch dein Warenkorb geleert
            wird, da er lokal in deinem Browser gespeichert ist.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Ausführliche Informationen zur Datenverarbeitung findest du in
            unserer{" "}
            <Link
              href="/datenschutz"
              className="text-gold underline underline-offset-2 hover:text-gold-light"
            >
              Datenschutzerklärung
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
