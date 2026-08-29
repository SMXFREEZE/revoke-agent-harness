// Download a free-licensed DJ clip from Pexels for the cinematic intro.
// Usage: node scripts/gen-video.mjs "<query>" public/video/out.mp4 [maxHeight]
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
const [, , query, outPath, maxH = "1080"] = process.argv;
const maxHeight = Number(maxH);

const res = await fetch(
  `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
  { headers: { Authorization: env.PEXELS_API_KEY } },
);
if (!res.ok) { console.error("search failed", res.status, await res.text()); process.exit(1); }
const json = await res.json();
const vids = json.videos || [];
if (!vids.length) { console.error("no videos for", query); process.exit(1); }

// score: prefer ~1080p landscape, duration 8-25s, decent file
function pickFile(v) {
  const files = (v.video_files || []).filter((f) => f.file_type === "video/mp4" && f.height && f.height <= maxHeight);
  files.sort((a, b) => b.height - a.height);
  return files[0];
}
let best = null;
for (const v of vids) {
  const f = pickFile(v);
  if (!f) continue;
  const dur = v.duration || 0;
  const durScore = dur >= 8 && dur <= 25 ? 2 : dur >= 5 && dur <= 35 ? 1 : 0;
  const score = (f.height || 0) / 100 + durScore * 3 + (v.width > v.height ? 2 : 0);
  if (!best || score > best.score) best = { v, f, score, dur };
}
if (!best) { console.error("no suitable file"); process.exit(1); }

console.log("picked", best.v.url, `${best.f.width}x${best.f.height}`, `${best.dur}s`, "by", best.v.user?.name);
const dl = await fetch(best.f.link);
if (!dl.ok) { console.error("download failed", dl.status); process.exit(1); }
const buf = Buffer.from(await dl.arrayBuffer());
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, buf);
console.log("saved", outPath, (buf.byteLength / 1e6).toFixed(1) + "MB  credit:", best.v.user?.name);
