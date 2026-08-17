import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/config/site";
import { necessaryCookies, optionalServices } from "@/config/cookies";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten in diesem Onlineshop.",
  alternates: { canonical: "/datenschutz" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Datenschutzerklärung"
      intro="Wie wir mit deinen Daten umgehen – welche wir erheben, wofür wir sie verwenden und welche Rechte du hast."
      lastUpdated="PLATZHALTER – Datum eintragen"
    >
      <LegalSection title="1. Verantwortliche Stelle">
        <p>
          {siteConfig.legalName}
          <br />
          {siteConfig.contact.street}, {siteConfig.contact.postalCode}{" "}
          {siteConfig.contact.city}, {siteConfig.contact.country}
          <br />
          E-Mail:{" "}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            {siteConfig.contact.email}
          </a>
        </p>
        <p className="text-xs text-subtle">
          PLATZHALTER: Falls eine Datenschutzbeauftragte oder ein
          Datenschutzbeauftragter bestellt wurde oder eine Vertretung in der EU
          erforderlich ist, sind diese Angaben hier zu ergänzen.
        </p>
      </LegalSection>

      <LegalSection title="2. Grundsatz">
        <p>
          Wir verarbeiten personenbezogene Daten nur, soweit dies zur
          Bereitstellung des Shops und zur Abwicklung von Bestellungen
          erforderlich ist oder du eingewilligt hast. Wir verkaufen keine Daten
          an Dritte.
        </p>
      </LegalSection>

      <LegalSection title="3. Aufruf der Website (Server-Logs)">
        <p>
          Beim Aufruf unserer Seiten verarbeitet unser Hosting-Anbieter
          technische Zugriffsdaten, die dein Browser übermittelt: aufgerufene
          Adresse, Zeitpunkt, übertragene Datenmenge, Browsertyp und
          Betriebssystem. Diese Daten sind erforderlich, um die Website
          auszuliefern und ihre Stabilität und Sicherheit zu gewährleisten.
        </p>
        <p>
          In unseren Anwendungsprotokollen speichern wir IP-Adressen nicht im
          Klartext. Wo eine Zuordnung zum Schutz vor Missbrauch nötig ist –
          etwa beim Kontaktformular oder bei der Newsletter-Anmeldung –
          verwenden wir ausschliesslich einen nicht umkehrbaren Hashwert.
        </p>
        <p>
          Rechtsgrundlage: berechtigtes Interesse am sicheren Betrieb (Art. 6
          Abs. 1 lit. f DSGVO bzw. entsprechende Bestimmungen des Schweizer
          DSG).
        </p>
      </LegalSection>

      <LegalSection title="4. Bestellungen">
        <p>
          Für die Abwicklung einer Bestellung verarbeiten wir: Vor- und
          Nachname, E-Mail-Adresse, Liefer- und Rechnungsadresse, optional die
          Telefonnummer, die bestellten Artikel, Beträge sowie den
          Zahlungsstatus.
        </p>
        <p>
          Rechtsgrundlage ist die Erfüllung des Kaufvertrags (Art. 6 Abs. 1
          lit. b DSGVO). Handels- und steuerrechtliche Aufbewahrungsfristen
          bleiben unberührt: Bestell- und Rechnungsdaten bewahren wir
          entsprechend der gesetzlichen Fristen auf (PLATZHALTER: geltende
          Aufbewahrungsfrist eintragen, in der Schweiz in der Regel 10 Jahre).
        </p>
      </LegalSection>

      <LegalSection title="5. Zahlungsabwicklung (Stripe)">
        <p>
          Zahlungen wickeln wir über Stripe ab. Bei einer Zahlung wirst du auf
          eine gesicherte Seite von Stripe weitergeleitet. Deine Zahlungsdaten
          – insbesondere vollständige Kartennummern – werden ausschliesslich von
          Stripe verarbeitet und erreichen unsere Server zu keinem Zeitpunkt.
        </p>
        <p>
          Wir erhalten von Stripe lediglich Referenzdaten zur Zuordnung der
          Zahlung sowie nicht sensible Anzeigedaten wie Kartenmarke und die
          letzten vier Ziffern.
        </p>
        <p>
          Anbieter: Stripe Payments Europe, Ltd., Irland. Weitere Informationen:{" "}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            stripe.com/privacy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Versand">
        <p>
          Zur Zustellung geben wir Name und Lieferadresse an den beauftragten
          Versanddienstleister weiter. Diese Übermittlung ist zur
          Vertragserfüllung erforderlich.
        </p>
        <p className="text-xs text-subtle">
          PLATZHALTER: Den tatsächlich eingesetzten Versanddienstleister
          namentlich benennen und auf dessen Datenschutzhinweise verlinken.
        </p>
      </LegalSection>

      <LegalSection title="7. E-Mail-Versand (Resend)">
        <p>
          Bestellbestätigungen, Versandbenachrichtigungen und ähnliche
          Nachrichten versenden wir über den Dienstleister Resend. Dafür werden
          deine E-Mail-Adresse und der Inhalt der jeweiligen Nachricht
          verarbeitet.
        </p>
      </LegalSection>

      <LegalSection title="8. Newsletter">
        <p>
          Der Newsletter wird ausschliesslich nach ausdrücklicher Einwilligung
          und Bestätigung über einen Link in einer separaten E-Mail versendet
          (Double-Opt-in). Wir speichern deine E-Mail-Adresse, den Zeitpunkt und
          den Wortlaut der Einwilligung sowie einen Hashwert der IP-Adresse, um
          die Einwilligung nachweisen zu können.
        </p>
        <p>
          Du kannst deine Einwilligung jederzeit widerrufen – über den
          Abmeldelink in jeder Nachricht oder per E-Mail an uns. Rechtsgrundlage:
          Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
        </p>
      </LegalSection>

      <LegalSection title="9. Verfügbarkeits-Benachrichtigungen">
        <p>
          Wenn du dich für eine Benachrichtigung bei Wiederverfügbarkeit
          einträgst, speichern wir deine E-Mail-Adresse ausschliesslich zu
          diesem Zweck. Nach dem einmaligen Versand kannst du den Eintrag über
          den Link in der Nachricht löschen lassen.
        </p>
      </LegalSection>

      <LegalSection title="10. Kontaktformular">
        <p>
          Deine Angaben aus dem Kontaktformular verarbeiten wir zur Bearbeitung
          der Anfrage. Zum Schutz vor automatisierten Eintragungen verwenden wir
          ein verstecktes Feld sowie eine Begrenzung der Anfragen je Absender;
          dabei wird ein Hashwert der IP-Adresse gespeichert.
        </p>
      </LegalSection>

      <LegalSection title="11. Cookies und lokale Speicherung">
        <p>
          Technisch notwendige Cookies und Einträge im lokalen Speicher deines
          Browsers setzen wir ein, damit Warenkorb, Bezahlvorgang und Anmeldung
          funktionieren. Sie sind ohne Einwilligung zulässig.
        </p>

        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[32rem] border-collapse text-sm">
            <caption className="sr-only">
              Technisch notwendige Cookies und Speichereinträge
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                <th scope="col" className="pb-2 pr-4 font-medium">Name</th>
                <th scope="col" className="pb-2 pr-4 font-medium">Art</th>
                <th scope="col" className="pb-2 pr-4 font-medium">Zweck</th>
                <th scope="col" className="pb-2 font-medium">Dauer</th>
              </tr>
            </thead>
            <tbody>
              {necessaryCookies.map((cookie) => (
                <tr key={cookie.name} className="border-b border-line/60">
                  <td className="py-2 pr-4 font-mono text-xs text-cream">
                    {cookie.name}
                  </td>
                  <td className="py-2 pr-4 text-xs text-subtle">{cookie.type}</td>
                  <td className="py-2 pr-4 text-xs">{cookie.purpose}</td>
                  <td className="py-2 text-xs text-subtle">{cookie.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4">
          {optionalServices.length === 0 ? (
            <>
              Analyse- oder Marketingdienste setzen wir derzeit{" "}
              <strong className="font-medium text-cream">nicht</strong> ein. Es
              wird deshalb auch kein Einwilligungsbanner angezeigt. Sollten wir
              künftig solche Dienste einsetzen, werden sie erst nach deiner
              ausdrücklichen Einwilligung geladen und an dieser Stelle
              aufgeführt.
            </>
          ) : (
            <>
              Zusätzlich setzen wir nach deiner Einwilligung folgende Dienste
              ein:{" "}
              {optionalServices.map((service) => service.name).join(", ")}. Deine
              Auswahl kannst du jederzeit unter{" "}
              <Link
                href="/cookie-einstellungen"
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                Cookie-Einstellungen
              </Link>{" "}
              ändern.
            </>
          )}
        </p>
      </LegalSection>

      <LegalSection title="12. Deine Rechte">
        <LegalList
          items={[
            "Auskunft über die zu deiner Person gespeicherten Daten",
            "Berichtigung unrichtiger Daten",
            "Löschung, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen",
            "Einschränkung der Verarbeitung",
            "Datenübertragbarkeit in einem gängigen Format",
            "Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen",
            "Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft",
            "Beschwerde bei der zuständigen Aufsichtsbehörde",
          ]}
        />
        <p>
          Für alle Anliegen genügt eine formlose Nachricht an{" "}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            {siteConfig.contact.email}
          </a>
          .
        </p>
        <p className="text-xs text-subtle">
          PLATZHALTER: Zuständige Aufsichtsbehörde benennen – in der Schweiz der
          EDÖB, in Deutschland die Landesdatenschutzbehörde des Sitzes.
        </p>
      </LegalSection>

      <LegalSection title="13. Datensicherheit">
        <p>
          Die Übertragung erfolgt verschlüsselt über HTTPS. Zugangsdaten des
          internen Bereichs speichern wir ausschliesslich als kryptografischen
          Hash. Der Zugriff auf Bestelldaten ist auf berechtigte Personen
          beschränkt.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
