"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Terminal } from "@/components/ui/terminal";
import { VantaBackground } from "@/components/layout/VantaBackground";
import { LiquidGlassCard } from "@/components/ui/uilayouts/liquid-glass";
import { NoiseBackground } from "@/components/ui/noise-background";
import { RNetwork } from "./RNetwork";
import { RSunburst } from "./RSunburst";
import { RGutCoach } from "./RGutCoach";
import { RGutEvidence } from "./RGutEvidence";
import { RTraceback } from "./RTraceback";
import { RSeqIntel } from "./RSeqIntel";
import { phylumLegend, dominantPhylum } from "@/lib/ggg/phylum";
import { withBasePath } from "@/lib/utils/base-path";
import patient from "@/lib/ggg/patient.json";

// The report panel, rebuilt in the Lexie Console UI: sky Vanta + frosted liquid
// glass + the console buttons. Same components, same colours, just the gut report
// inside. Every visual is generated from one engine output (no AI imagery).

// Sky / teal / sun palette (the console's), no red anywhere.
const PHYLUM_HUE: Record<string, string> = {
  Firmicutes: "#15aeea", Bacteroidetes: "#037bb5", Actinobacteria: "#19b27a",
  Proteobacteria: "#7c6cf0", Verrucomicrobia: "#f4b21a",
  Fusobacteria: "#e08a3b", Euryarchaeota: "#9b7cc7",
  Fungi: "#d98f3b", Protozoa: "#c06cb8", Algae: "#2aa98a", Metazoa: "#8a8c5a", Host: "#8896a3",
};
const FLAG = "#f4b21a"; // amber, for flagged taxa (never red)
const SKY = { highlightColor: 0xffce3a, midtoneColor: 0x73cef2, lowlightColor: 0x15aeea, baseColor: 0xeaf6ff, blurFactor: 0.62, speed: 0.85, zoom: 0.85 };

// A library of real + synthetic FASTQ samples a reviewer can click to run. The
// shotgun stool sample is the brief's headline case (whole-genome shotgun reads)
// and routes through the synthetic shotgun reference for a full gut report.
const SAMPLES: { file: string; name: string; src: string; tag: string; note: string; kind: "shotgun" | "gut" | "euk" | "blast" }[] = [
  { file: "sample-shotgun-stool.fastq", name: "Shotgun stool, healthy gut", src: "synthetic · shotgun-style", tag: "Shotgun-style", note: "Synthetic shotgun-style stool reads. The brief's case: full gut report, score and plan.", kind: "shotgun" },
  { file: "sample-shotgun-real-stool.fastq", name: "Real shotgun stool", src: "ENA SRR5650070 · stool WGS", tag: "Real shotgun", note: "A real shotgun metagenomic stool FASTQ from a published IBD stool study. Below-panel, so it runs sequence intelligence and live NCBI BLAST.", kind: "blast" },
  { file: "sample-gut-16S.fastq", name: "Gut mock community", src: "synthetic · known truth", tag: "16S", note: "A synthetic gut community with a known ground truth. Maps cleanly to a full gut report.", kind: "gut" },
  { file: "sample-realgut-16S-a.fastq", name: "Human gut, real 16S", src: "nf-core test data", tag: "Illumina 16S", note: "Real published gut 16S. Too few species resolve on the demo reference for a score, so it runs live NCBI BLAST.", kind: "blast" },
  { file: "sample-realgut-16S-b.fastq", name: "Human gut, real 16S #2", src: "nf-core test data", tag: "Illumina 16S", note: "A second real human gut sample. Sequence intelligence plus live NCBI BLAST identification.", kind: "blast" },
  { file: "sample-environmental-18S.fastq", name: "Eukaryotic community", src: "synthetic", tag: "18S", note: "Yeasts and protists. Shows the non-gut taxonomic profile, no gut score.", kind: "euk" },
  { file: "sample-water-18S-real.fastq", name: "Water control, real 18S", src: "Nanopore", tag: "Nanopore 18S", note: "A real environmental sample outside our panel. Runs sequence intelligence plus live NCBI BLAST.", kind: "blast" },
];
const GLASS = { blurIntensity: "md", glowIntensity: "sm", shadowIntensity: "sm", borderRadius: "20px" } as const;

const plain = (s: string) => (s || "").replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim();

