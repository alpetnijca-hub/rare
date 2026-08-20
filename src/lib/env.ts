/**
 * Umgebungsvariablen robust lesen.
 *
 * Hintergrund: Beim Import in Vercel werden alle Schlüssel aus `.env.example`
 * erkannt und als Zeilen vorgeschlagen. Wer eine Zeile stehen lässt, ohne
 * einen Wert einzutragen, setzt die Variable damit auf den **leeren String** –
 * und ein leerer String ist etwas anderes als "nicht gesetzt":
 *
 *   process.env.FOO ?? "standard"      // -> "" , nicht "standard"
 *   Number.parseInt("", 10)            // -> NaN
 *
 * Beides führt zu stillen Folgefehlern (leere Links in E-Mails, NaN-Beträge in
 * Bestellungen). Die Helfer hier behandeln leere und nur aus Leerzeichen
 * bestehende Werte deshalb konsequent wie "nicht gesetzt".
 *
 * Wichtig: Die Funktionen nehmen den **Wert**, nicht den Namen der Variablen.
 * `NEXT_PUBLIC_`-Werte werden beim Bauen nur dann in das Browser-Bundle
 * eingesetzt, wenn `process.env.NEXT_PUBLIC_X` wörtlich im Code steht – ein
 * dynamischer Zugriff über `process.env[name]` wäre dort undefined.
 */

/** Liefert den getrimmten Wert oder `undefined`, wenn nichts Sinnvolles drinsteht. */
export function envValue(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** Wie `envValue`, aber mit Rückfallwert. */
export function envText(raw: string | undefined, fallback: string): string {
  return envValue(raw) ?? fallback;
}

/**
 * Ganzzahl aus einer Umgebungsvariablen.
 * Leere, unlesbare oder negative Werte ergeben den Rückfallwert – niemals NaN.
 */
export function envInt(raw: string | undefined, fallback: number): number {
  const value = envValue(raw);
  if (value === undefined) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

/** Schalter aus einer Umgebungsvariablen: "true"/"1"/"yes" sind wahr. */
export function envFlag(raw: string | undefined, fallback: boolean): boolean {
  const value = envValue(raw)?.toLowerCase();
  if (value === undefined) return fallback;
  return value === "true" || value === "1" || value === "yes";
}
