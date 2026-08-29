// Brand + content config for GutGutGoose.
// The company's own content, mapped into the X Movement-style UI shapes.
// Brand: dark (#0b0f0a) + lime #d6fd70 + coral #f15a4a, Raveo type, goose mark.
//
// NOTE: this is a working engineering demo, not the operating company. Copy is
// kept to claims that are literally true of THIS build (a real in-browser
// pipeline, published methods, browser-only privacy, live public databases).
// Unverifiable business claims (investors, facilities, data residency, refund
// guarantees, specific survival stats) are deliberately not asserted here.

export const BRAND = {
  name: "GutGutGoose",
  full: "GutGutGoose",
  short: "GGG",
  tagline: "Probiotics matched to your gut DNA",
  blurb:
    "We sequence your gut first, then build a probiotic matched to your DNA, not an off-the-shelf guess.",
  app: "https://gutgutgoose.com",
  year: 2026,
} as const;

export const CONTACT = {
  email: "hello@gutgutgoose.com",
  phone: "",
  phoneHref: "",
  location: "A microbiome report you can actually read.",
} as const;

export const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/gutgutgoose" },
  { label: "TikTok", href: "https://tiktok.com/@gutgutgoose" },
  { label: "X", href: "https://x.com/gutgutgoose" },
  { label: "LinkedIn", href: "https://linkedin.com/company/gutgutgoose" },
] as const;

export type NavLink = { label: string; href: string; external?: boolean };
export const NAV_LINKS: NavLink[] = [
  { label: "How it works", href: "/#steps" },
  { label: "The Report", href: "/#report" },
  { label: "Science", href: "/#science" },
  { label: "Founder", href: "/#founder" },
];

export const APP_LINKS = {
  watch: { label: "Apply now", href: "#waitlist" },
  login: { label: "See your gut read live", href: "#report" },
  signup: { label: "Join the beta", href: "#waitlist" },
  community: { label: "Science", href: "/#science" },
  teachers: { label: "How it works", href: "/#steps" },
};

// Hero trust badges: only things that are true of this build.
export const HIGHLIGHTS = [
  "Real metagenomics engine",
  "Runs in your browser",
  "Shotgun metagenomics",
  "Live NCBI BLAST",
  "Open, published methods",
] as const;

export type Stat = { value: number; suffix: string; label: string; blurb: string };
export const STATS: Stat[] = [
  { value: 100, suffix: "%", label: "In your browser", blurb: "The whole pipeline, from raw FASTQ to finished report, runs on your device. Your reads are never uploaded." },
  { value: 30, suffix: "", label: "Gut taxa modelled", blurb: "A shotgun-style sample is matched against a reference community of gut species, not a single guess." },
  { value: 3, suffix: "", label: "Live databases", blurb: "NCBI, PubMed and ClinicalTrials.gov are queried live for the research behind every flag." },
];

// "Generic probiotics are a $58 billion guess." — the problem, 3 points.
export type Problem = { title: string; body: string };
export const PROBLEMS: Problem[] = [
  { title: "Most don't survive", body: "Most off-the-shelf strains die in transit or get washed out before they ever reach your colon." },
  { title: "Your gut is unique", body: "The number of possible strain combinations in one gut runs into the billions. A one-size formula cannot fit that." },
  { title: "No proof it worked", body: "You rarely find out whether anything colonised, or whether those strains were ever right for your gut." },
];

// "Reading your results" — a plain-English glossary of the exact metrics the
// live report shows above, so an average patient can read their own gut.
export type Discipline = { id: string; group: string; name: string; blurb: string; art: string; accent: string; theme: string };
export const DISCIPLINES: Discipline[] = [
  { id: "diversity", group: "Diversity", name: "Shannon diversity", blurb: "How many kinds of microbe you carry, and how evenly. A higher score usually means a steadier, more resilient gut.", art: "/img/gut-veg.jpg", accent: "#15aeea", theme: "lime" },
  { id: "composition", group: "Composition", name: "Who lives in your gut", blurb: "Your most abundant species, drawn as the constellation and the bars. Each is compared against its own healthy range.", art: "/img/gut-culture.jpg", accent: "#0e8fd0", theme: "lime" },
  { id: "balance", group: "Balance", name: "Firmicutes to Bacteroidetes", blurb: "The ratio of your two largest bacterial families. We flag it when it drifts outside the typical healthy band.", art: "/img/gut-fermented.jpg", accent: "#7c6cf0", theme: "coral" },
  { id: "enterotype", group: "Community type", name: "Your enterotype", blurb: "Which family leads your gut. A Bacteroides-led type is the hallmark of a fibre-fed, stable community.", art: "/img/gut-micro.jpg", accent: "#f4b21a", theme: "sun" },
  { id: "flags", group: "Flags", name: "What to work on", blurb: "Species sitting too high or too low, like raised E. coli or low F. prausnitzii, marked and explained in plain words.", art: "/img/gut-lab.jpg", accent: "#15aeea", theme: "lime" },
  { id: "match", group: "Your match", name: "The personalised plan", blurb: "The exact probiotic strains chosen to fill your gaps, picked to be the ones most likely to take root in your gut.", art: "/img/gut-greens.jpg", accent: "#0570ad", theme: "coral" },
];
export const SERVICE_GROUPS = ["Diversity", "Composition", "Balance", "Community type", "Flags", "Your match"] as const;

