import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { ProviderAddress } from "@/components/legal/provider-address";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung und Kontaktdaten.",
  alternates: { canonical: "/impressum" },
};

export default function ImprintPage() {
  const { contact } = siteConfig;

  return (
    <LegalPage
      title="Impressum"
      intro="Angaben zum Anbieter dieses Onlineshops nach Art. 3 Abs. 1 lit. s UWG."
      notice="review"
    >
      <LegalSection title="Anbieter">
        <ProviderAddress />
        <p className="text-xs text-subtle">
          Rechtsform: {siteConfig.legalForm} mit Sitz in der Schweiz.
        </p>
      </LegalSection>

      <LegalSection title="Verantwortliche Person">
        {contact.representatives ? (
          <>
            <p>{contact.representatives}</p>
            <p className="text-xs text-subtle">
              Inhaber und für den Inhalt dieser Website verantwortlich,
              Anschrift wie oben.
            </p>
          </>
        ) : (
          <p>
            Für den Inhalt dieser Website verantwortlich ist die Inhaberin bzw.
            der Inhaber von {siteConfig.name}. Name und Postanschrift nennen wir
            auf Anfrage – schreib uns dazu an{" "}
            <a
              href={`mailto:${contact.email}`}
              className="text-gold underline underline-offset-2 hover:text-gold-light"
            >
              {contact.email}
            </a>
            .
          </p>
        )}
      </LegalSection>

      <LegalSection title="Kontakt">
        <LegalList
          items={[
            <>
              E-Mail:{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                {contact.email}
              </a>
            </>,
            ...(contact.phone ? [<>Telefon: {contact.phone}</>] : []),
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
        <p className="text-xs text-subtle">
          Anfragen beantworten wir {siteConfig.supportResponseTime}. Die
          schnellste Antwort erhältst du per E-Mail.
        </p>
      </LegalSection>

      <LegalSection title="Handelsregister und Mehrwertsteuer">
        {contact.registrationNumber ? (
          <p>Handelsregister / UID: {contact.registrationNumber}</p>
        ) : (
          <p>
            Nicht im Handelsregister eingetragen. Ein Eintrag ist für
            Einzelunternehmen erst ab einem Jahresumsatz von CHF 100&#39;000
            vorgeschrieben.
          </p>
        )}

        {contact.vatId ? (
          <p>Mehrwertsteuernummer: {contact.vatId}</p>
        ) : (
          <p>
            Nicht mehrwertsteuerpflichtig. Es wird keine Mehrwertsteuer
            ausgewiesen und keine Mehrwertsteuer in Rechnung gestellt
            (Art. 10 Abs. 2 lit. a MWSTG).
          </p>
        )}

        <p className="text-xs text-subtle">
          Sobald eine UID vergeben oder die Mehrwertsteuerpflicht eintritt,
          müssen diese Angaben und die Preisauszeichnung im Shop angepasst
          werden. Technisch genügt dafür ein Eintrag in{" "}
          <code>src/config/site.ts</code> beziehungsweise die
          Umgebungsvariable <code>SHOP_TAX_RATE_BP</code>.
        </p>
      </LegalSection>

      <LegalSection title="Streitbeilegung">
        <p>
          Wir sind nicht verpflichtet und nicht bereit, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen. Melde dich bei Unstimmigkeiten bitte zuerst direkt bei
          uns – wir finden fast immer eine unkomplizierte Lösung.
        </p>
        <p className="text-xs text-subtle">
          Wir liefern ausschliesslich in die Schweiz. Die frühere Plattform der
          Europäischen Kommission zur Online-Streitbeilegung ist hier ohnehin
          nicht einschlägig und wurde zudem im Juli 2025 eingestellt.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Inhalte und Links">
        <p>
          Die Inhalte dieser Seiten wurden mit Sorgfalt erstellt. Für die
          Richtigkeit, Vollständigkeit und Aktualität übernehmen wir keine
          Gewähr. Für Inhalte externer Links sind ausschliesslich deren
          Betreiber verantwortlich; zum Zeitpunkt der Verlinkung waren keine
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
          gekennzeichnete Produkte sind eigenständige Erzeugnisse und keine
          Originalware. Sie stehen in keiner Verbindung zu den Herstellern
          anderer Düfte; es besteht weder eine Lizenz noch eine
          Zusammenarbeit. Gegebenenfalls genannte Marken sind Eigentum ihrer
          jeweiligen Inhaber und dienen ausschliesslich der beschreibenden
          Einordnung einer Duftrichtung.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
