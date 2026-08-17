import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung und Kontaktdaten.",
  alternates: { canonical: "/impressum" },
};

export default function ImprintPage() {
  return (
    <LegalPage
      title="Impressum"
      intro="Angaben zum Anbieter dieses Onlineshops."
    >
      <LegalSection title="Anbieter">
        <p>
          {siteConfig.legalName}
          <br />
          {siteConfig.contact.street}
          <br />
          {siteConfig.contact.postalCode} {siteConfig.contact.city}
          <br />
          {siteConfig.contact.country}
        </p>
      </LegalSection>

      <LegalSection title="Vertretungsberechtigte Personen">
        <p>{siteConfig.contact.representatives}</p>
        <p className="text-xs text-subtle">
          Hinweis: Bei zwei Geschäftspartnern sind beide vollständig mit Vor-
          und Nachnamen zu nennen. Die Rechtsform (z. B. Einzelunternehmen,
          einfache Gesellschaft, GmbH) muss ebenfalls angegeben werden.
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <LegalList
          items={[
            <>
              E-Mail:{" "}
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                {siteConfig.contact.email}
              </a>
            </>,
            <>Telefon: {siteConfig.contact.phone}</>,
            <>
              Instagram:{" "}
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                {siteConfig.social.instagramHandle}
              </a>
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Registereintrag und Steuernummern">
        <LegalList
          items={[
            <>Handelsregister / UID: {siteConfig.contact.registrationNumber}</>,
            <>Mehrwertsteuernummer: {siteConfig.contact.vatId}</>,
          ]}
        />
        <p className="text-xs text-subtle">
          Bei Befreiung von der Mehrwertsteuerpflicht ist stattdessen ein
          entsprechender Hinweis aufzunehmen. Die Umsatzsteuerangabe im Shop
          (siehe <code>SHOP_TAX_RATE_BP</code>) muss dazu passen.
        </p>
      </LegalSection>

      <LegalSection title="Verantwortlich für den Inhalt">
        <p>
          {siteConfig.contact.representatives}, Anschrift wie oben.
        </p>
      </LegalSection>

      <LegalSection title="Streitbeilegung">
        <p>
          Die Europäische Kommission stellt eine Plattform zur
          Online-Streitbeilegung bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
        <p>
          PLATZHALTER: Hier ist anzugeben, ob eine Bereitschaft oder
          Verpflichtung zur Teilnahme an einem Streitbeilegungsverfahren vor
          einer Verbraucherschlichtungsstelle besteht. Für Anbieter mit Sitz in
          der Schweiz gelten abweichende Vorgaben – bitte fachkundig prüfen
          lassen.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Inhalte und Links">
        <p>
          Die Inhalte dieser Seiten wurden mit Sorgfalt erstellt. Für die
          Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir
          keine Gewähr. Für Inhalte externer Links sind ausschliesslich deren
          Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine
          Rechtsverstösse erkennbar.
        </p>
      </LegalSection>

      <LegalSection title="Urheberrecht und Marken">
        <p>
          Texte, Bilder und Gestaltung dieses Shops sind urheberrechtlich
          geschützt. Eine Verwendung ausserhalb der gesetzlichen Grenzen bedarf
          unserer schriftlichen Zustimmung.
        </p>
        <p>
          Als „Duftalternative“ oder „inspiriert von einer Duftrichtung“
          gekennzeichnete Produkte sind eigenständige Erzeugnisse. Sie stehen in
          keiner Verbindung zu den Herstellern anderer Düfte; es besteht weder
          eine Lizenz noch eine Zusammenarbeit. Gegebenenfalls genannte Marken
          sind Eigentum ihrer jeweiligen Inhaber und dienen ausschliesslich der
          beschreibenden Einordnung einer Duftrichtung.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
