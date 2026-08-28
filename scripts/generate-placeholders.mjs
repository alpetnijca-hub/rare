/**
 * Erzeugt die Demo-Produktbilder als SVG.
 *
 * Bewusst selbst gezeichnet: Es werden keine fremden Produktfotos und keine
 * geschützten Logos verwendet. Für den Livegang werden diese Dateien durch
 * eigene Produktfotos ersetzt (Upload über das Admin-Dashboard zu Cloudinary).
 *
 * Aufruf:  node scripts/generate-placeholders.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, "..", "public", "produkte");

/** Flakon-Silhouette in unterschiedlichen Grundformen. */
function bottle(shape) {
  switch (shape) {
    case "tall":
      return "M300 250h200v70l40 40v300a40 40 0 0 1-40 40H300a40 40 0 0 1-40-40V360l40-40z";
    case "round":
      return "M400 250c90 0 170 80 170 190s-70 200-170 200-170-90-170-200 80-190 170-190z";
    case "flask":
      return "M310 260h180v90l70 130a70 70 0 0 1-60 110H300a70 70 0 0 1-60-110l70-130z";
    case "square":
      return "M270 280h260v340a40 40 0 0 1-40 40H310a40 40 0 0 1-40-40z";
    default:
      return "M290 260h220v80l30 60v260a40 40 0 0 1-40 40H300a40 40 0 0 1-40-40V400l30-60z";
  }
}

function svg({ id, monogram, accent, accentSoft, shape, angle }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="Stilisierte Illustration eines Parfuemflakons">
  <defs>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#101010"/>
      <stop offset="55%" stop-color="#0b0b0b"/>
      <stop offset="100%" stop-color="#151515"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="50%" cy="42%" r="52%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.24"/>
      <stop offset="65%" stop-color="${accent}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="glass-${id}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0%" stop-color="${accentSoft}" stop-opacity="0.30"/>
      <stop offset="45%" stop-color="${accent}" stop-opacity="0.13"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.30"/>
    </linearGradient>
    <linearGradient id="edge-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E1C785"/>
      <stop offset="50%" stop-color="#C8A45D"/>
      <stop offset="100%" stop-color="#8a703a"/>
    </linearGradient>
  </defs>

  <rect width="800" height="1000" fill="url(#bg-${id})"/>
  <rect width="800" height="1000" fill="url(#glow-${id})"/>

  <ellipse cx="400" cy="742" rx="168" ry="16" fill="#000" opacity="0.5"/>

  <rect x="356" y="176" width="88" height="62" rx="3" fill="url(#edge-${id})" opacity="0.9"/>
  <rect x="374" y="238" width="52" height="24" fill="#1a1a1a" stroke="url(#edge-${id})" stroke-width="1.2"/>

  <path d="${bottle(shape)}" fill="url(#glass-${id})" stroke="url(#edge-${id})" stroke-width="2.2" stroke-linejoin="round"/>

  <rect x="322" y="452" width="156" height="112" fill="#0a0a0a" opacity="0.72" stroke="#C8A45D" stroke-opacity="0.45"/>
  <text x="400" y="512" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="#E1C785" letter-spacing="4">${monogram}</text>
  <text x="400" y="540" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#8a8a8a" letter-spacing="5">RARE SCENTS</text>

  <text x="400" y="928" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#5a5a5a" letter-spacing="4">DEMO-ABBILDUNG</text>
</svg>
`;
}

const products = [
  { id: "golden-amber", monogram: "GA", accent: "#C8A45D", accentSoft: "#E1C785", shape: "square", angle: 15 },
  { id: "midnight-oud", monogram: "MO", accent: "#7a5cff", accentSoft: "#b3a4ff", shape: "tall", angle: 35 },
  { id: "velvet-rose", monogram: "VR", accent: "#d1567f", accentSoft: "#f0a7c0", shape: "round", angle: 25 },
  { id: "noir-vanilla", monogram: "NV", accent: "#b07c3f", accentSoft: "#e0bd8a", shape: "flask", angle: 45 },
  { id: "citrus-elan", monogram: "CE", accent: "#d8c14a", accentSoft: "#f2e6a0", shape: "tall", angle: 10 },
];

/** Zweites Bild je Produkt: gleiche Formsprache, andere Perspektive. */
function detailSvg(product) {
  return svg({ ...product, angle: (product.angle + 120) % 360, shape: "default" });
}

/** Hero-Bild der Startseite - querformatig. */
function heroSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000" role="img" aria-label="Stimmungsbild mit Parfuemflakons">
  <defs>
    <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="50%" stop-color="#121212"/>
      <stop offset="100%" stop-color="#080808"/>
    </linearGradient>
    <radialGradient id="hero-glow" cx="62%" cy="45%" r="46%">
      <stop offset="0%" stop-color="#C8A45D" stop-opacity="0.20"/>
      <stop offset="70%" stop-color="#C8A45D" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#C8A45D" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hero-edge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E1C785"/>
      <stop offset="100%" stop-color="#8a703a"/>
    </linearGradient>
    <linearGradient id="hero-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E1C785" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.35"/>
    </linearGradient>
  </defs>

  <rect width="1600" height="1000" fill="url(#hero-bg)"/>
  <rect width="1600" height="1000" fill="url(#hero-glow)"/>

  <rect x="0" y="726" width="1600" height="1" fill="#C8A45D" opacity="0.18"/>

  <g opacity="0.95">
    <ellipse cx="1010" cy="720" rx="150" ry="14" fill="#000" opacity="0.55"/>
    <rect x="966" y="250" width="88" height="56" rx="3" fill="url(#hero-edge)" opacity="0.9"/>
    <path d="M900 306h220v70l34 56v256a34 34 0 0 1-34 34H900a34 34 0 0 1-34-34V432l34-56z" fill="url(#hero-glass)" stroke="url(#hero-edge)" stroke-width="2.4"/>
    <rect x="936" y="500" width="148" height="104" fill="#0a0a0a" opacity="0.7" stroke="#C8A45D" stroke-opacity="0.4"/>
    <text x="1010" y="556" text-anchor="middle" font-family="Georgia, serif" font-size="40" fill="#E1C785" letter-spacing="5">RS</text>
  </g>

  <g opacity="0.6">
    <ellipse cx="1290" cy="726" rx="96" ry="11" fill="#000" opacity="0.5"/>
    <rect x="1262" y="386" width="56" height="38" rx="2" fill="url(#hero-edge)" opacity="0.8"/>
    <path d="M1222 424h136v46l22 38v190a26 26 0 0 1-26 26h-128a26 26 0 0 1-26-26V508l22-38z" fill="url(#hero-glass)" stroke="url(#hero-edge)" stroke-width="1.8"/>
  </g>

  <g opacity="0.42">
    <ellipse cx="770" cy="730" rx="74" ry="9" fill="#000" opacity="0.5"/>
    <rect x="750" y="470" width="40" height="28" rx="2" fill="url(#hero-edge)" opacity="0.7"/>
    <path d="M722 498h96v34l16 28v142a20 20 0 0 1-20 20h-88a20 20 0 0 1-20-20V560l16-28z" fill="url(#hero-glass)" stroke="url(#hero-edge)" stroke-width="1.5"/>
  </g>

  <text x="1520" y="960" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#4a4a4a" letter-spacing="4">DEMO-ABBILDUNG</text>
</svg>
`;
}

