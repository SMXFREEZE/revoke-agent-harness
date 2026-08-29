/**
 * Flexible Azure OpenAI (gpt-image-2) art generator driven by a JSON manifest.
 * Reads keys from .env.local only.
 *
 *   node --env-file=.env.local scripts/gen-art.mjs [manifest.json] [--force]
 *
 * Manifest: [{ "name": "hero.jpg", "prompt": "...", "size": "1536x1024" }, ...]
 * size defaults to 1024x1024. Supported: 1024x1024, 1024x1536, 1536x1024.
 * Existing files are skipped unless --force is passed.
 */
import { writeFile, mkdir, readFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "images", "gen");

const ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/$/, "");
const KEY = process.env.AZURE_API_KEY || "";
const DEPLOY = process.env.AZURE_IMAGE_DEPLOYMENT || "";
const VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-02-01";
const QUALITY = process.env.AZURE_IMAGE_QUALITY || "high";

if (!ENDPOINT || !KEY || !DEPLOY) {
  console.error("Missing Azure image env.");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const manifestPath = args.find((a) => !a.startsWith("--")) || join(ROOT, "scripts", "art-manifest.json");

const exists = (p) => access(p).then(() => true).catch(() => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gen({ name, prompt, size = "1024x1024" }, attempt = 1) {
  const url = `${ENDPOINT}/openai/deployments/${DEPLOY}/images/generations?api-version=${VERSION}`;
  const body = { prompt, n: 1, size };
  // gpt-image models accept a quality hint
  if (QUALITY) body.quality = QUALITY;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": KEY },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (attempt < 3) { await sleep(1500 * attempt); return gen({ name, prompt, size }, attempt + 1); }
    throw e;
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    // retry on transient/rate errors; if quality is rejected, retry without it
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(2500 * attempt);
      return gen({ name, prompt, size }, attempt + 1);
    }
    if (res.status === 400 && body.quality && attempt < 2) {
      delete body.quality;
      const r2 = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "api-key": KEY }, body: JSON.stringify(body) });
      if (r2.ok) return finalize(name, await r2.json());
    }
    throw new Error(`${res.status} ${t.slice(0, 220)}`);
  }
  return finalize(name, await res.json());
}

async function finalize(name, data) {
  const item = data?.data?.[0] ?? {};
  let bytes;
  if (item.b64_json) bytes = Buffer.from(item.b64_json, "base64");
  else if (item.url) bytes = Buffer.from(await (await fetch(item.url)).arrayBuffer());
  else throw new Error("no image in response");
  await writeFile(join(OUT, name), bytes);
  console.log(`  ✓ ${name} (${(bytes.length / 1024).toFixed(0)}kb)`);
}

// simple concurrency pool
async function run(jobs, concurrency = 2) {
  const queue = [...jobs];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const job = queue.shift();
      const dest = join(OUT, job.name);
      if (!force && (await exists(dest))) { console.log(`  · ${job.name} (exists, skip)`); continue; }
      try { await gen(job); } catch (e) { console.warn(`  ✗ ${job.name}: ${e.message}`); }
    }
  });
  await Promise.all(workers);
}

await mkdir(OUT, { recursive: true });
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
console.log(`Generating ${manifest.length} images → public/images/gen/  (force=${force})`);
await run(manifest, 2);
console.log("Done.");
