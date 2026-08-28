/**
 * Kulissen für Produktbilder.
 *
 * Steht `SHOP_IMAGE_BACKGROUND` auf `scene`, stellt Cloudinary den Flakon frei
 * und setzt ihn vor eine erzeugte Kulisse. Woraus die Kulisse entsteht, wird
 * in dieser Reihenfolge entschieden:
 *
 *   1. **Kopf- und Herznoten des Produkts.** Was im Adminbereich als Duftnote
 *      steht, landet im Bild: „Zitrone, Pfirsich“ ergibt Zitronen und
 *      Pfirsiche neben dem Flakon. Das ist der Normalfall.
 *   2. **Duftfamilie**, falls keine der Noten ein Motiv ergibt.
 *   3. **Nichts** – dann wird der Flakon nur freigestellt, statt eine Kulisse
 *      zu raten.
 *
 * Warum die Texte auf Englisch sind: Das Modell hinter
 * `e_gen_background_replace` ist auf englische Beschreibungen trainiert und
 * liefert damit deutlich verlässlichere Ergebnisse.
 *
 * Zwei Regeln, an die sich jeder neue Text halten muss:
 *
 *  1. **Keine Kommas.** In einer Cloudinary-Adresse trennt das Komma die
 *     Anweisungen voneinander – ein Komma im Text zerlegt die ganze Adresse
 *     und liefert HTTP 400. `encodeScenePrompt()` in `src/lib/product-image.ts`
 *     filtert es zwar heraus, aber besser gar nicht erst hineinschreiben.
 *  2. **Immer derselbe Schluss** (`sceneSetting`). Dadurch sehen alle
 *     Produktbilder wie eine Serie aus und nicht wie zufällig
 *     zusammengewürfelte Fotos.
 */

import { findNoteKeyword } from "@/lib/notes";

/** Gemeinsame Bildsprache aller Kulissen: dunkel, warm, ruhig. */
const sceneSetting =
  "on dark stone surface with warm golden light and soft shadows " +
  "dark moody product photography shallow depth of field";

/**
 * Motiv je Duftfamilie – der Rückfall, wenn aus den Duftnoten nichts
 * Darstellbares wird. Die Schlüssel entsprechen `fragranceFamilies`
 * aus `src/lib/catalog.ts`.
 */
const sceneMotifs: Record<string, string> = {
  FLORAL: "scattered rose petals and white blossoms",
  ORIENTAL: "scattered amber resin pieces and dried spices",
  HOLZIG: "pieces of dark cedar wood and tree bark scattered around",
  FRISCH: "wet dark stones and sea spray with fresh green leaves",
  ZITRUS: "fresh lemons and green citrus leaves",
  FRUCHTIG: "fresh peaches and red berries scattered around",
  GOURMAND: "vanilla pods and roasted cocoa beans scattered around",
  AROMATISCH: "sprigs of fresh lavender and rosemary scattered around",
  CHYPRE: "oakmoss and dry patchouli leaves scattered around",
  LEDER: "a piece of dark leather and dried tobacco leaves",
};

/**
 * Duftnote → sichtbarer Gegenstand.
 *
 * Bewusst ein Wörterbuch und keine wörtliche Übernahme der Eingabe: Der Text
 * geht an ein Bildmodell, das englische Substantive braucht. Mit „Bergamotte“
 * kann es wenig anfangen, mit „bergamot fruits“ sehr viel.
 *
 * Bewusst **unvollständig**. Nicht jede Duftnote hat ein Aussehen: Moschus,
 * Ambroxan, Aldehyde oder Iso E Super sind Gerüche ohne Gegenstand. Sie stehen
 * hier nicht drin und werden übersprungen, statt das Bild mit einer erfundenen
 * Darstellung zu füllen.
 *
 * Die Schlüssel werden kleingeschrieben und ohne Umlaute verglichen und
 * müssen nur **in** der Note stecken: „Vanille“, „vanille“ und
 * „Vanilleschote“ treffen alle denselben Eintrag (siehe `src/lib/notes.ts`).
 */
