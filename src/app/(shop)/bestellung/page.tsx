import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Bestellung verfolgen",
  description:
    "Status deiner Bestellung abrufen – über den persönlichen Link aus deiner Bestellbestätigung.",
  robots: { index: false, follow: true },
};

export default function OrderLookupPage() {
  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-3">Service</p>
        <h1 className="text-4xl md:text-5xl">Bestellung verfolgen</h1>

        <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed text-muted">
          <p>
            Den aktuellen Status deiner Bestellung rufst du über den
            persönlichen Link aus deiner Bestellbestätigung ab. Der Link steht
            in der E-Mail, die du direkt nach dem Kauf erhalten hast, und führt
            dich zu allen Angaben: Artikel, Beträge, Adressen, Zahlungsstatus
            und – sobald versendet – zur Sendungsnummer.
          </p>

          <div className="border border-line bg-charcoal p-6">
            <h2 className="mb-3 text-lg">E-Mail nicht gefunden?</h2>
            <ul className="flex flex-col gap-2">
              <li className="flex gap-2.5">
                <span className="mt-2 size-1 shrink-0 bg-gold" aria-hidden="true" />
                Prüfe bitte auch deinen Spam- oder Werbung-Ordner.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 size-1 shrink-0 bg-gold" aria-hidden="true" />
                Die Bestätigung wird erst nach bestätigter Zahlung versendet.
                Bei Sofortzahlungen dauert das nur wenige Sekunden.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 size-1 shrink-0 bg-gold" aria-hidden="true" />
                Schreib uns mit deinem Namen und dem ungefähren Bestelldatum –
                wir finden deine Bestellung und senden dir den Link erneut.
              </li>
            </ul>

            <a
              href={`mailto:${siteConfig.contact.email}?subject=Frage%20zu%20meiner%20Bestellung`}
              className="mt-6 inline-flex min-h-11 items-center border border-line-strong px-5 text-sm text-cream transition-colors hover:border-gold hover:text-gold-light"
            >
              {siteConfig.contact.email}
            </a>
          </div>

          <p className="text-xs text-subtle">
            Aus Datenschutzgründen geben wir Bestelldaten ausschliesslich an die
            Person heraus, die die Bestellung aufgegeben hat. Bitte habe
            Verständnis, wenn wir zur Sicherheit nachfragen.
          </p>
        </div>
      </div>
    </div>
  );
}
