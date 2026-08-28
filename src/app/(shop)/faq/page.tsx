import type { Metadata } from "next";
import Link from "next/link";
import { minOrderCents, returnsPolicy, siteConfig } from "@/config/site";
import { shippingMethods } from "@/lib/shipping";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = {
  title: "Häufige Fragen",
  description:
    "Antworten zu Abfüllungen, Lieferzeiten, Haltbarkeit, Rückgabe und Duftalternativen.",
  alternates: { canonical: "/faq" },
};

interface FaqEntry {
  question: string;
  answer: string;
}

const groups: Array<{ title: string; entries: FaqEntry[] }> = [
  {
    title: "Produkte und Abfüllungen",
    entries: [
      {
        question: "Was genau ist eine Abfüllung?",
        answer:
          "Eine Abfüllung ist eine kleinere Menge eines Duftes, die wir von Hand aus einem grösseren Gebinde in einen kleinen Flakon umfüllen. Der Inhalt ist identisch mit dem Duft aus der Originalgröße – nur die Menge ist kleiner. So kannst du ab 2 ml in Ruhe testen, bevor du dich für einen ganzen Flakon entscheidest.",
      },
      {
        question: "Was bedeutet „Duftalternative“?",
        answer:
          "Eine Duftalternative ist ein eigenständiges Produkt, das in eine bestimmte Duftrichtung geht – aber keine Originalware ist. Es besteht keine Verbindung, Lizenz oder Zusammenarbeit mit den Herstellern anderer Düfte. Wir kennzeichnen solche Produkte immer klar als Duftalternative und behaupten nie, dass sie mit einem geschützten Duft identisch sind.",
      },
      {
        question: "Wie lange hält ein Duft auf der Haut?",
        answer:
          "Das hängt stark von Duftfamilie und Hauttyp ab. Zitrische und frische Kompositionen bleiben meist 3 bis 5 Stunden wahrnehmbar, orientalische und holzige Düfte mit Amber, Oud oder Vanille deutlich länger. Auf trockener Haut verfliegen Düfte schneller – eine unparfümierte Feuchtigkeitspflege vor dem Auftragen hilft.",
      },
      {
        question: "Wie bewahre ich Parfüm richtig auf?",
        answer:
          "Kühl, dunkel und trocken – am besten im Schrank statt im Badezimmer. Wärme, Licht und Temperaturschwankungen bauen Duftstoffe schneller ab. Ungeöffnet hält Parfüm mehrere Jahre; nach dem Öffnen empfehlen wir, es innerhalb von etwa zwei Jahren zu verbrauchen.",
      },
      {
        question: "Sind die Produkte für empfindliche Haut geeignet?",
        answer:
          "Parfüms enthalten Duftstoffe, die allergische Reaktionen auslösen können. Die Inhaltsstoffe stehen auf jeder Produktseite und auf der Verpackung. Bei bekannten Unverträglichkeiten teste bitte zuerst an einer kleinen Hautstelle. Bei Unsicherheit frag bitte ärztlichen Rat.",
      },
    ],
  },
  {
    title: "Bestellung und Zahlung",
    entries: [
      {
        question: "Brauche ich ein Kundenkonto?",
        answer:
          "Nein. Du kannst als Gast bestellen – wir benötigen nur die Angaben, die für Lieferung und Rechnung erforderlich sind. Den Status deiner Bestellung rufst du über den persönlichen Link in der Bestellbestätigung ab.",
      },
      {
        question: "Gibt es einen Mindestbestellwert?",
        answer: `Ja, ${formatPrice(minOrderCents)} Warenwert ohne Versandkosten. Zwei Abfüllungen genügen dafür in der Regel. Fehlt noch etwas, zeigen wir dir im Warenkorb genau an, wie viel.`,
      },
      {
        question: "Welche Zahlungsarten gibt es?",
        answer:
          "Kredit- und Debitkarte sowie – abhängig von deinem Gerät – Apple Pay und Google Pay. Die Zahlung läuft über Stripe. Deine Zahlungsdaten werden ausschliesslich dort verarbeitet und erreichen unsere Server nie. Wir speichern keine vollständigen Kartendaten.",
      },
      {
        question: "Wann wird der Betrag abgebucht?",
        answer:
          "Direkt beim Abschluss der Bestellung. Bricht die Zahlung ab, wird nichts abgebucht und deine Bestellung kommt nicht zustande – reservierte Artikel geben wir automatisch wieder frei.",
      },
      {
        question: "Kann ich meine Bestellung noch ändern?",
        answer:
          "Solange wir noch nicht versendet haben, meist ja. Schreib uns möglichst schnell mit deiner Bestellnummer – wir versuchen, die Änderung noch zu berücksichtigen.",
      },
    ],
  },
  {
    title: "Versand und Lieferung",
    entries: [
      {
        question: "Was kostet der Versand?",
        answer: `${shippingMethods
          .map(
            (method) =>
              `${method.label}: ${formatPrice(method.priceCents)}${
                method.freeFromCents !== null
                  ? ` (kostenlos ab ${formatPrice(method.freeFromCents)})`
                  : ""
              }`,
          )
          .join(" · ")}. Die Kosten werden vor Abschluss der Bestellung ausgewiesen – versteckte Gebühren gibt es nicht.`,
      },
      {
        question: "Wie lange dauert die Lieferung?",
        answer:
          "Lagerware verlässt uns in der Regel innerhalb von 1 bis 2 Werktagen, dazu kommt die Transportzeit. Die konkrete Lieferzeit steht bei jedem Artikel und noch einmal im Warenkorb. Sie beginnt mit dem bestätigten Zahlungseingang.",
      },
      {
        question: "Was passiert bei unterschiedlichen Lieferzeiten?",
        answer:
          "Wir versenden standardmässig alles zusammen, sobald die komplette Bestellung bereitsteht. Möchtest du die verfügbaren Artikel vorab, schreib uns kurz – wir teilen die Lieferung dann ohne Zusatzkosten auf.",
      },
      {
        question: "Was bedeutet „vorbestellbar“?",
        answer:
          "Der Artikel ist gerade nicht auf Lager, aber bereits fest bestellbar. Auf der Produktseite steht, mit welchem Versandzeitraum du rechnen kannst. Verzögert sich die Verfügbarkeit deutlich, informieren wir dich und du kannst kostenfrei zurücktreten.",
      },
    ],
  },
  {
    title: "Rückgabe",
    entries: [
      {
        question: "Kann ich einen Duft zurückgeben, der mir nicht gefällt?",
        answer:
          `Ungeöffnete und originalversiegelte Artikel ja – wir räumen dir freiwillig ${returnsPolicy.voluntaryDays} Tage Rückgaberecht ein. Bei geöffneten Parfüms und Abfüllungen ist eine Rückgabe aus Hygienegründen ausgeschlossen. Genau deshalb gibt es unsere Abfüllungen ab 2 ml – teste erst günstig, entscheide dann.`,
      },
      {
        question: "Der Artikel ist beschädigt angekommen – was nun?",
        answer:
          "Schreib uns mit einem Foto. Wir schicken kostenlos Ersatz oder erstatten den vollen Betrag. Die Rücksendekosten übernehmen wir in diesem Fall selbstverständlich.",
      },
      {
        question: "Wie lange dauert eine Erstattung?",
        answer:
          "Wir lösen die Erstattung nach Eingang und Prüfung der Rücksendung aus. Bis der Betrag auf deinem Konto sichtbar ist, vergehen je nach Bank weitere 5 bis 10 Werktage.",
      },
    ],
  },
];

