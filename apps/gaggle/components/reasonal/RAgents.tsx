"use client";

import { useState } from "react";
import { RWordReveal } from "./reveal";

type AgentKey = "defense" | "prosecution" | "evidence" | "method" | "experiment" | "red-team" | "jury" | "dissent";

const AGENTS: ReadonlyArray<{
  key: AgentKey;
  name: string;
  tool: string;
  status: "complete" | "waiting";
  detail: string;
}> = [
  { key: "defense", name: "Defense", tool: "OpenAI + Bright Data", status: "complete", detail: "Built the strongest typed case for all three candidate consortia using its own evidence queries." },
  { key: "prosecution", name: "Prosecution", tool: "OpenAI + Bright Data", status: "complete", detail: "Found scope-transfer weaknesses and contradictory evidence that pushed Candidate A from #1 to #3." },
  { key: "evidence", name: "Evidence Clerk", tool: "Bright Data", status: "complete", detail: "Locked direct URLs, retrieval times, source classes, biological scope, method flags, and content identities." },
  { key: "method", name: "Methodologist", tool: "OpenAI", status: "complete", detail: "Down-weighted in-vitro and species-level claims that could not support exact-strain or human-efficacy conclusions." },
  { key: "experiment", name: "Experimentalist", tool: "Daytona", status: "complete", detail: "Executed deterministic compatibility and counterfactual code; the model never authored the displayed scores." },
  { key: "red-team", name: "Blind Red Team", tool: "OpenAI", status: "complete", detail: "Attacked the revised leader without seeing the preferred outcome and sent unresolved objections to the jury." },
  { key: "jury", name: "Five jurors", tool: "TrueForge subagents", status: "complete", detail: "Returned five individual structured verdicts. Their confidence values remain separate rather than averaged." },
  { key: "dissent", name: "Disagreement analyst", tool: "TrueForge", status: "waiting", detail: "Classified the remaining dissent and handed an immutable proposal to the human scientist approval boundary." },
];

export function RAgents() {
  const [selected, setSelected] = useState<AgentKey>("prosecution");
  const active = AGENTS.find((agent) => agent.key === selected) ?? AGENTS[0];

  return (
    <section className="rz-sec" id="agents">
      <div className="rz-card-w">
        <div className="rz-agents">
          <div className="rz-agents__copy">
            <span className="kick" style={{ color: "#0e8fd0" }}>The agent courtroom</span>
            <RWordReveal as="h2" className="rz-agents__title" text="Eight specialists. One belief that changed." />
            <p className="rz-agents__lead">This verified golden run resumed a persistent <b>TrueForge</b> case, used independent <b>Bright Data</b> evidence, executed deterministic scoring in <b>Daytona</b>, and preserved every revision and dissent before stopping for a scientist.</p>
            <p className="rz-agents__note">
              <span className="rz-agents__notedot" aria-hidden />
              Golden run <code>01m17kj6cy2prqvxret528beb4</code>
            </p>
          </div>

          <div className="gaggle-runtime rz-agents__beamcard">
            <div className="gaggle-runtime__head">
              <span><i aria-hidden /> Verified golden run</span>
              <code>CASE GGG-0042</code>
            </div>

            <div className="gaggle-runtime__revision" aria-label="Belief revision">
              <div><b>Candidate A</b><span>#1</span><em aria-hidden>&rarr;</em><strong>#3</strong></div>
              <div className="is-leader"><b>Candidate B</b><span>#2</span><em aria-hidden>&rarr;</em><strong>#1</strong></div>
            </div>

            <div className="gaggle-runtime__grid">
              <div className="gaggle-runtime__list" role="list" aria-label="Specialist agents">
                {AGENTS.map((agent) => (
                  <button
                    type="button"
                    className={agent.key === selected ? "is-active" : ""}
                    onClick={() => setSelected(agent.key)}
                    aria-pressed={agent.key === selected}
                    key={agent.key}
                  >
                    <i className={`is-${agent.status}`} aria-hidden />
                    <span>{agent.name}</span>
                    <small>{agent.status === "complete" ? "done" : "waiting"}</small>
                  </button>
                ))}
              </div>

              <div className="gaggle-runtime__detail" aria-live="polite">
                <span className="gaggle-runtime__tool">{active.tool}</span>
                <h3>{active.name}</h3>
                <p>{active.detail}</p>
              </div>
            </div>

            <div className="gaggle-runtime__approval">
              <span><i aria-hidden /> Waiting for scientist approval</span>
              <code>sha256:fa33575d&hellip;525a8b</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
