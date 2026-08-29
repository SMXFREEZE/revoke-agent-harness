import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowUpRight,
  Braces,
  Check,
  ChevronRight,
  CircleAlert,
  Database,
  ExternalLink,
  Fingerprint,
  GitCompareArrows,
  Globe2,
  KeyRound,
  LockKeyhole,
  Play,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  TerminalSquare,
  Users,
  X,
  Zap,
} from "lucide-react";
import "./styles.css";

type Tab = "overview" | "evidence" | "matches" | "system";

const SOURCES = {
  previous:
    "https://www.cpsc.gov/Recalls/2026/Conair-Recalls-Over-One-Million-Cuisinart-Grill-Brushes-Due-to-Ingestion-Hazard",
  current:
    "https://www.cpsc.gov/Recalls/2026/Conair-Expands-Recall-of-Cuisinart-Grill-Brushes-Due-to-Ingestion-Hazard-Over-3-6-Million-Brushes-Now-Recalled",
  manufacturer: "https://www.cuisinart.com/support/safety-recalls.html",
};

const stages = [
  { label: "Detect", meta: "Expansion found", icon: Globe2 },
  { label: "Verify", meta: "2 sources sealed", icon: SearchCheck },
  { label: "Resolve", meta: "4 SKUs actionable", icon: GitCompareArrows },
  { label: "Compute", meta: "Daytona complete", icon: TerminalSquare },
  { label: "Approve", meta: "Human required", icon: KeyRound },
];

const metrics = [
  { value: "4", label: "actionable SKUs", note: "3 exact · 1 family" },
  { value: "312", label: "units to hold", note: "simulated inventory" },
  { value: "4", label: "affected orders", note: "3 customers" },
  { value: "$4,806.88", label: "retail exposure", note: "simulated · USD" },
];

const exactMatches = [
  ["SKU-CUIS-CGWM024", "CGWM-024", "Exact model"],
  ["SKU-CUIS-CGWM059", "CGWM-059", "Exact model"],
  ["SKU-CUIS-FCB501", "FCB-501", "Exact model"],
  ["SKU-CUIS-LEGACY18", "CWBR-2018", "Explicit family"],
];

