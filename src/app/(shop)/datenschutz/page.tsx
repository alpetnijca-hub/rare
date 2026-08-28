import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { ProviderAddress } from "@/components/legal/provider-address";
import { siteConfig } from "@/config/site";
import { necessaryCookies, optionalServices } from "@/config/cookies";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten in diesem Onlineshop.",
  alternates: { canonical: "/datenschutz" },
};

export default function PrivacyPage() {
  const { contact } = siteConfig;

  const mail = (
    <a
      href={`mailto:${contact.email}`}
      className="text-gold underline underline-offset-2 hover:text-gold-light"
    >
      {contact.email}
    </a>
  );

  return (
    <LegalPage
      title="Datenschutzerklärung"
      intro="Wie wir mit deinen Daten umgehen: welche wir erheben, wofür wir sie verwenden, an wen wir sie weitergeben und welche Rechte du hast."
      lastUpdated="18. August 2026"
      notice="review"
    >
      <LegalSection title="1. Verantwortliche Stelle">
        <p>
          Verantwortlich für die Bearbeitung personenbezogener Daten auf dieser
          Website ist:
        </p>
        <ProviderAddress />
        <p>
          Für alle Fragen zum Datenschutz genügt eine formlose Nachricht an
          diese Adresse. Wir haben keine Datenschutzbeauftragte und keinen
          Datenschutzbeauftragten bestellt; dazu sind wir als kleines
          Einzelunternehmen nicht verpflichtet.
        </p>
      </LegalSection>

      <LegalSection title="2. Geltende Gesetze und Grundsatz">
        <p>
          Wir bearbeiten Personendaten nach dem revidierten Schweizer
          Datenschutzgesetz (revDSG). Wir liefern ausschliesslich in die
          Schweiz und richten unser Angebot nicht an Personen in der EU; die
          DSGVO ist deshalb in der Regel nicht anwendbar. Einzelne unserer
          Dienstleister unterliegen ihr jedoch, weshalb wir sie an den
          betreffenden Stellen mit nennen.
        </p>
        <p>
          Wir bearbeiten nur Daten, die wir wirklich brauchen: für die
          Bereitstellung des Shops, für die Abwicklung deiner Bestellung, zur
          Erfüllung gesetzlicher Pflichten oder weil du eingewilligt hast.{" "}
          <strong className="font-medium text-cream">
            Wir verkaufen keine Daten und geben sie nicht für Werbezwecke
            Dritter weiter.
          </strong>
        </p>
      </LegalSection>

      <LegalSection title="3. Aufruf der Website (Server-Protokolle)">
        <p>
          Beim Aufruf unserer Seiten verarbeitet unser Hosting-Anbieter
          technische Zugriffsdaten, die dein Browser übermittelt: aufgerufene
          Adresse, Zeitpunkt, übertragene Datenmenge, Browsertyp,
          Betriebssystem und IP-Adresse. Diese Daten sind erforderlich, um die
          Website auszuliefern und ihre Stabilität und Sicherheit zu
          gewährleisten.
        </p>
        <p>
          In unseren eigenen Anwendungsprotokollen speichern wir IP-Adressen
          nicht im Klartext. Wo eine Zuordnung zum Schutz vor Missbrauch nötig
          ist – etwa beim Kontaktformular oder bei der Newsletter-Anmeldung –
          verwenden wir ausschliesslich einen nicht umkehrbaren Hashwert.
        </p>
        <p>
          Grundlage: berechtigtes Interesse am sicheren und stabilen Betrieb
          (Art. 31 Abs. 1 revDSG, Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </LegalSection>

      <LegalSection title="4. Bestellungen">
        <p>
          Für die Abwicklung einer Bestellung bearbeiten wir: Vor- und
          Nachname, E-Mail-Adresse, Liefer- und Rechnungsadresse, optional die
          Telefonnummer, die bestellten Artikel, Beträge, Bestell- und
          Zahlungsstatus sowie den Zeitpunkt der Bestellung.
        </p>
        <p>
          Grundlage ist die Erfüllung des Kaufvertrags (Art. 31 Abs. 2 lit. a
          revDSG, Art. 6 Abs. 1 lit. b DSGVO).
        </p>
        <p>
          Bestell- und Rechnungsdaten bewahren wir zur Erfüllung der
          gesetzlichen Aufbewahrungspflicht nach Art. 958f OR{" "}
          <strong className="font-medium text-cream">zehn Jahre</strong> auf.
          Ein Löschverlangen wirkt erst nach Ablauf dieser Frist; bis dahin
          sperren wir die Daten für alle anderen Zwecke.
        </p>
      </LegalSection>

      <LegalSection title="5. Zahlungsabwicklung (Stripe)">
        <p>
          Zahlungen wickeln wir über Stripe ab. Für die Zahlung wirst du auf
          eine gesicherte Seite von Stripe geleitet.{" "}
          <strong className="font-medium text-cream">
            Deine Zahlungsdaten – insbesondere vollständige Kartennummern –
            werden ausschliesslich von Stripe verarbeitet und erreichen unsere
            Server zu keinem Zeitpunkt.
          </strong>{" "}
          Wir speichern keine Zahlungsmittel.
        </p>
        <p>
          Von Stripe erhalten wir lediglich Referenzdaten zur Zuordnung der
          Zahlung (Transaktionskennungen, Betrag, Status) sowie nicht sensible
          Anzeigedaten wie Kartenmarke und die letzten vier Ziffern.
        </p>
        <p>
          Anbieter: Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower,
          Dublin, Irland; für bestimmte Bearbeitungen zusätzlich Stripe, Inc.,
          USA. Die Übermittlung in die USA erfolgt auf Grundlage der
          Standardvertragsklauseln der EU-Kommission und der Anerkennung durch
          den Bundesrat. Weitere Informationen:{" "}
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
          Zur Zustellung geben wir Name, Lieferadresse und – sofern für die
          Avisierung nötig – E-Mail-Adresse oder Telefonnummer an das
          beauftragte Transportunternehmen weiter. Diese Übermittlung ist zur
          Vertragserfüllung erforderlich.
        </p>
        <p className="text-xs text-subtle">
          Vor dem Livegang zu ergänzen: das tatsächlich eingesetzte
          Transportunternehmen namentlich benennen und auf dessen
          Datenschutzhinweise verlinken.
        </p>
      </LegalSection>

      <LegalSection title="7. E-Mail-Versand (Resend)">
        <p>
          Bestellbestätigungen, Versandbenachrichtigungen und ähnliche
          Nachrichten versenden wir über den Dienstleister Resend
          (Plus Five Five, Inc., USA). Dafür werden deine E-Mail-Adresse und
          der Inhalt der jeweiligen Nachricht bearbeitet. Resend ist für uns
          Auftragsbearbeiter; die Übermittlung in die USA ist durch
          Standardvertragsklauseln abgesichert.
        </p>
      </LegalSection>

      <LegalSection title="8. Newsletter">
        <p>
          Den Newsletter versenden wir ausschliesslich nach ausdrücklicher
          Einwilligung und deren Bestätigung über einen Link in einer
          separaten E-Mail (Double-Opt-in). Wir speichern deine
          E-Mail-Adresse, den Zeitpunkt und den Wortlaut der Einwilligung sowie
          einen Hashwert der IP-Adresse, um die Einwilligung nachweisen zu
          können.
        </p>
        <p>
          Du kannst deine Einwilligung jederzeit mit Wirkung für die Zukunft
          widerrufen – über den Abmeldelink in jeder Nachricht oder per
          E-Mail an uns. Grundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO,
          Art. 6 Abs. 6 revDSG).
        </p>
      </LegalSection>

      <LegalSection title="9. Benachrichtigung bei Wiederverfügbarkeit">
        <p>
          Trägst du dich für eine Benachrichtigung ein, sobald ein Artikel
          wieder verfügbar ist, speichern wir deine E-Mail-Adresse
          ausschliesslich zu diesem Zweck. Nach dem einmaligen Versand kannst
          du den Eintrag über den Link in der Nachricht löschen lassen; nicht
          eingelöste Einträge löschen wir spätestens nach zwölf Monaten.
        </p>
      </LegalSection>

      <LegalSection title="10. Kontaktformular">
        <p>
          Deine Angaben aus dem Kontaktformular bearbeiten wir zur Beantwortung
          der Anfrage. Zum Schutz vor automatisierten Eintragungen verwenden
          wir ein für dich unsichtbares Zusatzfeld sowie eine Begrenzung der
          Anfragen je Absender; dabei wird ein Hashwert der IP-Adresse
          gespeichert. Anfragen löschen wir, sobald sie abschliessend erledigt
          sind und keine Aufbewahrungspflicht entgegensteht.
        </p>
      </LegalSection>

      <LegalSection title="11. Cookies und lokale Speicherung">
        <p>
          Wir setzen ausschliesslich technisch notwendige Cookies und Einträge
          im lokalen Speicher deines Browsers ein, damit Warenkorb,
          Bezahlvorgang, Währungsauswahl und die Anmeldung im internen Bereich
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
              Analyse-, Tracking- oder Marketingdienste setzen wir{" "}
              <strong className="font-medium text-cream">nicht</strong> ein. Es
              wird deshalb auch kein Einwilligungsbanner angezeigt – ein Banner
              ohne einwilligungspflichtige Dienste wäre reine Dekoration.
              Sollten wir künftig solche Dienste einsetzen, werden sie erst
              nach deiner ausdrücklichen Einwilligung geladen und an dieser
              Stelle aufgeführt.
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

      <LegalSection title="12. Soziale Netzwerke">
        <p>
          Auf unserer Website verlinken wir unser Instagram-Profil{" "}
          {siteConfig.social.instagramHandle} lediglich als gewöhnlichen Link.
          Es sind keine Zählpixel, Schaltflächen oder eingebetteten Inhalte von
          Meta eingebunden – beim blossen Aufruf unserer Seiten werden also
          keine Daten an Instagram übertragen. Erst wenn du den Link anklickst,
          gelten die Datenschutzbestimmungen von Meta.
        </p>
      </LegalSection>

      <LegalSection title="13. Empfänger und Auslandsbekanntgabe">
        <p>Personendaten geben wir nur an folgende Kategorien weiter:</p>
        <LegalList
          items={[
            "Zahlungsdienstleister (Stripe, Irland/USA) – zur Abwicklung der Zahlung",
            "E-Mail-Dienstleister (Resend, USA) – zum Versand von Bestell- und Servicemails",
            "Hosting- und Datenbankanbieter – zum Betrieb der Website (Bearbeitung in der EU/Schweiz)",
            "Bildhosting (Cloudinary) – zur Auslieferung der Produktbilder",
            "Transportunternehmen – zur Zustellung deiner Bestellung",
            "Behörden – soweit wir dazu gesetzlich verpflichtet sind",
          ]}
        />
        <p>
          Alle Dienstleister sind vertraglich zur Vertraulichkeit und zur
          Bearbeitung ausschliesslich nach unseren Weisungen verpflichtet.
          Erfolgt eine Bekanntgabe in ein Land ohne angemessenes
          Datenschutzniveau, stützen wir uns auf die Standardvertragsklauseln
          der EU-Kommission in der vom Bundesrat anerkannten Fassung.
        </p>
      </LegalSection>

      <LegalSection title="14. Aufbewahrung und Löschung">
        <LegalList
          items={[
            "Bestell- und Rechnungsdaten: 10 Jahre (Art. 958f OR)",
            "Newsletter-Anmeldungen: bis zum Widerruf der Einwilligung",
            "Verfügbarkeits-Benachrichtigungen: bis zum Versand, längstens 12 Monate",
            "Kontaktanfragen: bis zur abschliessenden Bearbeitung",
            "Server-Protokolle: kurzfristig, im Rahmen der Vorgaben des Hosting-Anbieters",
          ]}
        />
      </LegalSection>

      <LegalSection title="15. Deine Rechte">
        <LegalList
          items={[
            "Auskunft über die zu deiner Person bearbeiteten Daten",
            "Berichtigung unrichtiger Daten",
            "Löschung, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen",
            "Einschränkung der Bearbeitung",
            "Herausgabe oder Übertragung deiner Daten in einem gängigen elektronischen Format",
            "Widerspruch gegen Bearbeitungen, die auf berechtigten Interessen beruhen",
            "Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft",
          ]}
        />
        <p>
          Für alle Anliegen genügt eine formlose Nachricht an {mail}. Damit wir
          keine Daten an Unbefugte herausgeben, kann eine Identitätsprüfung
          nötig sein.
        </p>
        <p>
          Du hast zudem das Recht, dich bei einer Aufsichtsbehörde zu
          beschweren. In der Schweiz ist dies der Eidgenössische Datenschutz-
          und Öffentlichkeitsbeauftragte (EDÖB), Feldeggweg 1, 3003 Bern. Für
          Personen mit Wohnsitz in der EU ist die Datenschutzbehörde des
          eigenen Wohnsitzstaats zuständig.
        </p>
      </LegalSection>

      <LegalSection title="16. Datensicherheit">
        <p>
          Die Übertragung erfolgt durchgehend verschlüsselt über HTTPS.
          Zugangsdaten des internen Bereichs speichern wir ausschliesslich als
          kryptografischen Hash. Der Zugriff auf Bestelldaten ist auf
          berechtigte Personen beschränkt, Zahlungsvorgänge werden
          serverseitig gegen eine signierte Rückmeldung von Stripe geprüft.
          Ein absoluter Schutz vor Angriffen ist technisch nicht möglich.
        </p>
      </LegalSection>

      <LegalSection title="17. Änderungen dieser Erklärung">
        <p>
          Wir passen diese Datenschutzerklärung an, wenn sich unsere
          Bearbeitungen oder die Rechtslage ändern. Massgebend ist die jeweils
          auf dieser Seite veröffentlichte Fassung; das Datum der letzten
          Änderung steht oben.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
