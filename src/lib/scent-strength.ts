/**
 * Haltbarkeit und Sillage.
 *
 * Zwei Angaben, die jeder Duftkäufer wissen will und die in keiner Duftnote
 * stehen: Wie lange hält der Duft, und wie weit trägt er?
 *
 * Beides ist hier besonders wichtig, weil der Shop keine Rückgabe annimmt
 * (siehe `returnsPolicy` in src/config/site.ts). Je besser jemand vor dem
 * Kauf weiss, worauf er sich einlässt, desto seltener steht am Ende eine
 * Flasche herum, die nicht passt.
 *
 * Die Skala geht von 1 bis 5 und wird von Hand eingetragen – es ist eine
 * Einschätzung aus dem eigenen Tragen und keine Messung. Genau so steht es
 * auch auf der Produktseite; eine erfundene Genauigkeit wäre schlimmer als
 * gar keine Angabe.
 */

/** Kleinster und grösster Wert der Skala. */
export const strengthMin = 1;
export const strengthMax = 5;

/** Wie lange der Duft auf der Haut bleibt. */
export const longevityLabels: Record<number, string> = {
  1: "Kurz – ein bis zwei Stunden",
  2: "Mässig – etwa drei bis vier Stunden",
  3: "Solide – ein halber Tag",
  4: "Lang – der ganze Tag",
  5: "Sehr lang – noch am nächsten Morgen",
};

/** Wie weit der Duft um die Trägerin herum wahrnehmbar ist. */
export const sillageLabels: Record<number, string> = {
  1: "Hautnah – nur aus nächster Nähe",
  2: "Dezent – eine Armlänge",
  3: "Deutlich – am Tisch wahrnehmbar",
  4: "Stark – im ganzen Raum",
  5: "Sehr stark – hinterlässt eine Spur",
};

/** Ist der Wert eine gültige Angabe auf der Skala? */
export function isStrength(value: number | null | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= strengthMin &&
    value <= strengthMax
  );
}

/**
 * Der Text zu einem Wert – oder `null`, wenn nichts eingetragen ist.
 *
 * Nicht eingetragen heisst wirklich nicht anzeigen. Ein Balken bei „0“ oder
 * ein „keine Angabe“ nimmt Platz weg und sagt nichts.
 */
export function strengthLabel(
  kind: "longevity" | "sillage",
  value: number | null | undefined,
): string | null {
  if (!isStrength(value)) return null;
  const table = kind === "longevity" ? longevityLabels : sillageLabels;
  return table[value] ?? null;
}

/** Die Werte 1…5 als Liste – für Auswahlfelder und Balken. */
export const strengthSteps: readonly number[] = Array.from(
  { length: strengthMax - strengthMin + 1 },
  (_, index) => strengthMin + index,
);