/**
 * Kategoriebild.
 *
 * Kein Flakon-Symbol mehr, sondern eine gebaute Lichtstimmung: warme
 * Farbwolken über tiefem Schwarz, ein schräger Lichtstreif, eine angedeutete
 * Glaskante und eine feine Körnung. In der Kachel wirkt das wie ein
 * atmosphärisches Foto statt wie ein Platzhalter – und es bleibt lizenzfrei,
 * weil wir es selbst erzeugen.
 *
 * Hochformat 4:5, weil die Kacheln auf der Startseite hochkant stehen.
 */
function categorySvg(label, accent, second, aufbau) {
  const id = (name) => `${name}-${label}`;
  const { hell, warm, klein, winkel, streifY } = aufbau;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="${id("grund")}" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="#17110c"/>
      <stop offset="45%" stop-color="#0d0a08"/>
      <stop offset="100%" stop-color="#050403"/>
    </linearGradient>

    <radialGradient id="${id("wolke1")}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.95"/>
      <stop offset="40%" stop-color="${accent}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="${id("wolke2")}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${second}" stop-opacity="0.75"/>
      <stop offset="45%" stop-color="${second}" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="${second}" stop-opacity="0"/>
    </radialGradient>

    <!-- Schräger Lichtstreif, wie er über geschliffenem Glas liegt. -->
    <linearGradient id="${id("streif")}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffe6bd" stop-opacity="0"/>
      <stop offset="50%" stop-color="#fff2da" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffe6bd" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="${id("kante")}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#C8A45D" stop-opacity="0"/>
      <stop offset="45%" stop-color="#e6c98a" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#C8A45D" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="${id("fuss")}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#050403" stop-opacity="0.95"/>
      <stop offset="40%" stop-color="#050403" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#050403" stop-opacity="0"/>
    </linearGradient>

    <radialGradient id="${id("vignette")}" cx="50%" cy="42%" r="72%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.65"/>
    </radialGradient>

    <!-- Feine Körnung: nimmt der Fläche das Digitale. -->
    <filter id="${id("korn")}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" seed="11"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.32"/>
      </feComponentTransfer>
    </filter>

    <filter id="${id("weich")}" x="-45%" y="-45%" width="190%" height="190%">
      <feGaussianBlur stdDeviation="46"/>
    </filter>

    <filter id="${id("halbweich")}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>

  <rect width="800" height="1000" fill="url(#${id("grund")})"/>

  <g filter="url(#${id("weich")})">
    <ellipse cx="${hell[0]}" cy="${hell[1]}" rx="${hell[2]}" ry="${hell[3]}" fill="url(#${id("wolke1")})"/>
    <ellipse cx="${warm[0]}" cy="${warm[1]}" rx="${warm[2]}" ry="${warm[3]}" fill="url(#${id("wolke2")})"/>
    <ellipse cx="${klein[0]}" cy="${klein[1]}" rx="${klein[2]}" ry="${klein[3]}" fill="url(#${id("wolke2")})" opacity="0.5"/>
  </g>

  <!-- Angedeutete Glaskante: ein weit gezogener Bogen, kaum sichtbar. -->
  <g filter="url(#${id("halbweich")})" opacity="0.7">
    <path d="M-40 ${streifY + 300} C 220 ${streifY + 90}, 520 ${streifY + 40}, 860 ${streifY - 130}"
          fill="none" stroke="url(#${id("kante")})" stroke-width="2"/>
  </g>

  <g filter="url(#${id("halbweich")})">
    <rect x="-180" y="${streifY}" width="1160" height="26"
          fill="url(#${id("streif")})" opacity="0.3"
          transform="rotate(${winkel} 400 ${streifY + 13})"/>
  </g>

  <rect width="800" height="1000" fill="url(#${id("vignette")})"/>
  <rect width="800" height="1000" filter="url(#${id("korn")})" opacity="0.6"/>
  <rect y="470" width="800" height="530" fill="url(#${id("fuss")})"/>
</svg>
`;
}

await mkdir(outputDir, { recursive: true });

for (const product of products) {
  await writeFile(join(outputDir, `${product.id}-1.svg`), svg(product), "utf8");
  await writeFile(join(outputDir, `${product.id}-2.svg`), detailSvg(product), "utf8");
}

await writeFile(join(outputDir, "hero.svg"), heroSvg(), "utf8");

// Akzentfarbe und zweite, wärmere Farbe je Kategorie. Beide bleiben in der
// Gold-Palette des Shops, damit die Kacheln nebeneinander eine Familie bilden.
// Akzentfarbe, zweite wärmere Farbe und Bildaufbau je Kategorie. Die Farben
// bleiben in der Gold-Palette des Shops, damit die Kacheln nebeneinander eine
// Familie bilden; der Aufbau unterscheidet sich, damit sie nicht wie dasselbe
// Bild in drei Farben aussehen.
const categories = [
  {
    slug: "damen",
    accent: "#b8555e",
    second: "#e0a06a",
    aufbau: {
      hell: [230, 250, 300, 240],
      warm: [640, 660, 250, 300],
      klein: [110, 800, 200, 170],
      winkel: -27,
      streifY: 330,
    },
  },
  {
    slug: "herren",
    accent: "#96541a",
    second: "#d09646",
    aufbau: {
      hell: [590, 340, 275, 290],
      warm: [190, 690, 290, 260],
      klein: [700, 900, 200, 160],
      winkel: 19,
      streifY: 520,
    },
  },
  {
    slug: "unisex",
    accent: "#c9a86a",
    second: "#7d6440",
    aufbau: {
      hell: [400, 620, 330, 270],
      warm: [660, 200, 260, 230],
      klein: [90, 300, 210, 200],
      winkel: -9,
      streifY: 250,
    },
  },
  {
    slug: "abfuellungen",
    accent: "#8f7a44",
    second: "#bd8250",
    aufbau: {
      hell: [300, 430, 280, 300],
      warm: [640, 830, 250, 240],
      klein: [660, 130, 190, 170],
      winkel: 12,
      streifY: 620,
    },
  },
];

for (const { slug, accent, second, aufbau } of categories) {
  await writeFile(
    join(outputDir, `kategorie-${slug}.svg`),
    categorySvg(slug, accent, second, aufbau),
    "utf8",
  );
}

console.log(
  `${products.length * 2 + categories.length + 1} Demo-Bilder erzeugt in public/produkte/`,
);