const noteMotifs: Record<string, string> = {
  // Zitrus
  zitrone: "fresh lemons",
  limette: "fresh limes",
  bergamotte: "bergamot fruits",
  grapefruit: "pink grapefruit halves",
  mandarine: "fresh mandarins",
  orange: "fresh oranges",
  blutorange: "blood orange halves",
  neroli: "white neroli blossoms",
  petitgrain: "green citrus leaves",
  yuzu: "yuzu citrus fruits",
  bitterorange: "bitter oranges cut open",
  pomelo: "pomelo halves",
  kalamansi: "small green calamansi limes",
  zitronenverbene: "lemon verbena leaves",

  // Früchte
  pfirsich: "ripe peaches",
  aprikose: "ripe apricots",
  himbeere: "fresh raspberries",
  erdbeere: "fresh strawberries",
  brombeere: "fresh blackberries",
  johannisbeere: "red currants",
  kirsche: "dark cherries",
  pflaume: "ripe plums",
  apfel: "fresh apples",
  birne: "ripe pears",
  feige: "fresh figs and fig leaves",
  ananas: "sliced pineapple",
  mango: "ripe mango pieces",
  litschi: "peeled lychees",
  melone: "melon slices",
  traube: "dark grapes",
  kokos: "cracked coconut",
  dattel: "dried dates",
  granatapfel: "pomegranate halves with red seeds",
  quitte: "ripe quinces",
  blaubeere: "fresh blueberries",
  heidelbeere: "fresh blueberries",
  preiselbeere: "red lingonberries",
  cassis: "black currants on the branch",
  rhabarber: "cut rhubarb stalks",
  banane: "ripe bananas",
  papaya: "sliced papaya",
  passionsfrucht: "halved passion fruits",
  maracuja: "halved passion fruits",

  // Blüten
  rose: "fresh rose petals",
  jasmin: "white jasmine flowers",
  veilchen: "purple violets",
  iris: "iris roots and pale petals",
  maiglockchen: "lily of the valley flowers",
  tuberose: "white tuberose flowers",
  ylangylang: "yellow ylang ylang flowers",
  orangenblute: "white orange blossoms",
  lavendel: "lavender sprigs",
  magnolie: "white magnolia flowers",
  freesie: "freesia flowers",
  pfingstrose: "pink peonies",
  narzisse: "narcissus flowers",
  geranie: "geranium leaves and flowers",
  osmanthus: "small golden osmanthus flowers",
  kirschblute: "cherry blossom branches",
  lilie: "white lilies",
  flieder: "lilac branches",
  mimose: "yellow mimosa blossoms",
  gardenie: "white gardenia flowers",
  hyazinthe: "purple hyacinths",
  kamille: "small chamomile flowers",
  lotus: "pale lotus flowers on dark water",
  seerose: "pale water lilies on dark water",
  orchidee: "dark orchids",
  ginster: "yellow broom blossoms",

  // Kräuter und Grün
  minze: "fresh mint leaves",
  basilikum: "fresh basil leaves",
  rosmarin: "rosemary sprigs",
  salbei: "sage leaves",
  thymian: "thyme sprigs",
  grunertee: "green tea leaves",
  tee: "dried tea leaves",
  bambus: "green bamboo stalks",
  efeu: "dark ivy leaves",
  eichenmoos: "oakmoss",
  vetiver: "dried vetiver grass",
  patchouli: "dry patchouli leaves",
  heu: "dried hay",
  eukalyptus: "eucalyptus branches",
  wacholder: "juniper berries on a branch",
  fenchel: "fennel bulbs and fronds",
  zitronengras: "cut lemongrass stalks",
  matcha: "green matcha powder",
  schwarzertee: "dried black tea leaves",
  farn: "dark fern fronds",

  // Gewürze
  pfeffer: "black peppercorns",
  rosapfeffer: "pink peppercorns",
  kardamom: "green cardamom pods",
  zimt: "cinnamon sticks",
  nelke: "dried cloves",
  muskat: "whole nutmegs",
  safran: "saffron threads",
  ingwer: "fresh ginger root",
  koriander: "coriander seeds",
  anis: "star anise",
  chili: "dried red chilies",
  sternanis: "star anise pods",
  lorbeer: "dried bay leaves",
  kumin: "cumin seeds",
  kreuzkummel: "cumin seeds",
  vanillepfeffer: "black peppercorns and vanilla pods",

  // Holz und Harz
  oud: "dark oud wood pieces",
  agarholz: "dark agarwood pieces",
  sandelholz: "sandalwood pieces",
  zeder: "cedar wood pieces",
  zedernholz: "cedar wood pieces",
  kiefer: "pine branches and cones",
  birke: "birch bark",
  eiche: "oak bark",
  weihrauch: "frankincense resin pieces",
  myrrhe: "myrrh resin pieces",
  amber: "amber resin pieces",
  bernstein: "amber resin pieces",
  benzoe: "benzoin resin pieces",
  labdanum: "labdanum resin",
  harz: "resin pieces",
  rosenholz: "rosewood pieces",
  palisander: "dark rosewood planks",
  ebenholz: "polished ebony wood",
  teakholz: "teak wood pieces",
  guajakholz: "guaiac wood pieces",
  kaschmirholz: "pale cashmere wood pieces",
  tanne: "fir branches and cones",
  pinie: "pine cones and needles",
  zypresse: "cypress branches",
  papyrus: "dried papyrus stalks",
  weihrauchharz: "frankincense resin pieces",
  raucherwerk: "smouldering incense and resin pieces",

  // Süss und Gourmand
  vanille: "vanilla pods",
  tonkabohne: "tonka beans",
  kakao: "roasted cocoa beans",
  schokolade: "dark chocolate pieces",
  karamell: "caramel pieces",
  honig: "honeycomb",
  kaffee: "roasted coffee beans",
  mandel: "shelled almonds",
  pistazie: "pistachios",
  haselnuss: "hazelnuts",
  praline: "chocolate pralines",
  zucker: "sugar crystals",
  reis: "raw rice grains",
  nougat: "pieces of nougat",
  marzipan: "marzipan pieces and almonds",
  lakritz: "black liquorice pieces",
  kokosmilch: "coconut milk in a bowl and cracked coconut",
  ahornsirup: "maple syrup in a glass jar",
  keks: "butter biscuits",
  geback: "golden pastry pieces",
  popcorn: "caramel popcorn",
  walnuss: "cracked walnuts",
  cashew: "cashew nuts",

  // Leder, Rauch, Tabak
  leder: "a piece of dark leather",
  wildleder: "a piece of dark suede",
  tabak: "dried tobacco leaves",
  pfeifentabak: "dried tobacco leaves and a pipe",
  rauch: "wisps of smoke",
  lagerfeuer: "glowing embers and wisps of smoke",
  birkenteer: "birch tar and dark bark",
  whisky: "a glass of whisky and oak staves",
  rum: "dark rum in a glass and sugarcane",
  cognac: "cognac in a glass and oak wood",

  // Meer und Wasser
  //
  // „Meerwasser“ enthält auch „Wasser“. Weil das längste Stichwort gewinnt
  // (siehe src/lib/notes.ts), bekommt das Meer sein eigenes Bild und nicht
  // bloss ein paar Tropfen.
  meerwasser: "dark ocean water with white sea foam and wet rocks",
  meereswasser: "dark ocean water with white sea foam and wet rocks",
  meeresbrise: "dark ocean waves and wet black rocks at dusk",
  meer: "dark ocean water with white sea foam and wet rocks",
  ozean: "dark ocean water with white sea foam and wet rocks",
  marine: "dark ocean waves and wet black rocks",
  aquatisch: "dark water surface with ripples and wet stones",
  alge: "dark wet seaweed on black rocks",
  muschel: "seashells on wet dark sand",
  treibholz: "weathered driftwood on wet dark sand",
  sand: "fine dark sand with ripples",
  meersalz: "coarse sea salt crystals and wet black rocks",
  salz: "coarse salt crystals",
  regen: "water droplets on a dark surface",
  wasser: "clear water droplets on a dark surface",
  nebel: "low drifting mist over dark stone",
  eiskristall: "shards of clear ice on dark stone",
  schnee: "fresh snow on dark stone",

  // Erde, Stein, Mineralisch
  stein: "dark stones",
  feuerstein: "dark flint stones",
  erde: "dark damp soil",
  moos: "soft green moss on dark stone",
  leinen: "folded natural linen cloth",
  papier: "sheets of aged paper",
  tinte: "spilled dark ink",
};

