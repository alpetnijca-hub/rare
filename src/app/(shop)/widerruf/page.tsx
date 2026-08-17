import type { Metadata } from "next";
import {
  LegalBox,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Widerrufsbelehrung",
  description: "Dein Widerrufsrecht und das Muster-Widerrufsformular.",
  alternates: { canonical: "/widerruf" },
};

export default function WithdrawalPage() {
  return (
    <LegalPage
      title="Widerrufsbelehrung"
      intro="Informationen zum gesetzlichen Widerrufsrecht für Verbraucherinnen und Verbraucher."
    >
      <LegalSection title="Widerrufsrecht">
        <p>
          Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
          diesen Vertrag zu widerrufen.
        </p>
        <p>
          Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem du oder
          eine von dir benannte dritte Person, die nicht der Beförderer ist, die
          Waren in Besitz genommen hast beziehungsweise hat.
        </p>
        <p>
          Um dein Widerrufsrecht auszuüben, musst du uns mittels einer
          eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder
          eine E-Mail) über deinen Entschluss informieren:
        </p>
        <p>
          {siteConfig.legalName}
          <br />
          {siteConfig.contact.street}
          <br />
          {siteConfig.contact.postalCode} {siteConfig.contact.city},{" "}
          {siteConfig.contact.country}
          <br />
          E-Mail:{" "}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            {siteConfig.contact.email}
          </a>
        </p>
        <p>
          Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung
          über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist
          absendest.
        </p>
      </LegalSection>

      <LegalSection title="Folgen des Widerrufs">
        <p>
          Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die
          wir von dir erhalten haben, einschliesslich der Lieferkosten (mit
          Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass du
          eine andere Art der Lieferung als die von uns angebotene, günstigste
          Standardlieferung gewählt hast), unverzüglich und spätestens binnen
          vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
          deinen Widerruf bei uns eingegangen ist.
        </p>
        <p>
          Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du
          bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, es
          wurde ausdrücklich etwas anderes vereinbart. In keinem Fall werden dir
          wegen dieser Rückzahlung Entgelte berechnet.
        </p>
        <p>
          Wir können die Rückzahlung verweigern, bis wir die Waren wieder
          zurückerhalten haben oder bis du den Nachweis erbracht hast, dass du
          die Waren zurückgesandt hast – je nachdem, welches der frühere
          Zeitpunkt ist.
        </p>
        <p>
          Du hast die Waren unverzüglich und in jedem Fall spätestens binnen
          vierzehn Tagen ab dem Tag, an dem du uns über den Widerruf
          unterrichtest, an uns zurückzusenden oder zu übergeben.
        </p>
        <p>
          <strong className="font-medium text-cream">
            PLATZHALTER – Rücksendekosten:
          </strong>{" "}
          Hier ist eindeutig festzulegen, wer die unmittelbaren Kosten der
          Rücksendung trägt. Fehlt diese Angabe, können die Kosten auf den
          Verkäufer zurückfallen.
        </p>
        <p>
          Du musst für einen etwaigen Wertverlust der Waren nur aufkommen, wenn
          dieser auf einen zur Prüfung der Beschaffenheit, Eigenschaften und
          Funktionsweise der Waren nicht notwendigen Umgang mit ihnen
          zurückzuführen ist.
        </p>
      </LegalSection>

      <LegalSection title="Ausschluss und vorzeitiges Erlöschen des Widerrufsrechts">
        <p>Das Widerrufsrecht besteht insbesondere nicht bei:</p>
        <LegalList
          items={[
            "Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder Bestimmung durch dich massgeblich ist (z. B. individuell zusammengestellte Sets nach deinen Vorgaben)",
            "versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, wenn die Versiegelung nach der Lieferung entfernt wurde – dies betrifft geöffnete Parfüms und Abfüllungen",
            "Waren, die nach der Lieferung aufgrund ihrer Beschaffenheit untrennbar mit anderen Gütern vermischt wurden",
          ]}
        />
        <p className="text-xs text-subtle">
          PLATZHALTER: Ob und in welchem Umfang der Hygiene-Ausschluss auf eure
          konkrete Verpackung anwendbar ist, hängt von der tatsächlichen
          Versiegelung ab. Bitte prüfen lassen und die Versiegelung entsprechend
          gestalten.
        </p>
      </LegalSection>

      <LegalBox title="Muster-Widerrufsformular">
        <p className="text-xs text-subtle">
          Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus
          und sende es zurück. Die Verwendung ist freiwillig.
        </p>
        <div className="mt-3 whitespace-pre-line border-l-2 border-gold/40 pl-4 text-sm leading-relaxed">
          {`An:
${siteConfig.legalName}
${siteConfig.contact.street}
${siteConfig.contact.postalCode} ${siteConfig.contact.city}
${siteConfig.contact.email}

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag
über den Kauf der folgenden Waren:

_______________________________________________

Bestellnummer: ________________________________
Bestellt am (*) / erhalten am (*): ____________
Name der/des Verbraucher(s): __________________
Anschrift der/des Verbraucher(s): _____________

_______________________________________________
Unterschrift (nur bei Mitteilung auf Papier)

Datum: ________________________________________

(*) Unzutreffendes streichen`}
        </div>
      </LegalBox>
    </LegalPage>
  );
}
