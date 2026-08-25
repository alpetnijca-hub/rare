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
   * Rechtlicher Name für Impressum, Bestellbestätigungen und Rechnungen.
   * Einzelunternehmen ohne Handelsregistereintrag treten unter dem Namen der
   * Inhaberin bzw. des Inhabers auf; der Fantasiename darf ergänzend genannt
   * werden.
   */
  legalName: "Rare Scents, Inhaber Alvin Ramdedovic",
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
    street: "Neugasse 4b",
    postalCode: "9242",
    city: "Oberuzwil",
    country: "Schweiz",
    /**
     * Nicht im Handelsregister eingetragen und keine UID vorhanden.
     * Sobald eine UID vergeben wird (Pflicht ab CHF 100'000 Jahresumsatz),
     * hier eintragen – das Impressum zeigt sie dann automatisch an.
     */
    registrationNumber: null as string | null,
    /** Keine MwSt-Nummer, da nicht mehrwertsteuerpflichtig. */
    vatId: null as string | null,
    /** Vertretungsberechtigte Person(en). */
    representatives: "Alvin Ramdedovic",
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

/** true, sobald ein Steuersatz konfiguriert ist. */
export const isVatRegistered = taxConfig.rateBp > 0;

/**
 * Rückgabebedingungen.
 *
 * Wichtig zum Verständnis: In der Schweiz gibt es für Bestellungen über einen
 * Onlineshop **kein gesetzliches Widerrufsrecht**. Art. 40a ff. OR gilt nur
 * für Haustür- und Telefongeschäfte. Was wir anbieten, ist deshalb ein
 * freiwilliges, vertraglich zugesagtes Rückgaberecht – und daran sind wir
 * gebunden, sobald wir es auf der Seite /widerruf zusagen.
 *
 * Wir liefern ausschliesslich in die Schweiz (siehe `shippingCountries` in
 * src/lib/shipping.ts). Deshalb kommt zwingendes EU-Fernabsatzrecht hier
 * nicht zur Anwendung. Sollte das Liefergebiet je erweitert werden, müssen
 * die Rechtstexte um eine echte Widerrufsbelehrung ergänzt werden.
 */
export const returnsPolicy = {
  /** Freiwillige Rückgabefrist in Tagen ab Erhalt der Lieferung. */
  voluntaryDays: 14,
  /**
   * Wer trägt die Rücksendekosten?
   * "customer" ist zulässig, solange – wie hier – vor der Bestellung klar
   * darüber informiert wird. Auf "shop" umstellen, wenn ihr sie übernehmen
   * wollt; die Rechtstexte passen sich automatisch an.
   */
  returnShippingPaidBy: "customer" as "customer" | "shop",
  /** Frist für die Erstattung nach Eingang der Rücksendung, in Tagen. */
  refundDays: 14,
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
