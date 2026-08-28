/**
 * Einheitliche Produktbilder.
 *
 * Fotos kommen in allen Formaten herein: hochkant, quer, mal mit weissem
 * Hintergrund, mal mit dunklem. Nebeneinander im Shop wirkt das unruhig, und
 * die Flakons sehen unterschiedlich gross aus, obwohl sie es nicht sind.
 *
 * Statt jedes Foto von Hand vorzubereiten, lassen wir Cloudinary das beim
 * Ausliefern erledigen. Die Anweisungen stehen in der Bild-Adresse:
 *
 *   .../upload/c_pad,w_1000,h_1250,b_rgb:151515,f_auto,q_auto/v123/bild.jpg
 *              ^^^^^ Format und Hintergrund
 *
 * Bewusst `c_pad` und nicht `c_fill`: Gefüllt würde Cloudinary zuschneiden und
 * dabei Flakonhälse oder Sockel abschneiden. Gepolstert bleibt der Flakon
 * vollständig sichtbar, und der Rand wird in der Farbe der Seite aufgefüllt –
 * dadurch fällt die Polsterung gar nicht auf.
 *
 * Nicht-Cloudinary-Adressen bleiben unverändert; von Hand eingetragene
 * Bilder sollen weiterhin funktionieren.
 */

import {
  sceneMotif,
  usedNotes,
  type SceneSource,
} from "@/config/scent-scenes";
import { envValue } from "@/lib/env";

/**
 * Umgang mit dem Hintergrund im Foto selbst.
 *
 *   "keep"        – Foto bleibt wie es ist. Standard.
 *   "transparent" – Eine gleichmässige Fläche (z. B. weisser Tisch) wird
 *                   entfernt und durch die Shop-Farbe ersetzt. Funktioniert
 *                   in jedem Cloudinary-Tarif, verlangt aber einen ruhigen,
 *                   einfarbigen Hintergrund.
 *   "ai"          – Cloudinary schneidet den Gegenstand frei, auch bei
 *                   unruhigem Hintergrund. Setzt das Zusatzmodul
 *                   "Background Removal" voraus.
 *   "scene"       – Wie "ai", stellt den Flakon danach aber vor eine erzeugte
 *                   Kulisse aus den Kopf- und Herznoten des Dufts: „Zitrone,
 *                   Pfirsich“ ergibt Zitronen und Pfirsiche. Ohne
 *                   darstellbare Note entscheidet die Duftfamilie. Die
 *                   Zuordnung steht in `src/config/scent-scenes.ts`.
 *                   Verbraucht pro Bild einmalig Guthaben für erzeugende
 *                   Umformungen.
 *
 * Umschaltbar über SHOP_IMAGE_BACKGROUND. Bewusst "keep" als Standard: Ein
 * automatisches Freistellen, das danebengeht, ruiniert jedes Produktbild auf
 * einen Schlag – und zwar unbemerkt, weil niemand alle Bilder nachkontrolliert.
 */
export type BackgroundMode = "keep" | "transparent" | "ai" | "scene";

function backgroundMode(): BackgroundMode {
  const raw = envValue(process.env.SHOP_IMAGE_BACKGROUND)?.toLowerCase();
  if (raw === "transparent" || raw === "ai") return raw;
  // "szene" und "duftnoten" sind erlaubt, damit man nicht raten muss, ob die
  // Einstellung deutsch oder englisch geschrieben wird.
  if (raw === "scene" || raw === "szene" || raw === "duftnoten") return "scene";
  return "keep";
}

/**
 * Toleranz beim Entfernen einer einfarbigen Fläche (0–100).
 * Höher entfernt mehr, greift aber irgendwann den Flakon an.
 */
function transparencyTolerance(): number {
  const raw = envValue(process.env.SHOP_IMAGE_BACKGROUND_TOLERANCE);
  const value = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(value) || value < 1 || value > 100) return 30;
  return value;
}

/**
 * Vorgeschaltete Bearbeitung, bevor auf das Zielformat gepolstert wird.
 *
 * "scene" fällt hier auf reines Freistellen zurück: Die Kulisse selbst wird
 * erst *nach* dem Polstern erzeugt (siehe `productImageUrl`), weil sie sonst
 * nur den Ausschnitt des Originalfotos füllt und oben und unten schwarze
 * Balken stehen blieben.
 */
function backgroundStep(): string {
  switch (backgroundMode()) {
    case "transparent":
      return `e_make_transparent:${transparencyTolerance()}/`;
    case "ai":
    case "scene":
      return "e_background_removal/";
    default:
      return "";
  }
}

/**
 * Macht aus einem Kulissentext den Teil einer Cloudinary-Adresse.
 *
 * Alles ausser Buchstaben, Ziffern und Leerzeichen fliegt raus. Vor allem das
 * Komma: In einer Cloudinary-Adresse trennt es die Anweisungen, ein Komma im
 * Text zerlegt also die ganze Adresse und liefert HTTP 400.
 */
function encodeScenePrompt(text: string): string {
  const clean = text
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return encodeURIComponent(clean);
}

/** Seitenverhältnis der Bildflächen im Shop (4:5, hochkant). */
export const productImageRatio = { width: 1000, height: 1250 } as const;

/** Hintergrundfarben, passend zu den Flächen, auf denen Bilder stehen. */
const backgrounds = {
  /** Produktkarten im Shop – stehen auf `bg-ink`. */
  card: "080808",
  /** Produktseite und Adminbereich – stehen auf `bg-charcoal`. */
  detail: "151515",
} as const;

