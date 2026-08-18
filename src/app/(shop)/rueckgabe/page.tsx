import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { returnsPolicy, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Rückgabe & Erstattung",
  description: "Wie du Artikel zurücksendest und wann du dein Geld zurückerhältst.",
  alternates: { canonical: "/rueckgabe" },
};

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Rückgabe & Erstattung"
      intro="Was zu tun ist, wenn ein Duft nicht passt – und wie die Erstattung abläuft."
    >
      <LegalSection title="Ablauf in Kürze">
        <LegalList
          items={[
            <>
              Schreib uns innerhalb der Rückgabefrist an{" "}
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                {siteConfig.contact.email}
              </a>{" "}
              und nenne deine Bestellnummer.
            </>,
            "Wir bestätigen deine Rücksendung und nennen dir die Rücksendeadresse.",
            "Verpacke die Artikel so, dass sie unbeschädigt bei uns ankommen.",
            "Nach Eingang und Prüfung erstatten wir den Betrag auf dein ursprüngliches Zahlungsmittel.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Was zurückgegeben werden kann">
        <p>
          Ungeöffnete und originalversiegelte Artikel kannst du innerhalb von{" "}
          {returnsPolicy.voluntaryDays} Tagen ab Erhalt zurückgeben. Die
          rechtlichen Einzelheiten – und das gesetzliche Widerrufsrecht für
          Bestellungen aus der EU – stehen unter{" "}
          <Link
            href="/widerruf"
            className="text-gold underline underline-offset-2 hover:text-gold-light"
          >
            Rückgabe &amp; Widerruf
          </Link>
          .
        </p>
        <p>
          <strong className="font-medium text-cream">Wichtig:</strong> Bei
          geöffneten Parfüms und Abfüllungen ist eine Rückgabe aus Gründen der
          Hygiene ausgeschlossen, sobald die Versiegelung entfernt wurde. Genau
          dafür bieten wir Abfüllungen ab 2 ml an – so kannst du günstig
          testen, bevor du dich für eine grössere Größe entscheidest.
        </p>
      </LegalSection>

      <LegalSection title="Beschädigte oder falsche Artikel">
        <p>
          Ist etwas kaputt angekommen oder hast du einen falschen Artikel
          erhalten, gilt das Obige nicht: Melde dich einfach mit einem Foto bei
          uns. Wir schicken kostenlos Ersatz oder erstatten den vollen Betrag –
          ganz ohne Diskussion.
        </p>
      </LegalSection>

      <LegalSection title="Erstattung">
        <p>
          Wir erstatten immer auf das ursprünglich verwendete Zahlungsmittel.
          Die Bearbeitung starten wir nach Eingang und Prüfung der Rücksendung,
          spätestens innerhalb von {returnsPolicy.refundDays} Tagen nach Zugang
          deiner Rückgabe- oder Widerrufserklärung.
        </p>
        <p>
          Je nach Bank oder Zahlungsanbieter dauert es anschliessend weitere 5
          bis 10 Werktage, bis der Betrag auf deinem Konto sichtbar ist. Sobald
          wir die Erstattung ausgelöst haben, erhältst du von uns eine
          Bestätigungs-E-Mail.
        </p>
      </LegalSection>

      <LegalSection title="Rücksendekosten">
        <p>
          {returnsPolicy.returnShippingPaidBy === "customer"
            ? "Bei einer Rückgabe ohne Beanstandung trägst du die unmittelbaren Kosten der Rücksendung."
            : "Die unmittelbaren Kosten der Rücksendung übernehmen wir."}
        </p>
        <p>
          Bei berechtigten Reklamationen (Transportschaden, Falschlieferung,
          Mangel) übernehmen wir die Rücksendekosten in jedem Fall.
        </p>
      </LegalSection>

      <LegalSection title="Rücksendeadresse">
        <p>
          Bitte sende Retouren erst nach Rücksprache – so können wir sie deiner
          Bestellung zuordnen und schneller bearbeiten. Die Adresse teilen wir
          dir in unserer Antwort mit.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
