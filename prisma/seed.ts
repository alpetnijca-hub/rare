/**
 * Demo- und Startdaten.
 *
 * ⚠️ Alle Produkte sind erfundene Demo-Inhalte (`isDemo: true`) mit selbst
 * gezeichneten Abbildungen. Es werden keine geschützten Markennamen, Logos
 * oder fremden Produktbilder verwendet. Vor dem Livegang ersetzen.
 *
 * Aufruf:  npm run db:seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

/** Datum in `days` Tagen ab heute. */
function inDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date;
}

const categories = [
  {
    slug: "damen",
    name: "Damen",
    kind: "GENDER" as const,
    description: "Düfte mit blumigen, weichen und ausdrucksstarken Facetten.",
    sortOrder: 1,
    heroImageUrl: "/produkte/kategorie-damen.svg",
  },
  {
    slug: "herren",
    name: "Herren",
    kind: "GENDER" as const,
    description: "Holzige, würzige und markante Kompositionen.",
    sortOrder: 2,
    heroImageUrl: "/produkte/kategorie-herren.svg",
  },
  {
    slug: "unisex",
    name: "Unisex",
    kind: "GENDER" as const,
    description: "Düfte ohne Zuordnung – für alle, die sich nicht festlegen.",
    sortOrder: 3,
    heroImageUrl: "/produkte/kategorie-unisex.svg",
  },
  {
    slug: "abfuellungen",
    name: "Abfüllungen",
    kind: "TYPE" as const,
    description: "Von Hand abgefüllte Proben ab 2 ml – erst testen, dann entscheiden.",
    sortOrder: 4,
    heroImageUrl: "/produkte/kategorie-abfuellungen.svg",
  },
  {
    slug: "sets",
    name: "Sets",
    kind: "TYPE" as const,
    description: "Geschenkfertig zusammengestellte Duftsets.",
    sortOrder: 5,
    heroImageUrl: "/produkte/kategorie-sets.svg",
  },
];

interface SeedVariant {
  sku: string;
  size: string;
  volumeMl: number;
  priceCents: number;
  compareAtPriceCents?: number | null;
  stock: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  preorderEnabled?: boolean;
  restockDate?: Date | null;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  sortOrder: number;
}

interface SeedProduct {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  scentProfile: string;
  fragranceFamily:
    | "FLORAL"
    | "ORIENTAL"
    | "HOLZIG"
    | "FRISCH"
    | "ZITRUS"
    | "GOURMAND"
    | "AROMATISCH"
    | "CHYPRE"
    | "LEDER";
  kind: "PARFUM" | "ABFUELLUNG" | "PROBE" | "SET";
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  ingredients: string;
  usage: string;
  legalNotice?: string;
  isAlternative: boolean;
  isBestseller: boolean;
  isNew: boolean;
  popularity: number;
  categorySlugs: string[];
  images: Array<{ url: string; alt: string }>;
  variants: SeedVariant[];
}

const STANDARD_USAGE =
  "Auf die Haut an Puls- und Wärmepunkten auftragen: Handgelenke, Halsseiten und " +
  "hinter den Ohren. Nicht verreiben – das zerstört die feinen Kopfnoten. " +
  "Bei empfindlicher Haut zuerst an einer kleinen Stelle testen. " +
  "Kühl, trocken und vor direktem Sonnenlicht geschützt lagern.";

const STANDARD_INGREDIENTS =
  "Alcohol Denat., Parfum (Fragrance), Aqua, Limonene, Linalool, Coumarin, " +
  "Citral, Geraniol, Citronellol, Benzyl Salicylate, Eugenol.\n\n" +
  "Enthält Duftstoffe, die allergische Reaktionen hervorrufen können. " +
  "Nur zur äusserlichen Anwendung. Darf nicht in die Hände von Kindern gelangen. " +
  "Von Zündquellen fernhalten – nicht rauchen. Bei Augenkontakt gründlich mit " +
  "Wasser spülen. Angaben ohne Gewähr; massgeblich ist stets die Verpackung.";

const ALTERNATIVE_NOTICE =
  "Dieses Produkt ist eine eigenständige Duftalternative und keine Originalware. " +
  "Es besteht keine Verbindung, Lizenzierung oder Zusammenarbeit mit den Herstellern " +
  "anderer Düfte. Alle gegebenenfalls genannten Marken sind Eigentum ihrer jeweiligen " +
  "Inhaber und dienen ausschliesslich der Beschreibung einer Duftrichtung.";