export type ImageContext = keyof typeof backgrounds;

const cloudinaryMarker = "/upload/";

/**
 * Setzt die Transformationen in eine Cloudinary-Adresse ein.
 *
 * Enthält die Adresse bereits Transformationen (etwa weil sie von Hand
 * eingetragen wurde), bleibt sie unangetastet – sonst würden sich zwei
 * Anweisungen widersprechen.
 */
export function productImageUrl(
  url: string,
  context: ImageContext = "card",
  scale = 1,
  /**
   * Duftnoten und Duftfamilie des Produkts. Daraus entsteht die Kulisse,
   * wenn SHOP_IMAGE_BACKGROUND auf "scene" steht.
   */
  scene?: SceneSource | null,
): string {
  if (!url.includes("res.cloudinary.com") || !url.includes(cloudinaryMarker)) {
    return url;
  }

  const [prefix, rest] = url.split(cloudinaryMarker);
  if (!rest) return url;

  // Bereits transformiert? Dann nichts überschreiben.
  if (/^[a-z]_[^/]+\//.test(rest)) return url;

  const width = Math.round(productImageRatio.width * scale);
  const height = Math.round(productImageRatio.height * scale);

  const motif = backgroundMode() === "scene" ? sceneMotif(scene) : null;

  if (motif) {
    // Reihenfolge ist hier entscheidend: erst auf 4:5 polstern, dann die
    // Kulisse erzeugen. Andersherum entsteht die Kulisse nur im Ausschnitt des
    // Originalfotos, und oben und unten blieben schwarze Balken stehen.
    //
    // Die Polsterfarbe ist absichtlich für alle Flächen dieselbe und nicht
    // `backgrounds[context]`: Sie wird ohnehin von der Kulisse überdeckt,
    // gleiche Adresse heisst aber gleiches erzeugtes Bild – und damit nur
    // einmal Guthaben statt zweimal für Karte und Produktseite.
    const pad = `c_pad,w_${width},h_${height},b_rgb:${backgrounds.card}`;
    const scene = `e_gen_background_replace:prompt_${encodeScenePrompt(motif)}`;
    return `${prefix}${cloudinaryMarker}${pad}/${scene}/f_auto,q_auto/${rest}`;
  }

  const transformation = [
    "c_pad",
    `w_${width}`,
    `h_${height}`,
    `b_rgb:${backgrounds[context]}`,
    // Cloudinary wählt Format und Qualität selbst – moderne Browser bekommen
    // AVIF oder WebP, ältere JPEG.
    "f_auto",
    "q_auto",
    // Nie über die Originalgrösse hochrechnen; das erzeugt nur Unschärfe.
    "dpr_auto",
  ].join(",");

  return `${prefix}${cloudinaryMarker}${backgroundStep()}${transformation}/${rest}`;
}

/**
 * Quadratischer Ausschnitt für die kleinen Vorschaubilder unter der Galerie.
 *
 * Bewusst ohne Kulisse, auch wenn `scene` eingeschaltet ist: Ein anderes
 * Format heisst ein weiteres erzeugtes Bild und damit doppeltes Guthaben – für
 * ein Vorschaubild von 240 Pixeln lohnt sich das nicht. Der freigestellte
 * Flakon auf dunklem Grund wirkt daneben wie ein Kontaktabzug.
 */
export function productThumbUrl(url: string, size = 240): string {
  if (!url.includes("res.cloudinary.com") || !url.includes(cloudinaryMarker)) {
    return url;
  }

  const [prefix, rest] = url.split(cloudinaryMarker);
  if (!rest || /^[a-z]_[^/]+\//.test(rest)) return url;

  const transformation = [
    "c_pad",
    `w_${size}`,
    `h_${size}`,
    `b_rgb:${backgrounds.detail}`,
    "f_auto",
    "q_auto",
  ].join(",");

  return `${prefix}${cloudinaryMarker}${backgroundStep()}${transformation}/${rest}`;
}

/**
 * Ein Satz für den Adminbereich: Was landet im Hintergrund dieses Produkts?
 *
 * Ohne diese Anzeige müsste man raten. Wer „Moschus“ als Kopfnote einträgt und
 * im Bild nichts davon sieht, soll erfahren, dass es dafür kein Motiv gibt –
 * und nicht denken, die Funktion sei kaputt.
 *
 * Nur serverseitig aufrufen: Im Browser ist SHOP_IMAGE_BACKGROUND nicht lesbar
 * und die Antwort wäre immer `null`.
 */
export function sceneHint(source: SceneSource): string | null {
  if (backgroundMode() !== "scene") return null;

  const genutzt = usedNotes(source);

  if (genutzt.length > 0) {
    return `Im Hintergrund erscheint: ${genutzt.join(", ")} – aus deinen Duftnoten.`;
  }

  if (sceneMotif(source)) {
    return (
      "Keine deiner Duftnoten lässt sich abbilden (Moschus, Ambroxan und " +
      "Ähnliches haben kein Aussehen). Der Hintergrund richtet sich deshalb " +
      "nach der Duftfamilie."
    );
  }

  return (
    "Der Flakon wird nur freigestellt. Trag eine Duftnote wie „Zitrone“, " +
    "„Rose“ oder „Vanille“ ein, damit sie im Hintergrund erscheint."
  );
}
