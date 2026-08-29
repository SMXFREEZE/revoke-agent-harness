// Replace section imagery with real, free-licensed Pexels photos (max realism).
// Overwrites the existing /images/tulum/*.jpg so no component changes are needed.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}
const env = loadEnv();

// [outPath, query, orientation, pickIndex]
const JOBS = [
  ["public/images/tulum/hero-dj.jpg", "dj sunset beach turntable", "portrait", 0],
  ["public/images/tulum/prog-dj-course.jpg", "dj turntables mixing club", "landscape", 0],
  ["public/images/tulum/prog-online.jpg", "dj controller headphones laptop", "landscape", 0],
  ["public/images/tulum/prog-production.jpg", "music producer studio synthesizer", "landscape", 0],
  ["public/images/tulum/prog-recording.jpg", "videographer filming camera concert", "landscape", 0],
  ["public/images/tulum/prog-social.jpg", "content creator filming phone", "landscape", 0],
  ["public/images/tulum/prog-ghost.jpg", "music studio synthesizer dark", "landscape", 1],
  ["public/images/tulum/prog-events.jpg", "beach party crowd sunset dj", "landscape", 0],
  ["public/images/tulum/loc-cenote.jpg", "cenote mexico turquoise water cave", "landscape", 0],
  ["public/images/tulum/loc-beach.jpg", "tulum beach turquoise sea palm", "landscape", 0],
  ["public/images/tulum/loc-jungle.jpg", "tropical jungle palm trees canopy", "landscape", 0],
  ["public/images/tulum/loc-rooftop.jpg", "rooftop sunset tropical city", "landscape", 0],
  ["public/images/tulum/feat-mentor.jpg", "dj teaching student decks", "landscape", 0],
  ["public/images/tulum/feat-community.jpg", "friends celebrating beach sunset", "landscape", 0],
];

async function getPhoto(out, query, orientation, idx) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=${orientation}`,
    { headers: { Authorization: env.PEXELS_API_KEY } },
  );
  if (!r.ok) { console.error("search fail", query, r.status); return; }
  const j = await r.json();
  const photos = j.photos || [];
  const p = photos[idx] || photos[0];
  if (!p) { console.error("no photo for", query); return; }
  const url = p.src.large2x || p.src.large || p.src.original;
  const dl = await fetch(url);
  if (!dl.ok) { console.error("dl fail", out, dl.status); return; }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(await dl.arrayBuffer()));
  console.log("saved", out, " by", p.photographer);
}

for (const [out, q, o, idx] of JOBS) {
  try { await getPhoto(out, q, o, idx); } catch (e) { console.error("ERR", out, e.message); }
}
console.log("PHOTOS DONE");