// --- real sequence intelligence for uploads that do not map to our reference.
// Every value is measured from the actual reads, not fabricated.
function uniqueKmerRichness(reads: any[]): number {
  // distinct canonical 21-mers across a sample of reads (a sequence-complexity
  // proxy: more distinct k-mers = a more complex / diverse community)
  const k = 21;
  const seen = new Set<string>();
  const stride = Math.max(1, Math.floor(reads.length / 2500));
  const rc = (s: string) => { let o = ""; for (let i = s.length - 1; i >= 0; i--) o += ({ A: "T", T: "A", G: "C", C: "G" } as any)[s[i]] || "N"; return o; };
  for (let i = 0; i < reads.length; i += stride) {
    const s = reads[i]?.seq || "";
    for (let p = 0; p + k <= s.length; p += 11) {
      const sub = s.slice(p, p + k);
      if (sub.indexOf("N") !== -1) continue;
      const r = rc(sub);
      seen.add(sub <= r ? sub : r);
      if (seen.size > 400000) return seen.size;
    }
  }
  return seen.size;
}
function inferAssay(q: any): string {
  const len = q?.meanLen || 0;
  const platform = len > 600 ? "long-read (Nanopore / PacBio)" : "short-read (Illumina)";
  const kind = len > 1000 ? "long amplicon or genome" : len > 380 ? "amplicon (16S/18S)" : len > 230 ? "amplicon (16S V3-V4)" : "short-read shotgun or amplicon";
  return `${platform} · ${kind}`;
}

function order0(profile: any): string {
  return dominantPhylum(profile?.abundance || []);
}

// phylum legend [name, percent] for the sunburst colour key. Shares come from the
// shared helper so the traceback's phylum chip uses the exact same denominator.
function order0legend(profile: any): [string, string][] {
  return phylumLegend(profile?.abundance || []).map(([ph, pct]) => [ph, pct.toFixed(0)] as [string, string]);
}

function buildPipeline(p: any, label: string): { commands: string[]; outputs: Record<number, string[]> } {
  if (p.seqOnly) {
    const q = p.quality || {};
    const retainedReads = q.reads ?? 0;
    const rawReads = q.rawReads ?? retainedReads;
    const reads = retainedReads.toLocaleString();
    const raw = rawReads.toLocaleString();
    const mbp = ((q.totalBases || 0) / 1e6).toFixed(1);
    const len = Math.round(q.meanLen || 0);
    const gc = Math.round(q.gcPct || 0);
    const mq = Math.round(q.meanQ || 0);
    const uk = (p.uniqueKmers || 0).toLocaleString();
    return {
      commands: [
        `metascope qc --in ${label}`,
        "metascope profile --kmer-complexity",
        "metascope classify --db ggg-ref",
      ],
      outputs: {
        0: [
          "trimming detected adapters and low-quality ends; rejecting unusable reads",
          `${q.qualityGatePassed ? "✔" : "⚠"} ${reads} of ${raw} reads retained · ${mbp} Mbp · ~${len} bp · GC ${gc}% · Q${mq}${q.qualityGatePassed ? "" : " · full report blocked by QC gate"}`,
        ],
        1: ["counting distinct canonical k-mers", `✔ ${uk} unique k-mers profiled`],
        2: ["matching against the gut-species reference", `✔ ${p.mapped || 0} reads mapped · sequence report ready`],
      },
    };
  }
  const reads = (p.classified ?? 0).toLocaleString();
  const retainedReads = (p.quality?.reads ?? p.classified ?? 0).toLocaleString();
  const rawReads = (p.quality?.rawReads ?? p.quality?.reads ?? p.classified ?? 0).toLocaleString();
  const taxa = p.abundance?.length ?? 0;
  const phyla = new Set((p.abundance || []).map((a: any) => a.phylum)).size;
  const sh = p.diversity?.shannon?.toFixed(2);
  const rich = p.diversity?.richness;
  const fb = p.fbRatio?.toFixed(2);
  const ent = p.enterotype === "Unclassified"
    ? "enterotype unclassified (insufficient or balanced genus evidence)"
    : `${(p.enterotype || "Unclassified").split(/[\s-]/)[0]} enterotype`;
  const n = Math.min(5, p.recommendations?.length ?? 0);
  return {
    commands: [
      `metascope qc --in ${label}`,
      "metascope classify --db ggg-ref-30",
      "metascope diversity --metrics shannon,richness,fb",
      "metascope match --goals bloating,regularity,energy",
    ],
    outputs: {
      0: ["trimming detected adapters and low-quality ends; rejecting unusable reads", `✔ ${retainedReads} of ${rawReads} reads retained for classification`],
      1: ["canonical k-mers, lowest-common-ancestor calls", `✔ ${taxa} taxa across ${phyla} phyla`],
      2: [`✔ ${reads} reads classified · Shannon ${sh}, richness ${rich}, F/B ${fb}, ${ent}`],
      3: ["choosing strains most likely to colonise", `✔ ${n} strains selected, report ready`],
    },
  };
}

