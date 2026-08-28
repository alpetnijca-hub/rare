import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
import { ProviderAddress } from "@/components/legal/provider-address";
import {
  isVatRegistered,
  minOrderCents,
  maxPreorderQuantity,
  maxQuantityPerItem,
  returnsPolicy,
  siteConfig,
  taxConfig,
} from "@/config/site";
import { shippingMethods } from "@/lib/shipping";
import { formatPrice, formatTaxRate } from "@/lib/money";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen",
  description: "AGB für Bestellungen in unserem Onlineshop.",
  alternates: { canonical: "/agb" },
};

const returnShippingByCustomer = returnsPolicy.returnShippingPaidBy === "customer";

export default function TermsPage() {
  const { contact } = siteConfig;

  return (
    <LegalPage
      title="Allgemeine Geschäftsbedingungen"
      intro="Bedingungen für Bestellungen über diesen Onlineshop."
      lastUpdated="18. August 2026"
      notice="review"
    >
      <LegalSection title="1. Geltungsbereich und Anbieter">
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für sämtliche
          Bestellungen, die über diesen Onlineshop zwischen
        </p>
        <ProviderAddress />
        <p>
          (nachfolgend „wir“ oder „Rare Scents“) und dir als Kundin oder Kunde
          abgeschlossen werden. Massgebend ist die zum Zeitpunkt der Bestellung
          veröffentlichte Fassung.
        </p>
        <p>
          Wir verkaufen an Endverbraucherinnen und Endverbraucher in
          haushaltsüblichen Mengen. Entgegenstehende oder ergänzende
          Bedingungen erkennen wir nicht an, sofern wir ihnen nicht
          ausdrücklich schriftlich zugestimmt haben. Wir dürfen Bestellungen
          ohne Angabe von Gründen ablehnen, insbesondere bei offensichtlich
          gewerblicher Weiterveräusserung oder bei begründetem Verdacht auf
          Missbrauch.
        </p>
      </LegalSection>

      <LegalSection title="2. Vertragsschluss">
        <p>
          Die Darstellung der Produkte im Shop stellt kein bindendes Angebot
          dar, sondern eine unverbindliche Einladung zur Bestellung.
        </p>
        <p>
          Mit dem Klick auf „Zahlungspflichtig bestellen“ gibst du ein
          verbindliches Angebot zum Kauf der im Warenkorb enthaltenen Artikel
          ab. Wir bestätigen den Eingang deiner Bestellung unverzüglich per
          E-Mail. Diese Eingangsbestätigung ist noch keine Annahme des
          Angebots.
        </p>
        <p>
          Der Vertrag kommt zustande, sobald wir die Annahme ausdrücklich
          erklären oder die Ware versenden – spätestens jedoch mit der
          Versandbestätigung. Können wir eine Bestellung nicht ausführen,
          informieren wir dich unverzüglich; bereits geleistete Zahlungen
          erstatten wir in diesem Fall vollständig zurück.
        </p>
        <p>
          Vor dem verbindlichen Absenden kannst du alle Eingaben im
          Bestellvorgang prüfen und über die Korrekturfunktionen des Formulars
          oder die Zurück-Funktion deines Browsers ändern. Den Vertragstext
          senden wir dir mit der Bestellbestätigung zu; er ist zusätzlich über
          den persönlichen Link zu deiner Bestellung abrufbar.
        </p>
        <p>
          Je Artikel können höchstens {maxQuantityPerItem} Stück bestellt
          werden, bei Vorbestellungen höchstens {maxPreorderQuantity} Stück.
        </p>
      </LegalSection>

      <LegalSection title="3. Preise und Versandkosten">
        <p>
          Alle Preise sind Endpreise in Schweizer Franken (CHF)
          {isVatRegistered
            ? ` inklusive der gesetzlichen Mehrwertsteuer von ${formatTaxRate(taxConfig.rateBp)}`
            : ". Wir sind nicht mehrwertsteuerpflichtig und weisen deshalb keine Mehrwertsteuer aus"}
          , zuzüglich Versandkosten.
        </p>
        {minOrderCents > 0 && (
          <p>
            Für Bestellungen gilt ein Mindestbestellwert von{" "}
            <strong className="font-medium text-cream">
              {formatPrice(minOrderCents)}
            </strong>{" "}
            (Warenwert ohne Versandkosten, vor Abzug eines Rabattcodes). Wird er
            nicht erreicht, lässt sich die Bestellung nicht abschliessen; der
            fehlende Betrag wird im Warenkorb angezeigt.
          </p>
        )}
        <p>
          Der Shop bietet die Möglichkeit, Preise zur Orientierung in einer
          anderen Währung anzuzeigen. Diese Umrechnung ist unverbindlich und
          mit „ca.“ gekennzeichnet.{" "}
          <strong className="font-medium text-cream">
            Verbindlich ist ausschliesslich der Preis in Schweizer Franken; die
            Belastung erfolgt in CHF.
          </strong>{" "}
          Kosten, die deine Bank oder dein Kartenherausgeber für eine
          Fremdwährungsbelastung erhebt, liegen ausserhalb unseres Einflusses.
        </p>
        <p>
          Die Versandkosten werden im Warenkorb und im Bestellvorgang vor
          Abgabe der Bestellung gesondert ausgewiesen:
        </p>
        <LegalList
          items={shippingMethods.map((method) => (
            <>
              {method.label}: {formatPrice(method.priceCents)}
              {method.freeFromCents !== null && (
                <>
                  {" "}
                  – ab einem Bestellwert von{" "}
                  {formatPrice(method.freeFromCents)} versandkostenfrei
                </>
              )}
            </>
          ))}
        />
        <p>
          Wir liefern ausschliesslich innerhalb der Schweiz. Es fallen deshalb
          keine Zollabgaben, keine Einfuhrsteuern und keine
          Verzollungsgebühren an. Der im Bestellvorgang angezeigte Betrag ist
          der Betrag, den du bezahlst – weitere Kosten entstehen nicht.
        </p>
      </LegalSection>

      <LegalSection title="4. Zahlung">
        <p>
          Die Zahlungsabwicklung erfolgt über unseren Zahlungsdienstleister
          Stripe Payments Europe Ltd. Zur Verfügung stehen Kredit- und
          Debitkarte sowie – je nach Endgerät – Apple&nbsp;Pay und
          Google&nbsp;Pay. Weitere Zahlungsarten können hinzukommen; welche
          verfügbar sind, siehst du im Bestellvorgang.
        </p>
        <p>
          Der Kaufpreis ist mit Vertragsschluss sofort und vollständig fällig.
          Wir versenden erst nach bestätigtem Zahlungseingang.
        </p>
        <p>
          Deine Zahlungsdaten werden ausschliesslich von Stripe verarbeitet.
          Vollständige Kartendaten erreichen unsere Systeme zu keinem Zeitpunkt
          und werden von uns nicht gespeichert.
        </p>
        <p>
          Reservierte Artikel halten wir für die Dauer des Bezahlvorgangs
          zurück. Wird die Zahlung nicht innerhalb dieser Frist abgeschlossen,
          geben wir die Reservierung wieder frei und die Bestellung kommt nicht
          zustande.
        </p>
      </LegalSection>

      <LegalSection title="5. Lieferung, Lieferfristen und Vorbestellungen">
        <p>
          Wir liefern ausschliesslich an Adressen in der Schweiz. Eine
          Lieferung ins Ausland sowie an Postfächer ist nicht möglich.
        </p>
        <p>
          Die bei jedem Artikel angegebene Lieferzeit ist eine Schätzung in
          Werktagen (Montag bis Freitag, ohne Feiertage) und beginnt mit dem
          bestätigten Zahlungseingang. Verbindliche Liefertermine sagen wir nur
          zu, wenn wir dies ausdrücklich schriftlich bestätigt haben.
        </p>
        <p>
          Enthält eine Bestellung Artikel mit unterschiedlichen Lieferzeiten,
          versenden wir vollständig, sobald alle Positionen bereitstehen. Auf
          Wunsch teilen wir die Lieferung – schreib uns dazu bitte kurz; für
          die Teillieferung können zusätzliche Versandkosten anfallen.
        </p>
        <p>
          Bei als vorbestellbar gekennzeichneten Artikeln gilt die auf der
          Produktseite genannte voraussichtliche Lieferzeit. Verzögert sich die
          Verfügbarkeit wesentlich oder wird ein Artikel dauerhaft nicht mehr
          verfügbar, informieren wir dich unverzüglich. Du kannst in diesem
          Fall kostenfrei vom Vertrag zurücktreten; bereits geleistete
          Zahlungen erstatten wir umgehend.
        </p>
        <p>
          Die Gefahr des zufälligen Untergangs geht mit der Übergabe an dich
          über. Ist die Sendung bei Ankunft sichtbar beschädigt, melde dies
          bitte direkt beim Transportunternehmen und informiere uns – das
          erleichtert die Abwicklung, ist für deine Ansprüche uns gegenüber
          aber nicht Voraussetzung.
        </p>
      </LegalSection>

      <LegalSection title="6. Eigentumsvorbehalt">
        <p>
          Die gelieferte Ware bleibt bis zur vollständigen Bezahlung unser
          Eigentum.
        </p>
      </LegalSection>

      <LegalSection title="7. Rückgabe und Widerruf">
        <p>
          Bei Onlinebestellungen besteht nach Schweizer Recht kein gesetzliches
          Widerrufsrecht. Wir gewähren dir freiwillig ein Rückgaberecht von{" "}
          {returnsPolicy.voluntaryDays} Tagen ab Erhalt für ungeöffnete,
          originalversiegelte Artikel.{" "}
          {returnShippingByCustomer
            ? "Die Kosten der Rücksendung trägst du."
            : "Die Kosten der Rücksendung übernehmen wir."}
        </p>
        <p>
          Alle Einzelheiten, Voraussetzungen und Ausnahmen findest du unter{" "}
          <Link
            href="/widerruf"
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            Rückgaberecht
          </Link>
          .
        </p>
        <p>
          <strong className="font-medium text-cream">Wichtig:</strong> Bei
          versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder der
          Hygiene nicht zur Rückgabe geeignet sind, ist eine Rückgabe
          ausgeschlossen, sobald die Versiegelung nach der Lieferung entfernt
          wurde. Das betrifft insbesondere geöffnete Parfüms, Abfüllungen und
          Proben.
        </p>
      </LegalSection>

      <LegalSection title="8. Gewährleistung und Mängel">
        <p>
          Es gelten die gesetzlichen Bestimmungen über die Sachgewährleistung
          (Art. 197 ff. OR). Weist die gelieferte Ware einen Mangel auf, melde
          dich bitte unter{" "}
          <a
            href={`mailto:${contact.email}`}
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            {contact.email}
          </a>{" "}
          – nach Möglichkeit mit Bestellnummer und Foto. Wir prüfen jeden Fall
          einzeln und liefern in der Regel Ersatz oder erstatten den Kaufpreis.
        </p>
        <p>
          Prüfe die Ware bitte nach Erhalt und zeige erkennbare Mängel
          innerhalb angemessener Frist an. Für Verbraucherinnen und Verbraucher
          gilt die gesetzliche Verjährungsfrist von zwei Jahren ab Ablieferung.
        </p>
        <p>
          Nicht als Mangel gelten geringfügige, warentypische Abweichungen in
          Farbe, Konsistenz oder Duftverlauf sowie das natürliche Nachlassen
          der Duftintensität über die Zeit.
        </p>
      </LegalSection>

      <LegalSection title="9. Produkthinweise, Duftalternativen und Abfüllungen">
        <p>
          Unsere Abfüllungen werden von Hand aus grösseren Gebinden in geeignete
          Flakons umgefüllt und anschliessend versiegelt. Füllmengen sind
          Nennwerte; geringfügige, technisch bedingte Abweichungen sind
          möglich. Farbe und Duftverlauf unterliegen natürlichen Schwankungen.
        </p>
        <p>
          Produkte, die als „Duftalternative“ oder „inspiriert von einer
          Duftrichtung“ gekennzeichnet sind, sind{" "}
          <strong className="font-medium text-cream">
            eigenständige Erzeugnisse und keine Originalware
          </strong>
          . Es besteht keine Verbindung, Lizenzierung, Zusammenarbeit oder
          sonstige Zugehörigkeit zu den Herstellern anderer Düfte. Allfällig
          genannte Marken sind Eigentum ihrer jeweiligen Inhaber und dienen
          ausschliesslich der beschreibenden Einordnung einer Duftrichtung.
        </p>
        <p>
          Parfüms enthalten Duftstoffe, die bei entsprechender Veranlagung
          allergische Reaktionen auslösen können. Beachte bitte die Angaben auf
          der Produktseite und auf der Verpackung. Bei bekannten Allergien oder
          empfindlicher Haut empfehlen wir zuerst eine Probe. Parfüm ist
          leicht entzündlich, gehört nicht in Kinderhände und ist vor
          direkter Sonneneinstrahlung geschützt zu lagern.
        </p>
        <p>
          Produktabbildungen dienen der Veranschaulichung. Verpackungen und
          Flakonformen können vom Hersteller ohne Vorankündigung geändert
          werden.
        </p>
      </LegalSection>

      <LegalSection title="10. Rabattcodes und Aktionen">
        <p>
          Rabattcodes sind nur innerhalb des angegebenen Zeitraums und nur für
          die jeweils genannten Produkte gültig. Sie sind nicht mit anderen
          Aktionen kombinierbar, sofern nichts anderes angegeben ist, können
          nicht in bar ausbezahlt und nicht nachträglich auf eine bereits
          abgeschlossene Bestellung angerechnet werden. Bei einer Rückgabe wird
          der tatsächlich bezahlte Betrag erstattet.
        </p>
      </LegalSection>

      <LegalSection title="11. Haftung">
        <p>
          Wir haften unbeschränkt für Schäden aus der Verletzung des Lebens,
          des Körpers oder der Gesundheit sowie für Schäden, die wir
          absichtlich oder grobfahrlässig verursacht haben. Ebenso bleibt die
          Haftung nach dem Produktehaftpflichtgesetz unberührt.
        </p>
        <p>
          Für leichte Fahrlässigkeit haften wir nur bei Verletzung einer
          wesentlichen Vertragspflicht – also einer Pflicht, deren Erfüllung
          die ordnungsgemässe Durchführung des Vertrags überhaupt erst
          ermöglicht und auf deren Einhaltung du regelmässig vertrauen darfst.
          In diesem Fall ist die Haftung auf den bei Vertragsschluss
          vorhersehbaren, vertragstypischen Schaden begrenzt.
        </p>
        <p>
          Eine weitergehende Haftung, insbesondere für indirekte Schäden und
          entgangenen Gewinn, ist ausgeschlossen, soweit das Gesetz dies
          zulässt. Zwingende gesetzliche Rechte von Verbraucherinnen und
          Verbrauchern bleiben in jedem Fall unberührt.
        </p>
      </LegalSection>

      <LegalSection title="12. Datenschutz">
        <p>
          Wie wir mit deinen Daten umgehen, steht in unserer{" "}
          <Link
            href="/datenschutz"
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            Datenschutzerklärung
          </Link>
          . Sie ist Bestandteil dieser Bedingungen, soweit sie
          Verarbeitungszwecke beschreibt.
        </p>
      </LegalSection>

      <LegalSection title="13. Änderungen dieser Bedingungen">
        <p>
          Wir können diese AGB jederzeit für künftige Bestellungen anpassen.
          Für eine bereits abgeschlossene Bestellung gilt stets die Fassung,
          die zum Zeitpunkt der Bestellung veröffentlicht war.
        </p>
      </LegalSection>

      <LegalSection title="14. Anwendbares Recht und Gerichtsstand">
        <p>
          Es gilt ausschliesslich schweizerisches Recht unter Ausschluss des
          Übereinkommens der Vereinten Nationen über Verträge über den
          internationalen Warenkauf (CISG).
        </p>
        <p>
          Gerichtsstand ist – soweit gesetzlich zulässig – unser Sitz in der
          Schweiz. Die zwingenden Zuständigkeiten zum Schutz von Konsumentinnen
          und Konsumenten nach Art. 32 ZPO bleiben davon unberührt: Du kannst
          uns in jedem Fall auch an deinem Wohnsitz einklagen.
        </p>
      </LegalSection>

      <LegalSection title="15. Schlussbestimmungen">
        <p>
          Sollte eine Bestimmung dieser AGB ganz oder teilweise unwirksam sein
          oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen
          unberührt. An die Stelle der unwirksamen Bestimmung tritt die
          gesetzliche Regelung.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
