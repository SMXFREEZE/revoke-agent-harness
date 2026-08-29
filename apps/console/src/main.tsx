import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Beaker,
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileSearch,
  Fingerprint,
  FlaskConical,
  GitBranch,
  Globe2,
  Gavel,
  KeyRound,
  LockKeyhole,
  Play,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  ExperimentalApprovalRequestSchema,
  GaggleCandidateSchema,
  GaggleEvidenceSchema,
  JuryVoteSchema,
  analyzeJuryDisagreement,
  buildBeliefRevision,
  rankGaggleCandidates,
} from "@revoke/domain";
import caseFixture from "../../../fixtures/gaggle/case-0042.json";
import "../../gaggle/app/globals.css";
import "../../gaggle/app/reasonal.css";
import "../../gaggle/app/console.css";
import "./styles.css";

type Tab = "courtroom" | "evidence" | "experiment" | "jury" | "system";
type Decision = "pending" | "approved" | "rejected";

const initialCandidates = GaggleCandidateSchema.array().parse(caseFixture.initialCandidates);
const revisedCandidates = GaggleCandidateSchema.array().parse(caseFixture.revisedCandidates);
const evidence = GaggleEvidenceSchema.array().parse(caseFixture.evidence);
const jury = JuryVoteSchema.array().parse(caseFixture.jury);
const approval = ExperimentalApprovalRequestSchema.parse(caseFixture.approval);
const initialRanks = rankGaggleCandidates(initialCandidates);
const revisedRanks = rankGaggleCandidates(revisedCandidates);
const revision = buildBeliefRevision(
  initialCandidates,
  revisedCandidates,
  "Daytona competition analysis plus a Methodologist species-to-strain downgrade.",
);
const juryAnalysis = analyzeJuryDisagreement(jury);

const phases = [
  { label: "Plan", detail: "Chief Scientist", icon: BrainCircuit },
  { label: "Argue", detail: "Defense + Prosecution", icon: Scale },
  { label: "Retrieve", detail: "Bright Data", icon: Globe2 },
  { label: "Test", detail: "Daytona sandbox", icon: TerminalSquare },
  { label: "Challenge", detail: "Blind Red Team", icon: ShieldCheck },
  { label: "Revise", detail: "Leader changed", icon: GitBranch },
  { label: "Jury", detail: "5 independent votes", icon: Gavel },
  { label: "Approve", detail: "Scientist required", icon: KeyRound },
];

const activeEvents = [
  "Investigation ready",
  "Chief Scientist decomposing objective",
  "Defense and Prosecution searching independently",
  "Evidence Clerk validating provenance",
  "Experimentalist executing compatibility model",
  "Blind Red Team challenging the leader",
  "Belief state revised from new contradictory evidence",
  "Scientific jury classifying disagreement",
  "Stopped at scientist approval",
];