const products: SeedProduct[] = [
  // -------------------------------------------------------------------------
  // 1. Golden Amber – gut verfügbar, klassischer Bestseller
  // -------------------------------------------------------------------------
  {
    slug: "golden-amber",
    name: "Golden Amber",
    subtitle: "Warmer Bernstein mit Vanille und getrockneten Früchten",
    description:
      "Golden Amber öffnet mit einer kandierten Süsse aus Mandarine und rosa Pfeffer, die schnell in ein weiches Herz aus Amber und Labdanum übergeht.\n" +
      "Im Verlauf wird der Duft ruhiger: Vanille, Tonkabohne und ein Hauch Zedernholz bilden eine warme Basis, die stundenlang auf der Haut bleibt.\n" +
      "Ein Duft für kühlere Abende und für alle, die es weich und umhüllend mögen – deutlich wahrnehmbar, aber nie aufdringlich.",
    scentProfile: "Warm-orientalisch mit Amber, Vanille und Trockenfrüchten",
    fragranceFamily: "ORIENTAL",
    kind: "PARFUM",
    topNotes: ["Mandarine", "Rosa Pfeffer", "Bergamotte"],
    heartNotes: ["Amber", "Labdanum", "Pflaume"],
    baseNotes: ["Vanille", "Tonkabohne", "Zedernholz"],
    ingredients: STANDARD_INGREDIENTS,
    usage: STANDARD_USAGE,
    isAlternative: false,
    isBestseller: true,
    isNew: false,
    popularity: 980,
    categorySlugs: ["unisex", "abfuellungen"],
    images: [
      { url: "/produkte/golden-amber-1.svg", alt: "Golden Amber – Flakon in warmem Gold vor dunklem Hintergrund" },
      { url: "/produkte/golden-amber-2.svg", alt: "Golden Amber – seitliche Ansicht des Flakons" },
    ],
    variants: [
      { sku: "RS-GA-002", size: "2 ml", volumeMl: 2, priceCents: 490, stock: 64, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 1 },
      { sku: "RS-GA-005", size: "5 ml", volumeMl: 5, priceCents: 990, stock: 41, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 2 },
      { sku: "RS-GA-010", size: "10 ml", volumeMl: 10, priceCents: 1790, compareAtPriceCents: 1990, stock: 28, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 3 },
      { sku: "RS-GA-030", size: "30 ml", volumeMl: 30, priceCents: 4490, stock: 12, deliveryMinDays: 1, deliveryMaxDays: 3, sortOrder: 4 },
      { sku: "RS-GA-050", size: "50 ml", volumeMl: 50, priceCents: 6900, stock: 6, deliveryMinDays: 1, deliveryMaxDays: 3, sortOrder: 5 },
    ],
  },

  // -------------------------------------------------------------------------
  // 2. Midnight Oud – Duftalternative, teils knapper Bestand
  // -------------------------------------------------------------------------
  {
    slug: "midnight-oud",
    name: "Midnight Oud",
    subtitle: "Dunkles Oud mit Rose und Safran – intensiv und langanhaltend",
    description:
      "Midnight Oud ist der intensivste Duft unseres Sortiments. Safran und schwarzer Pfeffer treffen auf eine tiefrote Rose, die von Oudholz getragen wird.\n" +
      "Die Basis aus Patchouli, Leder und Moschus sorgt für eine ausgeprägte Haltbarkeit – zwei Sprühstösse genügen in der Regel für den ganzen Abend.\n" +
      "Wir empfehlen, diesen Duft zuerst in 2 ml oder 5 ml zu testen. Oud ist Geschmackssache und entfaltet sich auf jeder Haut etwas anders.",
    scentProfile: "Dunkel-holzig mit Oud, Rose und Safran",
    fragranceFamily: "HOLZIG",
    kind: "ABFUELLUNG",
    topNotes: ["Safran", "Schwarzer Pfeffer", "Muskatnuss"],
    heartNotes: ["Rose", "Oudholz", "Zeder"],
    baseNotes: ["Patchouli", "Leder", "Weisser Moschus"],
    ingredients: STANDARD_INGREDIENTS,
    usage: STANDARD_USAGE,
    legalNotice: ALTERNATIVE_NOTICE,
    isAlternative: true,
    isBestseller: true,
    isNew: true,
    popularity: 870,
    categorySlugs: ["herren", "unisex", "abfuellungen"],
    images: [
      { url: "/produkte/midnight-oud-1.svg", alt: "Midnight Oud – schlanker Flakon mit violettem Schimmer" },
      { url: "/produkte/midnight-oud-2.svg", alt: "Midnight Oud – Detailansicht des Flakons" },
    ],
    variants: [
      { sku: "RS-MO-002", size: "2 ml", volumeMl: 2, priceCents: 690, stock: 38, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 1 },
      { sku: "RS-MO-005", size: "5 ml", volumeMl: 5, priceCents: 1490, stock: 22, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 2 },
      // Knapper Bestand: zeigt "Nur noch X Stück verfügbar".
      { sku: "RS-MO-010", size: "10 ml", volumeMl: 10, priceCents: 2790, stock: 3, lowStockThreshold: 5, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 3 },
      { sku: "RS-MO-030", size: "30 ml", volumeMl: 30, priceCents: 7490, stock: 2, lowStockThreshold: 3, deliveryMinDays: 2, deliveryMaxDays: 4, sortOrder: 4 },
    ],
  },

  // -------------------------------------------------------------------------
  // 3. Velvet Rose – ausverkauft mit Wiederverfügbarkeitsdatum
  // -------------------------------------------------------------------------
  {
    slug: "velvet-rose",
    name: "Velvet Rose",
    subtitle: "Samtige Rose mit Litschi und weissem Moschus",
    description:
      "Velvet Rose zeigt die Rose von ihrer weichen Seite: keine schwere, klassische Rose, sondern eine helle, fast durchscheinende Interpretation.\n" +
      "Litschi und Himbeere sorgen zu Beginn für Frische, das Herz bleibt blumig mit Pfingstrose und Veilchen. In der Basis trägt weisser Moschus den Duft ruhig aus.\n" +
      "Angenehm im Alltag und auch im Büro tragbar – nah an der Haut und ohne aufdringliche Süsse.",
    scentProfile: "Blumig-frisch mit Rose, Litschi und Moschus",
    fragranceFamily: "FLORAL",
    kind: "PARFUM",
    topNotes: ["Litschi", "Himbeere", "Zitrone"],
    heartNotes: ["Rose", "Pfingstrose", "Veilchen"],
    baseNotes: ["Weisser Moschus", "Zedernholz", "Amber"],
    ingredients: STANDARD_INGREDIENTS,
    usage: STANDARD_USAGE,
    isAlternative: false,
    isBestseller: false,
    isNew: false,
    popularity: 640,
    categorySlugs: ["damen", "abfuellungen"],
    images: [
      { url: "/produkte/velvet-rose-1.svg", alt: "Velvet Rose – runder Flakon mit rosafarbenem Schimmer" },
      { url: "/produkte/velvet-rose-2.svg", alt: "Velvet Rose – zweite Ansicht des Flakons" },
    ],
    variants: [
      { sku: "RS-VR-002", size: "2 ml", volumeMl: 2, priceCents: 450, stock: 25, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 1 },
      { sku: "RS-VR-005", size: "5 ml", volumeMl: 5, priceCents: 890, stock: 14, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 2 },
      // Ausverkauft, aber mit Datum: "Nicht auf Lager – wieder verfügbar ab …".
      { sku: "RS-VR-030", size: "30 ml", volumeMl: 30, priceCents: 3990, stock: 0, preorderEnabled: false, restockDate: inDays(21), deliveryMinDays: 1, deliveryMaxDays: 3, sortOrder: 3 },
      { sku: "RS-VR-050", size: "50 ml", volumeMl: 50, priceCents: 5990, stock: 0, preorderEnabled: false, restockDate: inDays(21), deliveryMinDays: 1, deliveryMaxDays: 3, sortOrder: 4 },
    ],
  },

  // -------------------------------------------------------------------------
  // 4. Noir Vanilla – vorbestellbar
  // -------------------------------------------------------------------------
  {
    slug: "noir-vanilla",
    name: "Noir Vanilla",
    subtitle: "Dunkle Vanille mit Tabak, Kaffee und Tonka",
    description:
      "Noir Vanilla ist eine dunkle, geröstete Vanille – weit entfernt von süsslichem Dessertduft. Kaffee und Tabakblatt geben Tiefe, Tonkabohne rundet ab.\n" +
      "Nach dem Auftragen bleibt zunächst eine bittere Kakaonote, die sich langsam zu einer cremigen Vanille öffnet.\n" +
      "Die aktuelle Charge ist in Produktion. Du kannst bereits vorbestellen – wir versenden, sobald die Ware eingetroffen ist.",
    scentProfile: "Gourmandig-dunkel mit Vanille, Tabak und Kaffee",
    fragranceFamily: "GOURMAND",
    kind: "PARFUM",
    topNotes: ["Kakao", "Bergamotte", "Kardamom"],
    heartNotes: ["Tabakblatt", "Kaffee", "Zimt"],
    baseNotes: ["Bourbon-Vanille", "Tonkabohne", "Sandelholz"],
    ingredients: STANDARD_INGREDIENTS,
    usage: STANDARD_USAGE,
    legalNotice: ALTERNATIVE_NOTICE,
    isAlternative: true,
    isBestseller: false,
    isNew: true,
    popularity: 720,
    categorySlugs: ["unisex", "abfuellungen"],
    images: [
      { url: "/produkte/noir-vanilla-1.svg", alt: "Noir Vanilla – bauchiger Flakon in warmem Braunton" },
      { url: "/produkte/noir-vanilla-2.svg", alt: "Noir Vanilla – zweite Ansicht des Flakons" },
    ],
    variants: [
      { sku: "RS-NV-002", size: "2 ml", volumeMl: 2, priceCents: 590, stock: 30, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 1 },
      { sku: "RS-NV-005", size: "5 ml", volumeMl: 5, priceCents: 1190, stock: 9, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 2 },
      // Vorbestellbar: kein Bestand, aber bestellbar mit längerer Lieferzeit.
      { sku: "RS-NV-030", size: "30 ml", volumeMl: 30, priceCents: 5490, stock: 0, preorderEnabled: true, restockDate: inDays(14), deliveryMinDays: 10, deliveryMaxDays: 18, sortOrder: 3 },
      { sku: "RS-NV-100", size: "100 ml", volumeMl: 100, priceCents: 11900, stock: 0, preorderEnabled: true, restockDate: inDays(14), deliveryMinDays: 10, deliveryMaxDays: 18, sortOrder: 4 },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. Citrus Élan – frisch, mit Streichpreis
  // -------------------------------------------------------------------------
  {
    slug: "citrus-elan",
    name: "Citrus Élan",
    subtitle: "Spritzige Zitrusnoten mit Neroli und Vetiver",
    description:
      "Citrus Élan ist unser leichtester Duft: Zitrone, Grapefruit und Bergamotte sorgen für einen klaren, sauberen Auftakt.\n" +
      "Neroli und Petitgrain geben dem Herzen eine grüne, leicht bittere Nuance, bevor Vetiver und weisser Moschus für einen ruhigen Ausklang sorgen.\n" +
      "Ideal für warme Tage und für alle, die es unaufdringlich mögen. Erwartungsgemäss kürzere Haltbarkeit als schwere Ambernoten – dafür jederzeit nachlegbar.",
    scentProfile: "Frisch-zitrisch mit Neroli und Vetiver",
    fragranceFamily: "ZITRUS",
    kind: "PARFUM",
    topNotes: ["Zitrone", "Grapefruit", "Bergamotte"],
    heartNotes: ["Neroli", "Petitgrain", "Grüner Tee"],
    baseNotes: ["Vetiver", "Weisser Moschus", "Zedernholz"],
    ingredients: STANDARD_INGREDIENTS,
    usage: STANDARD_USAGE,
    isAlternative: false,
    isBestseller: true,
    isNew: false,
    popularity: 810,
    categorySlugs: ["unisex", "damen", "abfuellungen"],
    images: [
      { url: "/produkte/citrus-elan-1.svg", alt: "Citrus Élan – heller Flakon mit gelbem Schimmer" },
      { url: "/produkte/citrus-elan-2.svg", alt: "Citrus Élan – zweite Ansicht des Flakons" },
    ],
    variants: [
      { sku: "RS-CE-002", size: "2 ml", volumeMl: 2, priceCents: 390, stock: 52, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 1 },
      { sku: "RS-CE-010", size: "10 ml", volumeMl: 10, priceCents: 1490, compareAtPriceCents: 1890, stock: 33, deliveryMinDays: 1, deliveryMaxDays: 2, sortOrder: 2 },
      { sku: "RS-CE-050", size: "50 ml", volumeMl: 50, priceCents: 5490, compareAtPriceCents: 6490, stock: 17, deliveryMinDays: 1, deliveryMaxDays: 3, sortOrder: 3 },
      { sku: "RS-CE-100", size: "100 ml", volumeMl: 100, priceCents: 8900, stock: 8, deliveryMinDays: 1, deliveryMaxDays: 3, sortOrder: 4 },
    ],
  },

  // -------------------------------------------------------------------------
  // 6. Royal Essence – Set, mit einer deaktivierten Variante
  // -------------------------------------------------------------------------
  {
    slug: "royal-essence",
    name: "Royal Essence",
    subtitle: "Entdeckerset mit fünf Abfüllungen à 2 ml",
    description:
      "Royal Essence ist unser Entdeckerset: fünf Abfüllungen à 2 ml aus unserem Sortiment, verpackt in einer schlichten schwarzen Box mit Goldprägung.\n" +
      "Enthalten sind Golden Amber, Midnight Oud, Velvet Rose, Noir Vanilla und Citrus Élan – die ideale Möglichkeit, in Ruhe zu vergleichen.\n" +
      "Das Set eignet sich gut als Geschenk. Auf Wunsch legen wir eine handgeschriebene Karte bei – schreib uns dazu einfach im Bestellkommentar.",
    scentProfile: "Querschnitt durch das Sortiment – von zitrisch bis orientalisch",
    fragranceFamily: "AROMATISCH",
    kind: "SET",
    topNotes: ["Bergamotte", "Zitrone", "Safran"],
    heartNotes: ["Rose", "Amber", "Tabak"],
    baseNotes: ["Vanille", "Oudholz", "Moschus"],
    ingredients: STANDARD_INGREDIENTS,
    usage:
      "Jede Abfüllung ist einzeln beschriftet. Wir empfehlen, pro Tag nur einen Duft zu testen – " +
      "die Nase gewöhnt sich schnell und vergleicht sonst ungenau.\n\n" +
      STANDARD_USAGE,
    isAlternative: false,
    isBestseller: false,
    isNew: true,
    popularity: 560,
    categorySlugs: ["sets", "unisex"],
    images: [
      { url: "/produkte/royal-essence-1.svg", alt: "Royal Essence – Set-Verpackung in Schwarz mit goldener Prägung" },
      { url: "/produkte/royal-essence-2.svg", alt: "Royal Essence – zweite Ansicht des Sets" },
    ],
    variants: [
      { sku: "RS-RE-SET5", size: "Set mit 5 × 2 ml", volumeMl: 10, priceCents: 2490, compareAtPriceCents: 2610, stock: 19, deliveryMinDays: 2, deliveryMaxDays: 4, sortOrder: 1 },
      { sku: "RS-RE-SET3", size: "Set mit 3 × 2 ml", volumeMl: 6, priceCents: 1590, stock: 4, lowStockThreshold: 5, deliveryMinDays: 2, deliveryMaxDays: 4, sortOrder: 2 },
      // Deaktiviert: zeigt "Derzeit nicht bestellbar" im Adminbereich.
      { sku: "RS-RE-SET10", size: "Set mit 10 × 2 ml", volumeMl: 20, priceCents: 4490, stock: 0, isActive: false, deliveryMinDays: 3, deliveryMaxDays: 6, sortOrder: 3 },
    ],
  },
];

const discountCodes = [
  {
    code: "WILLKOMMEN10",
    description: "10 % Rabatt für Neukundinnen und Neukunden",
    type: "PERCENT" as const,
    value: 1000, // Basispunkte
    minSubtotalCents: 2000,
    maxRedemptions: 500,
    isActive: true,
  },
  {
    code: "GRATISVERSAND",
    description: "Versandkostenfrei ab 30 €",
    type: "FREE_SHIPPING" as const,
    value: 0,
    minSubtotalCents: 3000,
    maxRedemptions: null,
    isActive: true,
  },
  {
    code: "START5",
    description: "5 € Rabatt ab 40 € Bestellwert",
    type: "FIXED" as const,
    value: 500, // Cent
    minSubtotalCents: 4000,
    maxRedemptions: 200,
    isActive: true,
  },
];

async function main() {
  console.log("Seed wird ausgeführt …\n");

  // ---------------------------------------------------------------------
  // Adminkonto
  // ---------------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@rare-scents.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AendereMich2026!";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Shop-Administration",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
    },
    update: {},
  });
  console.log(`Adminkonto: ${admin.email}`);

  // ---------------------------------------------------------------------
  // Kategorien
  // ---------------------------------------------------------------------
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        name: category.name,
        description: category.description,
        kind: category.kind,
        sortOrder: category.sortOrder,
        heroImageUrl: category.heroImageUrl,
      },
    });
  }
  console.log(`${categories.length} Kategorien angelegt`);

  // ---------------------------------------------------------------------
  // Produkte
  // ---------------------------------------------------------------------
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle,
        description: product.description,
        scentProfile: product.scentProfile,
        fragranceFamily: product.fragranceFamily,
        kind: product.kind,
        topNotes: product.topNotes,
        heartNotes: product.heartNotes,
        baseNotes: product.baseNotes,
        ingredients: product.ingredients,
        usage: product.usage,
        legalNotice: product.legalNotice ?? null,
        isAlternative: product.isAlternative,
        isDemo: true,
        isActive: true,
        isBestseller: product.isBestseller,
        isNew: product.isNew,
        popularity: product.popularity,
        metaTitle: `${product.name} – ${product.subtitle}`,
        metaDesc: product.subtitle,
        categories: {
          connect: product.categorySlugs.map((slug) => ({ slug })),
        },
      },
      update: {
        name: product.name,
        subtitle: product.subtitle,
        description: product.description,
        isBestseller: product.isBestseller,
        isNew: product.isNew,
        popularity: product.popularity,
        categories: {
          set: product.categorySlugs.map((slug) => ({ slug })),
        },
      },
    });

    // Bilder neu setzen (idempotent).
    await prisma.productImage.deleteMany({ where: { productId: created.id } });
    await prisma.productImage.createMany({
      data: product.images.map((image, index) => ({
        productId: created.id,
        url: image.url,
        alt: image.alt,
        width: 800,
        height: 1000,
        sortOrder: index,
      })),
    });

    // Varianten anlegen bzw. aktualisieren. Bestände werden bewusst nur beim
    // ersten Anlegen gesetzt, damit ein erneuter Seed-Lauf keine echten
    // Bestandszahlen überschreibt.
    for (const variant of product.variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        create: {
          productId: created.id,
          sku: variant.sku,
          size: variant.size,
          volumeMl: variant.volumeMl,
          priceCents: variant.priceCents,
          compareAtPriceCents: variant.compareAtPriceCents ?? null,
          stock: variant.stock,
          lowStockThreshold: variant.lowStockThreshold ?? 3,
          isActive: variant.isActive ?? true,
          preorderEnabled: variant.preorderEnabled ?? false,
          restockDate: variant.restockDate ?? null,
          deliveryMinDays: variant.deliveryMinDays,
          deliveryMaxDays: variant.deliveryMaxDays,
          sortOrder: variant.sortOrder,
        },
        update: {
          size: variant.size,
          volumeMl: variant.volumeMl,
          priceCents: variant.priceCents,
          compareAtPriceCents: variant.compareAtPriceCents ?? null,
          isActive: variant.isActive ?? true,
          preorderEnabled: variant.preorderEnabled ?? false,
          restockDate: variant.restockDate ?? null,
          deliveryMinDays: variant.deliveryMinDays,
          deliveryMaxDays: variant.deliveryMaxDays,
          sortOrder: variant.sortOrder,
        },
      });
    }

    console.log(
      `Produkt „${product.name}“ mit ${product.variants.length} Größen angelegt`,
    );
  }

  // ---------------------------------------------------------------------
  // Rabattcodes
  // ---------------------------------------------------------------------
  for (const code of discountCodes) {
    await prisma.discountCode.upsert({
      where: { code: code.code },
      create: code,
      update: {
        description: code.description,
        type: code.type,
        value: code.value,
        minSubtotalCents: code.minSubtotalCents,
        maxRedemptions: code.maxRedemptions,
        isActive: code.isActive,
      },
    });
  }
  console.log(`${discountCodes.length} Rabattcodes angelegt`);

  console.log("\nSeed abgeschlossen.");
  console.log("---------------------------------------------");
  console.log(`Admin-Login:  ${adminEmail}`);
  console.log(`Passwort:     ${adminPassword}`);
  console.log("Bitte das Passwort nach der ersten Anmeldung ändern.");
  console.log("---------------------------------------------");
}

main()
  .catch((error) => {
    console.error("Seed fehlgeschlagen:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
