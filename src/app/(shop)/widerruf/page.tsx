import type { Metadata } from "next";
import {
  LegalBox,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal/legal-page";
import { returnsPolicy, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Rückgabe & Hygiene",
  description:
    "Warum wir Parfüm nicht zurücknehmen – und was gilt, wenn etwas defekt ankommt.",
  alternates: { canonical: "/widerruf" },
};

export default function ReturnRightPage() {
  const { contact } = siteConfig;

  return (
    <LegalPage
      title="Rückgabe & Hygiene"
      intro="Parfüm ist ein Kosmetikprodukt. Was das für eine Rückgabe bedeutet – und was gilt, wenn etwas nicht in Ordnung ist."
      lastUpdated="28. August 2026"
      notice="review"
    >
      <LegalSection title="Kurz gesagt">
        <LegalList
          items={[
            <>
              <strong className="font-medium text-cream">
                Wir nehmen keine Ware zurück
              </strong>{" "}
              und erstatten den Kaufpreis nicht, wenn ein Duft dir schlicht
              nicht gefällt. Parfüm ist ein Kosmetikprodukt – einmal aus der
              Hand gegeben, dürfen wir es nicht wieder verkaufen.
            </>,
            <>
              <strong className="font-medium text-cream">
                Ist etwas defekt, beschädigt oder falsch geliefert
              </strong>
              , gilt das nicht. Dann melde dich, und wir finden eine Lösung –
              Ersatz oder Geld zurück, und die Rücksendung geht auf uns.
            </>,
            <>
              <strong className="font-medium text-cream">
                Deshalb gibt es Abfüllungen ab 2&nbsp;ml.
              </strong>{" "}
              Für wenige Franken herausfinden, ob ein Duft zu dir passt, ist
              günstiger als ein grosser Flakon, der dann steht.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Warum keine Rückgabe">
        <p>
          Jeder Flakon und jede Abfüllung verlässt unser Lager versiegelt.
          Sobald diese Versiegelung entfernt ist, lässt sich nicht mehr
          feststellen, ob der Inhalt unverändert ist – ob nichts entnommen,
          nichts hinzugefügt und die Flüssigkeit richtig gelagert wurde. Ein
          Produkt, das auf die Haut kommt, dürfen wir in diesem Zustand nicht
          an die nächste Person weitergeben.
        </p>
        <p>
          Das ist keine Bequemlichkeit, sondern der Grund, warum Rückgaben bei
          Kosmetik branchenüblich ausgeschlossen sind. Wir sagen es lieber
          vorher klar, als es später im Einzelfall zu verhandeln.
        </p>
      </LegalSection>

      <LegalSection title="Kein gesetzliches Widerrufsrecht in der Schweiz">
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
          Es gibt bei uns also weder ein gesetzliches noch ein freiwillig
          zugesagtes Rückgaberecht. Mit dem Abschluss der Bestellung ist der
          Kauf verbindlich.
        </p>
      </LegalSection>

      <LegalSection title="Wenn etwas nicht in Ordnung ist">
        <p>
          Davon unberührt bleiben deine gesetzlichen Gewährleistungsrechte nach
          Art. 197&nbsp;ff. OR. Die schränken wir mit keiner Bestimmung dieser
          Seite ein – sie lassen sich gegenüber Konsumentinnen und Konsumenten
          auch gar nicht wegbedingen.
        </p>
        <p>Melde dich bitte in diesen Fällen:</p>
        <LegalList
          items={[
            "Der Artikel ist beschädigt oder ausgelaufen angekommen.",
            "Du hast einen anderen Artikel erhalten als bestellt.",
            "Die Menge stimmt nicht oder etwas fehlt in der Sendung.",
            "Der Duft weist einen erkennbaren Mangel auf.",
          ]}
        />
        <p>
          Ein Foto hilft uns, den Fall schnell zu klären. Wir schicken dann
          kostenlos Ersatz oder erstatten den Betrag vollständig auf das
          Zahlungsmittel, mit dem du bezahlt hast – die Rücksendekosten
          übernehmen wir. Transportschäden meldest du am besten innerhalb von{" "}
          {returnsPolicy.damageReportDays} Tagen; das ist eine Bitte und keine
          Ausschlussfrist, aber gegenüber der Post lässt sich ein frischer
          Schaden deutlich einfacher belegen.
        </p>
      </LegalSection>

      <LegalBox title="So meldest du einen Mangel">
        <p>Eine formlose E-Mail genügt. Damit es schnell geht, nenn uns bitte:</p>
        <div className="mt-3 whitespace-pre-line border-l-2 border-gold/40 pl-4 text-sm leading-relaxed">
          {`An: ${contact.email}
Betreff: Reklamation Bestellung <Bestellnummer>

Bestellnummer:
Betroffener Artikel:
Was ist nicht in Ordnung:
Foto im Anhang:`}
        </div>
        <p className="mt-4">
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent("Reklamation Bestellung")}`}
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            {contact.email}
          </a>
        </p>
      </LegalBox>

      <LegalSection title="Vor der Bestellung testen">
        <p>
          Weil eine Rückgabe nicht möglich ist, gibt es fast jeden Duft als
          Abfüllung ab 2&nbsp;ml. Damit kannst du einen Duft mehrere Tage auf
          der eigenen Haut tragen, bevor du dich für eine grössere Größe
          entscheidest – das ist der ehrlichste Test, den es gibt, und er
          kostet einen Bruchteil.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