function App() {
  const [tab, setTab] = useState<Tab>("courtroom");
  const [step, setStep] = useState(phases.length);
  const [running, setRunning] = useState(false);
  const [challengeRound, setChallengeRound] = useState(false);
  const [decision, setDecision] = useState<Decision>("pending");
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalText, setApprovalText] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState(evidence[0]?.id ?? "");
  const approvalReturnFocusRef = useRef<HTMLElement | null>(null);

  const revised = step >= 6;
  const activeEvent = activeEvents[Math.min(step, activeEvents.length - 1)] ?? "Investigation ready";
  const approvalPhrase = `APPROVE ${approval.proposalId} ${approval.proposalHash}`;
  const approvalValid = approvalText.trim() === approvalPhrase;

  useEffect(() => {
    if (!running) return;
    if (step >= phases.length) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((current) => current + 1), 720);
    return () => window.clearTimeout(timer);
  }, [running, step]);

  const convene = () => {
    setDecision("pending");
    setChallengeRound(false);
    setTab("courtroom");
    setStep(0);
    setRunning(true);
    document.querySelector("#courtroom")?.scrollIntoView({ behavior: "smooth" });
  };

  const challenge = () => {
    setChallengeRound(true);
    setDecision("pending");
    setTab("courtroom");
    setStep(2);
    setRunning(true);
  };

  const openApproval = () => {
    approvalReturnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setApprovalOpen(true);
  };

  return (
    <div className="gg-page">
      <Header onConvene={convene} />

      <main id="top" className="rz">
        <Hero onConvene={convene} />
        <SponsorRail />
        <Courtroom
          tab={tab}
          setTab={setTab}
          step={step}
          running={running}
          revised={revised}
          activeEvent={activeEvent}
          challengeRound={challengeRound}
          decision={decision}
          selectedEvidence={selectedEvidence}
          setSelectedEvidence={setSelectedEvidence}
          onChallenge={challenge}
          onApproval={openApproval}
          onReject={() => setDecision("rejected")}
        />
        <PreservedProduct />
        <Proof />
      </main>

      <Footer />

      {approvalOpen && (
        <ApprovalModal
          phrase={approvalPhrase}
          value={approvalText}
          setValue={setApprovalText}
          valid={approvalValid}
          returnFocus={approvalReturnFocusRef.current}
          onClose={() => setApprovalOpen(false)}
          onReject={() => {
            setDecision("rejected");
            setApprovalOpen(false);
          }}
          onApprove={() => {
            setDecision("approved");
            setApprovalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Header({ onConvene }: { onConvene: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="rz-nav">
      <div className="rz-nav__inner">
        <a href="#top" className="rz-nav__logo gg-wordmark" aria-label="The Gaggle home">
          <span aria-hidden>THE</span> GAGGLE
        </a>
        <nav className="rz-nav__links" aria-label="Primary">
          <a href="#courtroom" className="rz-nav__link">Investigation</a>
          <a href="#metascope" className="rz-nav__link">MetaScope</a>
          <a href="#architecture" className="rz-nav__link">Architecture</a>
        </nav>
        <div className="rz-nav__actions">
          <button type="button" className="rz-nav__cta" onClick={onConvene}>
            <span>Convene the Gaggle</span>
          </button>
          <button
            type="button"
            className={`rz-nav__burger${open ? " is-open" : ""}`}
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
      {open && (
        <nav className="rz-nav__mobile" aria-label="Primary">
          <a href="#courtroom" className="rz-nav__mlink" onClick={() => setOpen(false)}>Investigation</a>
          <a href="#metascope" className="rz-nav__mlink" onClick={() => setOpen(false)}>MetaScope</a>
          <a href="#architecture" className="rz-nav__mlink" onClick={() => setOpen(false)}>Architecture</a>
          <button type="button" className="rz-nav__mlink rz-nav__mlink--cta" onClick={() => { setOpen(false); onConvene(); }}>
            Convene the Gaggle
          </button>
        </nav>
      )}
    </header>
  );
}

function Hero({ onConvene }: { onConvene: () => void }) {
  return (
    <section className="rz-hero">
      <div className="rz-hero__card gg-hero-card">
        <div className="gg-sky" aria-hidden><i /><i /><i /></div>
        <div className="rz-hero__inner">
          <span className="rz-hero__eyebrow">Adversarial microbiome R&amp;D · Case GGG-0042</span>
          <h1 className="rz-hero__title">
            One AI can convince itself.
            <br />
            <em className="rz-serif">Ours has to survive the Gaggle.</em>
          </h1>
          <p className="rz-hero__sub">
            Independent AI scientists argue, retrieve live evidence, run deterministic experiments,
            challenge the leader, revise their beliefs, and stop for a human scientist.
          </p>
          <div className="rz-hero__cta">
            <button type="button" className="rz-hero__btn rz-hero__btn--go" onClick={onConvene}>
              <Play size={17} fill="currentColor" /> Convene the Gaggle <span aria-hidden>→</span>
            </button>
            <a href="#metascope" className="rz-hero__btn rz-hero__btn--ghost">
              Keep the MetaScope product
            </a>
          </div>
          <div className="rz-hero__tags" aria-label="Core capabilities">
            {["Defense vs prosecution", "Bright Data evidence", "Daytona experiments", "Scientist approval"].map((tag) => (
              <span className="rz-hero__tag" key={tag}>{tag}</span>
            ))}
          </div>
          <div className="rz-phone gg-phone">
            <span className="rz-phone__notch" aria-hidden />
            <div className="rz-phone__screen">
              <video className="rz-phone__media" src="./hero/microbiome.mp4" poster="./hero/ai-microbiome.webp" autoPlay loop muted playsInline aria-hidden />
              <span className="rz-phone__glare" aria-hidden />
              <span className="gg-phone-status"><Activity size={12} /> 8 agents deliberating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SponsorRail() {
  return (
    <section className="rz-sec gg-sponsor-wrap" aria-label="Required sponsor stack">
      <div className="rz-card-w gg-sponsor-rail">
        <span>HARNESS BACKBONE</span><strong>TRUEFORGE</strong><i />
        <strong>OPENAI</strong><i /><strong>BRIGHT DATA</strong><i />
        <strong>DAYTONA</strong><i /><strong>QODO <small>PR REVIEW ACTIVE</small></strong>
      </div>
    </section>
  );
}

interface CourtroomProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  step: number;
  running: boolean;
  revised: boolean;
  activeEvent: string;
  challengeRound: boolean;
  decision: Decision;
  selectedEvidence: string;
  setSelectedEvidence: (id: string) => void;
  onChallenge: () => void;
  onApproval: () => void;
  onReject: () => void;
}

function Courtroom(props: CourtroomProps) {
  const status = props.running
    ? "DELIBERATING"
    : props.decision === "approved"
      ? "EXPERIMENTAL VALIDATION APPROVED"
      : props.decision === "rejected"
        ? "PROPOSAL REJECTED"
        : "SCIENTIST APPROVAL REQUIRED";
  return (
    <section className="rz-sec" id="courtroom">
      <div className="rz-card-w">
        <div className="cc gg-workbench">
          <div className="cc-bg" aria-hidden />
          <div className="gg-workbench__inner">
            <div className="gg-case-head">
              <div>
                <span className="kick">THE GAGGLE · CASE GGG-0042 · SYNTHETIC R&amp;D</span>
                <h2>Scientific courtroom</h2>
                <p>{caseFixture.objective}</p>
              </div>
              <div className={`gg-status ${props.running ? "is-live" : ""}`}><span />{status}</div>
            </div>

            <div className="gg-stage-grid" aria-label="Investigation timeline">
              {phases.map((phase, index) => {
                const complete = index < props.step;
                const current = index === props.step && props.running;
                const Icon = phase.icon;
                return (
                  <article className={`gg-stage ${complete ? "is-complete" : ""} ${current ? "is-current" : ""}`} key={phase.label}>
                    <span className="gg-stage__icon">{complete ? <Check size={15} /> : <Icon size={15} />}</span>
                    <span><strong>{phase.label}</strong><small>{phase.detail}</small></span>
                  </article>
                );
              })}
            </div>

            {props.revised && (
              <div className="gg-revision" role="status">
                <span className="gg-revision__spark"><Zap size={24} /></span>
                <div><span>VERDICT REVISION</span><strong>THE GAGGLE CHANGED ITS MIND</strong><small>{revision.reason}</small></div>
                <div className="gg-revision__rank"><b>A</b><span>#1</span><ArrowRight size={17} /><span>#3</span></div>
                <div className="gg-revision__rank"><b>B</b><span>#2</span><ArrowRight size={17} /><span>#1</span></div>
              </div>
            )}

            <nav className="gg-tabs" aria-label="Case views">
              {(["courtroom", "evidence", "experiment", "jury", "system"] as Tab[]).map((item) => (
                <button type="button" className={props.tab === item ? "is-active" : ""} onClick={() => props.setTab(item)} key={item}>{item}</button>
              ))}
            </nav>

            <div className="gg-panel-slot">
              {props.tab === "courtroom" && <CourtroomPanel revised={props.revised} activeEvent={props.activeEvent} running={props.running} />}
              {props.tab === "evidence" && <EvidencePanel selected={props.selectedEvidence} setSelected={props.setSelectedEvidence} />}
              {props.tab === "experiment" && <ExperimentPanel revised={props.revised} />}
              {props.tab === "jury" && <JuryPanel />}
              {props.tab === "system" && <SystemPanel />}
            </div>

            <div className="gg-action-row">
              <div>
                <span className="kick">SECOND ADVERSARIAL ROUND</span>
                <strong>{props.challengeRound && !props.running ? "Verdict survived an independent challenge." : "Think the jury is wrong? Trigger peer review on demand."}</strong>
              </div>
              <button type="button" className="gbtn ghost" onClick={props.onChallenge} disabled={props.running}><RefreshCw size={16} /> Challenge verdict</button>
            </div>

            <div className="gg-approval">
              <div className="gg-approval__icon"><LockKeyhole size={28} /></div>
              <div>
                <span className="kick">TRUEFORGE POLICY STOP</span>
                <h3>Scientist approval required.</h3>
                <p>Two synthetic candidates · four admitted evidence records · one sandbox experiment · two unresolved uncertainties. No clinical recommendation and no external action.</p>
              </div>
              <div className="gg-approval__actions">
                <button type="button" className="gbtn ghost" onClick={props.onReject} disabled={props.running || props.decision !== "pending"}>Reject</button>
                <button type="button" className="gbtn primary" onClick={props.onApproval} disabled={props.running || props.decision !== "pending"}><KeyRound size={16} /> Review exact proposal</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CourtroomPanel({ revised, activeEvent, running }: { revised: boolean; activeEvent: string; running: boolean }) {
  return (
    <div className="gg-courtroom-grid">
      <article className="gg-side gg-defense">
        <div className="gg-card-head"><span><ShieldCheck size={18} /> DEFENSE</span><b>{revised ? "0.46" : "0.78"}</b></div>
        <h3>Candidate A can seed a cross-feeding network.</h3>
        <ul>
          <li>Published in-vitro cross-feeding evidence admitted with exact scope.</li>
          <li>Strong initial pathway complementarity in the synthetic model.</li>
          <li>Contradictory evidence remains visible, never concealed.</li>
        </ul>
        <small>Query: {caseFixture.queryProvenance.defense}</small>
      </article>

      <article className="gg-active-event">
        <span className={running ? "gg-orbit is-running" : "gg-orbit"}><Bot size={34} /></span>
        <span className="kick">ACTIVE EVENT</span>
        <h3>{activeEvent}</h3>
        <p>{revised ? "New evidence and deterministic computation changed the leader. The earlier belief remains in history." : "Agents expose tool activity and structured arguments—not hidden chain-of-thought."}</p>
        <div className="gg-agent-row"><i>Defense</i><i>Prosecution</i><i>Methods</i><i>Experiment</i><i>Red Team</i></div>
      </article>

      <article className="gg-side gg-prosecution">
        <div className="gg-card-head"><span><Scale size={18} /> PROSECUTION</span><b>{revised ? "0.88" : "0.52"}</b></div>
        <h3>The hypothesis may collapse under substrate competition.</h3>
        <ul>
          <li>The exact synthetic strain has no direct human evidence.</li>
          <li>Species-level support cannot inherit strain-level weight.</li>
          <li>Falsifiable test: recompute with the observed competitor load.</li>
        </ul>
        <small>Query: {caseFixture.queryProvenance.prosecution}</small>
      </article>
    </div>
  );
}

function EvidencePanel({ selected, setSelected }: { selected: string; setSelected: (id: string) => void }) {
  const record = evidence.find((item) => item.id === selected) ?? evidence[0];
  return (
    <div className="gg-evidence-layout">
      <div className="gg-ledger">
        <div className="gg-card-head"><span><BookOpen size={18} /> CANONICAL EVIDENCE LEDGER</span><b>{evidence.length} admitted</b></div>
        {evidence.map((item) => (
          <button type="button" key={item.id} className={selected === item.id ? "is-active" : ""} onClick={() => setSelected(item.id)}>
            <span>{item.id}</span><strong>{item.claim}</strong><em>{item.direction}</em>
          </button>
        ))}
      </div>
      {record && (
        <article className="gg-provenance">
          <span className="kick">CLICKABLE PROVENANCE</span>
          <h3>{record.id}</h3>
          <p>{record.claim}</p>
          <dl>
            <div><dt>Scope</dt><dd>{record.scope.replaceAll("_", " ")}</dd></div>
            <div><dt>Class</dt><dd>{record.sourceType.replaceAll("_", " ")}</dd></div>
            <div><dt>Method flags</dt><dd>{record.methodologyFlags.join(" · ")}</dd></div>
          </dl>
          <a href={record.sourceUrl} target="_blank" rel="noreferrer">Open original PubMed record <ExternalLink size={15} /></a>
          <div className="gg-graph-mini" aria-label="Claim evidence graph">
            <span>Recommendation</span><ChevronRight size={14} /><span>Claim</span><ChevronRight size={14} /><span>{record.id}</span><ChevronRight size={14} /><span>PubMed</span>
          </div>
        </article>
      )}
    </div>
  );
}

function ExperimentPanel({ revised }: { revised: boolean }) {
  const rankings = revised ? revisedRanks : initialRanks;
  return (
    <div className="gg-experiment-grid">
      <article className="gg-terminal">
        <div className="gg-terminal__bar"><i /><i /><i /><span>daytona / exp-004.py</span></div>
        <pre>{`$ python exp-004.py --input case-0042.json
✓ inputs schema-valid
✓ sha256 06de0327…c18e2
✓ deterministic compatibility model v1
${revised ? "⚡ leader changed: candidate-a → candidate-b" : "✓ initial leader: candidate-a"}
✓ output sealed 97860d58…8f86f`}</pre>
        <small>Experimental R&amp;D compatibility model · not a validated biological simulator</small>
      </article>
      <article className="gg-ranking">
        <div className="gg-card-head"><span><FlaskConical size={18} /> REPRODUCIBLE RANKING</span><b>CODE, NOT PROSE</b></div>
        {rankings.map((rank) => {
          const candidate = revisedCandidates.find((item) => item.id === rank.candidateId);
          return (
            <div className="gg-rank-row" key={rank.candidateId}>
              <strong>#{rank.rank}</strong><span><b>{candidate?.label}</b><small>{candidate?.strain}</small></span><em>{rank.score}</em>
            </div>
          );
        })}
        <div className="gg-counterfactual"><ArrowDown size={16} /><span><b>Leave Candidate B out</b>Predicted pathway support 82 → 59</span><small>synthetic counterfactual</small></div>
      </article>
    </div>
  );
}

function JuryPanel() {
  return (
    <div className="gg-jury-layout">
      <div className="gg-jury-grid">
        {jury.map((vote) => (
          <article key={vote.judge} data-verdict={vote.verdict}>
            <span>{vote.judge}</span><strong>{vote.verdict}</strong><b>{vote.confidence.toFixed(2)}</b><small>{vote.priority}</small>
          </article>
        ))}
      </div>
      <article className="gg-disagreement">
        <span className="kick">DISAGREEMENT ANALYST</span>
        <h3>Jury disagreement: {juryAnalysis.level}</h3>
        <p>Primary disagreement: how much evidence below the exact-strain standard should influence an R&amp;D candidate decision.</p>
        <div><span>3 promising</span><span>1 uncertain</span><span>1 reject</span></div>
        <small>Confidence values are not averaged. The structure of disagreement is preserved.</small>
      </article>
    </div>
  );
}

function SystemPanel() {
  const nodes = [
    ["Bright Data", "Adversarial live retrieval", Globe2],
    ["TrueForge", "Persistent orchestration", BrainCircuit],
    ["OpenAI", "Scientific reasoning", Sparkles],
    ["Daytona", "Deterministic experiments", TerminalSquare],
    ["Human", "Exact proposal approval", KeyRound],
  ] as const;
  return (
    <div className="gg-system">
      {nodes.map(([name, role, Icon], index) => (
        <React.Fragment key={name}>
          <article><Icon size={22} /><strong>{name}</strong><span>{role}</span></article>
          {index < nodes.length - 1 && <ChevronRight size={18} className="gg-system__arrow" />}
        </React.Fragment>
      ))}
      <div className="gg-recovery"><CircleAlert size={17} /><span><b>Bright Data resilience fixture:</b> selector failed → schema rejected → repair applied → validation passed → persistent investigation continued.</span></div>
    </div>
  );
}

function PreservedProduct() {
  return (
    <section className="rz-sec" id="metascope">
      <div className="rz-card-w gg-product">
        <div>
          <span className="rz-hero__eyebrow">Original GutGutGoose product · preserved</span>
          <h2>MetaScope still turns a FASTQ into a patient-readable gut report.</h2>
          <p>The complete 349-file application, browser classifier, sample library, product components, imagery, and MCP server are imported unchanged under <code>apps/gaggle</code>. The Gaggle adds an R&amp;D deliberation layer; it does not delete the working report product.</p>
          <div className="rz-hero__cta gg-product__actions">
            <a className="rz-hero__btn rz-hero__btn--go" href="./samples/sample-shotgun-stool.fastq" download>Download synthetic FASTQ <ArrowDown size={16} /></a>
            <a className="rz-hero__btn rz-hero__btn--ghost" href="https://github.com/SMXFREEZE/revoke-agent-harness/tree/codex/revoke-vertical-slice/apps/gaggle" target="_blank" rel="noreferrer">Inspect imported product <ExternalLink size={15} /></a>
          </div>
        </div>
        <div className="gg-report-card">
          <span className="kick">METASCOPE · LIVE ENGINE</span>
          <div className="gg-score"><strong>78</strong><span>/ 100<br />synthetic gut score</span></div>
          <div className="gg-taxa"><i style={{ width: "82%" }} /><i style={{ width: "64%" }} /><i style={{ width: "48%" }} /><i style={{ width: "34%" }} /></div>
          <small>Original in-browser sequence engine and report UI retained in the imported app.</small>
        </div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="rz-sec" id="architecture">
      <div className="rz-card-w gg-proof">
        <span className="kick">WHY THIS IS NOT MULTI-PERSONA CHAT</span>
        <h2>Every disagreement becomes evidence, code, or a human decision.</h2>
        <div>
          <article><Users size={22} /><strong>8 bounded roles</strong><span>Least-privilege agents with independent missions</span></article>
          <article><Fingerprint size={22} /><strong>Append-only ledger</strong><span>Claims trace back to sources, experiments, and hashes</span></article>
          <article><Beaker size={22} /><strong>Deterministic model</strong><span>Scores run in Daytona; models never invent numbers</span></article>
          <article><FileSearch size={22} /><strong>Qodo release gate</strong><span>Public PR review, fixes, and follow-up evidence</span></article>
        </div>
      </div>
    </section>
  );
}

function ApprovalModal(props: {
  phrase: string;
  value: string;
  setValue: (value: string) => void;
  valid: boolean;
  returnFocus: HTMLElement | null;
  onClose: () => void;
  onReject: () => void;
  onApprove: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(props.onClose);

  useEffect(() => {
    onCloseRef.current = props.onClose;
  }, [props.onClose]);

  useEffect(() => {
    const background = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".gg-page > header, .gg-page > main, .gg-page > footer",
      ),
    );
    const priorState = background.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    for (const element of background) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }

    inputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || dialogRef.current === null) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.tabIndex >= 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (first === undefined || last === undefined) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      for (const { element, inert, ariaHidden } of priorState) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      props.returnFocus?.focus();
    };
  }, [props.returnFocus]);

  return (
    <div className="gg-modal-backdrop" role="presentation" onMouseDown={props.onClose}>
      <div ref={dialogRef} className="gg-modal" role="dialog" aria-modal="true" aria-labelledby="approval-title" aria-describedby="approval-description" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="gg-modal__close" aria-label="Close" onClick={props.onClose}><X size={18} /></button>
        <span className="kick">SYNTHETIC R&amp;D · EXACT SCOPE</span>
        <h2 id="approval-title">Approve experimental validation?</h2>
        <p id="approval-description">This public interface records the demo decision only in your browser. In the golden path, TrueForge gates the server-side MCP write for this exact id and hash. No treatment is recommended and no external system is changed.</p>
        <div className="gg-proposal-summary">
          <strong>Candidate B + Candidate C</strong>
          <span>Next validation: anaerobic coculture with targeted metabolomics</span>
          <code>{approval.proposalId}</code><code>{approval.proposalHash}</code>
        </div>
        <label htmlFor="approval-phrase">Type the exact immutable proposal phrase</label>
        <button type="button" className="gg-copy-phrase" onClick={() => props.setValue(props.phrase)}>{props.phrase}</button>
        <input ref={inputRef} id="approval-phrase" value={props.value} onChange={(event) => props.setValue(event.target.value)} autoComplete="off" spellCheck={false} />
        <div className="gg-modal__actions">
          <button type="button" className="gbtn ghost" onClick={props.onReject}>Reject</button>
          <button type="button" className="gbtn primary" disabled={!props.valid} onClick={props.onApprove}>Record scientist approval · demo only</button>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="gg-footer">
      <strong className="gg-wordmark"><span aria-hidden>THE</span> GAGGLE</strong>
      <p>The Gaggle · experimental microbiome R&amp;D prototype · synthetic cases only</p>
      <span>TrueForge · OpenAI · Bright Data · Daytona · Qodo</span>
    </footer>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
