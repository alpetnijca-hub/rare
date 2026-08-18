import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalBox,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
import { returnsPolicy, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Rückgabe & Widerruf",
  description:
    "Unser freiwilliges Rückgaberecht sowie das gesetzliche Widerrufsrecht für Verbraucherinnen und Verbraucher in der EU.",
  alternates: { canonical: "/widerruf" },
};

const returnShippingByCustomer = returnsPolicy.returnShippingPaidBy === "customer";

export default function WithdrawalPage() {
  const { contact } = siteConfig;

  const address = (
    <p>
      {siteConfig.legalName}
      <br />
      {contact.street}
      <br />
      {contact.postalCode} {contact.city}, {contact.country}
      <br />
      E-Mail:{" "}
      <a
        href={`mailto:${contact.email}`}
        className="text-gold underline underline-offset-2 hover:text-gold-light"
      >
        {contact.email}
      </a>
    </p>
  );

  return (
    <LegalPage
      title="Rückgabe & Widerruf"
      intro="Was gilt, wenn du eine Bestellung zurückgeben möchtest – für die Schweiz und für Bestellungen aus der EU."
      lastUpdated="18. August 2026"
      notice="review"
    >
      <LegalSection title="Kurz gesagt">
        <LegalList
          items={[
            <>
              <strong className="font-medium text-cream">Schweiz und Liechtenstein:</strong>{" "}
              Es gibt kein gesetzliches Widerrufsrecht bei Onlinebestellungen.
              Wir räumen dir freiwillig {returnsPolicy.voluntaryDays} Tage
              Rückgaberecht für ungeöffnete, originalversiegelte Artikel ein.
            </>,
            <>
              <strong className="font-medium text-cream">Deutschland und Österreich:</strong>{" "}
              Als Verbraucherin oder Verbraucher hast du das gesetzliche
              Widerrufsrecht von {returnsPolicy.euWithdrawalDays} Tagen. Die
              vollständige Belehrung steht weiter unten.
            </>,
            <>
              <strong className="font-medium text-cream">Immer ausgeschlossen:</strong>{" "}
              geöffnete Parfüms und Abfüllungen. Sobald die Versiegelung
              entfernt ist, können wir sie aus Hygienegründen nicht mehr
              zurücknehmen.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="1. Freiwilliges Rückgaberecht (Schweiz und Liechtenstein)">
        <p>
          Bestellungen über einen Onlineshop fallen in der Schweiz nicht unter
          das gesetzliche Widerrufsrecht nach Art. 40a ff. OR – dieses gilt nur
          für Haustür- und Telefongeschäfte. Wir wollen trotzdem, dass du ohne
          Risiko bestellen kannst, und sagen dir deshalb vertraglich Folgendes
          zu:
        </p>
        <LegalList
          items={[
            <>
              Du kannst Artikel innerhalb von{" "}
              {returnsPolicy.voluntaryDays} Tagen ab Erhalt der Lieferung an
              uns zurücksenden.
            </>,
            "Die Artikel müssen ungeöffnet, unbenutzt und in der ungeöffneten Originalversiegelung sein.",
            <>
              Melde die Rücksendung vorher kurz per E-Mail an{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                {contact.email}
              </a>{" "}
              an, damit wir sie zuordnen können.
            </>,
            returnShippingByCustomer
              ? "Die Kosten der Rücksendung trägst du."
              : "Die Kosten der Rücksendung übernehmen wir.",
            <>
              Nach Eingang und Prüfung erstatten wir den Kaufpreis innerhalb von{" "}
              {returnsPolicy.refundDays} Tagen auf dasselbe Zahlungsmittel,
              mit dem du bezahlt hast.
            </>,
          ]}
        />
        <p>
          Dieses Rückgaberecht kommt zusätzlich zu deinen gesetzlichen
          Rechten bei mangelhafter Ware. Diese schränken wir damit nicht ein.
        </p>
      </LegalSection>

      <LegalSection title="2. Gesetzliches Widerrufsrecht für Verbraucher in der EU">
        <p>
          Bestellst du als Verbraucherin oder Verbraucher mit Wohnsitz in der
          Europäischen Union – wir liefern nach Deutschland und Österreich –,
          gilt für dich zusätzlich das zwingende EU-Fernabsatzrecht. Die
          folgende Belehrung ist für diesen Fall massgeblich.
        </p>
      </LegalSection>

      <LegalSection title="Widerrufsrecht">
        <p>
          Du hast das Recht, binnen {returnsPolicy.euWithdrawalDays} Tagen ohne
          Angabe von Gründen diesen Vertrag zu widerrufen.
        </p>
        <p>
          Die Widerrufsfrist beträgt {returnsPolicy.euWithdrawalDays} Tage ab
          dem Tag, an dem du oder eine von dir benannte dritte Person, die
          nicht der Beförderer ist, die Waren in Besitz genommen hast
          beziehungsweise hat. Bei einer Bestellung mehrerer Waren, die
          getrennt geliefert werden, läuft die Frist ab Erhalt der letzten
          Ware.
        </p>
        <p>
          Um dein Widerrufsrecht auszuüben, musst du uns mittels einer
          eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder
          eine E-Mail) über deinen Entschluss informieren:
        </p>
        {address}
        <p>
          Du kannst dafür das unten stehende Muster-Widerrufsformular
          verwenden, das aber nicht vorgeschrieben ist. Zur Wahrung der
          Widerrufsfrist reicht es aus, dass du die Mitteilung über die
          Ausübung des Widerrufsrechts vor Ablauf der Frist absendest.
        </p>
      </LegalSection>

      <LegalSection title="Folgen des Widerrufs">
        <p>
          Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die
          wir von dir erhalten haben, einschliesslich der Lieferkosten (mit
          Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass du
          eine andere Art der Lieferung als die von uns angebotene, günstigste
          Standardlieferung gewählt hast), unverzüglich und spätestens binnen{" "}
          {returnsPolicy.refundDays} Tagen ab dem Tag zurückzuzahlen, an dem
          die Mitteilung über deinen Widerruf bei uns eingegangen ist.
        </p>
        <p>
          Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du
          bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, es
          wurde ausdrücklich etwas anderes vereinbart. In keinem Fall werden
          dir wegen dieser Rückzahlung Entgelte berechnet.
        </p>
        <p>
          Wir können die Rückzahlung verweigern, bis wir die Waren wieder
          zurückerhalten haben oder bis du den Nachweis erbracht hast, dass du
          die Waren zurückgesandt hast – je nachdem, welches der frühere
          Zeitpunkt ist.
        </p>
        <p>
          Du hast die Waren unverzüglich und in jedem Fall spätestens binnen{" "}
          {returnsPolicy.euWithdrawalDays} Tagen ab dem Tag, an dem du uns über
          den Widerruf unterrichtest, an uns zurückzusenden oder zu übergeben.
          Die Frist ist gewahrt, wenn du die Waren vor Ablauf der Frist
          absendest.
        </p>
        <p>
          {returnShippingByCustomer ? (
            <>
              <strong className="font-medium text-cream">Rücksendekosten:</strong>{" "}
              Du trägst die unmittelbaren Kosten der Rücksendung der Waren.
            </>
          ) : (
            <>
              <strong className="font-medium text-cream">Rücksendekosten:</strong>{" "}
              Wir tragen die unmittelbaren Kosten der Rücksendung der Waren.
            </>
          )}
        </p>
        <p>
          Du musst für einen etwaigen Wertverlust der Waren nur aufkommen, wenn
          dieser auf einen zur Prüfung der Beschaffenheit, Eigenschaften und
          Funktionsweise der Waren nicht notwendigen Umgang mit ihnen
          zurückzuführen ist.
        </p>
        <p className="text-xs text-subtle">
          Hinweis zu Zoll und Einfuhr: Bei Rücksendungen aus der EU in die
          Schweiz können Zoll- und Einfuhrformalitäten anfallen. Melde die
          Rücksendung deshalb bitte vorher kurz an – wir nennen dir dann das
          korrekte Vorgehen und die richtige Anschrift.
        </p>
      </LegalSection>

      <LegalSection title="Ausschluss und vorzeitiges Erlöschen des Widerrufsrechts">
        <p>Das Widerrufsrecht besteht insbesondere nicht bei:</p>
        <LegalList
          items={[
            <>
              <strong className="font-medium text-cream">
                versiegelten Waren, die aus Gründen des Gesundheitsschutzes
                oder der Hygiene nicht zur Rückgabe geeignet sind
              </strong>
              , wenn die Versiegelung nach der Lieferung entfernt wurde. Das
              betrifft geöffnete Parfüms, Abfüllungen und Proben.
            </>,
            "Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder Bestimmung durch dich massgeblich ist – etwa individuell nach deinen Vorgaben zusammengestellte Sets.",
            "Waren, die nach der Lieferung aufgrund ihrer Beschaffenheit untrennbar mit anderen Gütern vermischt wurden.",
          ]}
        />
        <p>
          Alle Flakons und Abfüllungen verlassen unser Lager versiegelt. Prüfe
          bitte zuerst am ungeöffneten Artikel, ob die Bestellung stimmt.
          Möchtest du einen Duft vorher riechen, sind unsere Proben der
          richtige Weg – sie sind genau dafür da.
        </p>
      </LegalSection>

      <LegalBox title="Muster-Widerrufsformular">
        <p className="text-xs text-subtle">
          Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular
          aus und sende es zurück. Die Verwendung ist freiwillig.
        </p>
        <div className="mt-3 whitespace-pre-line border-l-2 border-gold/40 pl-4 text-sm leading-relaxed">
          {`An:
${siteConfig.legalName}
${contact.street}
${contact.postalCode} ${contact.city}
${contact.email}

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

      <LegalSection title="Wie es praktisch abläuft">
        <p>
          Den Ablauf einer Rücksendung – Anmeldung, Verpackung, Erstattung –
          haben wir Schritt für Schritt unter{" "}
          <Link
            href="/rueckgabe"
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            Rückgabe &amp; Erstattung
          </Link>{" "}
          beschrieben.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
