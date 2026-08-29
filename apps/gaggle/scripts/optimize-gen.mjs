/**
 * Downscale + recompress the Azure-generated JPGs to web-appropriate sizes.
 * Sources are ~2MB each (1024x1536 / 1536x1024); we never display them larger
 * than ~600-1280px, so this cuts page weight ~10x with no visible loss.
 *
 *   node scripts/optimize-gen.mjs
 */
import sharp from "sharp";
import { readdir, rename, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "gen");

// max width by filename prefix
const widthFor = (name) => {
  if (name.startsWith("disc-")) return 820;
  if (name.startsWith("prog-")) return 1280; // featured hero shows large; keep crisp
  if (name.startsWith("teach-") || name === "hero-move.jpg") return 1280;
  if (name.startsWith("cal-")) return 760;
  if (name === "aurora.jpg") return 1600;
  return 1100;
};

const files = (await readdir(DIR)).filter((f) => /\.jpg$/i.test(f) && !f.endsWith(".tmp.jpg"));
let before = 0;
let after = 0;
for (const f of files) {
  const src = join(DIR, f);
  const tmp = join(DIR, f.replace(/\.jpg$/i, ".tmp.jpg"));
  const b = (await stat(src)).size;
  before += b;
  await sharp(src)
    .resize({ width: widthFor(f), withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(tmp);
  const a = (await stat(tmp)).size;
  after += a;
  await rename(tmp, src);
  console.log(`  ${f}: ${(b / 1024).toFixed(0)}kb → ${(a / 1024).toFixed(0)}kb`);
}
console.log(`Total: ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB`);
