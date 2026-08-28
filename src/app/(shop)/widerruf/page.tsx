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
  title: "Rückgaberecht",
  description:
    "Unser freiwilliges Rückgaberecht: Fristen, Voraussetzungen und Ablauf.",
  alternates: { canonical: "/widerruf" },
};

const returnShippingByCustomer = returnsPolicy.returnShippingPaidBy === "customer";

export default function ReturnRightPage() {
  const { contact } = siteConfig;

  return (
    <LegalPage
      title="Rückgaberecht"
      intro="Was gilt, wenn du eine Bestellung zurückgeben möchtest."
      lastUpdated="20. August 2026"
      notice="review"
    >
      <LegalSection title="Kurz gesagt">
        <LegalList
          items={[
            <>
              <strong className="font-medium text-cream">
                {returnsPolicy.voluntaryDays} Tage Rückgaberecht
              </strong>{" "}
              auf ungeöffnete, originalversiegelte Artikel – freiwillig von uns
              zugesagt.
            </>,
            <>
              <strong className="font-medium text-cream">
                Geöffnete Parfüms und Abfüllungen
              </strong>{" "}
              können wir aus Hygienegründen nicht zurücknehmen.
            </>,
            <>
              <strong className="font-medium text-cream">
                Bei Mängeln, Transportschäden oder Falschlieferung
              </strong>{" "}
              gilt das nicht – da findest du immer eine Lösung mit uns, und die
              Rücksendung geht auf uns.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Kein gesetzliches Widerrufsrecht – warum wir trotzdem eines geben">
        <p>
          Bestellungen über einen Onlineshop fallen in der Schweiz{" "}
          <strong className="font-medium text-cream">
            nicht unter ein gesetzliches Widerrufsrecht
          </strong>
          . Das in Art. 40a ff. OR geregelte Widerrufsrecht gilt nur für
          Haustür- und ähnliche Geschäfte sowie für telefonisch geschlossene
          Verträge – nicht für Bestellungen im Internet.
        </p>
        <p>
          Wir halten das für keine gute Grundlage für eine Kundenbeziehung.
          Deshalb sagen wir dir vertraglich ein Rückgaberecht zu. Es ist
          freiwillig, aber verbindlich: Was hier steht, gilt.
        </p>
      </LegalSection>

      <LegalSection title="Voraussetzungen">
        <LegalList
          items={[
            <>
              Die Rückgabe erfolgt innerhalb von{" "}
              {returnsPolicy.voluntaryDays} Tagen ab Erhalt der Lieferung.
              Massgeblich ist das Datum deiner Nachricht an uns.
            </>,
            "Die Artikel sind unbenutzt und die Originalversiegelung ist unversehrt.",
            "Die Umverpackung ist so weit erhalten, dass ein Weiterverkauf möglich bleibt.",
            "Du meldest die Rücksendung vorher kurz per E-Mail an – so können wir sie zuordnen und dir die richtige Adresse nennen.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Wovon wir keine Rückgabe annehmen können">
        <LegalList
          items={[
            <>
              <strong className="font-medium text-cream">
                Geöffnete Parfüms, Abfüllungen und Proben.
              </strong>{" "}
              Sobald die Versiegelung entfernt ist, lässt sich nicht mehr
              ausschliessen, dass der Inhalt verändert wurde. Aus Gründen des
              Gesundheitsschutzes und der Hygiene ist eine Rückgabe deshalb
              ausgeschlossen.
            </>,
            "Individuell nach deinen Wünschen abgefüllte Sonderanfertigungen.",
            "Artikel, die sichtbar benutzt oder beschädigt wurden.",
          ]}
        />
        <p>
          Alle Flakons und Abfüllungen verlassen unser Lager versiegelt. Prüfe
          bitte zuerst am ungeöffneten Artikel, ob die Bestellung stimmt.
          Möchtest du einen Duft vorher riechen, sind unsere Abfüllungen ab
          2&nbsp;ml genau dafür da – deutlich günstiger als ein Fehlkauf.
        </p>
      </LegalSection>

      <LegalSection title="Kosten">
        <p>
          {returnShippingByCustomer
            ? "Die Kosten der Rücksendung trägst du. Wir empfehlen einen versicherten Versand mit Sendungsverfolgung – bis die Ware bei uns ankommt, liegt das Risiko bei dir."
            : "Die Kosten der Rücksendung übernehmen wir. Melde die Rücksendung an, dann erhältst du von uns ein Retourenetikett."}
        </p>
        <p>
          Bei berechtigten Beanstandungen – Transportschaden, Falschlieferung
          oder Mangel – übernehmen wir die Rücksendekosten in jedem Fall.
        </p>
      </LegalSection>

      <LegalSection title="Erstattung">
        <p>
          Nach Eingang und Prüfung der Rücksendung erstatten wir den Kaufpreis
          innerhalb von {returnsPolicy.refundDays} Tagen auf dasselbe
          Zahlungsmittel, mit dem du bezahlt hast. Je nach Bank dauert es
          anschliessend weitere fünf bis zehn Werktage, bis der Betrag
          sichtbar ist.
        </p>
        <p>
          Die ursprünglichen Versandkosten erstatten wir bei einer vollständigen
          Rückgabe mit. Bei einer Teilrückgabe bleiben sie bestehen.
        </p>
      </LegalSection>

      <LegalBox title="So meldest du eine Rückgabe an">
        <p>
          Eine formlose E-Mail genügt. Damit es schnell geht, nenn uns bitte:
        </p>
        <div className="mt-3 whitespace-pre-line border-l-2 border-gold/40 pl-4 text-sm leading-relaxed">
          {`An: ${contact.email}
Betreff: Rückgabe Bestellung <Bestellnummer>

Bestellnummer:
Artikel, die zurückgehen sollen:
Grund (freiwillig):
Name und Adresse:`}
        </div>
        <p className="mt-4">
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent("Rückgabe Bestellung")}`}
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            {contact.email}
          </a>
        </p>
      </LegalBox>

      <LegalSection title="Deine Rechte bei mangelhafter Ware">
        <p>
          Unabhängig von diesem freiwilligen Rückgaberecht gelten deine
          gesetzlichen Gewährleistungsrechte nach Art. 197 ff. OR. Die
          schränken wir mit keiner Bestimmung dieser Seite ein.
        </p>
      </LegalSection>

      <LegalSection title="Ablauf im Detail">
        <p>
          Wie eine Rücksendung praktisch abläuft – Verpackung, Adresse,
          Erstattung – steht Schritt für Schritt unter{" "}
          <Link
            href="/rueckgabe"
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            Rückgabe &amp; Erstattung
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
