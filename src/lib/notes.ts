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

/**
 * Kleinschreiben, Akzente auflösen, alles Übrige entfernen.
 *
 * Über NFD zerlegt und die Zeichen ohne eigene Breite entfernt: Damit fallen
 * nicht nur Umlaute weg, sondern auch die französischen Akzente, die in
 * Duftnoten ständig vorkommen – „Crème brûlée“, „Thé vert“, „Café“. Vorher
 * blieb davon Buchstabensalat übrig und keine Note traf.
 *
 * ß wird vorher zu ss, weil es sich nicht zerlegen lässt.
 */
export function normalizeNote(note: string): string {
  return note
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
