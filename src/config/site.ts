/**
 * Zentrale Shop-Konfiguration.
 *
 * ⚠️ VOR DEM LIVEGANG AUSFÜLLEN
 * Alle mit «PLATZHALTER» markierten Werte müssen durch die echten
 * Unternehmensdaten ersetzt werden. Impressum, Datenschutzerklärung und AGB
 * greifen direkt auf diese Werte zu.
 */

export const siteConfig = {
  /** Anzeigename des Shops. */
  name: "Rare Scents",
  /** Rechtlicher Firmenname für Impressum, Rechnungen und E-Mails. */
  legalName: "PLATZHALTER – vollständiger Firmenname eintragen",
  tagline: "Düfte mit Charakter",
  description:
    "Ausgewählte Parfüms, Duftalternativen und Abfüllungen – sorgfältig kuratiert, ehrlich beschrieben und sicher versendet.",

  /** Öffentliche Basis-URL ohne abschliessenden Slash. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  ),

  locale: "de-CH",
  /**
   * Zahlenformat für Preise. "de-DE" zeigt EUR-Beträge als "49,90 €".
   * Wird auf CHF umgestellt, passt "de-CH" besser ("CHF 49.90").
   */
  priceLocale: "de-DE",
  language: "de",
  currency: "EUR" as const,
  country: "CH",
  countryName: "Schweiz",

  contact: {
    /** PLATZHALTER – echte Geschäftsadresse eintragen. */
    email: "PLATZHALTER@deine-domain.ch",
    phone: "PLATZHALTER – Telefonnummer",
    street: "PLATZHALTER – Strasse und Hausnummer",
    postalCode: "PLZ",
    city: "Ort",
    country: "Schweiz",
    /** PLATZHALTER – Handelsregisternummer / UID. */
    registrationNumber: "PLATZHALTER – UID / Handelsregisternummer",
    /** PLATZHALTER – Umsatzsteuer-Identifikationsnummer, falls vorhanden. */
    vatId: "PLATZHALTER – MwSt-Nummer",
    /** PLATZHALTER – vertretungsberechtigte Personen (beide Geschäftspartner). */
    representatives: "PLATZHALTER – Vorname Nachname, Vorname Nachname",
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
 * Der Satz wird in Basispunkten geführt: 810 = 8,10 %.
 */
export const taxConfig = {
  rateBp: Number.parseInt(process.env.SHOP_TAX_RATE_BP ?? "810", 10),
  pricesIncludeTax: (process.env.SHOP_PRICES_INCLUDE_TAX ?? "true") === "true",
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
