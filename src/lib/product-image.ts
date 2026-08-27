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
 *                   unruhigem Hintergrund. Setzt das kostenpflichtige
 *                   Zusatzmodul "Background Removal" voraus.
 *
 * Umschaltbar über SHOP_IMAGE_BACKGROUND. Bewusst "keep" als Standard: Ein
 * automatisches Freistellen, das danebengeht, ruiniert jedes Produktbild auf
 * einen Schlag – und zwar unbemerkt, weil niemand alle Bilder nachkontrolliert.
 */
export type BackgroundMode = "keep" | "transparent" | "ai";

function backgroundMode(): BackgroundMode {
  const raw = envValue(process.env.SHOP_IMAGE_BACKGROUND)?.toLowerCase();
  if (raw === "transparent" || raw === "ai") return raw;
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

/** Vorgeschaltete Bearbeitung, bevor auf das Zielformat gepolstert wird. */
function backgroundStep(): string {
  switch (backgroundMode()) {
    case "transparent":
      return `e_make_transparent:${transparencyTolerance()}/`;
    case "ai":
      return "e_background_removal/";
    default:
      return "";
  }
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

/** Quadratischer Ausschnitt für die kleinen Vorschaubilder unter der Galerie. */
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
