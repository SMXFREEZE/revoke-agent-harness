/**
 * Regenerates the hero photo (bright, authentic kids-in-motion classroom — the
 * shipped one has an ugly baked-in pink wash) and the four calendar tiles
 * (bright, friendly flat illustrations instead of dark moody abstracts) using
 * the Azure gpt-image-2 deployment. Keys from .env.local only.
 *
 *   node --env-file=.env.local scripts/gen-hero-calendar.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = join(ROOT, "public", "images", "brand");
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

const ILLO =
  "Modern flat vector illustration for a premium children's wellness brand, " +
  "soft rounded organic shapes, clean, cheerful, bright and optimistic, gentle " +
  "grain, generous negative space, tasteful and designer-crafted (not childish-cheap). " +
  "No text, no words, no letters, no logos.";

const JOBS = [
  {
    name: "hero-classroom.jpg",
    dir: BRAND,
    size: "1024x1536",
    prompt:
      "A bright, candid documentary-style photograph of a diverse group of happy " +
      "elementary-school children standing beside their desks in a sunlit modern " +
      "classroom, arms raised mid-stretch during a joyful movement break. Warm " +
      "natural daylight from large windows, clean fresh colours, authentic and " +
      "energetic, shallow depth of field, premium editorial photography. " +
      "Natural skin tones, no colour cast, no pink wash. No text, no logos.",
  },
  { name: "cal-water.jpg", dir: GEN, size: "1024x1024", prompt: `${ILLO} Theme: World Water Day — clear bright blue water waves, ripples and droplets, sunny and clean, sky-blue and aqua palette.` },
  { name: "cal-pink.jpg", dir: GEN, size: "1024x1024", prompt: `${ILLO} Theme: kindness / Pink Shirt Day — warm coral and pink rounded shapes and soft hearts, gentle and friendly.` },
  { name: "cal-bhm.jpg", dir: GEN, size: "1024x1024", prompt: `${ILLO} Theme: Black History Month — warm golden-amber and rich violet celebratory rounded shapes, dignified yet bright and joyful.` },
  { name: "cal-bell.jpg", dir: GEN, size: "1024x1024", prompt: `${ILLO} Theme: mental-wellness conversation — calm bright teal and soft sky-blue rounded shapes with a gentle speech-bubble motif, reassuring and warm.` },
];

async function gen({ name, dir, prompt, size }) {
  const url = `${ENDPOINT}/openai/deployments/${DEPLOY}/images/generations?api-version=${VERSION}`;
  const body = { prompt, n: 1, size };
  if (QUALITY) body.quality = QUALITY;
  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok && size !== "1024x1024") {
    // fall back to square if the size isn't supported by this api-version
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": KEY },
      body: JSON.stringify({ ...body, size: "1024x1024" }),
    });
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status} ${t.slice(0, 240)}`);
  }
  const data = await res.json();
  const item = data?.data?.[0] ?? {};
  let bytes;
  if (item.b64_json) bytes = Buffer.from(item.b64_json, "base64");
  else if (item.url) bytes = Buffer.from(await (await fetch(item.url)).arrayBuffer());
  else throw new Error("no image in response");
  await writeFile(join(dir, name), bytes);
  console.log(`  ✓ ${name} (${(bytes.length / 1024).toFixed(0)}kb)`);
}

await mkdir(BRAND, { recursive: true });
await mkdir(GEN, { recursive: true });
for (const job of JOBS) {
  try {
    await gen(job);
  } catch (e) {
    console.warn(`  ✗ ${job.name}: ${e.message}`);
  }
}
console.log("Done.");
