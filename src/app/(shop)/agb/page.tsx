import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/config/site";
import { shippingMethods } from "@/lib/shipping";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen",
  description: "AGB für Bestellungen in unserem Onlineshop.",
  alternates: { canonical: "/agb" },
};

export default function TermsPage() {
  const standard = shippingMethods[0];

  return (
    <LegalPage
      title="Allgemeine Geschäftsbedingungen"
      intro="Bedingungen für Bestellungen über diesen Onlineshop."
      lastUpdated="PLATZHALTER – Datum eintragen"
    >
      <LegalSection title="§ 1 Geltungsbereich und Anbieter">
        <p>
          Diese Bedingungen gelten für alle Bestellungen über diesen Shop
          zwischen {siteConfig.legalName}, {siteConfig.contact.street},{" "}
          {siteConfig.contact.postalCode} {siteConfig.contact.city} (nachfolgend
          „wir“) und dir als Kundin oder Kunde.
        </p>
        <p>
          Wir verkaufen ausschliesslich an Endverbraucherinnen und
          Endverbraucher in haushaltsüblichen Mengen sowie an Unternehmen.
          Abweichende Bedingungen erkennen wir nicht an, sofern wir ihnen nicht
          ausdrücklich zugestimmt haben.
        </p>
      </LegalSection>

      <LegalSection title="§ 2 Vertragsschluss">
        <p>
          Die Darstellung der Produkte im Shop ist kein bindendes Angebot,
          sondern eine unverbindliche Aufforderung zur Bestellung.
        </p>
        <p>
          Mit dem Klick auf „Zahlungspflichtig bestellen“ gibst du ein
          verbindliches Angebot ab. Wir bestätigen den Eingang unverzüglich per
          E-Mail; diese Eingangsbestätigung stellt noch keine Annahme dar. Der
          Vertrag kommt zustande, sobald wir die Annahme erklären oder die Ware
          versenden.
        </p>
        <p>
          Vor dem Absenden kannst du alle Eingaben im Bezahlvorgang prüfen und
          über die Zurück-Funktion des Browsers korrigieren.
        </p>
      </LegalSection>

      <LegalSection title="§ 3 Preise und Versandkosten">
        <p>
          Alle Preise verstehen sich als Endpreise in Euro inklusive
          gesetzlicher Umsatzsteuer, zuzüglich Versandkosten. Die Versandkosten
          werden im Warenkorb und im Bezahlvorgang vor Abgabe der Bestellung
          gesondert ausgewiesen. Es entstehen keine weiteren Kosten.
        </p>
        <LegalList
          items={shippingMethods.map((method) => (
            <>
              {method.label}: {formatPrice(method.priceCents)}
              {method.freeFromCents !== null && (
                <> – kostenlos ab {formatPrice(method.freeFromCents)} Bestellwert</>
              )}
            </>
          ))}
        />
        <p className="text-xs text-subtle">
          PLATZHALTER: Bei Lieferungen über Zollgrenzen hinweg (z. B. aus der
          Schweiz in die EU) müssen Hinweise zu Zoll, Einfuhrumsatzsteuer und
          etwaigen Bearbeitungsgebühren ergänzt und fachlich geprüft werden.
        </p>
      </LegalSection>

      <LegalSection title="§ 4 Zahlung">
        <p>
          Die Zahlung erfolgt über unseren Zahlungsdienstleister Stripe. Zur
          Verfügung stehen Kredit- und Debitkarte sowie – je nach Endgerät –
          Apple&nbsp;Pay und Google&nbsp;Pay. Weitere Methoden können hinzukommen.
        </p>
        <p>
          Der Kaufpreis ist mit Vertragsschluss sofort fällig. Deine
          Zahlungsdaten werden ausschliesslich von Stripe verarbeitet; wir
          speichern keine vollständigen Kartendaten.
        </p>
      </LegalSection>

      <LegalSection title="§ 5 Lieferung und Lieferzeit">
        <p>
          Wir liefern in folgende Länder: {standard.countries.join(", ")}.
          Die Lieferzeit ist bei jedem Artikel angegeben und beginnt mit
          bestätigtem Zahlungseingang. Angaben in Werktagen verstehen sich als
          Montag bis Freitag ohne Feiertage.
        </p>
        <p>
          Enthält eine Bestellung Artikel mit unterschiedlichen Lieferzeiten,
          versenden wir vollständig, sobald alle Positionen bereitstehen. Auf
          Wunsch teilen wir die Lieferung – schreib uns dazu bitte kurz.
        </p>
        <p>
          Bei Vorbestellungen gilt die auf der Produktseite genannte
          voraussichtliche Lieferzeit. Verzögert sich die Verfügbarkeit
          wesentlich, informieren wir dich und du kannst kostenfrei vom Vertrag
          zurücktreten.
        </p>
      </LegalSection>

      <LegalSection title="§ 6 Eigentumsvorbehalt">
        <p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.</p>
      </LegalSection>

      <LegalSection title="§ 7 Widerrufsrecht">
        <p>
          Verbraucherinnen und Verbrauchern steht ein Widerrufsrecht zu. Die
          Einzelheiten und die Ausnahmen findest du in unserer{" "}
          <Link
            href="/widerruf"
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            Widerrufsbelehrung
          </Link>
          .
        </p>
        <p>
          Bitte beachte: Bei versiegelten Waren, die aus Gründen des
          Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind,
          erlischt das Widerrufsrecht, wenn die Versiegelung nach der Lieferung
          entfernt wurde. Das betrifft insbesondere geöffnete Parfüms und
          Abfüllungen.
        </p>
      </LegalSection>

      <LegalSection title="§ 8 Gewährleistung">
        <p>
          Es gelten die gesetzlichen Gewährleistungsrechte. Bei Mängeln melde
          dich bitte unter{" "}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            {siteConfig.contact.email}
          </a>{" "}
          – wir finden gemeinsam eine Lösung.
        </p>
      </LegalSection>

      <LegalSection title="§ 9 Produkthinweise">
        <p>
          Unsere Abfüllungen werden von Hand aus grösseren Gebinden abgefüllt
          und in geeignete Flakons umgefüllt. Farbe und Duftverlauf können
          natürlichen Schwankungen unterliegen.
        </p>
        <p>
          Produkte, die als „Duftalternative“ oder „inspiriert von einer
          Duftrichtung“ gekennzeichnet sind, sind eigenständige Erzeugnisse und
          keine Originalware. Es besteht keine Verbindung, Lizenz oder
          Zusammenarbeit mit den Herstellern anderer Düfte.
        </p>
        <p>
          Parfüms enthalten Duftstoffe, die allergische Reaktionen auslösen
          können. Bitte beachte die Angaben auf der Produktseite und der
          Verpackung.
        </p>
      </LegalSection>

      <LegalSection title="§ 10 Haftung">
        <p>
          PLATZHALTER: Eine Haftungsklausel ist rechtlich heikel und muss auf
          die gewählte Rechtsordnung abgestimmt werden. Unwirksame
          Haftungsausschlüsse können abgemahnt werden – bitte fachkundig
          formulieren lassen.
        </p>
      </LegalSection>

      <LegalSection title="§ 11 Schlussbestimmungen">
        <p>
          PLATZHALTER: Anwendbares Recht und Gerichtsstand sind hier zu regeln.
          Zu beachten ist, dass Verbraucherinnen und Verbraucher der Schutz
          zwingender Vorschriften ihres Aufenthaltsstaats nicht entzogen werden
          darf.
        </p>
        <p>
          Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der
          übrigen Bestimmungen unberührt.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