const noteKeywords = Object.keys(noteMotifs);

/**
 * Motiv zu einer eingetippten Note. Erkannt wird über das längste enthaltene
 * Stichwort, damit auch „Oudholz“, „Tabakblatt“ und „Vanilleschote“ treffen –
 * siehe `src/lib/notes.ts`.
 */
function motifForNote(note: string): string | undefined {
  const keyword = findNoteKeyword(note, noteKeywords);
  return keyword ? noteMotifs[keyword] : undefined;
}

/**
 * Wie viele Noten höchstens ins Bild dürfen.
 *
 * Zwei ist Absicht und ausprobiert: Mit drei Motiven wird die Beschreibung so
 * lang, dass das Bildmodell die dunkle Bildsprache am Ende überliest – im Test
 * kam eine helle, blaue Kulisse heraus statt der dunklen. Zwei Gegenstände
 * halten die Kulisse ruhig und lassen den Flakon der Hauptdarsteller bleiben.
 */
const maxNotesInScene = 2;

/**
 * Baut eine Kulisse aus Duftnoten. `null`, wenn keine der Noten etwas
 * Darstellbares ergibt.
 */
export function motifFromNotes(notes: readonly string[]): string | null {
  const gefunden: string[] = [];

  for (const note of notes) {
    const motif = motifForNote(note);
    // Dubletten überspringen: Steht „Rose“ in Kopf- und Herznote, soll die
    // Kulisse nicht zweimal dasselbe Motiv enthalten.
    if (motif && !gefunden.includes(motif)) gefunden.push(motif);
    if (gefunden.length === maxNotesInScene) break;
  }

  if (gefunden.length === 0) return null;
  // "dark moody still life" steht vorn, weil das Modell den Anfang der
  // Beschreibung am stärksten gewichtet.
  return `dark moody still life with ${gefunden.join(" and ")} ${sceneSetting}`;
}

