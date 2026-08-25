import type { Metadata } from "next";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { shippingCountries, shippingMethods } from "@/lib/shipping";
import { Money } from "@/components/currency/money";
import { formatDeliveryRange } from "@/lib/availability";

export const metadata: Metadata = {
  title: "Versand & Lieferung",
  description:
    "Versandkosten, Lieferzeiten, Lieferländer und Informationen zur Sendungsverfolgung.",
  alternates: { canonical: "/versand" },
};

export default function ShippingPage() {
  return (
    <LegalPage
      title="Versand & Lieferung"
      intro="Wie und wann deine Bestellung bei dir ankommt – ohne versteckte Kosten."
      notice="none"
    >
      <LegalSection title="Versandarten und Kosten">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <caption className="sr-only">
              Versandarten mit Preis und Transportzeit
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-subtle">
                <th scope="col" className="pb-3 pr-4 font-medium">Versandart</th>
                <th scope="col" className="pb-3 pr-4 font-medium">Kosten</th>
                <th scope="col" className="pb-3 pr-4 font-medium">Kostenlos ab</th>
                <th scope="col" className="pb-3 font-medium">Transportzeit</th>
              </tr>
            </thead>
            <tbody>
              {shippingMethods.map((method) => (
                <tr key={method.key} className="border-b border-line/60">
                  <td className="py-3 pr-4 text-cream">
                    {method.label}
                    <span className="block text-xs text-subtle">
                      {method.description}
                    </span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-cream">
                    <Money cents={method.priceCents} />
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-muted">
                    {method.freeFromCents !== null ? (
                      <Money cents={method.freeFromCents} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 text-muted">
                    {formatDeliveryRange(method.minDays, method.maxDays)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-subtle">
          Alle Versandkosten werden im Warenkorb und im Bezahlvorgang vor der
          Bestellung ausgewiesen. Es kommen keine weiteren Gebühren hinzu.
        </p>
      </LegalSection>

      <LegalSection title="Lieferländer">
        <p>Wir liefern derzeit in folgende Länder:</p>
        <LegalList items={shippingCountries.map((country) => country.name)} />
        <p>
          Wir versenden ausschliesslich innerhalb der Schweiz. Damit fallen
          keine Zollabgaben, keine Einfuhrsteuern und keine
          Verzollungsgebühren an – der Betrag im Bestellvorgang ist der
          Endbetrag.
        </p>
        <p className="text-xs text-subtle">
          Lieferungen ins Ausland bieten wir derzeit nicht an. Wenn du aus dem
          grenznahen Ausland bestellen möchtest, schreib uns – wir schauen, ob
          sich etwas machen lässt.
        </p>
      </LegalSection>

      <LegalSection title="Lieferzeit">
        <p>
          Die Lieferzeit setzt sich aus der Bearbeitungszeit des jeweiligen
          Artikels und der Transportzeit zusammen. Beide Angaben findest du
          direkt am Produkt und noch einmal im Warenkorb.
        </p>
        <p>
          Die Frist beginnt mit dem bestätigten Zahlungseingang. Werktage sind
          Montag bis Freitag, ausgenommen Feiertage. Bestellungen, die an
          Wochenenden eingehen, bearbeiten wir am folgenden Werktag.
        </p>
      </LegalSection>

      <LegalSection title="Unterschiedliche Lieferzeiten in einer Bestellung">
        <p>
          Enthält deine Bestellung sofort verfügbare und vorbestellte Artikel,
          versenden wir standardmässig alles zusammen, sobald die komplette
          Bestellung bereitsteht. Der Warenkorb weist dich auf unterschiedliche
          Lieferzeiten hin.
        </p>
        <p>
          Möchtest du die verfügbaren Artikel vorab erhalten, schreib uns nach
          der Bestellung kurz eine Nachricht – wir teilen die Lieferung dann
          auf. Zusätzliche Versandkosten entstehen dir dadurch nicht.
        </p>
      </LegalSection>

      <LegalSection title="Verpackung">
        <p>
          Wir versenden bruchsicher gepolstert in einem neutralen Karton – von
          aussen ist nicht erkennbar, was sich darin befindet. Wo möglich
          verwenden wir Verpackungsmaterial wieder.
        </p>
      </LegalSection>

      <LegalSection title="Sendungsverfolgung">
        <p>
          Sobald dein Paket unterwegs ist, erhältst du eine E-Mail mit
          Sendungsnummer und Link zur Sendungsverfolgung. Es kann einige Stunden
          dauern, bis der Versanddienstleister erste Daten anzeigt.
        </p>
        <p>
          Den aktuellen Stand deiner Bestellung siehst du jederzeit über den
          persönlichen Link aus deiner Bestellbestätigung.
        </p>
      </LegalSection>

      <LegalSection title="Paket beschädigt oder nicht angekommen?">
        <p>
          Melde dich bitte innerhalb von 14 Tagen bei uns. Fotografiere
          beschädigte Sendungen möglichst vor dem Öffnen – das hilft bei der
          Klärung mit dem Versanddienstleister. Wir kümmern uns um den Rest.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
