import { baseCurrency } from "@/config/currencies";
import { envFlag, envInt, envText } from "@/lib/env";

/**
 * Zentrale Shop-Konfiguration.
 *
 * Impressum, Datenschutzerklärung, AGB, Rechnungen und E-Mails ziehen ihre
 * Angaben direkt aus dieser Datei. Wer hier etwas ändert, ändert es überall.
 */

export const siteConfig = {
  /** Anzeigename des Shops. */
  name: "Rare Scents",
  /**
   * Name, der im Impressum, in Bestellbestätigungen und auf Rechnungen steht.
   *
   * Bewusst nur der Firmenname ohne Personennamen: Der Shop wird von zu Hause
   * aus betrieben, deshalb sollen weder Inhabername noch Privatadresse
   * öffentlich auf der Website stehen. Siehe `contact.street` weiter unten –
   * dort steht auch, welches rechtliche Risiko damit verbunden ist.
   */
  legalName: "Rare Scents",
  /** Rechtsform – wird im Impressum ausgewiesen. */
  legalForm: "Einzelunternehmen",
  tagline: "Düfte mit Charakter",
  description:
    "Ausgewählte Parfüms, Duftalternativen und Abfüllungen – sorgfältig kuratiert, ehrlich beschrieben und sicher versendet.",

  /** Öffentliche Basis-URL ohne abschliessenden Slash. */
  url: envText(
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3000",
  ).replace(/\/$/, ""),

  locale: "de-CH",
  language: "de",

  /**
   * Abrechnungswährung. Wird ausschliesslich aus `src/config/currencies.ts`
   * bezogen, damit Stripe, Datenbank und Anzeige nicht auseinanderlaufen.
   * Die im Shop wählbare Anzeigewährung ändert daran nichts.
   */
  currency: baseCurrency.code,
  priceLocale: baseCurrency.locale,

  country: "CH",
  countryName: "Schweiz",

  contact: {
    email: "rarescents.swiss@gmail.com",
    /**
     * Telefonnummer ist optional. In der Schweiz verlangt Art. 3 Abs. 1 lit. s
     * UWG Name und Kontaktadresse einschliesslich E-Mail – eine Rufnummer ist
     * nicht zwingend. `null` blendet die Angabe überall sauber aus.
     */
    phone: null as string | null,
    /**
     * Postanschrift – absichtlich nicht veröffentlicht.
     *
     * ⚠️ Wichtig zu wissen: Art. 3 Abs. 1 lit. s UWG verlangt von
     * Onlineanbietern "klare und vollständige Angaben über seine Identität und
     * seine Kontaktadresse einschliesslich derjenigen der elektronischen
     * Post". Die herrschende Lehre versteht unter "Kontaktadresse" eine
     * Postanschrift; die E-Mail-Adresse kommt ausdrücklich *zusätzlich* dazu.
     * Eine reine E-Mail-Angabe erfüllt die Vorschrift also strenggenommen
     * nicht.
     *
     * Der Shop wird von einer Privatwohnung aus betrieben, die nicht im
     * Internet stehen soll. Sauberste Lösung: ein Postfach der Schweizerischen
     * Post oder eine c/o-Geschäftsadresse mieten und hier eintragen – dann
     * erscheint sie automatisch wieder im Impressum, in den AGB, in der
     * Datenschutzerklärung, im Footer und in allen E-Mails.
     *
     * Bis dahin nennen wir die Anschrift auf Anfrage per E-Mail
     * (siehe `addressOnRequestNote`).
     */
    street: null as string | null,
    postalCode: null as string | null,
    city: null as string | null,
    country: "Schweiz",
    /**
     * Nicht im Handelsregister eingetragen und keine UID vorhanden.
     * Sobald eine UID vergeben wird (Pflicht ab CHF 100'000 Jahresumsatz),
     * hier eintragen – das Impressum zeigt sie dann automatisch an.
     */
    registrationNumber: null as string | null,
    /** Keine MwSt-Nummer, da nicht mehrwertsteuerpflichtig. */
    vatId: null as string | null,
    /**
     * Vertretungsberechtigte Person(en). `null` blendet den Abschnitt im
     * Impressum aus – der Name wird auf Anfrage genannt.
     */
    representatives: null as string | null,
  },

  social: {
    instagram: "https://www.instagram.com/rarescents.swiss/",
    instagramHandle: "@rarescents.swiss",
  },

  /** Reaktionszeit für Kundenanfragen (Kontaktseite). */
  supportHours: "Montag bis Freitag, 9–17 Uhr",
  supportResponseTime: "in der Regel innerhalb von 24 Stunden",
} as const;

