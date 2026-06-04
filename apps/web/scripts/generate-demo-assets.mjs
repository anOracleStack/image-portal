/**
 * Generates WebP demo assets per use-case slug.
 * Run from repo root: node apps/web/scripts/generate-demo-assets.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const publicDemo = path.join(webRoot, "public", "demo");
const legacyPoster = path.join(publicDemo, "poster-reference.png");
const legacyScan = path.join(publicDemo, "scan-photo.png");

const SLUGS = [
  {
    slug: "posters-flyers",
    headline: "SUMMER LAUNCH",
    sub: "Live music · Aug 24",
    palette: ["#0f172a", "#5eead4", "#f8fafc"],
    useLegacy: true,
  },
  {
    slug: "restaurant-menus",
    headline: "CHEF'S TABLE",
    sub: "Seasonal tasting menu",
    palette: ["#1c1917", "#d97706", "#fef3c7"],
  },
  {
    slug: "event-tickets",
    headline: "ARENA NIGHT",
    sub: "Sec 12 · Row F · Seat 8",
    palette: ["#18181b", "#a855f7", "#e4e4e7"],
  },
  {
    slug: "product-packaging",
    headline: "CRAFT SERIES",
    sub: "Limited batch No. 07",
    palette: ["#0c4a6e", "#38bdf8", "#f0f9ff"],
  },
  {
    slug: "art-photography",
    headline: "OPENING PRINT",
    sub: "Archival pigment · 24×36",
    palette: ["#171717", "#f43f5e", "#fafafa"],
  },
  {
    slug: "business-cards",
    headline: "STUDIO RQ",
    sub: "Creative director",
    palette: ["#042f2e", "#14b8a6", "#ccfbf1"],
  },
];

function mockPrintSvg({ headline, sub, palette, skew = false }) {
  const [bg, accent, text] = palette;
  const transform = skew
    ? 'transform="rotate(-4 200 250) scale(1.02)"'
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.35"/>
    </linearGradient>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter>
  </defs>
  <rect width="400" height="500" fill="${bg}"/>
  <rect x="24" y="24" width="352" height="452" rx="12" fill="url(#g)" stroke="${accent}" stroke-width="2" opacity="0.95" ${transform}/>
  <rect x="24" y="24" width="352" height="452" rx="12" fill="white" opacity="0.03" filter="url(#n)"/>
  <text x="48" y="120" font-family="Georgia, serif" font-size="28" font-weight="700" fill="${text}">${headline}</text>
  <text x="48" y="158" font-family="Arial, sans-serif" font-size="14" fill="${text}" opacity="0.75">${sub}</text>
  <line x1="48" y1="180" x2="352" y2="180" stroke="${accent}" stroke-width="3"/>
  <text x="48" y="220" font-family="Arial, sans-serif" font-size="11" fill="${text}" opacity="0.5">RQ PLUS · SCANNABLE PRINT</text>
  ${skew ? `<rect x="60" y="240" width="280" height="180" rx="6" fill="${text}" opacity="0.08"/>` : `<rect x="48" y="200" width="304" height="240" rx="8" fill="${text}" opacity="0.06"/>`}
</svg>`;
}

async function writeWebp(outPath, input, width, height, opts = {}) {
  await sharp(input)
    .resize(width, height, { fit: "cover", ...opts.resize })
    .webp({ quality: 82 })
    .toFile(outPath);
}

async function fromSvg(svg, outPath, w, h, extra = {}) {
  const buf = Buffer.from(svg);
  await writeWebp(outPath, buf, w, h, extra);
}

async function main() {
  for (const item of SLUGS) {
    const dir = path.join(publicDemo, item.slug);
    await fs.mkdir(dir, { recursive: true });
    const refPath = path.join(dir, "reference.webp");
    const scanPath = path.join(dir, "scan.webp");
    const thumbPath = path.join(dir, "thumb.webp");

    if (item.useLegacy) {
      await writeWebp(refPath, legacyPoster, 400, 500);
      await writeWebp(scanPath, legacyScan, 400, 500);
      await writeWebp(thumbPath, legacyPoster, 280, 350);
    } else {
      await fromSvg(mockPrintSvg(item), refPath, 400, 500);
      await fromSvg(mockPrintSvg({ ...item, skew: true }), scanPath, 400, 500);
      await fromSvg(mockPrintSvg(item), thumbPath, 280, 350);
    }
    console.log(`✓ ${item.slug}`);
  }
  console.log("Done — assets in public/demo/{slug}/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