export default function FaqPage() {
  // Strukturierte Daten für Suchmaschinen.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((group) =>
      group.entries.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: entry.answer },
      })),
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-shop py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <header className="mb-12">
            <p className="eyebrow mb-3">Hilfe</p>
            <h1 className="text-4xl md:text-5xl">Häufige Fragen</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
              Antworten auf das, was uns am häufigsten geschrieben wird. Ist
              deine Frage nicht dabei, melde dich einfach über die{" "}
              <Link
                href="/kontakt"
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                Kontaktseite
              </Link>
              .
            </p>
          </header>

          <div className="flex flex-col gap-12">
            {groups.map((group) => (
              <section key={group.title} aria-labelledby={`faq-${group.title}`}>
                <h2
                  id={`faq-${group.title}`}
                  className="mb-5 border-b border-line pb-3 text-xl md:text-2xl"
                >
                  {group.title}
                </h2>

                <div className="flex flex-col">
                  {group.entries.map((entry) => (
                    <details
                      key={entry.question}
                      className="group border-b border-line/70 py-4"
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] text-cream transition-colors hover:text-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
                        <span>{entry.question}</span>
                        <span
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-gold transition-transform duration-300 group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="mt-3 pr-8 text-sm leading-relaxed text-muted">
                        {entry.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-14 border border-line bg-charcoal p-6 md:p-8">
            <h2 className="text-xl">Noch eine Frage offen?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Schreib uns an{" "}
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                {siteConfig.contact.email}
              </a>{" "}
              oder über Instagram. Wir antworten {siteConfig.supportResponseTime}.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
