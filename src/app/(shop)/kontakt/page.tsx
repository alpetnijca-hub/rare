import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import {
  addressOnRequestNote,
  hasPublicAddress,
  postalAddressLines,
  siteConfig,
} from "@/config/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Fragen zu einem Duft oder deiner Bestellung? Schreib uns – wir antworten persönlich.",
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return (
    <div className="container-shop py-12 md:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 max-w-2xl">
          <p className="eyebrow mb-3">Kontakt</p>
          <h1 className="text-4xl md:text-5xl">Schreib uns</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
            Hinter {siteConfig.name} stehen zwei Menschen – keine Hotline und
            kein Chatbot. Ob Frage zu einem Duft, zur passenden Größe oder zu
            einer laufenden Bestellung: Wir antworten persönlich und{" "}
            {siteConfig.supportResponseTime}.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <ContactForm />

          <aside className="flex flex-col gap-8">
            <div>
              <h2 className="eyebrow mb-3">Direkt erreichen</h2>
              <p className="text-sm leading-relaxed text-muted">
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="text-gold underline underline-offset-2 hover:text-gold-light"
                >
                  {siteConfig.contact.email}
                </a>
                {siteConfig.contact.phone && (
                  <>
                    <br />
                    {siteConfig.contact.phone}
                  </>
                )}
              </p>
              <p className="mt-3 text-sm text-subtle">
                Erreichbar {siteConfig.supportHours}
              </p>
            </div>

            <div>
              <h2 className="eyebrow mb-3">Instagram</h2>
              <p className="mb-3 text-sm leading-relaxed text-muted">
                Für kurze Fragen oft am schnellsten – dort zeigen wir auch
                Neuzugänge und Abfüllungen in Arbeit.
              </p>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2.5 border border-line-strong px-5 text-sm text-cream transition-colors hover:border-gold hover:text-gold-light"
              >
                {siteConfig.social.instagramHandle}
                <span className="sr-only">(öffnet in neuem Tab)</span>
              </a>
            </div>

            <div>
              <h2 className="eyebrow mb-3">Anschrift</h2>
              <address className="text-sm not-italic leading-relaxed text-muted">
                {siteConfig.legalName}
                {postalAddressLines.map((line) => (
                  <Fragment key={line}>
                    <br />
                    {line}
                  </Fragment>
                ))}
              </address>
              <p className="mt-3 text-xs leading-relaxed text-subtle">
                {hasPublicAddress
                  ? "Kein Ladengeschäft – bitte schreib uns, bevor du etwas versendest."
                  : addressOnRequestNote}
              </p>
            </div>

            <div className="border border-line bg-charcoal p-5">
              <h2 className="eyebrow mb-3">Häufige Fragen</h2>
              <p className="mb-4 text-sm leading-relaxed text-muted">
                Vieles ist schon beantwortet: Lieferzeiten, Haltbarkeit von
                Abfüllungen, Mindestbestellwert und mehr.
              </p>
              <Link
                href="/faq"
                className="text-sm text-gold underline underline-offset-4 hover:text-gold-light"
              >
                Zu den häufigen Fragen →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