export type CalendarItem = { id: string; name: string; date: string; blurb: string; art: string };
export const CALENDAR: CalendarItem[] = [];

// How it works — 3 steps.
export const STEPS = [
  { n: "01", title: "Sample at home", body: "A simple at-home stool kit. We run shotgun metagenomic sequencing, reading every microbe's DNA, not just a guess." },
  { n: "02", title: "MetaScope reads it", body: "Our engine classifies your reads, maps your community, scores diversity and flags dysbiosis, in plain English." },
  { n: "03", title: "We build & match", body: "A probiotic matched to your DNA and goals, chosen to be the strains most likely to take root in your specific gut." },
];

export const TESTIMONIAL = {
  quote:
    "Everyone's selling the same bacteria to a billion different guts. We sequence yours first, then build the one that actually belongs there. The goose just makes sure you smile while we do the science.",
  author: "The founder",
  handle: "GutGutGoose",
};

export type ProofItem = { quote: string; name: string; role: string; theme: string };
// "The memorable ones" — brand case studies.
export const PROOF: ProofItem[] = [
  { quote: "A serious metagenomics pipeline that turns raw DNA reads into a report you can actually read, with a mascot that refuses to take itself too seriously.", name: "The goose that grew in a dish", role: "Origin", theme: "lime" },
  { quote: "Raw DNA reads become QC, a classified community, diversity scores, dysbiosis flags and a matched formula, all in one pipeline.", name: "From FASTQ to formula", role: "The engine", theme: "coral" },
  { quote: "We don't just ship strains. We pick the ones most likely to take root in your gut, matched to exactly what your sample is missing.", name: "How a strain takes root", role: "Colonisation", theme: "sun" },
  { quote: "Real metagenomics, run for your gut, with a goose that refuses to take itself too seriously.", name: "Built in a lab, led by a goose", role: "The brand", theme: "lime" },
];

export type Faq = { q: string; a: string };
export const FAQS: Faq[] = [
  { q: "How does GutGutGoose work?", a: "We analyse your microbiome from a simple at-home stool test using shotgun metagenomic sequencing, build a model of your gut with MetaScope, and choose probiotic strains that match your profile and goals." },
  { q: "How does the engine choose my formula?", a: "Your gut has too many strain combinations for guesswork. MetaScope uses your sequencing data, diet and goals to map your community, flag what is low or overgrown, and match strains most likely to colonise you." },
  { q: "Can I run my own sequencing data?", a: "Yes. Use Upload FASTQ in the live report to run your own file. It is classified against a real 16S/18S marker reference, with live NCBI BLAST for anything outside it, and everything runs in your browser, so your reads never leave your device." },
  { q: "What about my data privacy?", a: "This demo runs entirely in your browser. Your FASTQ is processed on your device and is never uploaded. In the full product, your data would stay encrypted and under your control, and you could delete it whenever you want." },
  { q: "Is the report on this page real?", a: "The MetaScope engine is a genuine, working classifier running in your browser. Full personalised reports run on synthetic mock-community samples with a known ground truth, the same in-silico approach used to validate real metagenomic tools. Real uploads are classified live and identified with NCBI BLAST, never given a made-up score." },
];

export const SAFEGUARDS = [
  "Built on published, peer-reviewed methods: k-mer taxonomic classification, Shannon and Simpson diversity, enterotyping and the F/B ratio.",
  "Runs in your browser. Your sequencing reads are processed on your device and never uploaded.",
  "Identifications are checked live against NCBI BLAST and the research is pulled from PubMed, not a black box.",
  "Your microbiome, your data. Share it with your clinician anytime, or delete it.",
] as const;
