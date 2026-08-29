/**
 * Generates premium dark abstract imagery via Azure OpenAI Images, to replace
 * the low-quality calendar thumbnails and add an aurora backdrop for the dark
 * redesign. Keys are read from .env.local only, never hardcoded.
 *
 *   node --env-file=.env.local scripts/gen-images.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "images", "gen");

const ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/$/, "");
const KEY = process.env.AZURE_API_KEY || "";
const DEPLOY = process.env.AZURE_IMAGE_DEPLOYMENT || "";
const VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-02-01";
if (!ENDPOINT || !KEY || !DEPLOY) {
  console.error("Missing Azure image env (AZURE_OPENAI_ENDPOINT / AZURE_API_KEY / AZURE_IMAGE_DEPLOYMENT).");
  process.exit(1);
}

const BASE =
  "A premium, ultra-minimal abstract background. Deep near-black charcoal base. " +
  "Smooth volumetric gradient haze, soft cinematic bloom, subtle fine film grain, " +
  "elegant and high-end, lots of negative space. No text, no logos, no people, no objects.";

const JOBS = [
  { name: "aurora.jpg", prompt: `${BASE} A soft aurora of electric violet (#6901ff) and indigo light blooming from the upper-right corner, fading into black.` },
  { name: "cal-water.jpg", prompt: `${BASE} Luminous deep-blue and violet light like calm rippling water reflections in the dark.` },
  { name: "cal-pink.jpg", prompt: `${BASE} A warm soft rose-pink and violet glow, gentle and kind.` },
  { name: "cal-bhm.jpg", prompt: `${BASE} A warm amber-gold and deep-violet light, rich, elegant and dignified.` },
  { name: "cal-bell.jpg", prompt: `${BASE} A calm soft teal and violet glow, serene and reassuring.` },
];

async function gen({ name, prompt }) {
  const url = `${ENDPOINT}/openai/deployments/${DEPLOY}/images/generations?api-version=${VERSION}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": KEY },
    body: JSON.stringify({ prompt, n: 1, size: "1024x1024" }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status} ${t.slice(0, 240)}`);
  }
  const data = await res.json();
  const item = data?.data?.[0] ?? {};
  let bytes;
  if (item.b64_json) {
    bytes = Buffer.from(item.b64_json, "base64");
  } else if (item.url) {
    const img = await fetch(item.url);
    bytes = Buffer.from(await img.arrayBuffer());
  } else {
    throw new Error("no image in response");
  }
  await writeFile(join(OUT, name), bytes);
  console.log(`  ✓ ${name} (${(bytes.length / 1024).toFixed(0)}kb)`);
}

await mkdir(OUT, { recursive: true });
for (const job of JOBS) {
  try {
    await gen(job);
  } catch (e) {
    console.warn(`  ✗ ${job.name}: ${e.message}`);
  }
}
console.log("Done → public/images/gen/");
