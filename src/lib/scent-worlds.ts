/**
 * Duftwelten – Kategorien, die sich aus den Duftnoten ergeben.
 *
 * Statt jedes Parfüm von Hand einzusortieren, schaut diese Datei sich die
 * Kopf-, Herz- und Basisnoten an und ordnet den Duft der Welt zu, in die er
 * gehört: „Vanille, Tonkabohne, Karamell“ ergibt Süss & Gourmand,
 * „Oud, Zeder, Vetiver“ ergibt Holzig & Oud.
 *
 * Die Zuordnung ist bewusst ein festes Regelwerk und kein lernendes Modell:
 * Sie ist damit vorhersagbar, nachvollziehbar und prüfbar. Wer eine Note
 * vermisst, trägt sie unten ein – das Ergebnis ändert sich sofort und für
 * alle Produkte gleich.
 */

import { findNoteKeyword } from "@/lib/notes";

/** Eine Duftwelt mit den Noten, die sie ausmachen. */
export interface ScentWorld {
  slug: string;
  name: string;
  description: string;
  /** Reihenfolge im Shop-Menü und in den Filtern. */
  sortOrder: number;
  /** Noten, die für diese Welt zählen. Kleingeschrieben, ohne Umlaute. */
  notes: readonly string[];
}

export const scentWorlds: readonly ScentWorld[] = [
  {
    slug: "frisch-zitrisch",
    name: "Frisch & Zitrisch",
    description: "Spritzig und hell – Zitrusfrüchte, Blätter und klare Luft.",
    sortOrder: 10,
    notes: [
      "zitrone", "limette", "bergamotte", "grapefruit", "mandarine",
      "orange", "blutorange", "bitterorange", "neroli", "petitgrain", "yuzu",
      "zitrusfruchte", "pomelo", "kalamansi", "zitronenverbene",
      // Maritim: „Meerwasser“ enthält auch „Wasser“ – weil das längste
      // Stichwort gewinnt, bekommt das Meer trotzdem seinen eigenen Eintrag.
      // „Treibholz“ steht bewusst nicht hier: Ohne eigenes Stichwort greift
      // „Holz“ und der Duft landet bei Holzig & Oud – im Bild bleibt es
      // trotzdem Treibholz am Strand.
      "meerwasser", "meereswasser", "meeresbrise", "meer", "ozean", "marine",
      "aquatisch", "alge", "muschel", "sand", "meersalz", "salz",
      "wasser", "regen", "nebel", "eiskristall", "schnee",
    ],
  },
  {
    slug: "fruchtig-suess",
    name: "Fruchtig",
    description: "Saftig und rund – Steinobst, Beeren und Südfrüchte.",
    sortOrder: 20,
    notes: [
      "pfirsich", "aprikose", "himbeere", "erdbeere", "brombeere",
      "johannisbeere", "kirsche", "pflaume", "apfel", "birne", "feige",
      "ananas", "mango", "litschi", "melone", "traube", "kokos", "dattel",
      "cassis", "rhabarber", "granatapfel", "quitte", "blaubeere",
      "heidelbeere", "preiselbeere", "banane", "papaya", "passionsfrucht",
      "maracuja",
    ],
  },
  {
    slug: "blumig",
    name: "Blumig",
    description: "Blüten im Mittelpunkt – von zarter Freesie bis satter Tuberose.",
    sortOrder: 30,
    notes: [
      "rose", "jasmin", "veilchen", "iris", "tuberose", "maiglockchen",
      "ylangylang", "orangenblute", "magnolie", "freesie", "pfingstrose",
      "narzisse", "geranie", "osmanthus", "kirschblute", "lilie", "flieder",
      "mimose", "gardenie", "hyazinthe", "kamille", "lotus", "seerose",
      "orchidee", "ginster",
    ],
  },
  {
    slug: "gruen-kraeuter",
    name: "Grün & Kräuter",
    description: "Kräutergarten und feuchtes Laub – aromatisch statt süss.",
    sortOrder: 40,
    notes: [
      "minze", "basilikum", "rosmarin", "salbei", "thymian", "lavendel",
      "grunertee", "schwarzertee", "matcha", "tee", "bambus", "efeu",
      "eichenmoos", "moos", "heu", "wermut", "estragon", "gras", "galbanum",
      "eukalyptus", "wacholder", "fenchel", "zitronengras", "farn",
    ],
  },
  {
    slug: "wuerzig",
    name: "Würzig",
    description: "Gewürzregal statt Blumenwiese – warm, scharf, lebendig.",
    sortOrder: 50,
    notes: [
      "pfeffer", "rosapfeffer", "kardamom", "zimt", "nelke", "muskat",
      "safran", "ingwer", "koriander", "anis", "sternanis", "chili", "kumin",
      "kreuzkummel", "lorbeer",
    ],
  },
  {
    slug: "holzig-oud",
    name: "Holzig & Oud",
    description: "Das Rückgrat vieler Nischendüfte – Holz, Wurzeln, Rinde.",
    sortOrder: 60,
    notes: [
      "oud", "agarholz", "sandelholz", "zeder", "zedernholz", "kiefer",
      "birke", "eiche", "vetiver", "patchouli", "guajakholz", "kaschmirholz",
      "papyrus", "zypresse", "holz", "erde",
      // „Rosenholz“ enthält „Rose“, „Ebenholz“ enthält „Holz“ – beide sind
      // hier eigene Stichwörter, damit sie sicher beim Holz landen.
      "rosenholz", "palisander", "ebenholz", "teakholz", "tanne", "pinie",
    ],
  },
  {
    slug: "amber-harzig",
    name: "Amber & Harzig",
    description: "Warm und schwer – Harze, Amber und Räucherwerk.",
    sortOrder: 70,
    notes: [
      "amber", "bernstein", "weihrauch", "weihrauchharz", "myrrhe", "benzoe",
      "labdanum", "harz", "opoponax", "styrax", "elemi",
      // „Räucherwerk“ enthält „Rauch“ – als eigenes Stichwort landet es beim
      // Weihrauch statt beim Lagerfeuer.
      "raucherwerk",
    ],
  },
  {
    slug: "leder-rauch",
    name: "Leder & Rauch",
    description: "Dunkel und markant – Leder, Tabak und Rauch.",
    sortOrder: 80,
    notes: [
      "leder", "wildleder", "tabak", "pfeifentabak", "rauch", "lagerfeuer",
      "birkenteer", "teer", "whisky", "rum", "cognac",
    ],
  },
  {
    slug: "suess-gourmand",
    name: "Süss & Gourmand",
    description: "Zum Anbeissen – Vanille, Karamell, Kakao und Nüsse.",
    sortOrder: 90,
    notes: [
      "vanille", "tonkabohne", "kakao", "schokolade", "karamell", "honig",
      "kaffee", "mandel", "pistazie", "haselnuss", "walnuss", "cashew",
      "praline", "zucker", "reis", "milch", "kokosmilch", "sahne",
      "marshmallow", "zuckerwatte", "nougat", "marzipan", "lakritz",
      "ahornsirup", "keks", "geback", "popcorn",
    ],
  },
];

