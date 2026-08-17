/**
 * Cookie- und Consent-Konfiguration.
 *
 * Grundsatz: Ein Cookie-Banner wird nur dann angezeigt, wenn tatsächlich
 * nicht notwendige Cookies oder Dienste eingesetzt werden. Solange
 * `optionalServices` leer ist, erscheint kein Banner – das ist rechtlich
 * korrekt und für Besucher angenehmer als ein Banner ohne Zweck.
 */

export interface CookieService {
  /** Technischer Schlüssel, wird im Consent gespeichert. */
  key: string;
  category: "analytics" | "marketing" | "external";
  name: string;
  provider: string;
  purpose: string;
  /** Speicherdauer als Text, z. B. "13 Monate". */
  duration: string;
  /** Land der Datenverarbeitung – relevant für die Datenschutzerklärung. */
  processingCountry: string;
}

/**
 * Technisch notwendige Cookies. Diese sind ohne Einwilligung zulässig,
 * müssen aber in der Datenschutzerklärung aufgeführt werden.
 */
export const necessaryCookies: Array<{
  name: string;
  purpose: string;
  duration: string;
  type: "Cookie" | "Local Storage";
}> = [
  {
    name: "rare-scents-cart-v1",
    purpose:
      "Speichert die Artikel im Warenkorb, damit sie beim erneuten Besuch erhalten bleiben. Enthält nur Artikelnummern und Mengen.",
    duration: "Bis zum Löschen durch den Besucher",
    type: "Local Storage",
  },
  {
    name: "rare-scents-consent",
    purpose:
      "Speichert die Cookie-Entscheidung, damit die Auswahl nicht bei jedem Besuch erneut abgefragt wird.",
    duration: "6 Monate",
    type: "Local Storage",
  },
  {
    name: "authjs.session-token",
    purpose:
      "Sitzungscookie für die Anmeldung im internen Adminbereich. Wird nur für Mitarbeitende gesetzt, nicht für Kunden.",
    duration: "8 Stunden",
    type: "Cookie",
  },
  {
    name: "authjs.csrf-token",
    purpose:
      "Schützt Anmeldeformulare des Adminbereichs vor websiteübergreifender Anfragenfälschung (CSRF).",
    duration: "Sitzung",
    type: "Cookie",
  },
  {
    name: "__stripe_mid / __stripe_sid",
    purpose:
      "Wird von Stripe während des Bezahlvorgangs zur Betrugsprävention gesetzt. Erforderlich, um Zahlungen sicher abzuwickeln.",
    duration: "bis zu 1 Jahr",
    type: "Cookie",
  },
];

/**
 * Nicht notwendige Dienste.
 *
 * ⚠️ LEER LASSEN, solange keine Analyse- oder Marketingdienste eingesetzt
 * werden. Sobald hier ein Eintrag steht, erscheint automatisch das
 * Cookie-Banner, und der Dienst darf erst nach Einwilligung geladen werden
 * (siehe `useConsent()` in src/components/cookie-consent.tsx).
 *
 * Beispiel für einen späteren Eintrag:
 *
 * {
 *   key: "ga4",
 *   category: "analytics",
 *   name: "Google Analytics 4",
 *   provider: "Google Ireland Limited",
 *   purpose: "Auswertung des Besucherverhaltens zur Verbesserung des Shops.",
 *   duration: "14 Monate",
 *   processingCountry: "Irland / USA",
 * }
 */
export const optionalServices: CookieService[] = [];

export const consentStorageKey = "rare-scents-consent";

/** Version des Einwilligungstexts – bei Änderungen erhöhen. */
export const consentVersion = 1;

export function hasOptionalServices(): boolean {
  return optionalServices.length > 0;
}

export function servicesByCategory(category: CookieService["category"]) {
  return optionalServices.filter((service) => service.category === category);
}
