// Generate a synthetic SHOTGUN metagenomic stool sample (FASTQ) that classifies
// against the synthetic shotgun reference (window.GGG_REFERENCE). This gives the
// sample library a second, contrasting shotgun stool profile: a healthy,
// high-fibre, Prevotella-led gut (distinct from Jordan's mid-range sample).
//
// Reads are 150 bp fragments sampled across each taxon's reference genome with a
// small substitution-error rate and Illumina-style quality, so the in-browser
// k-mer classifier recovers the planted community. Deterministic PRNG -> the file
// is reproducible (no Date/Math.random).
//
//   node scripts/gen-shotgun-sample.cjs
//
const fs = require("fs");
const path = require("path");

global.window = {};
require(path.join(__dirname, "../public/engine/reference-db.js"));
const REF = global.window.GGG_REFERENCE;
const byId = Object.fromEntries(REF.taxa.map((t) => [t.id, t]));
const READLEN = REF.readLen || 150;

// Target community as direct percentages of the CLASSIFIED reads (weights sum to
// ~100). A healthy, high-fibre gut: butyrate makers in range, one gentle
// Akkermansia dip (keeps a flag + plan item), pathobionts low, a Prevotella-rich
// Bacteroides-type profile, plus filler "Other commensal" taxa (3 left at zero so
// richness is a realistic 27, not a suspiciously perfect 30). Lands a gut score
// near 80: clearly healthy, believable, and a clear contrast to Jordan's 58.
const COMP = {
  fprau: 6.5, rosin: 4.5, erect: 4.5, rbrom: 2.5, blaut: 6, lacto: 1.0, chris: 1.4,
  bunif: 7, bvulg: 5, pcopr: 11, alist: 3, blong: 3, badol: 1.5, akker: 1.2,
  ecoli: 0.5, klebs: 0.2,
  other00: 5, other01: 4.5, other02: 4, other03: 3.5, other05: 4.5,
  other06: 4, other08: 3.5, other10: 3, other11: 4, other12: 3, other13: 2.2,
};
const SIGNAL_READS = 1800;     // reads drawn from the reference community
const NOISE_FRAC = 0.35;       // share of total reads that are host / unknown / off-panel
const TOTAL_READS = Math.round(SIGNAL_READS / (1 - NOISE_FRAC));
const NOISE_READS = TOTAL_READS - SIGNAL_READS;

let seed = 1337;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const BASES = ["A", "C", "G", "T"];
const qualString = () => {
  let qual = "";
  for (let p = 0; p < READLEN; p++) {
    const base = 38 - Math.floor(8 * (p / READLEN)); // mild 3' quality dropoff
    const q = Math.max(20, Math.min(40, base - Math.floor(rnd() * 6)));
    qual += String.fromCharCode(33 + q);
  }
  return qual;
};

const ids = Object.keys(COMP).filter((id) => byId[id]);
const wsum = ids.reduce((s, id) => s + COMP[id], 0);
const counts = {};
ids.forEach((id) => { counts[id] = Math.max(1, Math.round((SIGNAL_READS * COMP[id]) / wsum)); });

const recs = [];
let idx = 0;
// signal: 150 bp fragments sampled across each taxon genome, ~0.6% error
for (const id of ids) {
  const g = byId[id].genome;
  for (let n = 0; n < counts[id]; n++) {
    const start = Math.floor(rnd() * g.length);
    const arr = new Array(READLEN);
    for (let p = 0; p < READLEN; p++) arr[p] = g[(start + p) % g.length];
    for (let p = 0; p < READLEN; p++) if (rnd() < 0.006) arr[p] = BASES[Math.floor(rnd() * 4)];
    recs.push(`@GGG:SHOT:${idx}:${id} 1:N:0:GGGSTL\n${arr.join("")}\n+\n${qualString()}\n`.trimEnd());
    idx++;
  }
}
// noise: host / unknown / off-panel reads (random sequence) that do not classify,
// so the sample maps at a realistic ~65% like genuine shotgun stool data
for (let n = 0; n < NOISE_READS; n++) {
  const arr = new Array(READLEN);
  for (let p = 0; p < READLEN; p++) arr[p] = BASES[Math.floor(rnd() * 4)];
  recs.push(`@GGG:SHOT:${idx}:unknown 1:N:0:GGGSTL\n${arr.join("")}\n+\n${qualString()}`);
  idx++;
}
// deterministic shuffle so the file is not grouped by taxon
for (let i = recs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [recs[i], recs[j]] = [recs[j], recs[i]]; }

const out = recs.join("\n") + "\n";
const dest = path.join(__dirname, "../public/samples/sample-shotgun-stool.fastq");
fs.writeFileSync(dest, out);
console.log(`wrote ${recs.length} reads -> ${dest} (${(out.length / 1024).toFixed(0)} KB)`);
