/**
 * Kulissen für Produktbilder.
 *
 * Steht `SHOP_IMAGE_BACKGROUND` auf `scene`, stellt Cloudinary den Flakon frei
 * und setzt ihn vor eine erzeugte Kulisse, die zur Duftfamilie passt: Zitrus
 * bekommt Früchte, Holzig bekommt Oud und Zedernrinde, Leder bekommt Tabak.
 *
 * Warum die Texte auf Englisch sind: Das Modell hinter
 * `e_gen_background_replace` ist auf englische Beschreibungen trainiert und
 * liefert damit deutlich verlässlichere Ergebnisse.
 *
 * Zwei Regeln, an die sich jeder neue Text halten muss:
 *
 *  1. **Keine Kommas.** In einer Cloudinary-Adresse trennt das Komma die
 *     Anweisungen voneinander – ein Komma im Text zerlegt die ganze Adresse
 *     und liefert HTTP 400. `scenePrompt()` filtert es zwar heraus, aber
 *     besser gar nicht erst hineinschreiben.
 *  2. **Immer derselbe Schluss** (`sceneSetting`). Dadurch sehen alle
 *     Produktbilder wie eine Serie aus und nicht wie zufällig
 *     zusammengewürfelte Fotos.
 */

/** Gemeinsame Bildsprache aller Kulissen: dunkel, warm, ruhig. */
const sceneSetting =
  "on dark stone surface with warm golden light and soft shadows " +
  "dark moody product photography shallow depth of field";

/**
 * Motiv je Duftfamilie. Die Schlüssel entsprechen `fragranceFamilies`
 * aus `src/lib/catalog.ts`.
 */
const sceneMotifs: Record<string, string> = {
  FLORAL: "scattered rose petals and white blossoms",
  ORIENTAL: "scattered amber resin pieces and dried spices",
  HOLZIG: "pieces of dark cedar wood and tree bark scattered around",
  FRISCH: "green leaves and water droplets scattered around",
  ZITRUS: "fresh lemons and green citrus leaves",
  GOURMAND: "vanilla pods and roasted cocoa beans scattered around",
  AROMATISCH: "sprigs of fresh lavender and rosemary scattered around",
  CHYPRE: "oakmoss and dry patchouli leaves scattered around",
  LEDER: "a piece of dark leather and dried tobacco leaves",
};

/**
 * Kulisse für eine Duftfamilie. `null`, wenn die Familie unbekannt ist –
 * dann wird der Flakon nur freigestellt, statt eine Kulisse zu raten.
 */
export function sceneMotif(family: string | null | undefined): string | null {
  if (!family) return null;
  const motif = sceneMotifs[family.toUpperCase()];
  return motif ? `${motif} ${sceneSetting}` : null;
}
