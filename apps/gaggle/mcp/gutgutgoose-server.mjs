#!/usr/bin/env node
/**
 * GutGutGoose MCP server.
 *
 * Exposes the real MetaScope microbiome platform to any MCP-capable AI agent
 * (Claude Desktop, Cursor, etc.). The same in-browser shotgun-metagenomics
 * engine runs here in Node, so an agent can analyse a FASTQ, read the report,
 * and pull medical context for any flagged microbe, then reason about it.
 *
 * Tools:
 *   analyze_gut_sample   run the engine on a FASTQ (or the built-in demo sample)
 *   get_report           one analysis report as structured JSON
 *   explain_microbe      one microbe: abundance + role + medical context
 *   get_plan             the personalised probiotic recommendations
 *
 * Run:  node mcp/gutgutgoose-server.mjs        (stdio transport)
 * Wire it into an MCP client by pointing it at this file. See mcp/README.md.
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createAnalysisStore } from "./analysis-store.mjs";
import { MAX_MICROBE_NAME_LENGTH, parseMicrobeName } from "./tool-input.mjs";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const eng = (f) => path.join(here, "..", "public", "engine", f);

// the browser engine attaches to window; give it one and load it in Node.
globalThis.window = globalThis.window || {};
require(eng("reference-db.js"));
require(eng("sample-fastq.js"));
require(eng("metascope.js"));
const W = globalThis.window;

// ---- medical knowledge base: microbe -> clinical context (genus keyed) ----
const KB = {
  faecalibacterium: { role: "Flagship butyrate producer and one of the most anti-inflammatory gut microbes.", conditions: "Depleted in Crohn's disease, ulcerative colitis, IBS and obesity.", levers: "Resistant starch, inulin, and dietary polyphenols.", evidence: "Among the most consistently health-associated taxa in human gut studies." },
  akkermansia: { role: "Mucus-layer guardian that strengthens the gut barrier.", conditions: "Low in obesity, type 2 diabetes and metabolic syndrome.", levers: "Polyphenols (cranberry, grape), time-restricted eating; next-gen probiotics.", evidence: "Pasteurised A. muciniphila has been trialled for metabolic health." },
  escherichia: { role: "Facultative anaerobe, normal in small amounts.", conditions: "Blooms in dysbiosis, inflammation and after antibiotics.", levers: "Rebuild butyrate producers and increase fibre to lower gut oxygen.", evidence: "Expansion of Proteobacteria like E. coli is a recognised signature of dysbiosis." },
  klebsiella: { role: "Opportunistic Enterobacteriaceae.", conditions: "Overgrowth is linked to intestinal inflammation and can drive IBD flares.", levers: "Restore commensals and fibre; reduce ultra-processed food.", evidence: "Klebsiella blooms associate with mucosal inflammation." },
  bifidobacterium: { role: "Keystone genus that cross-feeds butyrate producers and trains the immune system.", conditions: "Low with low-fibre diets, ageing and formula feeding.", levers: "GOS/FOS prebiotics and fermented foods.", evidence: "Classic, well-studied probiotic genus." },
  prevotella: { role: "Plant-fibre specialist.", conditions: "Marks a plant-rich, fibre-heavy diet; context dependent.", levers: "Whole grains and legumes.", evidence: "The Prevotella enterotype tracks long-term fibre intake." },
  bacteroides: { role: "Versatile fibre and protein degrader, a backbone of a stable gut.", conditions: "Stable and abundant in healthy Western guts.", levers: "Diverse dietary fibre.", evidence: "Defines the common Bacteroides enterotype." },
  roseburia: { role: "Butyrate producer linked to steady energy and gut comfort.", conditions: "Depleted in IBD and type 2 diabetes.", levers: "Resistant starch and fibre.", evidence: "A reliable marker of a fibre-fed colon." },
  eubacterium: { role: "Major butyrate producer.", conditions: "Falls on low-fibre diets.", levers: "Plant fibre diversity.", evidence: "Core short-chain-fatty-acid producer." },
  blautia: { role: "Short-chain fatty-acid producer associated with leanness.", conditions: "Lower in obesity.", levers: "Fibre.", evidence: "Inversely associated with adiposity." },
  saccharomyces: { role: "Probiotic yeast that antagonises pathogens.", conditions: "Used for antibiotic-associated diarrhoea.", levers: "Targeted supplementation.", evidence: "S. boulardii is a clinically studied probiotic." },
  ruminococcus: { role: "Keystone resistant-starch degrader that unlocks fibre for others.", conditions: "Sensitive to low-starch diets.", levers: "Cooked-then-cooled potato, rice and legumes.", evidence: "Primary degrader of resistant starch." },
  lactobacillus: { role: "Lactic-acid bacteria from fermented foods.", conditions: "Supports barrier and immunity.", levers: "Kefir, yoghurt, sauerkraut.", evidence: "The most widely used probiotic genus." },
  christensenella: { role: "Highly heritable taxon associated with leanness.", conditions: "Lower in obesity.", levers: "Fibre.", evidence: "One of the most heritable gut microbes." },
  alistipes: { role: "Bile-tolerant Bacteroidetes.", conditions: "Context dependent; tracks protein and fat intake.", levers: "Balanced fibre.", evidence: "Common commensal." },
};
const kbFor = (name) => KB[(name || "").toLowerCase().split(" ")[0]] || null;

async function runEngine(text) {
  return W.MetaScope.run(text, { reference: W.GGG_REFERENCE, onStage: () => {}, onProgress: () => {} });
}
function summarise(p) {
  const sc = p.scores || {}, div = p.diversity || {};
  const score = Math.round((sc.scfa + sc.resilience + (100 - sc.dysbiosis)) / 3);
  const flags = (p.abundance || []).filter((a) => a.status !== "ok");
  return {
    gutHealthScore: score,
    reads: p.classified,
    diversity: { shannon: Number(div.shannon?.toFixed?.(2)), richness: div.richness },
    firmicutesToBacteroidetes: Number(p.fbRatio?.toFixed?.(2)),
    enterotype: p.enterotype,
    taxa: (p.abundance || []).map((a) => ({ species: a.species, phylum: a.phylum, percent: Number(a.pct?.toFixed?.(2)), status: a.status })),
    flagged: flags.map((a) => ({ species: a.species, status: a.status, percent: Number(a.pct?.toFixed?.(2)) })),
    plan: (p.recommendations || []).slice(0, 5).map((r) => ({ strain: r.strain, tag: r.tag, why: (r.why || "").replace(/\s*[—–]\s*/g, ", ") })),
  };
}
const ok = (obj) => ({ content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }] });
const analyses = createAnalysisStore();
const analysisIdProperty = {
  type: "string",
  minLength: 1,
  maxLength: 128,
  description: "The analysisId returned by analyze_gut_sample.",
};
const reportFor = (analysisId) => analyses.get(analysisId);

