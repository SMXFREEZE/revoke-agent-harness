// Bake the user's glass-ball previews into transparent sprites for the band.
// 1) flood-fill the light backdrop from the edges to LOCATE the ball (bbox of
//    everything the flood could not reach). 2) apply a feathered CIRCULAR mask
//    on the ORIGINAL pixels, so the whole sphere is kept -- including the white
//    X mark and highlights inside it (which a plain key would eat).
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/sami/Downloads/X movement 3d/glass-spheres";
const OUT = "C:/Users/sami/Downloads/x-movement/public/band";
fs.mkdirSync(OUT, { recursive: true });

async function bake(name) {
  const { data, info } = await sharp(path.join(SRC, name + "-preview.png")).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, ch = info.channels;
  const idx = (x, y) => (y * W + x) * ch;
  const isBg = (x, y) => {
    const i = idx(x, y);
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    return sat < 62 && lum > 186;
  };

  // flood the connected backdrop from the borders
  const visited = new Uint8Array(W * H);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (visited[p] || !isBg(x, y)) return;
    visited[p] = 1;
    queue.push(p);
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  let head = 0;
  while (head < queue.length) {
    const p = queue[head++], x = p % W, y = (p - x) / W;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  // ball = bbox of everything the flood could NOT reach (core + inner islands)
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!visited[y * W + x]) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const R = Math.max(maxX - minX, maxY - minY) / 2 + 5; // small margin for the rim

  // feathered circular alpha on the ORIGINAL pixels
  const feather = 9;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dist = Math.hypot(x - cx, y - cy);
    let a;
    if (dist <= R - feather) a = 255;
    else if (dist >= R) a = 0;
    else a = Math.round((255 * (R - dist)) / feather);
    data[idx(x, y) + 3] = a;
  }

  const pad = 4;
  const left = Math.max(0, Math.round(cx - R) - pad);
  const top = Math.max(0, Math.round(cy - R) - pad);
  const size = Math.round(R * 2) + pad * 2;
  await sharp(data, { raw: { width: W, height: H, channels: ch } })
    .extract({ left, top, width: Math.min(size, W - left), height: Math.min(size, H - top) })
    .png()
    .toFile(path.join(OUT, name + ".png"));
  console.log(name, "->", { center: [Math.round(cx), Math.round(cy)], R: Math.round(R) });
}

(async () => { await bake("glass-ball-5"); await bake("glass-ball-7"); })();