/**
 * Postanschrift als einzelne Zeilen.
 *
 * Leer, solange in `siteConfig.contact` keine Strasse und kein Ort hinterlegt
 * sind. Alle Seiten und E-Mails prüfen die Länge und blenden den Block dann
 * aus – so muss beim Eintragen einer Postfachadresse nur `site.ts` geändert
 * werden.
 */
export const postalAddressLines: readonly string[] = [
  siteConfig.contact.street,
  [siteConfig.contact.postalCode, siteConfig.contact.city]
    .filter(Boolean)
    .join(" ") || null,
  siteConfig.contact.city ? siteConfig.contact.country : null,
].filter((line): line is string => Boolean(line));

/** true, sobald eine Postanschrift öffentlich ausgewiesen wird. */
export const hasPublicAddress = postalAddressLines.length > 0;

/**
 * Ersatztext, solange keine Postanschrift veröffentlicht ist.
 * Bewusst kurz und ohne Ausreden formuliert.
 */
export const addressOnRequestNote =
  "Wir betreiben kein Ladengeschäft. Die vollständige Postanschrift des " +
  "Anbieters nennen wir auf Anfrage – eine kurze E-Mail genügt, und du " +
  "erhältst sie umgehend.";

/**
 * Steuerliche Einstellungen.
 * Der Satz wird in Basispunkten geführt: 810 entspräche 8,10 %.
 *
 * ⚠️ Aktuell 0, weil keine UID und keine Mehrwertsteuerpflicht besteht.
 * Wer nicht mehrwertsteuerpflichtig ist, darf keine MwSt ausweisen. Sobald
 * die Steuerpflicht eintritt (Umsatz ab CHF 100'000 pro Jahr), genügt
 * `SHOP_TAX_RATE_BP=810` in der Umgebung – der Shop weist die im Preis
 * enthaltene Steuer dann überall automatisch aus.
 */
export const taxConfig = {
  rateBp: envInt(process.env.SHOP_TAX_RATE_BP, 0),
  pricesIncludeTax: envFlag(process.env.SHOP_PRICES_INCLUDE_TAX, true),
} as const;

/**
 * Mindestbestellwert in Rappen, bezogen auf den Warenwert **vor** Rabatt.
 *
 * Warum vor Rabatt: Wer für CHF 15 in den Warenkorb legt, hat den
 * Mindestbestellwert erreicht. Ein Gutschein soll ihn nicht nachträglich
 * darunter drücken – das versteht niemand.
 *
 * Bewusst über eine Umgebungsvariable änderbar (`SHOP_MIN_ORDER_CENTS`),
 * damit sich der Betrag ohne Codeänderung anpassen lässt. `0` schaltet die
 * Regel ab.
 *
 * Rechtlich: Ein Mindestbestellwert ist zulässig, muss aber **vor** der
 * Bestellung klar erkennbar sein. Er steht deshalb im Warenkorb, an der Kasse,
 * in den AGB und in den häufigen Fragen.
 */
export const minOrderCents = envInt(process.env.SHOP_MIN_ORDER_CENTS, 1500);

/**
 * Ab diesem Warenwert liegt eine Gratis-Abfüllung bei, die sich die Kundschaft
 * selbst aussuchen darf. Rappen, `0` schaltet die Aktion ab.
 *
 * Bezugsgrösse ist wie beim Mindestbestellwert der Warenwert vor Rabatt: Wer
 * für CHF 120 einkauft, hat sich das Geschenk verdient – auch mit Gutschein.
 */
export const freeSampleFromCents = envInt(
  process.env.SHOP_FREE_SAMPLE_FROM_CENTS,
  12000,
);