/** Alles, woraus eine Kulisse entstehen kann. */
export interface SceneSource {
  fragranceFamily?: string | null;
  /** Kopfnoten – zuerst, weil sie den ersten Eindruck des Dufts prägen. */
  topNotes?: readonly string[] | null;
  heartNotes?: readonly string[] | null;
}

/**
 * Kulisse für ein Produkt: erst aus den Duftnoten, sonst aus der Duftfamilie.
 * `null` heisst „keine Kulisse“ – dann wird der Flakon nur freigestellt.
 */
export function sceneMotif(
  source: SceneSource | null | undefined,
): string | null {
  if (!source) return null;

  const notes = [...(source.topNotes ?? []), ...(source.heartNotes ?? [])];
  const ausNoten = motifFromNotes(notes);
  if (ausNoten) return ausNoten;

  const family = source.fragranceFamily;
  if (!family) return null;

  const motif = sceneMotifs[family.toUpperCase()];
  return motif ? `${motif} ${sceneSetting}` : null;
}

/**
 * Welche der eingetragenen Noten tatsächlich im Bild landen.
 *
 * Nur für die Anzeige im Adminbereich: Wer „Moschus“ einträgt und nichts im
 * Hintergrund sieht, soll nicht rätseln müssen, warum.
 */
export function usedNotes(notes: readonly string[]): string[] {
  const treffer: string[] = [];
  const motive: string[] = [];

  for (const note of notes) {
    const motif = motifForNote(note);
    if (motif && !motive.includes(motif)) {
      motive.push(motif);
      treffer.push(note);
    }
    if (motive.length === maxNotesInScene) break;
  }

  return treffer;
}
