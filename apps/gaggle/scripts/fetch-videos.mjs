/**
 * Fetches a few short, licensed sample clips from Pexels Video for the in-app
 * player (demo content). Downloaded once and committed; no runtime API calls.
 *
 *   node --env-file=.env.local scripts/fetch-videos.mjs
 *
 * Pexels License: free for commercial use, attribution optional.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "videos");
mkdirSync(OUT, { recursive: true });

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) {
  console.error("Missing PEXELS_API_KEY. Run: node --env-file=.env.local scripts/fetch-videos.mjs");
  process.exit(1);
}

// One DISTINCT clip per program (slug = the program id in lib/data/catalog.ts).
// `fallback` is a broader query used if the specific one returns nothing fresh,
// so every program always ends up with its own file. We dedupe by Pexels video
// id across the whole run so no two programs ever play the same clip.
const CLIPS = [
  // fitness
  { id: "wake-up-shake-up", query: "kids jumping exercise", fallback: "children workout" },
  { id: "energy-boost-circuit", query: "children fitness class", fallback: "kids exercise gym" },
  { id: "cool-down-stretch", query: "kids stretching floor", fallback: "child stretching" },
  // dance
  { id: "freeze-dance-party", query: "kids dancing fun", fallback: "children party dance" },
  { id: "hip-hop-basics", query: "children hip hop dance", fallback: "kid street dance" },
  { id: "around-the-world", query: "kids group dance", fallback: "children dancing together" },
  // yoga
  { id: "morning-sun-flow", query: "child yoga pose", fallback: "kids yoga" },
  { id: "animal-poses", query: "kids yoga class", fallback: "children yoga mat" },
  { id: "breathe-balance", query: "girl yoga balance", fallback: "child stretching yoga" },
  // mindfulness
  { id: "one-minute-reset", query: "child calm breathing", fallback: "kids classroom calm" },
  { id: "gratitude-moment", query: "children meditation classroom", fallback: "kids sitting calm" },
  // meditation
  { id: "belly-breathing", query: "child meditating peaceful", fallback: "kid relaxing eyes closed" },
  { id: "body-scan", query: "children relaxing lying down", fallback: "kids resting floor" },
  // sports
  { id: "dribble-pass", query: "kids basketball drill", fallback: "children playing basketball" },
  { id: "agility-ladder", query: "children running agility", fallback: "kids sports training" },
  // martial arts
  { id: "white-belt-basics", query: "kids karate class", fallback: "children martial arts" },
  { id: "power-control", query: "child martial arts kick", fallback: "kids taekwondo" },
];

async function search(query) {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: KEY } });
  if (!res.ok) throw new Error(`Pexels video ${res.status}`);
  const data = await res.json();
  return data.videos ?? [];
}

// pick an mp4 around 960px wide so the file stays small
function pickFile(video) {
  const files = (video.video_files || []).filter((f) => f.file_type === "video/mp4");
  files.sort((a, b) => Math.abs((a.width || 0) - 960) - Math.abs((b.width || 0) - 960));
  return files[0];
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

const usedIds = new Set();

// Prefer a short clip whose id hasn't been used yet; fall back to any fresh one.
function pickFresh(videos) {
  const fresh = videos.filter((v) => !usedIds.has(v.id));
  const pool = fresh.length ? fresh : videos;
  return pool.find((x) => (x.duration || 0) >= 4 && (x.duration || 0) <= 30) || pool[0];
}

const credits = [];
for (const clip of CLIPS) {
  try {
    let videos = await search(clip.query);
    let v = pickFresh(videos);
    // If the specific query only returns already-used clips, broaden the search.
    if (!v || usedIds.has(v.id)) {
      const more = await search(clip.fallback);
      v = pickFresh([...videos, ...more]) || v;
    }
    if (!v) {
      console.warn(`  ✗ no video: ${clip.id}`);
      continue;
    }
    usedIds.add(v.id);
    const file = pickFile(v);
    await download(file.link, join(OUT, `${clip.id}.mp4`));
    if (v.image) await download(v.image, join(OUT, `${clip.id}.jpg`));
    credits.push({ id: clip.id, by: v.user?.name, url: v.url });
    console.log(`  ✓ ${clip.id}.mp4 (${file.width}px, ${v.duration}s) © ${v.user?.name}`);
  } catch (err) {
    console.warn(`  ✗ ${clip.id}: ${err.message}`);
  }
}

writeFileSync(join(OUT, "credits.json"), JSON.stringify(credits, null, 2));
console.log(`\nDone. ${credits.length}/${CLIPS.length} distinct clips → public/videos/`);