/** Alle Slugs der Duftwelten – zum Erkennen der automatisch erzeugten Kategorien. */
export const scentWorldSlugs: readonly string[] = scentWorlds.map(
  (world) => world.slug,
);

/**
 * Stichwort → Welt, aus den Listen oben zusammengebaut.
 *
 * Ein Stichwort darf nur in einer Welt vorkommen; ein Test hält das fest.
 * Sonst wäre nicht mehr vorhersagbar, wo ein Duft landet.
 */
const worldByKeyword = new Map<string, ScentWorld>(
  scentWorlds.flatMap((world) =>
    world.notes.map((note) => [note, world] as const),
  ),
);

const alleStichworte = [...worldByKeyword.keys()];

/**
 * Welt zu einer eingetippten Note. Erkannt wird über das längste enthaltene
 * Stichwort – „Oudholz“ und „Tabakblatt“ treffen damit ebenso wie „Oud“ und
 * „Tabak“, und „Eichenmoos“ landet beim Moos statt beim Holz.
 */
function worldForNote(note: string): ScentWorld | undefined {
  const keyword = findNoteKeyword(note, alleStichworte);
  return keyword ? worldByKeyword.get(keyword) : undefined;
}

/** Ein Produkt mit seinen Noten, so wie die Analyse es braucht. */
export interface NotedProduct {
  topNotes?: readonly string[] | null;
  heartNotes?: readonly string[] | null;
  baseNotes?: readonly string[] | null;
}

/**
 * Höchstens so viele Welten pro Duft.
 *
 * Zwei ist Absicht: Ein Duft, der in fünf Kategorien auftaucht, hilft beim
 * Stöbern nicht mehr – dann kann man auch gleich die vollständige Liste
 * durchblättern.
 */
export const maxWorldsPerProduct = 2;

/**
 * Wie viele Noten eine Welt mindestens treffen muss, damit sie sicher zählt.
 *
 * Bei nur einem Treffer entscheidet zusätzlich, ob es der beste Treffer ist –
 * sonst landete jeder Duft mit einer einzigen Pfeffernote unter „Würzig“.
 */
const sureHits = 2;

export interface WorldScore {
  world: ScentWorld;
  /** Wie viele Noten des Dufts in diese Welt fallen. */
  score: number;
  /** Die Noten, die den Ausschlag gegeben haben – für die Anzeige im Admin. */
  matched: string[];
}

/** Zählt für jede Welt, wie viele Noten des Dufts hineinpassen. */
export function scoreWorlds(product: NotedProduct): WorldScore[] {
  const notes = [
    ...(product.topNotes ?? []),
    ...(product.heartNotes ?? []),
    ...(product.baseNotes ?? []),
  ];

  const treffer = new Map<string, string[]>();

  for (const note of notes) {
    const world = worldForNote(note);
    if (!world) continue;

    const bisher = treffer.get(world.slug) ?? [];
    // Dubletten überspringen: „Rose“ in Kopf- und Herznote ist ein Treffer.
    if (!bisher.includes(note)) bisher.push(note);
    treffer.set(world.slug, bisher);
  }

  return scentWorlds
    .map((world) => {
      const matched = treffer.get(world.slug) ?? [];
      return { world, score: matched.length, matched };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.world.sortOrder - b.world.sortOrder);
}

/**
 * Die Welten, in die ein Duft gehört.
 *
 * Regel: Eine Welt zählt, wenn sie mindestens zwei Noten trifft – oder wenn
 * sie der beste Treffer überhaupt ist. Höchstens `maxWorldsPerProduct` Welten.
 */
export function worldsForProduct(product: NotedProduct): WorldScore[] {
  const scored = scoreWorlds(product);
  if (scored.length === 0) return [];

  const best = scored[0].score;

  return scored
    .filter((entry) => entry.score >= sureHits || entry.score === best)
    .slice(0, maxWorldsPerProduct);
}
