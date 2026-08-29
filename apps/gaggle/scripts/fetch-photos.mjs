/**
 * Fetches licensed photography from Pexels for the program tiles and feature
 * sections. Photos are downloaded once to public/images/photos and committed,
 * so the deployed site ships static assets with no runtime API calls.
 *
 *   node --env-file=.env.local scripts/fetch-photos.mjs
 *
 * Pexels License: free for commercial use, modification allowed, attribution
 * optional. A credits manifest is written alongside the images regardless.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "images", "photos");
mkdirSync(OUT, { recursive: true });

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) {
  console.error("Missing PEXELS_API_KEY. Run with: node --env-file=.env.local scripts/fetch-photos.mjs");
  process.exit(1);
}

// `pick` chooses which search result index to use (overridable after review).
const SHOTS = [
  { id: "fitness", query: "children exercising fun class", pick: 0 },
  { id: "dance", query: "children dance class studio", pick: 0 },
  { id: "yoga", query: "child yoga mat pose", pick: 0 },
  { id: "mindfulness", query: "children classroom hands up fun", pick: 0 },
  { id: "meditation", query: "kids sitting meditation calm", pick: 0 },
  { id: "sports", query: "children playing sport ball", pick: 0 },
  { id: "martial-arts", query: "kids karate class kicking", pick: 0 },
  { id: "more", query: "group happy kids jumping joy", pick: 0 },
  { id: "feature-play", query: "family exercising living room kids", pick: 0 },
  { id: "teachers", query: "teacher students classroom happy", pick: 0 },
];

async function search(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query,
  )}&orientation=landscape&per_page=12`;
  const res = await fetch(url, { headers: { Authorization: KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status} for "${query}"`);
  const data = await res.json();
  return data.photos ?? [];
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

const credits = [];
for (const shot of SHOTS) {
  try {
    const photos = await search(shot.query);
    if (!photos.length) {
      console.warn(`  no results: ${shot.id} (${shot.query})`);
      continue;
    }
    const p = photos[shot.pick] || photos[0];
    const src = p.src.large2x || p.src.large || p.src.original;
    const bytes = await download(src, join(OUT, `${shot.id}.jpg`));
    credits.push({ id: shot.id, photographer: p.photographer, url: p.url, alt: p.alt });
    console.log(`  ✓ ${shot.id}  (${(bytes / 1024).toFixed(0)}kb)  © ${p.photographer}`);
  } catch (err) {
    console.warn(`  ✗ ${shot.id}: ${err.message}`);
  }
}

writeFileSync(join(OUT, "credits.json"), JSON.stringify(credits, null, 2));
console.log(`\nDone. ${credits.length}/${SHOTS.length} photos → public/images/photos/`);