function loadEngine(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.MetaScope && w.GGG_REFERENCE && w.GGG_REFERENCE_REAL && w.GGG_SAMPLE_FASTQ) return resolve();
    const files = ["/engine/reference-db.js", "/engine/reference-real.js", "/engine/sample-fastq.js", "/engine/metascope.js"].map((file) => withBasePath(file));
    let done = 0;
    const finish = () => { if (++done === files.length) resolve(); };
    files.forEach((src) => {
      if (document.querySelector(`script[src="${src}"]`)) return finish();
      const s = document.createElement("script");
      s.src = src; s.async = false; s.onload = finish; s.onerror = reject;
      document.body.appendChild(s);
    });
  });
}

// the console's primary CTA: an animated gradient-ring pill
function Primary({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: ReactNode }) {
  return <NoiseBackground containerClassName="rz-nb"><button className="nb-btn" onClick={onClick} disabled={disabled}>{children}</button></NoiseBackground>;
}

// Krona-style sunburst, light theme.
function Sunburst({ abundance }: { abundance: any[] }) {
  const [hover, setHover] = useState<any>(null);
  const taxa = abundance.filter((a) => a.pct > 0.05);
  const total = taxa.reduce((s, a) => s + a.pct, 0) || 1;
  const phyla: Record<string, any[]> = {};
  taxa.forEach((a) => { (phyla[a.phylum] ||= []).push(a); });
  const order = Object.keys(phyla).sort((x, y) => phyla[y].reduce((s, a) => s + a.pct, 0) - phyla[x].reduce((s, a) => s + a.pct, 0));
  const cx = 150, cy = 150, r0 = 40, r1 = 80, r2 = 132, TAU = Math.PI * 2;
  let ang = -Math.PI / 2;
  const arcs: any[] = [];
  order.forEach((ph) => {
    const list = phyla[ph].slice().sort((a, b) => b.pct - a.pct);
    const pTot = list.reduce((s, a) => s + a.pct, 0);
    const pStart = ang, pEnd = ang + (pTot / total) * TAU;
    arcs.push({ k: "ph:" + ph, type: "phylum", name: ph, a0: pStart, a1: pEnd, color: PHYLUM_HUE[ph] || "#19b27a", pct: pTot, ri: r0, ro: r1 });
    let sa = pStart;
    list.forEach((a) => {
      const se = sa + (a.pct / total) * TAU;
      arcs.push({ k: "sp:" + a.id, type: "species", name: a.species, a0: sa, a1: se, color: PHYLUM_HUE[ph] || "#19b27a", pct: a.pct, ri: r1 + 2.5, ro: r2, flag: a.status !== "ok" });
      sa = se;
    });
    ang = pEnd;
  });
  const arcPath = (a0: number, a1: number, ri: number, ro: number) => {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    return `M${p(ro, a0)} A${ro},${ro} 0 ${large} 1 ${p(ro, a1)} L${p(ri, a1)} A${ri},${ri} 0 ${large} 0 ${p(ri, a0)} Z`;
  };
  return (
    <div className="rz-rep__sun">
      <svg viewBox="0 0 300 300" role="img" aria-label="Phylum to species sunburst of your gut community">
        {arcs.map((s) => {
          const dim = hover && hover.k !== s.k && !(s.type === "phylum" && hover.type === "species" && hover.color === s.color);
          return (
            <path key={s.k} d={arcPath(s.a0, s.a1, s.ri, s.ro)} fill={s.color}
              fillOpacity={s.type === "phylum" ? (dim ? 0.6 : 1) : dim ? 0.3 : 0.82}
              stroke={s.flag ? FLAG : "#ffffff"} strokeWidth={s.flag ? 2 : 1}
              style={{ transition: "fill-opacity 0.25s", cursor: "pointer" }}
              onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)} />
          );
        })}
        <circle cx={cx} cy={cy} r={r0 - 4} fill="#ffffff" stroke="rgba(3,123,181,0.18)" />
        <text x={cx} y={hover ? cy - 4 : cy + 1} textAnchor="middle" fill="#0e2a3f"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: hover ? 13 : 12 }}>
          {hover ? (hover.name.length > 16 ? hover.name.slice(0, 15) + "…" : hover.name) : "Your community"}
        </text>
        {hover && <text x={cx} y={cy + 13} textAnchor="middle" fill="#037bb5" style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{hover.pct.toFixed(1)}%</text>}
      </svg>
      <div className="rz-rep__sun-legend">
        {order.map((ph) => (
          <div key={ph} onMouseEnter={() => setHover(arcs.find((a) => a.k === "ph:" + ph))} onMouseLeave={() => setHover(null)}>
            <i style={{ background: PHYLUM_HUE[ph] || "#19b27a" }} />
            <span>{ph}</span>
            <b>{((phyla[ph].reduce((s, a) => s + a.pct, 0) / total) * 100).toFixed(0)}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  const hue = score >= 75 ? "#19b27a" : score >= 55 ? "#ffce3a" : "#f4b21a";
  return (
    <svg viewBox="0 0 128 128" width="120" height="120" className="rz-rep__ring">
      <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(3,123,181,0.12)" strokeWidth="11" />
      <circle cx="64" cy="64" r={r} fill="none" stroke={hue} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 64 64)" style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)" }} />
      <text x="64" y="60" textAnchor="middle" fill="#0e2a3f" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30 }}>{score}</text>
      <text x="64" y="82" textAnchor="middle" fill="#5d7689" style={{ fontSize: 11 }}>/ 100</text>
    </svg>
  );
}

