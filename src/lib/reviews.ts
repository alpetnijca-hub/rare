/**
 * Bewertungen.
 *
 * Nur wer einen Duft bestellt hat, kann ihn bewerten. Das ist keine
 * Bequemlichkeit, sondern die Bedingung dafür, dass im Shop überhaupt
 * „Bewertung von einer Käuferin“ stehen darf: Wer mit geprüften Bewertungen
 * wirbt, muss auch prüfen (Art. 3 Abs. 1 lit. s UWG). Deshalb hängt jede
 * Bewertung an einer Bestellung, und der Zugang läuft über den
 * Bestell-Token, den nur die Kundin hat.
 *
 * **Moderation heisst Missbrauch aussortieren, nicht Kritik.** Nur
 * freigegebene Bewertungen erscheinen im Shop – abgelehnt wird, was
 * beleidigt, wirbt oder offensichtlich nicht zum Duft gehört. Eine schlechte
 * Bewertung zurückzuhalten, weil sie schlecht ist, wäre irreführend und
 * genau das, was die Regel oben verbietet. Der Adminbereich sagt das an der
 * Stelle, an der freigegeben wird.
 *
 * Diese Datei enthält bewusst **keine** Datenbankzugriffe: Sie wird von
 * `src/lib/validation.ts` gebraucht, und das läuft auch im Browser. Ein
 * `import` von Prisma wanderte damit ins Browserpaket. Die Abfragen stehen
 * in `src/lib/review-queries.ts`.
 */

/** Kleinste und grösste Sternzahl. */
export const ratingMin = 1;
export const ratingMax = 5;

/**
 * Statuswerte einer Bestellung, ab denen bewertet werden darf.
 *
 * Vor dem Versand hat niemand den Duft gerochen. Eine Bewertung wäre dann
 * bestenfalls eine Meinung über die Verpackung.
 */
export const reviewableOrderStatuses = ["SHIPPED", "DELIVERED"] as const;

/** Ist die Sternzahl gültig? */
export function isRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= ratingMin &&
    value <= ratingMax
  );
}

/**
 * Anzeigename aus dem Vornamen der Bestellung.
 *
 * Nur der Vorname und der erste Buchstabe des Nachnamens – „Anna M.“. Der
 * volle Name gehört nicht unter eine öffentliche Bewertung, und niemand
 * rechnet damit, dass er dort erscheint.
 */
export function displayName(firstName: string, lastName: string): string {
  const vorname = firstName.trim();
  const initial = lastName.trim().charAt(0).toUpperCase();

  if (!vorname) return "Kundin oder Kunde";
  return initial ? `${vorname} ${initial}.` : vorname;
}

export interface ReviewSummary {
  /** Anzahl freigegebener Bewertungen. */
  count: number;
  /** Durchschnitt auf eine Nachkommastelle, oder `null` ohne Bewertungen. */
  average: number | null;
  /** Wie oft jede Sternzahl vergeben wurde, von 5 nach 1. */
  distribution: { rating: number; count: number }[];
}

/**
 * Wie viele Tage nach dem Versand um eine Bewertung gebeten wird.
 *
 * Nicht sofort: Am Versandtag hat niemand den Duft gerochen, und wer zu früh
 * fragt, bekommt eine Antwort über die Verpackung. Fünf Tage reichen für die
 * Zustellung innerhalb der Schweiz und für ein paar Mal Tragen.
 */
export const reviewInviteAfterDays = 5;
