/**
 * Regenerates the Global Awareness Calendar tiles as premium editorial
 * photography (the flat illustrations read like clip-art). gpt-image-2 via Azure.
 *   node --env-file=.env.local scripts/gen-calendar-premium.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GEN = join(ROOT, "public", "images", "gen");

const ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/$/, "");
const KEY = process.env.AZURE_API_KEY || "";
const DEPLOY = process.env.AZURE_IMAGE_DEPLOYMENT || "";
const VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-02-01";
const QUALITY = process.env.AZURE_IMAGE_QUALITY || "";
if (!ENDPOINT || !KEY || !DEPLOY) {
  console.error("Missing Azure image env.");
  process.exit(1);
}

const STYLE =
  "Premium editorial photograph, warm natural light, shallow depth of field, " +
  "fresh and vibrant yet tasteful, high-end commercial photography, clean composition. " +
  "No text, no words, no logos.";

const JOBS = [
  { name: "cal-water.jpg", prompt: `${STYLE} World Water Day: diverse happy young schoolchildren joyfully playing with clean sparkling water outdoors on a bright sunny day, droplets catching the light.` },
  { name: "cal-pink.jpg", prompt: `${STYLE} A kindness theme: a diverse group of cheerful school children wearing pink, smiling together and sharing a warm group hug in a bright airy space.` },
  { name: "cal-bhm.jpg", prompt: `${STYLE} Black History Month celebration: joyful Black children laughing and celebrating together, warm golden light, dignified, uplifting and vibrant.` },
  { name: "cal-bell.jpg", prompt: `${STYLE} A mental-wellness moment: a caring teacher and a young student sharing a calm, warm, supportive conversation, gentle reassuring mood, soft background.` },
];

async function gen({ name, prompt }) {
  const url = `${ENDPOINT}/openai/deployments/${DEPLOY}/images/generations?api-version=${VERSION}`;
  const body = { prompt, n: 1, size: "1024x1024" };
  if (QUALITY) body.quality = QUALITY;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const item = (await res.json())?.data?.[0] ?? {};
  let bytes;
  if (item.b64_json) bytes = Buffer.from(item.b64_json, "base64");
  else if (item.url) bytes = Buffer.from(await (await fetch(item.url)).arrayBuffer());
  else throw new Error("no image");
  await writeFile(join(GEN, name), bytes);
  console.log(`  ✓ ${name} (${(bytes.length / 1024).toFixed(0)}kb)`);
}

await mkdir(GEN, { recursive: true });
for (const job of JOBS) {
  try {
    await gen(job);
  } catch (e) {
    console.warn(`  ✗ ${job.name}: ${e.message}`);
  }
}
console.log("Done.");
