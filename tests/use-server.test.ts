import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Server-Actions-Module dürfen ausschliesslich async-Funktionen exportieren.
 *
 * Warum das einen eigenen Test verdient: Ein Verstoss fällt **nicht** beim
 * Typecheck und **nicht** beim Bauen auf. Er schlägt erst zur Laufzeit zu,
 * beim ersten Aufruf einer Aktion, und erscheint im Browser als
 * nichtssagender „Minified React error". Genau so ist in diesem Projekt der
 * gesamte Adminbereich lahmgelegt worden, ohne dass eine Prüfung angeschlagen
 * hätte.
 *
 * Erlaubt sind daneben nur reine Typ-Exporte – die verschwinden beim
 * Kompilieren und existieren zur Laufzeit nicht.
 */

function sammleDateien(verzeichnis: string): string[] {
  const treffer: string[] = [];
  for (const eintrag of readdirSync(verzeichnis)) {
    if (eintrag === "node_modules" || eintrag.startsWith(".")) continue;
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) {
      treffer.push(...sammleDateien(pfad));
    } else if (/\.(ts|tsx)$/.test(eintrag)) {
      treffer.push(pfad);
    }
  }
  return treffer;
}

/** Dateien, deren erste Anweisung "use server" ist. */
function serverActionsModule(): string[] {
  return sammleDateien("src").filter((pfad) => {
    const inhalt = readFileSync(pfad, "utf8");
    return /^\s*["']use server["'];/.test(inhalt);
  });
}

/** Exporte, die zur Laufzeit einen Wert erzeugen. */
function unerlaubteExporte(inhalt: string): string[] {
  const verstoesse: string[] = [];

  for (const zeile of inhalt.split("\n")) {
    const text = zeile.trim();
    if (!text.startsWith("export ")) continue;

    // Reine Typen sind unbedenklich.
    if (/^export\s+(type|interface)\b/.test(text)) continue;
    if (/^export\s+type\s*\{/.test(text)) continue;

    // Erlaubt: export async function …
    if (/^export\s+async\s+function\b/.test(text)) continue;

    verstoesse.push(text.replace(/\s+/g, " ").slice(0, 90));
  }

  return verstoesse;
}

describe('Module mit "use server"', () => {
  const dateien = serverActionsModule();

  it("werden überhaupt gefunden", () => {
    // Schutz gegen einen Test, der nichts prüft, weil die Suche ins Leere läuft.
    expect(dateien.length).toBeGreaterThan(0);
  });

  it.each(dateien)("%s exportiert nur async-Funktionen", (datei) => {
    const verstoesse = unerlaubteExporte(readFileSync(datei, "utf8"));
    expect(verstoesse).toEqual([]);
  });
});
