// The Gaggle copy, mapped into the original GutGutGoose UI without changing
// its layout, section order, component shapes, or visual system.

import { withBasePath } from "@/lib/utils/base-path";

export const BRAND = {
  name: "The Gaggle",
  full: "The Gaggle",
  short: "GGL",
  tagline: "Adversarial microbiome R&D",
  blurb:
    "Independent AI scientists argue, retrieve evidence, run deterministic experiments, revise their beliefs, and stop for a human scientist.",
  app: "https://smxfreeze.github.io/revoke-agent-harness/",
  year: 2026,
} as const;

export const CONTACT = {
  email: "",
  phone: "",
  phoneHref: "",
  location: "Synthetic, experimental, and non-clinical.",
} as const;

export const SOCIALS = [
  { label: "GitHub", href: "https://github.com/SMXFREEZE/revoke-agent-harness" },
] as const;

export type NavLink = { label: string; href: string; external?: boolean };
// Keep internal routes app-root-relative: next/link applies next.config basePath.
export const NAV_LINKS: NavLink[] = [
  { label: "How it works", href: "/#steps" },
  { label: "The agents", href: "/#agents" },
  { label: "Evidence", href: "/#disciplines" },
  { label: "The verdict", href: "/#science" },
];

export const APP_LINKS = {
  watch: { label: "Watch the agents", href: "/#agents" },
  login: { label: "Inspect the run", href: "/#agents" },
  signup: { label: "Inspect the run", href: "/#agents" },
  community: { label: "Evidence", href: "/#disciplines" },
  teachers: { label: "How it works", href: "/#steps" },
};

// Hero trust badges: only things that are true of this build.
export const HIGHLIGHTS = [
  "Persistent TrueForge session",
  "OpenAI specialist agents",
  "Bright Data evidence",
  "Daytona experiments",
  "Qodo-reviewed code",
] as const;

export type Stat = { value: number; suffix: string; label: string; blurb: string };
export const STATS: Stat[] = [
  { value: 8, suffix: "", label: "Bounded specialists", blurb: "Defense, Prosecution, Evidence Clerk, Methodologist, Experimentalist, Red Team, jurors, and a disagreement analyst each have a distinct mission." },
  { value: 39, suffix: "", label: "Audit events", blurb: "The verified golden run preserves evidence, scores, revisions, dissent, tool provenance, and the exact proposal hash." },
  { value: 1, suffix: "", label: "Human boundary", blurb: "Read-only work runs autonomously. Promotion stops until a scientist approves the exact immutable proposal ID and SHA-256 hash." },
];

// "Generic probiotics are a $58 billion guess." — the problem, 3 points.
export type Problem = { title: string; body: string };
export const PROBLEMS: Problem[] = [
  { title: "One model anchors", body: "A persuasive first hypothesis can become the answer before contrary evidence is seriously tested." },
  { title: "Evidence has scope", body: "Species-level, in-vitro, and human evidence cannot silently inherit the same weight." },
  { title: "Consensus can lie", body: "Averaging confidence hides meaningful dissent instead of showing why qualified reviewers disagree." },
];

// "Reading your results" — a plain-English glossary of the exact metrics the
// live report shows above, so an average patient can read their own gut.
export type Discipline = { id: string; group: string; name: string; blurb: string; art: string; accent: string; theme: string };
export const DISCIPLINES: Discipline[] = [
  { id: "defense", group: "Advocate", name: "Defense", blurb: "Builds the strongest evidence-backed case for each candidate without hiding methodology or biological-scope limits.", art: withBasePath("/img/gut-veg.jpg"), accent: "#15aeea", theme: "lime" },
  { id: "prosecution", group: "Adversary", name: "Prosecution", blurb: "Uses independent queries to find contradictions, weak transfer assumptions, and evidence that should lower confidence.", art: withBasePath("/img/gut-culture.jpg"), accent: "#0e8fd0", theme: "lime" },
  { id: "evidence", group: "Provenance", name: "Evidence Clerk", blurb: "Admits only source-linked claims with retrieval time, source class, biological scope, methodology flags, and content identity.", art: withBasePath("/img/gut-fermented.jpg"), accent: "#7c6cf0", theme: "coral" },
  { id: "method", group: "Rigor", name: "Methodologist", blurb: "Checks whether a paper's design, population, endpoint, and strain specificity justify the weight assigned to it.", art: withBasePath("/img/gut-micro.jpg"), accent: "#f4b21a", theme: "sun" },
  { id: "experiment", group: "Computation", name: "Experimentalist", blurb: "Runs deterministic compatibility and counterfactual calculations in Daytona so the language model cannot invent scores.", art: withBasePath("/img/gut-lab.jpg"), accent: "#15aeea", theme: "lime" },
  { id: "red-team", group: "Challenge", name: "Blind Red Team", blurb: "Attacks the current leader without seeing the desired answer, then sends unresolved objections to jurors and the disagreement analyst.", art: withBasePath("/img/gut-greens.jpg"), accent: "#0570ad", theme: "coral" },
];
export const SERVICE_GROUPS = ["Advocate", "Adversary", "Provenance", "Rigor", "Computation", "Challenge"] as const;