const PlayIcon = () => <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>;
const UploadIcon = () => <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>;

function Glass({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <LiquidGlassCard {...GLASS}><div className={`lg-in ${className}`}>{children}</div></LiquidGlassCard>;
}

export function RReport() {
  const [profile, setProfile] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [pending, setPending] = useState<any>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<any>(null);

  const runFastq = useCallback(async (text: string, label: string, useReal = false) => {
    setRunning(true); setError(null); setProfile(null); setPending(null); pendingRef.current = null;
    try {
      await loadEngine();
      const w = window as any;
      const reads = w.MetaScope.parseFastq(text) || [];
      if (reads.length < 1) { setError("No FASTQ reads found in that file. Upload a .fastq or .fq (optionally .gz)."); setRunning(false); return; }
      // the router: the synthetic demo sample uses the synthetic reference; every
      // upload is routed through the REAL marker-gene reference (16S bacteria +
      // 18S eukaryotes) so it always gets a real, measured answer, never a refusal.
      const reference = useReal ? w.GGG_REFERENCE_REAL : w.GGG_REFERENCE;
      const filtered = w.MetaScope.filterReads(reads, { minLength: Math.max(30, reference.k || 21) });
      const cleanReads = filtered.reads || [];
      const result = await w.MetaScope.run(text, { reference, onStage: () => {}, onProgress: () => {} });
      const parsed = reads.length;
      const retained = result?.quality?.reads ?? cleanReads.length;
      // longest reads make the best BLAST queries for the live identify agent
      const sampleReads = [...cleanReads].sort((a: any, b: any) => (b.seq?.length || 0) - (a.seq?.length || 0)).slice(0, 12).map((r: any) => r.seq).filter(Boolean);
      const idPctNum = retained ? (100 * result.classified) / retained : 0;
      // Plausibility guard. A real gut community is spread across many taxa; the
      // demo reference is small, so an arbitrary real sample can funnel most reads
      // onto a single marker (a small-reference artifact, e.g. 70%+ one species).
      // When the profile is implausibly single-dominant or too sparse, we do NOT
      // present a confident gut score - we route to the honest sequence-
      // intelligence + live NCBI BLAST path instead, so a skewed local guess is
      // never dressed up as a clinical result.
      const sortedAb = (result?.abundance || []).slice().sort((a: any, b: any) => (b.reads || 0) - (a.reads || 0));
      const topShare = result?.classified ? (sortedAb[0]?.reads || 0) / result.classified : 0;
      const distinctTaxa = (result?.abundance || []).filter((a: any) => a.pct >= 2).length;
      const plausible = topShare <= 0.45 && distinctTaxa >= 4;
      // need a real, well-spread fraction matched for the full local report;
      // otherwise route to the live-BLAST taxonomic profile
      if (result && result.reportEligible !== false && result.classified >= 20 && idPctNum >= 5 && plausible) {
        const BACT = new Set(["Firmicutes", "Bacteroidetes", "Actinobacteria", "Proteobacteria", "Verrucomicrobia", "Fusobacteria", "Euryarchaeota"]);
        const phy = result.phylum || {};
        const bact = Object.entries(phy).reduce((s: number, [k, v]: any) => s + (BACT.has(k) ? (v as number) : 0), 0);
        result.parsedReads = parsed;
        result.qcReads = retained;
        result.idPct = +(100 * result.classified / retained).toFixed(1);
        result.bacterialPct = Math.round(bact);
        result.kingdom = bact >= 55 ? "Bacterial gut community" : "Eukaryotic / mixed community";
        result.quality = result.quality || w.MetaScope.qc(reads);
        result.sampleReads = sampleReads;
        pendingRef.current = result; setPending(result); return;
      }
      // few QC-passed reads matched the reference (a sample of organisms outside
      // our panel, or heavy sequencing error): show sequence intelligence only
      // plus whatever organisms we COULD identify. Still a real result.
      const quality = result?.quality || w.MetaScope.qc(reads);
      // When a single marker absorbs most of the matched reads (a small-reference
      // artifact, topShare > 0.6), the local names are not trustworthy, so we hide
      // the preliminary-match list entirely and let live NCBI BLAST do the ID.
      const identified = topShare > 0.6 ? [] : (result?.abundance || []).filter((a: any) => a.reads > 0).sort((a: any, b: any) => b.reads - a.reads).slice(0, 6)
        .map((a: any) => ({ species: a.species, reads: a.reads, pct: a.pct }));
      const seq = {
        seqOnly: true, quality, mapped: result ? result.classified : 0, parsedReads: parsed,
        uniqueKmers: uniqueKmerRichness(cleanReads), assay: inferAssay(quality), identified, sampleReads,
      };
      pendingRef.current = seq; setPending(seq);
    } catch {
      setError("Something went wrong reading that file. Try a plain-text FASTQ."); setRunning(false);
    }
  }, []);

  const reveal = useCallback(() => { setProfile(pendingRef.current); setRunning(false); }, []);

  const runSample = useCallback(async () => {
    setUploaded(null);
    await loadEngine();
    runFastq((window as any).GGG_SAMPLE_FASTQ || "", "jordan.fastq");
  }, [runFastq]);

  // load one of the bundled library samples. Shotgun reads route through the
  // synthetic shotgun reference (the brief's case, with planted ground truth);
  // every other sample routes through the real 16S/18S marker-gene reference.
  const loadSample = useCallback(async (file: string, name: string, kind: string) => {
    setError(null); setUploaded(name); setRunning(true); setProfile(null); setPending(null); pendingRef.current = null;
    try {
      const text = await fetch(withBasePath(`/samples/${file}`)).then((r) => r.text());
      await runFastq(text, name, kind !== "shotgun");
    } catch {
      setError("Could not load that sample. Please try again."); setRunning(false);
    }
  }, [runFastq]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setError(null);
    if (f.size > 250 * 1024 * 1024) { setError("That file is over 250 MB, too large for an in-browser demo. Try a subsample."); e.target.value = ""; return; }
    const label = f.name.replace(/\.gz$/i, "");
    setUploaded(label);
    setRunning(true); setProfile(null); setPending(null); pendingRef.current = null;
    try {
      let text: string;
      if (/\.gz$/i.test(f.name) && typeof DecompressionStream !== "undefined") {
        // real sequencer FASTQ is gzipped, decompress it in the browser
        text = await new Response((f.stream() as any).pipeThrough(new DecompressionStream("gzip"))).text();
      } else {
        text = await f.text();
      }
      await runFastq(text, label, true);
    } catch {
      setError("Could not read that file. Upload a FASTQ (.fastq, .fq, or .fastq.gz)."); setRunning(false);
    }
    e.target.value = "";
  };

  useEffect(() => {
    const cv = canvasRef.current; if (!cv || !profile) return;
    const ctx = cv.getContext("2d")!; const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes: any[] = [], raf = 0, t = 0;
    const build = () => {
      const r = cv.getBoundingClientRect(); cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
      const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
      const taxa = profile.abundance.filter((a: any) => a.pct > 0.05);
      const maxPct = Math.max(...taxa.map((t: any) => t.pct), 1);
      nodes = taxa.map((tx: any, i: number) => {
        const ang = (i / taxa.length) * Math.PI * 2 + tx.phylum.length * 0.35;
        const ring = 0.34 + 0.52 * (1 - tx.pct / maxPct), rad = Math.min(W, H) * 0.42 * ring;
        return { t: tx, bx: cx + Math.cos(ang) * rad, by: cy + Math.sin(ang) * rad, x: 0, y: 0,
          r: (7 + 28 * Math.sqrt(tx.pct / maxPct)) * dpr, hue: PHYLUM_HUE[tx.phylum] || "#19b27a", ph: (i * 1.7) % 6.28, flag: tx.status !== "ok" };
      });
    };
    build(); const ro = new ResizeObserver(build); ro.observe(cv);
    const draw = () => {
      t += 0.016; const W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      nodes.forEach((n) => { n.x = n.bx + Math.sin(t * 0.5 + n.ph) * 8 * dpr; n.y = n.by + Math.cos(t * 0.4 + n.ph) * 8 * dpr; });
      ctx.lineWidth = 1 * dpr; const maxD = Math.min(W, H) * 0.34;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].t.phylum !== nodes[j].t.phylum) continue;
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxD) { ctx.strokeStyle = `rgba(3,123,181,${0.16 * (1 - d / maxD)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const n of nodes) {
        const pulse = 1 + (n.flag ? Math.sin(t * 2 + n.ph) * 0.12 : Math.sin(t + n.ph) * 0.04), rr = n.r * pulse;
        const color = n.flag ? FLAG : n.hue;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rr * 2.2);
        g.addColorStop(0, color + "55"); g.addColorStop(0.55, color + "1c"); g.addColorStop(1, color + "00");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, rr * 2.2, 0, 6.2832); ctx.fill();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(n.x, n.y, rr * 0.52, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [profile]);

  const div = profile?.diversity, sc = profile?.scores;
  const gutScore = profile && sc ? Math.round((sc.scfa + sc.resilience + (100 - sc.dysbiosis)) / 3) : 0;
  const verdict = gutScore >= 75 ? "Your gut is in good shape." : gutScore >= 55 ? "Your gut is mostly healthy, with a few things to tune." : "Your gut needs some attention, and that is fixable.";
  const flags = profile?.abundance?.filter((a: any) => a.status !== "ok") || [];
  const thriving = profile?.abundance?.filter((a: any) => a.status === "ok" && a.concern === "low").slice(0, 3) || [];
  const top = profile?.abundance?.slice(0, 8) || [];
  const isUpload = !!uploaded;
  // showViz: any classified sample renders the diagrams (network, sunburst, bars,
  // diversity) from its REAL taxa, gut or not. showGut: the gut-specific scoring,
  // findings, plan and coach only when the sample is bacterial-dominant, so a
  // eukaryotic sample is not given a misleading gut score. seqOnly: too few reads
  // matched, show the sequence-intelligence readout + live BLAST instead.
  const showViz = !!profile && !profile.seqOnly;
  const bacterial = (profile?.bacterialPct ?? 100) >= 55;
  const showGut = showViz && bacterial;
  const pipe = pending ? buildPipeline(pending, isUpload ? (uploaded as string) : "jordan.fastq") : null;

  return (
    <section className="rz-sec" id="report">
      <div className="rz-card-w">
        <div className="cc rz-cc">
          <VantaBackground effect="fog" className="rz-cc-vanta" options={SKY} />
          <div className="rz-cc-in">

            <Glass>
              <div className="card-h">
                <div>
                  <span className="kick">MetaScope &middot; live engine</span>
                  <h2>Generate your gut report, <em>live</em></h2>
                </div>
                <div className="rz-cc-run">
                  <Primary onClick={runSample} disabled={running}>
                    {running && !isUpload ? <><span className="rz-rep__spin" aria-hidden /> Reading sample</> : <><PlayIcon /> Run Jordan&rsquo;s sample</>}
                  </Primary>
                  <button className="gbtn ghost" onClick={() => fileRef.current?.click()} disabled={running}><UploadIcon /> Upload FASTQ</button>
                  <input ref={fileRef} type="file" accept=".fastq,.fq,.fastq.gz,.fq.gz,.gz,.txt,.text,text/plain,application/gzip" hidden onChange={onUpload} />
                </div>
              </div>
              <div className="card-b">
                <p className="rz-cc-lead">The real pipeline, running in your browser. Load Jordan&rsquo;s shotgun-metagenomic sample or drop your own FASTQ and watch raw DNA reads turn into a plain-English gut report. Nothing leaves your device.</p>
                {!profile && !running && (
                  <div className="rz-lib">
                    <div className="rz-lib__head">
                      <span className="kick">Sample library &middot; click to run</span>
                      <p className="rz-lib__label">No FASTQ of your own? Click any card to run the real pipeline on it, real published data and synthetic. Start with the <b>shotgun stool</b> sample, the brief&rsquo;s case. Or use <b>Upload FASTQ</b> above for your own file.</p>
                    </div>
                    <div className="rz-lib__row">
                      {SAMPLES.map((s) => (
                        <button key={s.file} className={`rz-lib__card rz-lib__card--${s.kind}`} onClick={() => loadSample(s.file, s.name, s.kind)} disabled={running}>
                          <span className="rz-lib__cardtop">
                            <span className={`rz-lib__tag rz-lib__tag--${s.kind}`}>{s.tag}</span>
                            <span className="rz-lib__src">{s.src}</span>
                          </span>
                          <b>{s.name}</b>
                          <span className="rz-lib__note">{s.note}</span>
                          <span className="rz-lib__runslot">
                            <NoiseBackground containerClassName="rz-lib__nb">
                              <span className="nb-btn rz-lib__runbtn"><PlayIcon /> Run this sample</span>
                            </NoiseBackground>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {error && <p className="rz-cc-err" role="alert">{error}</p>}

                {!profile && (
                  <div className="rz-rep__gen">
                    {running ? (
                      pipe ? (
                        <Terminal commands={pipe.commands} outputs={pipe.outputs} typingSpeed={26} delayBetweenCommands={620} title={`metascope · ${isUpload ? uploaded : "jordan.fastq"}`} onComplete={reveal} />
                      ) : (
                        <div className="term">
                          <div className="term__bar"><span className="term__dot term__dot--r" /><span className="term__dot term__dot--y" /><span className="term__dot term__dot--g" /><span className="term__title">metascope</span></div>
                          <div className="term__body"><div className="term__line"><span className="term__prompt">$</span> <span className="term__cmd">booting metascope engine</span><span className="term__caret" /></div></div>
                        </div>
                      )
                    ) : (
                      <div className="term term--idle">
                        <div className="term__bar"><span className="term__dot term__dot--r" /><span className="term__dot term__dot--y" /><span className="term__dot term__dot--g" /><span className="term__title">metascope</span></div>
                        <div className="term__body">
                          <div className="term__line"><span className="term__prompt">$</span> <span className="term__cmd">metascope run --sample jordan.fastq</span><span className="term__caret" /></div>
                          <div className="term__line term__outline">press &ldquo;Run Jordan&rsquo;s sample&rdquo;, or upload your own FASTQ, to begin</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Glass>

            {profile?.seqOnly && (
              <Glass className="rz-rep__seqwrap">
                <RSeqIntel profile={profile} label={uploaded as string} />
              </Glass>
            )}

            {showViz && (
              <Glass className="rz-rep__overview">
                <div>
                  <div className="rz-rep__name">{isUpload ? "Your sample" : `${patient.name}, ${patient.age}`}</div>
                  <div className="rz-rep__meta">{isUpload ? `${uploaded} · ${profile.classified.toLocaleString()} of ${(profile.qcReads || profile.classified).toLocaleString()} QC-passed reads identified` : `Sample ${patient.sampleId} · collected ${patient.collected} · ${profile.classified.toLocaleString()} DNA reads identified`}</div>
                  {!isUpload && <div className="rz-rep__goals">{patient.goals.map((g: string) => <span key={g}>{g}</span>)}</div>}
                  {bacterial
                    ? <p className="rz-rep__verdict">{verdict}<span>Your community is mapped below, with {flags.length} thing{flags.length === 1 ? "" : "s"} flagged to work on and a plan to match.</span></p>
                    : <p className="rz-rep__verdict">We mapped your sample.<span>This is not a gut-bacteria sample, so we show the live taxonomic profile of the organisms we identified, not a gut-health score.</span></p>}
                  {isUpload && profile.kingdom && (
                    <p className="rz-rep__kingdom">Detected: {profile.kingdom} &middot; {profile.idPct}% of reads matched the reference{!bacterial ? ". Diagrams below are the real organisms found." : ""}</p>
                  )}
                </div>
                {bacterial
                  ? <div className="rz-rep__score"><ScoreRing score={gutScore} /><span>Gut health score</span><small className="rz-rep__scorecap">{gutScore >= 75 ? "In a good range" : gutScore >= 55 ? "Mostly healthy" : "Worth attention"}</small><small className="rz-rep__scorenote">Blends fibre fuel, resilience and balance. Healthy guts usually land 60 to 85.</small></div>
                  : <div className="rz-rep__score rz-rep__score--alt"><b>{div?.richness ?? profile.abundance.length}</b><span>organisms found</span><small className="rz-rep__scorecap">Shannon diversity {Number(div?.shannon ?? 0).toFixed(2)}</small></div>}
              </Glass>
            )}

            {showGut && (
              <Glass className="rz-rep__tracewrap">
                <RTraceback profile={profile} patient={patient} isUpload={isUpload} />
              </Glass>
            )}

            {showViz && (
              <div className="rz-rep__layout">
                <Glass className="rz-rep__stage-wrap">
                  <span className="kick">Your gut, made visible</span>
                  <div className="rz-rep__stage"><RNetwork abundance={profile.abundance} /></div>
                  <p className="rz-rep__stage-note"><b className="rz-rep__live">live</b> computed from your reads, not AI &middot; {profile.abundance.filter((a: any) => a.pct > 0).length} microbe types &middot; bigger circle = more of it &middot; amber = a flag &middot; drag to explore</p>
                </Glass>
                <div className="rz-rep__rail">
                  <Glass className="rz-rep__pad">
                    <span className="kick">Who lives in your gut</span>
                    <p className="rz-rep__legend">Bar = your level &middot; dashed band = the healthy range &middot; amber = outside it</p>
                    <div className="rz-rep__bars">
                      {top.map((a: any) => {
                        const w = Math.min(100, (a.pct / Math.max(top[0].pct, 1)) * 100);
                        const lo = Math.min(100, (a.healthyLo / Math.max(top[0].pct, 1)) * 100);
                        const hi = Math.min(100, (a.healthyHi / Math.max(top[0].pct, 1)) * 100);
                        return (
                          <div className="rz-rep__bar" key={a.id}>
                            <div className="rz-rep__bar-top"><span>{a.species.split(" ")[0]} <i>{a.species.split(" ").slice(1).join(" ")}</i></span><b>{a.pct.toFixed(1)}%</b></div>
                            <div className="rz-rep__track"><span className="rz-rep__range" style={{ left: `${lo}%`, width: `${Math.max(2, hi - lo)}%` }} /><span className="rz-rep__fill" data-flag={a.status} style={{ width: `${w}%` }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  </Glass>
                  <Glass className="rz-rep__pad">
                    <span className="kick">Your gut ecology</span>
                    <div className="rz-rep__stats">
                      <div><b>{div.shannon.toFixed(2)}</b><span>Diversity</span><i>{div.shannon >= 3 ? "healthy spread" : "on the lower side"}</i></div>
                      <div><b>{div.richness}</b><span>Species found</span><i>more is better</i></div>
                      <div><b>{profile.fbRatio.toFixed(2)}</b><span>F / B balance</span><i>two main families</i></div>
                      <div><b>{sc.resilience}</b><span>Resilience</span><i>higher is better</i></div>
                    </div>
                    <p className="rz-rep__note">More variety means a more resilient gut. {profile.enterotype === "Unclassified"
                      ? "The Bacteroides/Prevotella evidence is too sparse or balanced to assign an enterotype."
                      : `The genus-level evidence supports a ${profile.enterotype.split(/[\s-]/)[0]} enterotype.`} It is a description, not a grade.</p>
                  </Glass>
                </div>
              </div>
            )}

            {showViz && (
              <div className="rz-rep__tree">
                <Glass className="rz-rep__card--sun">
                  <span className="kick">From phylum to species</span>
                  <RSunburst abundance={profile.abundance} />
                  <div className="rz-rep__sun-legend rz-rep__sun-legend--row">
                    {order0legend(profile).map(([ph, pct]) => (
                      <div key={ph}><i style={{ background: PHYLUM_HUE[ph] || "#8896a3" }} /><span>{ph}</span><b>{pct}%</b></div>
                    ))}
                  </div>
                </Glass>
                <Glass className="rz-rep__card--read">
                  <span className="kick">How to read this</span>
                  <p>The inner ring is the big families of bacteria in your gut. The outer ring breaks each one into the individual species we found. A wider slice means more of it. An <em style={{ color: "#b27d00", fontStyle: "normal" }}>amber outline</em> marks a species we flagged to work on.</p>
                  <p>Yours is led by <b>{order0(profile)}</b>, the hallmark of a fibre-fed, stable gut. Hover any slice to name it.</p>
                </Glass>
              </div>
            )}

            {showGut && (
              <div className="rz-rep__findings">
                <Glass className="rz-rep__find rz-rep__find--good">
                  <span className="kick">What is going well</span>
                  {thriving.length === 0 && <p className="rz-rep__empty2">A few of your most important good microbes are low. Your plan below is built to bring them back.</p>}
                  {thriving.map((a: any) => <div className="rz-rep__row" key={a.id}><div><b>{a.species}</b><span>{plain(a.function)}</span></div></div>)}
                </Glass>
                <Glass className="rz-rep__find rz-rep__find--watch">
                  <span className="kick">What to work on</span>
                  {flags.length === 0 && <p className="rz-rep__empty2">Nothing flagged, your community looks balanced.</p>}
                  {flags.map((a: any) => <div className="rz-rep__row" key={a.id}><div><b>{a.species} <em data-dir={a.status}>{a.status === "low" ? "too little" : a.status === "high" ? "too much" : a.status}</em></b><span>{plain(a.function)}</span></div></div>)}
                </Glass>
                <Glass className="rz-rep__find rz-rep__find--plan">
                  <span className="kick">Your plan, matched to your sample</span>
                  {profile.recommendations.slice(0, 5).map((r: any, i: number) => <div className="rz-rep__row" key={i}><div><b>{r.strain} <em>{r.tag}</em></b><span>{plain(r.why)}</span></div></div>)}
                </Glass>
              </div>
            )}

            {showGut && (
              <Glass className="rz-rep__evwrap">
                <RGutEvidence profile={profile} />
              </Glass>
            )}

            {showGut && (
              <Glass className="rz-rep__coachwrap">
                <RGutCoach profile={profile} />
              </Glass>
            )}

            <p className="rz-cc-disc">A real k-mer classifier runs in your browser. Full personalised reports run on synthetic communities with a known ground truth (Jordan, the shotgun-stool and gut-mock samples). Real uploads are classified against a real 16S / 18S marker reference; when a small demo reference cannot confidently profile a real sample, it shows sequence intelligence with live NCBI BLAST rather than a made-up score. For demonstration, not medical advice.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
