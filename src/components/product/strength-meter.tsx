import {
  isStrength,
  strengthLabel,
  strengthMax,
  strengthSteps,
} from "@/lib/scent-strength";

/**
 * Haltbarkeit und Sillage als Balken.
 *
 * Fünf Segmente, die gefüllten in Gold. Daneben steht der Wert immer auch
 * ausgeschrieben – ein Balken allein sagt „4 von 5“, aber nicht, was das in
 * Stunden bedeutet, und für Screenreader wäre er ohne Text gar nichts.
 */
function Meter({
  label,
  hint,
  value,
  text,
}: {
  label: string;
  hint: string;
  value: number;
  text: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-xs uppercase tracking-[0.14em] text-gold">
          {label}
        </span>
        <span className="text-xs text-subtle">
          {value} von {strengthMax}
        </span>
      </div>

      <div
        className="mt-2 flex gap-1"
        role="img"
        aria-label={`${label}: ${text} (${value} von ${strengthMax})`}
      >
        {strengthSteps.map((stufe) => (
          <span
            key={stufe}
            aria-hidden="true"
            className={
              stufe <= value
                ? "h-1 flex-1 bg-gold"
                : "h-1 flex-1 bg-line-strong"
            }
          />
        ))}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
      <p className="mt-0.5 text-xs text-subtle">{hint}</p>
    </div>
  );
}

/**
 * Der Abschnitt auf der Produktseite.
 *
 * Ist nichts eingetragen, kommt gar nichts – keine leeren Balken und kein
 * „keine Angabe“. Das nimmt nur Platz weg und sagt nichts.
 */
export function StrengthMeters({
  longevity,
  sillage,
}: {
  longevity: number | null;
  sillage: number | null;
}) {
  const hatHaltbarkeit = isStrength(longevity);
  const hatSillage = isStrength(sillage);

  if (!hatHaltbarkeit && !hatSillage) return null;

  return (
    <div className="border border-line bg-charcoal p-5 md:p-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {hatHaltbarkeit && (
          <Meter
            label="Haltbarkeit"
            hint="Wie lange der Duft auf der Haut bleibt"
            value={longevity}
            text={strengthLabel("longevity", longevity) ?? ""}
          />
        )}
        {hatSillage && (
          <Meter
            label="Sillage"
            hint="Wie weit die Duftwolke trägt"
            value={sillage}
            text={strengthLabel("sillage", sillage) ?? ""}
          />
        )}
      </div>

      {/* Ehrlichkeit gehört dazu: Das ist eine Einschätzung aus dem eigenen
          Tragen und keine Messung. Wer eine Zahl ohne diesen Satz liest,
          hält sie für eine Zusicherung. */}
      <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
        Unsere eigene Einschätzung aus dem Tragen. Parfüm verhält sich auf
        jeder Haut anders – nimm die Angaben als Anhaltspunkt, nicht als
        Zusicherung.
      </p>
    </div>
  );
}