export type CalendarItem = { id: string; name: string; date: string; blurb: string; art: string };
export const CALENDAR: CalendarItem[] = [];

// How it works — 3 steps.
export const STEPS = [
  { n: "01", title: "Convene competing scientists", body: "TrueForge opens one persistent case and dispatches bounded specialists with different missions, contexts, and typed outputs." },
  { n: "02", title: "Make evidence change the state", body: "Bright Data retrieves independent sources and Daytona computes deterministic compatibility, forcing the initial ranking to face new facts." },
  { n: "03", title: "Revise, preserve dissent, stop", body: "The old and new rankings remain inspectable, jurors expose disagreement, and promotion halts at the exact scientist approval boundary." },
];

export const TESTIMONIAL = {
  quote:
    "A single model can make a confident argument. The Gaggle must survive an opponent, independent evidence, deterministic experiments, a blind Red Team, and a jury that is allowed to disagree.",
  author: "The Gaggle rulebook",
  handle: "Synthetic · experimental · non-clinical",
};

export type ProofItem = { quote: string; name: string; role: string; theme: string };
// "The memorable ones" — brand case studies.
export const PROOF: ProofItem[] = [
  { quote: "Candidate A begins at rank one and falls to rank three after admitted evidence and deterministic compatibility tests challenge it.", name: "Belief revision", role: "Append-only state", theme: "lime" },
  { quote: "Candidate B rises from rank two to rank one, with every source, score, and causal revision preserved in the audit ledger.", name: "Evidence that matters", role: "Decision path", theme: "coral" },
  { quote: "Five jurors return structured verdicts while the disagreement analyst preserves meaningful dissent instead of averaging it away.", name: "No fake consensus", role: "Jury", theme: "sun" },
  { quote: "The system emits an immutable proposal ID and SHA-256 hash, then stops before the guarded write tool.", name: "Human boundary", role: "Approval", theme: "lime" },
];

export type Faq = { q: string; a: string };
export const FAQS: Faq[] = [
  { q: "What is The Gaggle?", a: "An adversarial multi-agent microbiome R&D workflow. Independent specialists argue, retrieve evidence, run deterministic experiments, revise candidate rankings, preserve dissent, and stop for a scientist." },
  { q: "Is this a medical or clinical system?", a: "No. The public case is synthetic, experimental, and non-clinical. It does not diagnose, prescribe, recommend treatment, or claim clinical validation." },
  { q: "What does TrueForge do?", a: "TrueForge owns the persistent case, specialist delegation, MCP tool calls, sandbox events, context continuation, and the exact human approval boundary." },
  { q: "How do Bright Data and Daytona affect the result?", a: "Bright Data retrieves query-specific sources with provenance and recovery metadata. Daytona executes deterministic compatibility and counterfactual code. Both change the recorded ranking rather than decorating the interface." },
  { q: "Why not average the jury scores?", a: "Averages can hide meaningful scientific disagreement. The system stores each verdict and uses a disagreement analyst to classify where the jurors diverge and why." },
];

export const SAFEGUARDS = [
  "Every admitted claim carries a direct source URL, source class, biological scope, methodology flags, retrieval time, and content identity.",
  "Retrieved pages are untrusted data. They cannot change instructions, permissions, tool choice, or the approval gate.",
  "Initial and revised beliefs are append-only; the old ranking and the evidence that displaced it remain inspectable.",
  "Promotion requires the exact immutable proposal ID and SHA-256 hash. Reject means zero mutation and every decision emits an audit receipt.",
] as const;