const evidence = [
  {
    tier: "01",
    title: "CPSC 26-717 · authoritative",
    detail: "3,625,800 total units · 13 identifiers added · family scope added",
    hash: "6be5d7…578c",
    tool: "cpsc-recalls MCP",
    href: SOURCES.current,
  },
  {
    tier: "02",
    title: "Bright Data · discovery",
    detail: "Both notices discovered; government-domain scraping correctly blocked",
    hash: "policy enforced",
    tool: "search_engine",
    href: SOURCES.current,
  },
  {
    tier: "03",
    title: "Cuisinart · corroboration",
    detail: "Manufacturer recall center verified as non-authoritative support",
    hash: "c2bf4a…91c83",
    tool: "scrape_as_markdown",
    href: SOURCES.manufacturer,
  },
];

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "live" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [runStep, setRunStep] = useState(5);
  const [running, setRunning] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalText, setApprovalText] = useState("");
  const [decision, setDecision] = useState<"pending" | "recorded" | "denied">("pending");

  const approvalPhrase = "APPROVE proposal-be1085358f92e9fe";
  const approvalValid = approvalText.trim() === approvalPhrase;

  useEffect(() => {
    if (!running) return;
    if (runStep >= stages.length) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setRunStep((step) => step + 1), 620);
    return () => window.clearTimeout(timer);
  }, [running, runStep]);

  const runCase = () => {
    setDecision("pending");
    setRunStep(0);
    setRunning(true);
    setActiveTab("overview");
  };

  const status = useMemo(() => {
    if (running) return `Running ${stages[Math.min(runStep, 4)]?.label.toLowerCase()} phase`;
    if (decision === "recorded") return "Approval recorded locally · no write executed";
    if (decision === "denied") return "Proposal denied · zero mutation";
    return "Awaiting explicit human approval";
  }, [decision, runStep, running]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="REVOKE home">
          <span className="brand-mark">R/</span>
          <span>REVOKE</span>
        </a>
        <nav className="nav" aria-label="Primary">
          {(["overview", "evidence", "matches", "system"] as Tab[]).map((tab) => (
            <button key={tab} className={activeTab === tab ? "nav-link is-active" : "nav-link"} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="top-status"><span className="pulse" /> Golden case · verified run</div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><CircleAlert size={15} /> PRODUCT SAFETY INCIDENT / 26-717</div>
            <h1>Recall found.<br /><span>Exposure contained.</span></h1>
            <p>
              REVOKE turns a changing safety notice into a source-backed, sandbox-computed containment plan—and stops before action until a human says yes.
            </p>
            <div className="hero-actions">
              <button className="button button--primary" onClick={runCase} disabled={running}>
                {running ? <RefreshCw className="spin" size={17} /> : <Play size={17} fill="currentColor" />}
                {running ? status : "Replay verified case"}
              </button>
              <a className="button button--secondary" href={SOURCES.current} target="_blank" rel="noreferrer">
                Open source notice <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
          <div className="incident-card">
            <div className="incident-card__head">
              <div><span className="kicker">ACTIVE CASE</span><strong>Cuisinart grill brushes</strong></div>
              <Badge tone="live">LIVE EVIDENCE</Badge>
            </div>
            <div className="case-number"><span>Recall</span><strong>26-717</strong></div>
            <div className="expansion-row">
              <div><span>Previous scope</span><strong>1,719,995</strong></div>
              <ChevronRight size={18} />
              <div><span>Expanded scope</span><strong>3,625,800</strong></div>
            </div>
            <div className="delta-strip"><Zap size={16} /> +1,905,805 units · +13 identifiers · family scope added</div>
            <div className="case-foot"><Fingerprint size={15} /> Evidence sealed with SHA-256</div>
          </div>
        </section>

        <section className="sponsor-rail" aria-label="Technology stack">
          <span>POWERED BY</span>
          <strong>TRUEFORGE</strong><i />
          <strong>OPENAI</strong><i />
          <strong>BRIGHT DATA</strong><i />
          <strong>DAYTONA</strong><i />
          <strong>QODO <small>PR #1 review active</small></strong>
        </section>

        <section className="command-section">
          <div className="section-heading">
            <div><span className="kicker">LIVE RUN / 29 AUG 2026</span><h2>Containment command center</h2></div>
            <Badge tone={decision === "denied" ? "neutral" : decision === "recorded" ? "good" : "warn"}>{status.toUpperCase()}</Badge>
          </div>

          <div className="stage-grid">
            {stages.map((stage, index) => {
              const complete = index < runStep;
              const current = index === runStep && running;
              const Icon = stage.icon;
              return (
                <div className={`stage ${complete ? "is-complete" : ""} ${current ? "is-current" : ""}`} key={stage.label}>
                  <div className="stage-icon">{complete ? <Check size={18} /> : <Icon size={18} />}</div>
                  <div><strong>{stage.label}</strong><span>{stage.meta}</span></div>
                  <span className="stage-index">0{index + 1}</span>
                </div>
              );
            })}
          </div>

          <div className="metrics-grid">
            {metrics.map((metric) => (
              <article className="metric" key={metric.label}>
                <strong>{metric.value}</strong><span>{metric.label}</span><small>{metric.note}</small>
              </article>
            ))}
          </div>

          <div className="tab-panel">
            {activeTab === "overview" && <Overview />}
            {activeTab === "evidence" && <Evidence />}
            {activeTab === "matches" && <Matches />}
            {activeTab === "system" && <System />}
          </div>

          <section className="approval-gate">
            <div className="approval-icon"><LockKeyhole size={26} /></div>
            <div className="approval-copy">
              <span className="kicker">POLICY-ENFORCED STOP</span>
              <h3>One human decision stands between analysis and action.</h3>
              <p>Proposal <code>proposal-be1085358f92e9fe</code> is immutable, idempotent, and scoped to exactly four simulated SKUs. Customer notices require a separate approval.</p>
            </div>
            <div className="approval-actions">
              <button className="button button--danger" onClick={() => setApprovalOpen(true)} disabled={decision !== "pending"}>
                <KeyRound size={17} /> Review exact proposal
              </button>
              <button className="text-button" onClick={() => setDecision("denied")} disabled={decision !== "pending"}>Deny · zero mutation</button>
            </div>
          </section>
        </section>

        <section className="proof-section">
          <div className="section-heading"><div><span className="kicker">RUNTIME RECEIPT</span><h2>Not a mock badge. A completed harness run.</h2></div></div>
          <div className="proof-grid">
            <article><Users size={20} /><strong>4 bounded agents</strong><span>Independent evidence, catalog, exposure, and adversarial reports</span></article>
            <article><TerminalSquare size={20} /><strong>Daytona sandbox</strong><span>Real isolated computation with deterministic input/output hashes</span></article>
            <article><Activity size={20} /><strong>141 trace events</strong><span>Persistent TrueForge session stopped at tool response required</span></article>
            <article><ShieldCheck size={20} /><strong>0 mutations</strong><span>Preview receipt sequence 1; containment never invoked</span></article>
          </div>
          <div className="hash-line"><span>CASE RECORD</span><code>sha256:a60d49152f0b0e67908214e1f2ad1ea99e295dff4e3f39a9f86e0511a85c96b8</code></div>
        </section>
      </main>

      <footer><div className="brand"><span className="brand-mark">R/</span><span>REVOKE</span></div><p>Live public evidence. Explicitly simulated commerce. Human-controlled action.</p><span>Agent Harness Hackathon · 2026</span></footer>

      {approvalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setApprovalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="approval-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={() => setApprovalOpen(false)}><X size={19} /></button>
            <span className="kicker">SIMULATED COMMERCE / EXACT SCOPE</span>
            <h2 id="approval-title">Approve containment preview?</h2>
            <p>This public demo records the decision locally in your browser. It does not call the write tool or change any real or simulated server state.</p>
            <div className="proposal-summary"><strong>4 SKUs · 312 units</strong><span>active / unheld → quarantined / held</span><code>26-717:containment:be1085358f92e9fe67edcbb7</code></div>
            <label htmlFor="approval-phrase">Type the exact approval phrase</label>
            <div className="copy-phrase">{approvalPhrase}</div>
            <input id="approval-phrase" value={approvalText} onChange={(event) => setApprovalText(event.target.value)} autoComplete="off" spellCheck="false" />
            <div className="modal-actions">
              <button className="button button--secondary" onClick={() => { setDecision("denied"); setApprovalOpen(false); }}>Deny</button>
              <button className="button button--danger" disabled={!approvalValid} onClick={() => { setDecision("recorded"); setApprovalOpen(false); }}>
                Record demo approval · no write
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Overview() {
  return (
    <div className="two-column">
      <article className="panel">
        <div className="panel-head"><span><GitCompareArrows size={18} /> Expansion diff</span><Badge tone="good">VERIFIED</Badge></div>
        <div className="diff-row"><span>Identifiers</span><strong>8</strong><ChevronRight size={16} /><strong>21</strong><em>+13</em></div>
        <div className="diff-row"><span>Units</span><strong>1.72M</strong><ChevronRight size={16} /><strong>3.63M</strong><em>+111%</em></div>
        <div className="diff-row"><span>Family scope</span><strong>None</strong><ChevronRight size={16} /><strong>Added</strong><em>NEW</em></div>
        <div className="unchanged"><Check size={15} /> Hazard and refund remedy unchanged</div>
      </article>
      <article className="panel">
        <div className="panel-head"><span><ShieldCheck size={18} /> Adversarial verifier</span><Badge tone="good">PASSED</Badge></div>
        <ul className="check-list">
          <li><Check size={15} /> Scraped text isolated as untrusted data</li>
          <li><Check size={15} /> Government-domain policy not bypassed</li>
          <li><Check size={15} /> Fuzzy collision excluded from targets</li>
          <li><Check size={15} /> Catalog re-read matched preview state</li>
        </ul>
      </article>
    </div>
  );
}

function Evidence() {
  return (
    <div className="evidence-list">
      {evidence.map((item) => (
        <a href={item.href} target="_blank" rel="noreferrer" className="evidence-item" key={item.tier}>
          <span className="evidence-tier">{item.tier}</span>
          <div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.tool} · {item.hash}</small></div>
          <ExternalLink size={18} />
        </a>
      ))}
      <div className="truth-note"><CircleAlert size={17} /><p><strong>Truth boundary:</strong> CPSC facts are live. Catalog, inventory, orders, customers, proposal, and audit events are explicitly simulated.</p></div>
    </div>
  );
}

function Matches() {
  return (
    <div className="match-layout">
      <div className="match-table">
        <div className="table-row table-head"><span>Simulated SKU</span><span>Evidence</span><span>Disposition</span></div>
        {exactMatches.map(([sku, model, lane]) => (
          <div className="table-row" key={sku}><code>{sku}</code><span>{model}</span><Badge tone="good">{lane}</Badge></div>
        ))}
      </div>
      <div className="manual-review">
        <Badge tone="warn">MANUAL REVIEW ONLY</Badge>
        <strong>CCB-395 ≈ CB-395</strong>
        <p>Similarity is not authority. Category mismatch blocks execution even at 0.909 fuzzy confidence.</p>
      </div>
    </div>
  );
}

function System() {
  const nodes = [
    ["Bright Data", "Discover + corroborate", Globe2],
    ["TrueForge", "Orchestrate + approve", Braces],
    ["Daytona", "Compute + hash", TerminalSquare],
    ["Commerce MCP", "Preview + receipt", Database],
  ] as const;
  return (
    <div className="system-flow">
      {nodes.map(([name, role, Icon], index) => (
        <React.Fragment key={name}>
          <div className="system-node"><Icon size={20} /><strong>{name}</strong><span>{role}</span></div>
          {index < nodes.length - 1 && <ChevronRight className="flow-arrow" size={20} />}
        </React.Fragment>
      ))}
      <div className="system-note"><LockKeyhole size={18} /> OpenAI runs inside TrueForge. Write tools remain policy-gated. Qodo is the merge/release gate once its repository credential is connected.</div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
