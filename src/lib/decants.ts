/**
 * Abfüllungen – die kleinen Größen zum Testen.
 *
 * Eine Abfüllung ist hier über die Menge definiert: alles von 1 bis 10 ml.
 * Bewusst nicht über das Häkchen „Probengröße“ im Adminbereich, denn dieses
 * Häkchen ist von Hand gesetzt und irgendwann vergisst man es. Die Menge steht
 * ohnehin an jeder Größe und kann nicht falsch sein.
 *
 * Daraus wird im Shop eine Kategorie, die niemand pflegen muss: Sobald ein
 * Duft eine Größe zwischen 1 und 10 ml hat, steht er unter „Abfüllungen“.
 * Kommt eine solche Größe dazu oder fällt weg, ändert sich die Liste von
 * selbst.
 */

import { normalizeNote } from "@/lib/notes";

/** Kleinste Menge, die noch als Abfüllung zählt. */
export const decantMinMl = 1;

/** Grösste Menge, die noch als Abfüllung zählt. */
export const decantMaxMl = 10;

/**
 * Die Kategorie, unter der Abfüllungen im Shop erscheinen.
 *
 * Der Slug ist reserviert: Eine eigene Kategorie mit demselben Slug im
 * Adminbereich würde von dieser hier verdeckt. `filterCategories()` sortiert
 * eine solche Dublette deshalb aus, damit sie nicht zweimal in der Liste
 * steht.
 */
export const decantCategory = {
  slug: "abfuellungen",
  name: "Abfüllungen",
} as const;

/** Gehört diese Menge zu den Abfüllungen? */
export function isDecantVolume(volumeMl: number): boolean {
  return volumeMl >= decantMinMl && volumeMl <= decantMaxMl;
}

/** Nur die Abfüllungen aus einer Größenliste. */
export function decantsOf<T extends { volumeMl: number }>(
  variants: readonly T[],
): T[] {
  return variants.filter((variant) => isDecantVolume(variant.volumeMl));
}

/**
 * Sucheingaben, die dieselbe Auswahl meinen.
 *
 * Wer „Abfüllungen“ in das Suchfeld tippt, sucht keinen Duft dieses Namens –
 * er will die kleinen Größen sehen. Eine reine Textsuche liefert hier nichts,
 * weil kein Produkt so heisst; deshalb wird der Begriff auf die Kategorie
 * umgelegt.
 *
 * Verglichen wird der **ganze** Suchbegriff, nicht ein Teil davon. „Abfüllung
 * Oud“ bleibt damit eine normale Textsuche nach Oud-Abfüllungen und wird
 * nicht stillschweigend zur ganzen Kategorie aufgeblasen.
 */
const decantSearchTerms = new Set([
  "abfullung",
  "abfullungen",
  "abfuellung",
  "abfuellungen",
  "probe",
  "proben",
  "probengrosse",
  "probengrossen",
  "duftprobe",
  "duftproben",
  "tester",
  "decant",
  "decants",
  "sample",
  "samples",
]);

/** Meint dieser Suchbegriff die Kategorie „Abfüllungen“? */
export function isDecantSearch(term: string): boolean {
  // Dieselbe Faltung wie bei den Duftnoten: kleingeschrieben, ohne Umlaute und
  // Akzente. Eine zweite Fassung davon würde irgendwann auseinanderlaufen.
  const normalized = normalizeNote(term);

  return normalized.length > 0 && decantSearchTerms.has(normalized);
}
