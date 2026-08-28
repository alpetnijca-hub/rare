/**
 * Kulissen für Produktbilder.
 *
 * Steht `SHOP_IMAGE_BACKGROUND` auf `scene`, stellt Cloudinary den Flakon frei
 * und setzt ihn vor eine erzeugte Kulisse. Woraus die Kulisse entsteht, wird
 * in dieser Reihenfolge entschieden:
 *
 *   1. **Die Duftnoten des Produkts.** Was im Adminbereich als Duftnote steht,
 *      landet im Bild: „Zitrone, Pfirsich“ ergibt Zitronen und Pfirsiche neben
 *      dem Flakon. Nach Möglichkeit eine Note aus Kopf oder Herz und eine aus
 *      der Basis – siehe `chosenNotes()`. Das ist der Normalfall.
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

/**
 * Gemeinsame Bildsprache aller Kulissen: dunkel, warm, ruhig.
 *
 * Der Schluss („dark moody product photography shallow depth of field“) sieht
 * überflüssig aus, ist es aber nicht: Nachgemessen an einem echten
 * Produktfoto ergab derselbe Bildwunsch ohne diesen Teil eine mittelhelle
 * Kulisse (Helligkeit 86 von 255), mit ihm eine dunkle (51). Wer hier kürzt,
 * bekommt helle Bilder auf einer schwarzen Seite.
 */
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
  tangerine: "fresh tangerines",
  clementine: "fresh clementines",
  cedrat: "large citron fruits",
  hesperiden: "assorted citrus fruits",
  limone: "fresh lemons",
  litsea: "small green litsea berries",

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
  sanddorn: "orange sea buckthorn berries",
  holunder: "dark elderberries on the branch",
  holunderblute: "white elderflower umbels",
  mirabelle: "small yellow mirabelle plums",
  nektarine: "ripe nectarines",
  zwetschge: "dark blue plums",
  kaki: "ripe persimmons",
  guave: "sliced guava",
  physalis: "physalis in their husks",
  kaktusfeige: "prickly pears",
  tamarinde: "tamarind pods",
  waldbeeren: "wild forest berries",
  sauerkirsche: "dark sour cherries",

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
  kamelie: "pale camellia flowers",
  hibiskus: "deep red hibiscus flowers",
  heliotrop: "purple heliotrope flowers",
  immortelle: "dried yellow immortelle flowers",
  champaca: "golden champaca flowers",
  frangipani: "white frangipani flowers",
  plumeria: "white plumeria flowers",
  tiare: "white tiare blossoms",
  monoi: "tiare blossoms in oil",
  lindenblute: "pale linden blossoms",
  akazie: "yellow acacia blossoms",
  glyzinie: "hanging wisteria blossoms",
  kornblume: "blue cornflowers",
  ringelblume: "orange marigolds",
  mohn: "red poppy flowers",
  schneeglockchen: "white snowdrops",
  krokus: "purple crocus flowers",
  tulpe: "dark tulips",
  dahlie: "deep red dahlias",

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
  petersilie: "flat parsley leaves",
  dill: "fresh dill fronds",
  oregano: "dried oregano",
  majoran: "marjoram sprigs",
  ysop: "hyssop sprigs",
  zitronenmelisse: "lemon balm leaves",
  melisse: "lemon balm leaves",
  brennnessel: "dark nettle leaves",
  tomate: "tomato leaves on the vine",
  weizen: "wheat ears",
  hafer: "oat stalks",
  stroh: "dry straw",
  waldboden: "damp forest floor with leaves",
  tannennadel: "fir needles and a small branch",
  kiefernadel: "pine needles and a small branch",
  klee: "green clover leaves",
  chai: "chai spices and dried tea leaves",

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
  piment: "allspice berries",
  szechuanpfeffer: "szechuan peppercorns",
  kubebenpfeffer: "cubeb peppercorns",
  schwarzkummel: "black cumin seeds",
  bockshornklee: "fenugreek seeds",
  macis: "dried mace blades",
  galgant: "galangal root",
  kurkuma: "turmeric root and powder",
  paprika: "dried red paprika pods",
  zimtblute: "cassia buds",

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
  mahagoni: "dark mahogany wood",
  akazienholz: "acacia wood pieces",
  olivenholz: "olive wood pieces",
  kampfer: "camphor crystals and wood",
  fichte: "spruce branches and cones",
  larche: "larch branches and cones",
  buche: "beech wood pieces",
  korkeiche: "cork oak bark",
  birkenrinde: "curled birch bark",
  drachenblut: "dragon blood resin pieces",
  kopal: "copal resin pieces",
  tolubalsam: "tolu balsam resin",
  perubalsam: "peru balsam resin",
  ambra: "grey ambergris on wet dark sand",
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
  baiser: "white meringue kisses",
  meringue: "white meringue kisses",
  cremebrulee: "creme brulee with a caramel crust",
  waffel: "golden waffles",
  zimtschnecke: "cinnamon rolls",
  erdnuss: "roasted peanuts",
  macadamia: "macadamia nuts",
  kastanie: "roasted chestnuts",
  marone: "roasted chestnuts",
  melasse: "dark molasses in a jar",
  butter: "a block of butter",
  joghurt: "yoghurt in a bowl",
  espresso: "a small espresso and roasted beans",
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
  gin: "gin in a glass with juniper berries",
  wodka: "vodka in a glass on ice",
  champagner: "champagne in a coupe glass",
  wein: "red wine in a glass",
  rotwein: "red wine in a glass",
  kohle: "black charcoal pieces",
  holzkohle: "black charcoal pieces",
  asche: "fine grey ash",

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
  kies: "dark gravel",
  kieselstein: "smooth dark pebbles",
  kreide: "white chalk pieces",
  beton: "raw concrete surface",
  metall: "brushed dark metal",
  kupfer: "polished copper",
  pergament: "aged parchment",
  staub: "fine dust in a beam of light",
  ozon: "clear air over dark water",
  gewitter: "storm clouds over dark water",
  bienenwachs: "beeswax blocks",
  kerzenwachs: "melted candle wax",
  seide: "folded dark silk",
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
 * Drei ist die Obergrenze; mehr macht die Kulisse unruhig und zieht die
 * Aufmerksamkeit vom Flakon weg. Drei Motive nebeneinander sind an einem
 * echten Produktfoto nachgemessen und bleiben dunkel – vorausgesetzt,
 * `sceneSetting` bleibt vollständig.
 */
