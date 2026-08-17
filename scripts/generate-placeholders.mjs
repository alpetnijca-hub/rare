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
  { id: "royal-essence", monogram: "RE", accent: "#3f7fb0", accentSoft: "#9ecbe8", shape: "square", angle: 55 },
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

/** Kategoriebild - quadratisch, sehr reduziert. */
function categorySvg(label, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="cat-bg-${label}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#131313"/>
      <stop offset="100%" stop-color="#080808"/>
    </linearGradient>
    <radialGradient id="cat-glow-${label}" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#cat-bg-${label})"/>
  <rect width="600" height="600" fill="url(#cat-glow-${label})"/>
  <circle cx="300" cy="288" r="118" fill="none" stroke="#C8A45D" stroke-opacity="0.35" stroke-width="1.4"/>
  <circle cx="300" cy="288" r="86" fill="none" stroke="#C8A45D" stroke-opacity="0.18" stroke-width="1"/>
  <path d="M268 236h64v26l14 24v96a20 20 0 0 1-20 20h-52a20 20 0 0 1-20-20v-96l14-24z" fill="#0d0d0d" stroke="#C8A45D" stroke-width="1.6" stroke-opacity="0.75"/>
  <rect x="288" y="212" width="24" height="24" fill="#C8A45D" opacity="0.75"/>
</svg>
`;
}

await mkdir(outputDir, { recursive: true });

for (const product of products) {
  await writeFile(join(outputDir, `${product.id}-1.svg`), svg(product), "utf8");
  await writeFile(join(outputDir, `${product.id}-2.svg`), detailSvg(product), "utf8");
}

await writeFile(join(outputDir, "hero.svg"), heroSvg(), "utf8");

const categories = [
  ["damen", "#d1567f"],
  ["herren", "#3f7fb0"],
  ["unisex", "#C8A45D"],
  ["abfuellungen", "#7a9c6a"],
  ["sets", "#b07c3f"],
];

for (const [slug, accent] of categories) {
  await writeFile(
    join(outputDir, `kategorie-${slug}.svg`),
    categorySvg(slug, accent),
    "utf8",
  );
}

console.log(
  `${products.length * 2 + categories.length + 1} Demo-Bilder erzeugt in public/produkte/`,
);