/**
 * Grösste Abfüllung, die als Geschenk zulässig ist (in Millilitern).
 *
 * Wichtig als Sicherheitsgrenze: Die gewünschte Variante kommt aus dem
 * Browser. Ohne diese Prüfung liesse sich statt einer 2-ml-Probe ein
 * 100-ml-Flakon als „Geschenk“ anfordern.
 */
export const freeSampleMaxMl = envInt(process.env.SHOP_FREE_SAMPLE_MAX_ML, 2);

/** true, sobald ein Steuersatz konfiguriert ist. */
export const isVatRegistered = taxConfig.rateBp > 0;

/**
 * Rückgabebedingungen.
 *
 * Dieser Shop nimmt **keine Rückgaben ohne Grund** an. Parfüm ist ein
 * Kosmetikprodukt: Sobald eine Flasche oder Abfüllung die Hand des Käufers
 * verlassen hat, lässt sich nicht mehr feststellen, ob der Inhalt unverändert
 * ist. Weiterverkaufen darf man sie danach nicht mehr.
 *
 * Was rechtlich dahintersteht:
 *
 *  - In der Schweiz gibt es für Bestellungen über einen Onlineshop **kein
 *    gesetzliches Widerrufsrecht**. Art. 40a ff. OR gilt nur für Haustür- und
 *    Telefongeschäfte. Eine freiwillige Rückgabe wegzulassen ist deshalb
 *    zulässig – anders als in der EU, wo ein zwingendes Fernabsatzrecht gilt.
 *    Wir liefern ausschliesslich in die Schweiz (siehe `shippingCountries` in
 *    src/lib/shipping.ts). Wird das Liefergebiet je erweitert, braucht es
 *    zwingend eine echte Widerrufsbelehrung – dann ist diese Datei der erste
 *    Ort, der geändert werden muss.
 *  - **Die Gewährleistung bleibt.** Bei einem Mangel, einem Transportschaden
 *    oder einer Falschlieferung haftet der Verkäufer nach Art. 197 ff. OR,
 *    und diese Rechte lassen sich gegenüber Konsumentinnen und Konsumenten
 *    nicht wegbedingen (Art. 210 Abs. 4 OR; ein pauschaler Ausschluss wäre
 *    zudem nach Art. 8 UWG angreifbar). Ein Satz wie „keine Erstattung unter
 *    keinen Umständen“ darf deshalb nirgends auf der Seite stehen. Die
 *    Rechtstexte sagen „keine Rückgabe aus Hygienegründen“ und nennen den
 *    Weg für Mängel ausdrücklich daneben.
 *
 * Ob die Texte im Einzelfall genügen, kann nur eine Anwältin oder ein Anwalt
 * beurteilen – automatisch rechtssicher sind sie nicht.
 */
export const returnsPolicy = {
  /**
   * Nimmt der Shop Ware ohne Grund zurück? Nein – Kosmetik, Hygiene.
   *
   * Auf `true` zu stellen genügt nicht: Die Rechtstexte müssten dann wieder
   * eine Frist, einen Ablauf und die Kostenregelung nennen. Das Feld steht
   * hier, damit die Entscheidung an einer Stelle sichtbar ist und nicht in
   * einem Dutzend Seitentexte verstreut.
   */
  acceptsVoluntaryReturns: false,
  /**
   * Innerhalb wie vieler Tage ein Transportschaden gemeldet werden sollte.
   *
   * Das ist eine Bitte, keine Ausschlussfrist: Die gesetzliche
   * Gewährleistung läuft unabhängig davon weiter. Früh gemeldet lässt sich
   * ein Schaden nur einfacher gegenüber der Post belegen.
   */
  damageReportDays: 7,
} as const;

/** Schwelle, ab der das Dashboard vor niedrigem Bestand warnt (Fallback). */
export const defaultLowStockThreshold = 3;

/**
 * Wie lange eine Reservierung nach dem Anlegen einer Bestellung gilt.
 * Danach gibt der Cron-Job den Bestand wieder frei.
 */
export const reservationMinutes = 60;

/** Maximale Stückzahl je Position im Warenkorb. */
export const maxQuantityPerItem = 20;

/** Maximale Stückzahl je Vorbestellposition. */
export const maxPreorderQuantity = 5;