const maxNotesInScene = 3;

interface NoteMatch {
  /** Die Note so, wie sie im Adminbereich eingetippt wurde. */
  note: string;
  /** Der englische Gegenstand für das Bildmodell. */
  motif: string;
}

/** Alle Noten einer Liste, für die es ein Motiv gibt – ohne Dubletten. */
function matchNotes(notes: readonly string[]): NoteMatch[] {
  const treffer: NoteMatch[] = [];

  for (const note of notes) {
    const motif = motifForNote(note);
    // Dubletten überspringen: Steht „Rose“ in Kopf- und Herznote, soll die
    // Kulisse nicht zweimal dasselbe Motiv enthalten.
    if (motif && !treffer.some((eintrag) => eintrag.motif === motif)) {
      treffer.push({ note, motif });
    }
  }

  return treffer;
}

/**
 * Baut eine Kulisse aus einer flachen Notenliste.
 *
 * Für den einfachen Fall, in dem keine Unterscheidung nach Kopf, Herz und
 * Basis nötig ist.
 */
export function motifFromNotes(notes: readonly string[]): string | null {
  return buildScene(matchNotes(notes).slice(0, maxNotesInScene));
}

function buildScene(gewaehlt: NoteMatch[]): string | null {
  if (gewaehlt.length === 0) return null;
  // "dark moody still life" steht vorn, weil das Modell den Anfang der
  // Beschreibung am stärksten gewichtet.
  return `dark moody still life with ${gewaehlt
    .map((eintrag) => eintrag.motif)
    .join(" and ")} ${sceneSetting}`;
}

/** Alles, woraus eine Kulisse entstehen kann. */
export interface SceneSource {
  fragranceFamily?: string | null;
  /** Kopfnoten – der erste Eindruck des Dufts. */
  topNotes?: readonly string[] | null;
  heartNotes?: readonly string[] | null;
  /** Basisnoten – dort steht meist, wofür ein Duft bekannt ist. */
  baseNotes?: readonly string[] | null;
}

/**
 * Welche Noten ins Bild kommen: bis zu drei.
 *
 * Kopf- und Herznoten kommen zuerst – sie beschreiben, wonach ein Duft beim
 * Aufsprühen riecht. Danach die Basis, denn dort sitzt oft die Signatur:
 * „Oud Maracuja“ hat Maracuja im Kopf und Oud in der Basis, und ausgerechnet
 * das Oud gehört ins Bild.
 *
 * Damit die Basis nicht leer ausgeht, wenn Kopf und Herz schon drei Motive
 * hergeben, ist der erste Basistreffer gesetzt: Von den drei Plätzen gehen
 * höchstens zwei an Kopf und Herz, solange die Basis etwas beizutragen hat.
 */
export function chosenNotes(source: SceneSource): NoteMatch[] {
  const vorne = matchNotes([
    ...(source.topNotes ?? []),
    ...(source.heartNotes ?? []),
  ]);
  const unten = matchNotes([...(source.baseNotes ?? [])]);

  const gewaehlt: NoteMatch[] = [];

  const hinzu = (eintrag: NoteMatch | undefined) => {
    if (!eintrag) return;
    if (gewaehlt.length >= maxNotesInScene) return;
    if (gewaehlt.some((schon) => schon.motif === eintrag.motif)) return;
    gewaehlt.push(eintrag);
  };

  // Ein Platz bleibt für die Basis reserviert, solange sie etwas hergibt.
  const plaetzeVorne = unten.length > 0 ? maxNotesInScene - 1 : maxNotesInScene;
  for (const eintrag of vorne.slice(0, plaetzeVorne)) hinzu(eintrag);

  hinzu(unten[0]);

  // Bleibt Platz – etwa weil eine der beiden Seiten leer war –, mit dem Rest
  // auffüllen.
  for (const eintrag of [...vorne, ...unten]) hinzu(eintrag);

  return gewaehlt;
}

/**
 * Kulisse für ein Produkt: erst aus den Duftnoten, sonst aus der Duftfamilie.
 * `null` heisst „keine Kulisse“ – dann wird der Flakon nur freigestellt.
 */
export function sceneMotif(
  source: SceneSource | null | undefined,
): string | null {
  if (!source) return null;

  const ausNoten = buildScene(chosenNotes(source));
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
export function usedNotes(source: SceneSource): string[] {
  return chosenNotes(source).map((eintrag) => eintrag.note);
}
