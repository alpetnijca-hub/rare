/**
 * Währungen.
 *
 * ── Abrechnungswährung ────────────────────────────────────────────────────
 * Die Abrechnung erfolgt ausnahmslos in Schweizer Franken. Alle Beträge in
 * Datenbank, Bestellungen, Stripe-Sessions, Rechnungen und E-Mails sind
 * Integer-Rappen in CHF. Es gibt keine Fliesskommazahlen für Geld und keine
 * zweite Abrechnungswährung – das hält Zahlungen, Rückerstattungen und die
 * Buchhaltung eindeutig.
 *
 * ── Anzeigewährung ────────────────────────────────────────────────────────
 * Besucherinnen und Besucher können zusätzlich eine Anzeigewährung wählen.
 * Diese rechnet die CHF-Preise nur zur Orientierung um. Der Umschalter ist
 * bewusst als reine Anzeigehilfe gebaut:
 *
 *   • Umgerechnete Beträge werden mit «ca.» gekennzeichnet.
 *   • Im Warenkorb und im Checkout steht sichtbar, dass in CHF belastet wird.
 *   • Der Server berechnet weiterhin ausschliesslich CHF-Beträge; die
 *     gewählte Anzeigewährung beeinflusst keine einzige Preisberechnung.
 *
 * ⚠️ WECHSELKURSE PFLEGEN
 * Die Kurse unten sind fest hinterlegte Näherungswerte und veralten. Setze
 * sie über die Umgebungsvariable `SHOP_DISPLAY_RATES`, z. B.
 *
 *     SHOP_DISPLAY_RATES="EUR:1.07,USD:1.24,GBP:0.92"
 *
 * (Format: <ISO-Code>:<Einheiten je 1 CHF>, mit Komma getrennt.)
 * Wer keine gepflegten Kurse anbieten will, setzt `SHOP_DISPLAY_RATES=""` –
 * dann entfällt der Umschalter und der Shop zeigt ausschliesslich CHF.
 */

export interface Currency {
  /** ISO-4217-Code, z. B. "CHF". */
  code: string;
  /** Anzeigename im Umschalter. */
  label: string;
  /** Locale für die Formatierung, z. B. "de-CH" -> "CHF 17.90". */
  locale: string;
  /** Wie viele Einheiten dieser Währung entsprechen 1 CHF. */
  unitsPerBase: number;
  /** true = tatsächliche Abrechnungswährung, false = reine Anzeige. */
  isBase: boolean;
}

/** Abrechnungswährung. Wird nirgends zur Laufzeit umgestellt. */
export const baseCurrency: Currency = {
  code: "CHF",
  label: "Schweizer Franken",
  locale: "de-CH",
  unitsPerBase: 1,
  isBase: true,
};

/** Anzeigewährungen, die zusätzlich angeboten werden dürfen. */
const convertibleCurrencies: Omit<Currency, "unitsPerBase" | "isBase">[] = [
  { code: "EUR", label: "Euro", locale: "de-DE" },
  { code: "USD", label: "US-Dollar", locale: "en-US" },
  { code: "GBP", label: "Britisches Pfund", locale: "en-GB" },
];

/** Näherungskurse, falls `SHOP_DISPLAY_RATES` nicht gesetzt ist. */
const fallbackRates: Record<string, number> = {
  EUR: 1.07,
  USD: 1.24,
  GBP: 0.92,
};

/** Liest `SHOP_DISPLAY_RATES`. Ungültige Einträge werden still übergangen. */
function parseConfiguredRates(): Record<string, number> | null {
  const raw = process.env.SHOP_DISPLAY_RATES;
  if (raw === undefined) return null;
  if (raw.trim() === "") return {};

  const rates: Record<string, number> = {};
  for (const entry of raw.split(",")) {
    const [code, value] = entry.split(":");
    if (!code || !value) continue;
    const rate = Number.parseFloat(value.trim());
    if (!Number.isFinite(rate) || rate <= 0) continue;
    rates[code.trim().toUpperCase()] = rate;
  }
  return rates;
}

const activeRates = parseConfiguredRates() ?? fallbackRates;

/**
 * Alle wählbaren Währungen. CHF steht immer an erster Stelle; weitere
 * erscheinen nur, wenn dafür ein Kurs hinterlegt ist.
 */
export const currencies: Currency[] = [
  baseCurrency,
  ...convertibleCurrencies.flatMap((currency) => {
    const rate = activeRates[currency.code];
    if (!rate) return [];
    return [{ ...currency, unitsPerBase: rate, isBase: false }];
  }),
];

/** Der Umschalter wird nur gezeigt, wenn es überhaupt etwas zu wählen gibt. */
export const currencySwitchingEnabled = currencies.length > 1;

/** Cookie, in dem die gewählte Anzeigewährung liegt (technisch notwendig). */
export const currencyCookieName = "rare-scents-currency";

/** Gültigkeit des Währungscookies in Sekunden (1 Jahr). */
export const currencyCookieMaxAge = 60 * 60 * 24 * 365;

/** Schlägt eine Währung nach; unbekannte Codes fallen auf CHF zurück. */
export function resolveCurrency(code: string | null | undefined): Currency {
  if (!code) return baseCurrency;
  const normalized = code.trim().toUpperCase();
  return (
    currencies.find((currency) => currency.code === normalized) ?? baseCurrency
  );
}