// ---- live external medical platforms (no key needed) ----
async function pubmed(query, n = 5) {
  const es = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${n}&retmode=json&sort=relevance`).then((r) => r.json());
  const ids = es.esearchresult?.idlist || [];
  if (!ids.length) return [];
  const sum = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`).then((r) => r.json());
  const res = sum.result || {};
  return (res.uids || []).map((u) => ({ pmid: u, title: res[u]?.title, year: (res[u]?.pubdate || "").slice(0, 4), journal: res[u]?.source, url: `https://pubmed.ncbi.nlm.nih.gov/${u}/` }));
}
async function trials(query, n = 5) {
  const j = await fetch(`https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=${n}&format=json`).then((r) => r.json());
  return (j.studies || []).map((st) => {
    const id = st.protocolSection?.identificationModule || {};
    const stat = st.protocolSection?.statusModule || {};
    return { nct: id.nctId, title: id.briefTitle, status: stat.overallStatus, url: `https://clinicaltrials.gov/study/${id.nctId}` };
  });
}

const TOOLS = [
  { name: "analyze_gut_sample", description: "Run the MetaScope shotgun-metagenomics engine on a FASTQ. Omit `fastq` to use the built-in demo sample (patient Jordan Vale). Returns a structured gut report: score, diversity, F/B ratio, enterotype, every taxon, flags, and the personalised plan.",
    inputSchema: { type: "object", properties: { fastq: { type: "string", description: "Raw FASTQ text. Optional; defaults to the demo sample." } } } },
  { name: "get_report", description: "Return one gut report by analysis ID. Analyses expire after 30 idle minutes and the server retains at most 32.",
    inputSchema: { type: "object", properties: { analysisId: analysisIdProperty }, required: ["analysisId"] } },
  { name: "explain_microbe", description: "Explain one microbe from a named analysis: its abundance and status plus clinical context (role, associated conditions, dietary levers, evidence).",
    inputSchema: { type: "object", properties: { analysisId: analysisIdProperty, name: { type: "string", minLength: 1, maxLength: MAX_MICROBE_NAME_LENGTH, pattern: "\\S", description: "Non-empty microbe name or genus, e.g. 'Akkermansia' or 'E. coli'." } }, required: ["analysisId", "name"] } },
  { name: "get_plan", description: "Return the personalised probiotic recommendations for one analysis ID.",
    inputSchema: { type: "object", properties: { analysisId: analysisIdProperty }, required: ["analysisId"] } },
  { name: "search_medical_evidence", description: "Search live PubMed (NCBI) for peer-reviewed research on a microbe, condition or topic. Returns real papers (title, year, journal, PMID, link). Use it to back a finding with literature.",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "e.g. 'Akkermansia muciniphila obesity' or 'Faecalibacterium prausnitzii IBD'." } }, required: ["query"] } },
  { name: "find_clinical_trials", description: "Search live ClinicalTrials.gov for trials related to a microbe, probiotic or condition. Returns real studies (NCT id, title, status, link).",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "e.g. 'Akkermansia probiotic' or 'gut microbiome IBS'." } }, required: ["query"] } },
];

