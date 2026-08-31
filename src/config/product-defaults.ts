/**
 * Vorgabetexte für neue Produkte.
 *
 * Sie ersparen das Abtippen wiederkehrender Pflichtangaben. Gedacht als
 * Startpunkt, nicht als fertige Angabe: Der Text muss je Duft geprüft und
 * ergänzt werden – insbesondere die INCI-Liste, denn die Allergene
 * unterscheiden sich von Duft zu Duft.
 */

/** Anwendung und Lagerung. Für alle Düfte gleich. */
export const defaultUsage =
  "Auf die Haut an Puls- und Wärmepunkten auftragen: Handgelenke, Halsseiten und " +
  "hinter den Ohren. Nicht verreiben – das zerstört die feinen Kopfnoten. " +
  "Bei empfindlicher Haut zuerst an einer kleinen Stelle testen. " +
  "Kühl, trocken und vor direktem Sonnenlicht geschützt lagern.";

/**
 * Gerüst für die Pflichtangaben.
 *
 * Der obere Teil ist bewusst eine auszufüllende Lücke. Eine erfundene
 * INCI-Liste vorzugeben wäre bequem, aber falsch: Sie steht auf der
 * Verpackung und unterscheidet sich je Duft. Ein Platzhalter, den man
 * überschreiben muss, ist ehrlicher als ein plausibel aussehender Text,
 * den niemand mehr prüft.
 */
export const ingredientsTemplate =
  "INCI-Liste hier eintragen (steht auf der Verpackung des Herstellers).\n\n" +
  "Enthält Duftstoffe, die allergische Reaktionen hervorrufen können. " +
  "Nur zur äusserlichen Anwendung. Darf nicht in die Hände von Kindern gelangen. " +
  "Von Zündquellen fernhalten – nicht rauchen. Bei Augenkontakt gründlich mit " +
  "Wasser spülen. Angaben ohne Gewähr; massgeblich ist stets die Verpackung.";

/** Hinweis, der bei Duftalternativen auf der Produktseite erscheinen muss. */
export const alternativeNotice =
  "Dieses Produkt ist eine eigenständige Duftalternative und keine Originalware. " +
  "Es besteht keine Verbindung, Lizenzierung oder Zusammenarbeit mit den Herstellern " +
  "anderer Düfte. Alle gegebenenfalls genannten Marken sind Eigentum ihrer jeweiligen " +
  "Inhaber und dienen ausschliesslich der Beschreibung einer Duftrichtung.";

/**
 * Voreinstellungen für eine neue Größe.
 *
 * Die Lieferzeit ist bewusst weit gefasst: Manche Düfte sind vorrätig und
 * innerhalb von Tagen abgefüllt, bei anderen wartet man zuerst auf eine
 * Zutat. Wer eine Größe sofort verfügbar hat, setzt die Werte beim Anlegen
 * einfach herunter – vorsichtig schätzen ist besser als eine Frist zu
 * versprechen, die nicht zu halten ist.
 */
export const variantDefaults = {
  deliveryMinDays: 3,
  deliveryMaxDays: 14,
  lowStockThreshold: 3,
} as const;

/**
 * Gängige Größen für die Schnellauswahl beim Anlegen.
 * `isSample` steuert, ob die Größe unter "Zum Testen" erscheint.
 */
export const commonSizes: Array<{
  label: string;
  volumeMl: number;
  isSample: boolean;
}> = [
  { label: "2 ml", volumeMl: 2, isSample: true },
  { label: "5 ml", volumeMl: 5, isSample: true },
  { label: "10 ml", volumeMl: 10, isSample: true },
  { label: "30 ml", volumeMl: 30, isSample: false },
  { label: "50 ml", volumeMl: 50, isSample: false },
  { label: "100 ml", volumeMl: 100, isSample: false },
  { label: "125 ml", volumeMl: 125, isSample: false },
];
