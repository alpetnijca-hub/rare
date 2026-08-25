/**
 * Zustand der Admin-Formulare.
 *
 * Bewusst **ohne** `"use server"`: Aus einem Server-Actions-Modul dürfen
 * ausschliesslich async-Funktionen exportiert werden. Steht dort zusätzlich
 * eine Konstante oder ein Objekt, lehnt Next.js das gesamte Modul zur Laufzeit
 * ab – und zwar erst beim ersten Aufruf einer Aktion, nicht beim Bauen. Im
 * Browser erscheint dann nur ein nichtssagender React-Fehler.
 *
 * Typen allein wären unkritisch (sie verschwinden beim Kompilieren), aber
 * `idleState` ist ein echter Wert. Deshalb liegt beides hier.
 */

export interface ActionState {
  ok: boolean;
  message?: string;
  fields?: Record<string, string>;
}

export const idleState: ActionState = { ok: false };