const server = new Server({ name: "gutgutgoose", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    if (name === "analyze_gut_sample") {
      const text = args.fastq && args.fastq.trim() ? args.fastq : W.GGG_SAMPLE_FASTQ;
      const p = await runEngine(text);
      if (!p || !p.classified) return ok("No reads recognised. Provide a plain-text FASTQ.");
      const analysisId = analyses.create(p);
      return ok({ analysisId, ...summarise(p) });
    }
    if (name === "get_report") {
      const report = reportFor(args.analysisId);
      return report ? ok({ analysisId: args.analysisId, ...summarise(report) }) : ok("Unknown or expired analysisId. Call analyze_gut_sample first.");
    }
    if (name === "get_plan") {
      const report = reportFor(args.analysisId);
      return report ? ok({ analysisId: args.analysisId, plan: summarise(report).plan }) : ok("Unknown or expired analysisId. Call analyze_gut_sample first.");
    }
    if (name === "explain_microbe") {
      const microbeName = parseMicrobeName(args.name);
      if (!microbeName) return ok(`Invalid microbe name. Provide 1-${MAX_MICROBE_NAME_LENGTH} non-whitespace characters.`);
      const report = reportFor(args.analysisId);
      if (!report) return ok("Unknown or expired analysisId. Call analyze_gut_sample first.");
      const q = microbeName.toLowerCase();
      const hit = (report.abundance || []).find((a) => a.species.toLowerCase().includes(q) || a.species.toLowerCase().split(" ").some((w) => w.length > 3 && q.includes(w)) || q.includes(a.species.toLowerCase().split(" ")[0]));
      const kb = kbFor(hit ? hit.species : microbeName);
      return ok({
        analysisId: args.analysisId,
        microbe: hit ? hit.species : microbeName,
        found: !!hit,
        abundance: hit ? { percent: Number(hit.pct?.toFixed?.(2)), status: hit.status, phylum: hit.phylum, healthyRange: `${hit.healthyLo}-${hit.healthyHi}%` } : null,
        clinical: kb || "No curated medical context for this microbe.",
      });
    }
    if (name === "search_medical_evidence") return ok({ query: args.query, source: "PubMed (NCBI)", papers: await pubmed(args.query || "", 5) });
    if (name === "find_clinical_trials") return ok({ query: args.query, source: "ClinicalTrials.gov", studies: await trials(args.query || "", 5) });
    return ok(`Unknown tool: ${name}`);
  } catch (e) {
    return ok(`Error: ${e?.message || e}`);
  }
});

await server.connect(new StdioServerTransport());
console.error("[gutgutgoose-mcp] ready on stdio");
