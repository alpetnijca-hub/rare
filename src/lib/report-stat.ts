/**
 * Eine Ansicht oder einen Warenkorb-Eintrag melden.
 *
 * `sendBeacon`, wo verfügbar: Der Browser schickt die Meldung auch dann noch
 * zu Ende, wenn die Seite gerade verlassen wird – genau der Moment, in dem
 * jemand etwas in den Warenkorb legt und weiterklickt. Ein normales `fetch`
 * würde dabei abgebrochen.
 *
 * Fehler werden verschluckt. Ein Zähler darf nie der Grund sein, warum eine
 * Kundin eine Fehlermeldung sieht.
 */
/**
 * Bereits gemeldete Ansichten dieses Seitenbesuchs.
 *
 * Eine Ansicht zählt einmal je Duft und Besuch. Ohne diese Sperre zählte
 * derselbe Aufruf mehrfach: React ruft Effekte im Entwicklungsmodus doppelt
 * auf, und beim Wechsel der Größe wird die Seite neu aufgebaut. Aus „drei
 * Aufrufe“ würden dann sechs, und die Quote daneben wäre nur noch halb so
 * hoch wie in Wirklichkeit.
 *
 * Warenkorb-Einträge sind davon ausgenommen: Wer denselben Duft zweimal
 * hineinlegt, hat sich auch zweimal dafür entschieden.
 *
 * Der Speicher lebt so lange wie die Seite im Browser offen ist. Wer morgen
 * wiederkommt, zählt wieder – das ist gewollt.
 */
const gemeldeteAnsichten = new Set<string>();

export function reportStat(
  productId: string,
  event: "ansicht" | "warenkorb",
): void {
  if (typeof window === "undefined" || !productId) return;

  if (event === "ansicht") {
    if (gemeldeteAnsichten.has(productId)) return;
    gemeldeteAnsichten.add(productId);
  }

  const body = JSON.stringify({ productId, event });

  try {
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(
        "/api/statistik",
        new Blob([body], { type: "application/json" }),
      );
      return;
    }

    void fetch("/api/statistik", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Blockiert durch eine Erweiterung o. ä. – dann wird eben nicht gezählt.
  }
}
