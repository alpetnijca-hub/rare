/**
 * Duftnoten erkennen.
 *
 * Duftnoten werden von Hand eingetippt, und niemand schreibt sie genau so, wie
 * eine Nachschlagetabelle sie erwartet. In echten Daten steht „Oudholz“ statt
 * „Oud“, „Tabakblatt“ statt „Tabak“, „Muskatnuss“ statt „Muskat“ und
 * „Schwarzer Pfeffer“ statt „Pfeffer“. Ein exakter Vergleich findet davon
 * nichts.
 *
 * Deshalb wird geprüft, ob ein Stichwort **in** der Note steckt – und zwar das
 * längste, das passt. Das ist wichtig: „Eichenmoos“ enthält auch „Eiche“, und
 * ohne diese Regel landete das Moos beim Holz. „Orangenblüte“ enthält
 * „Orange“, gehört aber zu den Blüten.
 */

/** Kleinschreiben, Umlaute auflösen, alles Übrige entfernen. */
export function normalizeNote(note: string): string {
  return note
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z]/g, "");
}

/**
 * Das längste Stichwort, das in der Note steckt – oder `undefined`.
 *
 * Die Stichwörter müssen bereits normalisiert sein (kleingeschrieben, ohne
 * Umlaute); Tests halten das für beide Tabellen fest.
 */
export function findNoteKeyword(
  note: string,
  keywords: readonly string[],
): string | undefined {
  const normalized = normalizeNote(note);
  if (!normalized) return undefined;

  let treffer: string | undefined;

  for (const keyword of keywords) {
    if (!normalized.includes(keyword)) continue;
    if (treffer === undefined || keyword.length > treffer.length) {
      treffer = keyword;
    }
  }

  return treffer;
}
