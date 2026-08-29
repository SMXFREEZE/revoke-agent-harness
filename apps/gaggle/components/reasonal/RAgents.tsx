"use client";

import { useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/utils/base-path";
import { RWordReveal } from "./reveal";

type TraceAgent = {
  id: string;
  role: string;
  label: string;
  status: string;
  turn: string;
  startedAt: string;
  completedAt: string | null;
  toolCallCount: number;
};

type TraceEvent = {
  sequence: number;
  at: string;
  turn: string;
  type: string;
  label: string;
  agent?: string;
  provider?: string;
  tool?: string;
  status?: string;
  proposal?: { proposalId: string; proposalHash: string };
};

type TracePayload = {
  schemaVersion: 1;
  run: {
    id: string;
    sessionId: string;
    source: string;
    status: string;
    startedAt: string;
    updatedAt: string;
    exportedAt: string;
    hash: string;
  };
  summary: {
    eventCount: number;
    turnCount: number;
    continuationCount: number;
    recoveryCount: number;
    dynamicSubagentCount: number;
    completedAgentCount: number;
    erroredAgentCount: number;
    toolCallCount: number;
    toolResponseCount: number;
    brightData: { searchCount: number; scrapeCount: number };
    daytona: { sandboxCount: number; execCount: number };
    approval: {
      requiredCount: number;
      allowedCount: number;
      deniedCount: number;
      protocolViolationCount: number;
    };
  };
  approval: {
    status: string;
    proposal: { proposalId: string; proposalHash: string };
  };
  agents: TraceAgent[];
  timeline: TraceEvent[];
  artifacts: {
    caseCrate: { name: string; path: string; mediaType: string };
  };
};

type AgentReplayStatus = "queued" | "running" | "waiting" | "complete" | "failed";

const TRACE_PATH = "/runs/gaggle-0042/trace.json";
const SPEEDS = [0.5, 1, 2, 4, 8] as const;
const TIME_FORMATTER = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasNumberFields(value: unknown, fields: readonly string[]): value is Record<string, number> {
  return isRecord(value) && fields.every((field) => isNumber(value[field]));
}

function isProposal(value: unknown): value is { proposalId: string; proposalHash: string } {
  return isRecord(value)
    && typeof value.proposalId === "string"
    && typeof value.proposalHash === "string"
    && /^sha256:[a-f0-9]{64}$/.test(value.proposalHash);
}

function isTracePayload(value: unknown): value is TracePayload {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.run) || !isRecord(value.summary)) return false;
  const run = value.run;
  const summary = value.summary;
  if (!isRecord(summary.brightData) || !isRecord(summary.daytona) || !isRecord(summary.approval)) return false;
  if (!isRecord(value.approval) || !isProposal(value.approval.proposal)) return false;
  if (!isRecord(value.artifacts) || !isRecord(value.artifacts.caseCrate)) return false;
  if (!Array.isArray(value.agents) || !Array.isArray(value.timeline)) return false;

  const runStrings = ["id", "sessionId", "source", "status", "startedAt", "updatedAt", "exportedAt", "hash"] as const;
  const summaryNumbers = ["eventCount", "turnCount", "continuationCount", "recoveryCount", "dynamicSubagentCount", "completedAgentCount", "erroredAgentCount", "toolCallCount", "toolResponseCount"] as const;
  const caseCrate = value.artifacts.caseCrate;

  return runStrings.every((field) => typeof run[field] === "string")
    && run.source === "TrueForge"
    && /^sha256:[a-f0-9]{64}$/.test(String(run.hash))
    && summaryNumbers.every((field) => isNumber(summary[field]))
    && hasNumberFields(summary.brightData, ["searchCount", "scrapeCount"])
    && hasNumberFields(summary.daytona, ["sandboxCount", "execCount"])
    && hasNumberFields(summary.approval, ["requiredCount", "allowedCount", "deniedCount", "protocolViolationCount"])
    && typeof value.approval.status === "string"
    && typeof caseCrate.name === "string"
    && caseCrate.path === "case-crate.json"
    && caseCrate.mediaType === "application/json"
    && value.agents.every((agent) => isRecord(agent)
      && typeof agent.id === "string"
      && typeof agent.role === "string"
      && typeof agent.label === "string"
      && typeof agent.status === "string"
      && typeof agent.turn === "string"
      && typeof agent.startedAt === "string"
      && (agent.completedAt === null || typeof agent.completedAt === "string")
      && isNumber(agent.toolCallCount))
    && value.agents.length === summary.dynamicSubagentCount
    && value.timeline.every((event, index) => isRecord(event)
      && event.sequence === index + 1
      && typeof event.at === "string"
      && Number.isFinite(Date.parse(event.at))
      && typeof event.turn === "string"
      && typeof event.type === "string"
      && typeof event.label === "string"
      && (event.agent === undefined || typeof event.agent === "string")
      && (event.provider === undefined || typeof event.provider === "string")
      && (event.tool === undefined || typeof event.tool === "string")
      && (event.status === undefined || typeof event.status === "string")
      && (event.proposal === undefined || isProposal(event.proposal)));
}

function humanize(value: string): string {
  return value.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : TIME_FORMATTER.format(date);
}

function agentStatusAt(agent: TraceAgent, timeline: TraceEvent[], sequence: number): AgentReplayStatus {
  const started = timeline.find((event) => event.type === "agent.started" && event.agent === agent.label);
  const finished = timeline.find((event) => ["agent.completed", "agent.failed"].includes(event.type) && event.agent === agent.label);
  if (!started || sequence < started.sequence) return "queued";
  if (finished && sequence >= finished.sequence) return finished.type === "agent.failed" ? "failed" : "complete";
  return "running";
}

function isApprovalEvent(event: TraceEvent): boolean {
  const descriptor = `${event.type} ${event.status ?? ""} ${event.label} ${event.tool ?? ""}`.toLowerCase();
  return descriptor.includes("approval") || descriptor.includes("promote_experimental_proposal");
}

function isPendingApproval(event: TraceEvent): boolean {
  const descriptor = `${event.type} ${event.status ?? ""} ${event.label}`.toLowerCase();
  return (
    descriptor.includes("approval_required") ||
    descriptor.includes("approval required") ||
    descriptor.includes("awaiting approval") ||
    descriptor.includes("pending approval") ||
    descriptor.includes("approval requested") ||
    (isApprovalEvent(event) && (descriptor.includes("waiting") || descriptor.includes("pending")))
  );
}

export function RAgents() {
  const [trace, setTrace] = useState<TracePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(8);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setTrace(null);
    setError(null);
    setPlaying(false);

    async function loadTrace() {
      try {
        const response = await fetch(withBasePath(TRACE_PATH), {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Trace request failed with HTTP ${response.status}.`);

        const payload: unknown = await response.json();
        if (!isTracePayload(payload) || payload.timeline.length === 0) {
          throw new Error("The exported trace is empty or does not match the verified replay schema.");
        }

        setTrace(payload);
        setCursor(0);
        setSelectedAgentId(null);

        const autoplayRequested = new URLSearchParams(window.location.search).get("run") === "1";
        const motionIsReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setPlaying(autoplayRequested && !motionIsReduced && payload.timeline.length > 1);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "The verified trace could not be loaded.");
      }
    }

    void loadTrace();
    return () => controller.abort();
  }, [requestKey]);

  useEffect(() => {
    if (reducedMotion) setPlaying(false);
  }, [reducedMotion]);

  const timeline = trace?.timeline ?? [];
  const finalCursor = Math.max(0, timeline.length - 1);
  const currentEvent = timeline[cursor] ?? null;
  const currentSequence = currentEvent?.sequence ?? -1;

  useEffect(() => {
    if (!playing || timeline.length < 2) return;
    if (cursor >= finalCursor) {
      setPlaying(false);
      return;
    }

    const currentTime = new Date(timeline[cursor].at).valueOf();
    const nextTime = new Date(timeline[cursor + 1].at).valueOf();
    const recordedDelay = Number.isFinite(currentTime) && Number.isFinite(nextTime)
      ? Math.max(0, nextTime - currentTime)
      : 0;
    // Preserve the trace order and relative short gaps, while compressing real
    // reconnect pauses that lasted hours into a judge-operable replay.
    const replayDelay = Math.min(200, Math.max(60, recordedDelay / speed));
    const timer = window.setTimeout(() => {
      setCursor((position) => Math.min(position + 1, finalCursor));
    }, replayDelay);
    return () => window.clearTimeout(timer);
  }, [cursor, finalCursor, playing, speed, timeline]);

  const visibleEvents = useMemo(() => timeline.slice(0, cursor + 1), [cursor, timeline]);
  const recentEvents = visibleEvents.slice(-7);
  const latestApprovalEvent = useMemo(
    () => [...visibleEvents].reverse().find(isApprovalEvent) ?? null,
    [visibleEvents],
  );
  const pendingApproval = latestApprovalEvent
    && isPendingApproval(latestApprovalEvent)
    && trace?.approval.status === "waiting_for_scientist"
    ? latestApprovalEvent
    : null;
  const caseCrateHref = trace
    ? withBasePath(`/runs/gaggle-0042/${trace.artifacts.caseCrate.path}`)
    : undefined;

  const activeAgent = useMemo(() => {
    if (!trace) return null;
    const selected = trace.agents.find((agent) => agent.id === selectedAgentId);
    if (selected) return selected;
    return trace.agents.find((agent) => agent.label === currentEvent?.agent) ?? null;
  }, [currentEvent?.agent, selectedAgentId, trace]);

  function togglePlayback() {
    if (!trace || reducedMotion) return;
    if (cursor >= finalCursor) setCursor(0);
    setPlaying((isPlaying) => !isPlaying);
  }

  function restartReplay() {
    if (!trace) return;
    setCursor(0);
    setSelectedAgentId(null);
    setPlaying(!reducedMotion && timeline.length > 1);
  }

  function moveCursor(nextCursor: number) {
    setPlaying(false);
    setCursor(Math.min(finalCursor, Math.max(0, nextCursor)));
  }

  return (
    <section className="rz-sec" id="agents">
      <div className="rz-card-w">
        <div className="rz-agents rz-agents--replay">
          <div className="rz-agents__copy">
            <span className="kick" style={{ color: "#0e8fd0" }}>The agent courtroom</span>
            <RWordReveal as="h2" className="rz-agents__title" text="12 agents. One belief that changed." />
            <p className="rz-agents__lead">Replay the exported <b>TrueForge</b> event stream: independent <b>Bright Data</b> retrieval, deterministic <b>Daytona</b> execution, adversarial revision, preserved dissent, and the exact scientist approval boundary.</p>
            <p className="rz-agents__note">
              <span className="rz-agents__notedot" aria-hidden />
              {trace ? <><span>Verified run</span><code>{trace.run.id}</code></> : <span>Loading verified run</span>}
            </p>
            {reducedMotion ? (
              <p className="gaggle-replay__motion-note" role="status">Reduced motion is enabled. Replay remains available through the step and scrub controls.</p>
            ) : null}
          </div>

          <div className="gaggle-runtime gaggle-replay rz-agents__beamcard" aria-busy={!trace && !error}>
            {!trace && !error ? (
              <div className="gaggle-replay__state" role="status" aria-live="polite">
                <span className="rz-rep__spin" aria-hidden />
                <b>Loading the signed event trace</b>
                <small>No agent state is simulated in the browser.</small>
              </div>
            ) : null}

            {error ? (
              <div className="gaggle-replay__state gaggle-replay__state--error" role="alert">
                <b>Verified replay unavailable</b>
                <p>{error}</p>
                <button type="button" onClick={() => setRequestKey((key) => key + 1)}>Retry trace</button>
              </div>
            ) : null}

            {trace ? (
              <>
                <div className="gaggle-replay__head">
                  <div>
                    <span className={`gaggle-replay__runstatus is-${trace.run.status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                      <i aria-hidden />{humanize(trace.run.status)}
                    </span>
                    <strong>{trace.run.source} &middot; {trace.run.id}</strong>
                  </div>
                  <div className="gaggle-replay__identity">
                    <code>{trace.run.sessionId}</code>
                    <span title={trace.run.hash}>integrity {trace.run.hash.slice(0, 17)}&hellip;</span>
                  </div>
                </div>

                <dl className="gaggle-replay__metrics" aria-label="Verified run totals">
                  <div><dt>Agents</dt><dd>{trace.summary.dynamicSubagentCount}</dd></div>
                  <div><dt>Events</dt><dd>{trace.summary.eventCount}</dd></div>
                  <div><dt>Tool calls</dt><dd>{trace.summary.toolCallCount}</dd></div>
                  <div><dt>Bright Data</dt><dd>{trace.summary.brightData.searchCount + trace.summary.brightData.scrapeCount}</dd></div>
                  <div><dt>Daytona</dt><dd>{trace.summary.daytona.sandboxCount}</dd></div>
                  <div><dt>Approvals</dt><dd>{trace.summary.approval.requiredCount}</dd></div>
                </dl>

                <div className="gaggle-replay__transport" aria-label="Replay controls">
                  <div className="gaggle-replay__buttons">
                    <button type="button" onClick={restartReplay} aria-label="Restart verified replay" title="Restart">
                      <span aria-hidden>&#8634;</span><span>Restart</span>
                    </button>
                    <button type="button" onClick={() => moveCursor(cursor - 1)} disabled={cursor === 0} aria-label="Previous event" title="Previous event">
                      <span aria-hidden>&larr;</span>
                    </button>
                    <button
                      type="button"
                      className="gaggle-replay__play"
                      onClick={togglePlayback}
                      disabled={reducedMotion}
                      aria-label={playing ? "Pause verified replay" : cursor >= finalCursor ? "Replay verified run" : "Play verified replay"}
                      aria-pressed={playing}
                    >
                      <span aria-hidden>{playing ? "Ⅱ" : "▶"}</span>
                      <span>{playing ? "Pause" : cursor >= finalCursor ? "Replay" : "Play"}</span>
                    </button>
                    <button type="button" onClick={() => moveCursor(cursor + 1)} disabled={cursor >= finalCursor} aria-label="Next event" title="Next event">
                      <span aria-hidden>&rarr;</span>
                    </button>
                  </div>
                  <label className="gaggle-replay__speed">
                    <span>Speed</span>
                    <select value={speed} onChange={(event) => setSpeed(Number(event.target.value) as (typeof SPEEDS)[number])}>
                      {SPEEDS.map((option) => <option key={option} value={option}>{option}&times;</option>)}
                    </select>
                  </label>
                </div>

                <div className="gaggle-replay__scrub">
                  <label htmlFor="gaggle-replay-range">
                    <span>Event {cursor + 1} of {timeline.length}</span>
                    <time dateTime={currentEvent?.at}>{currentEvent ? formatTime(currentEvent.at) : ""}</time>
                  </label>
                  <input
                    id="gaggle-replay-range"
                    type="range"
                    min="0"
                    max={finalCursor}
                    step="1"
                    value={cursor}
                    onChange={(event) => moveCursor(Number(event.target.value))}
                    aria-valuetext={currentEvent ? `Event ${cursor + 1}: ${currentEvent.label}` : undefined}
                    style={{ "--gaggle-progress": `${finalCursor === 0 ? 100 : (cursor / finalCursor) * 100}%` } as React.CSSProperties}
                  />
                </div>

                <div className="gaggle-replay__workspace">
                  <div className="gaggle-replay__agents">
                    <div className="gaggle-replay__columnhead"><span>Agent lifecycle</span><small>sequence {currentSequence}</small></div>
                    <ul aria-label="TrueForge specialist lifecycle">
                      {trace.agents.map((agent) => {
                        const replayStatus = agentStatusAt(agent, timeline, currentSequence);
                        const isActive = activeAgent?.id === agent.id;
                        return (
                          <li key={agent.id}>
                            <button
                              type="button"
                              className={isActive ? "is-active" : ""}
                              onClick={() => setSelectedAgentId(agent.id)}
                              aria-pressed={isActive}
                            >
                              <i className={`is-${replayStatus}`} aria-hidden />
                              <span><b>{agent.label}</b><small>{agent.role} &middot; {agent.toolCallCount} tools</small></span>
                              <em>{replayStatus}</em>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="gaggle-replay__events">
                    <div className="gaggle-replay__columnhead"><span>Current event + tool feed</span><small aria-live="polite">{playing ? "replaying" : "paused"}</small></div>
                    {currentEvent ? (
                      <article className="gaggle-replay__current" aria-live="polite" aria-atomic="true">
                        <div className="gaggle-replay__eventmeta">
                          <span>{humanize(currentEvent.type)}</span>
                          <code>#{currentEvent.sequence}</code>
                          {currentEvent.status ? <em>{humanize(currentEvent.status)}</em> : null}
                        </div>
                        <h3>{currentEvent.label}</h3>
                        <p>{currentEvent.turn} &middot; recorded {formatTime(currentEvent.at)}</p>
                        <div className="gaggle-replay__badges">
                          {currentEvent.agent ? <span>{currentEvent.agent}</span> : null}
                          {currentEvent.provider ? <span>{currentEvent.provider}</span> : null}
                          {currentEvent.tool ? <code>{currentEvent.tool}</code> : null}
                        </div>
                      </article>
                    ) : null}

                    <ol className="gaggle-replay__feed" aria-label="Recent verified events">
                      {recentEvents.map((event, index) => {
                        const eventCursor = visibleEvents.length - recentEvents.length + index;
                        return (
                          <li key={`${event.sequence}-${event.type}-${event.at}`} className={eventCursor === cursor ? "is-current" : ""}>
                            <button type="button" onClick={() => moveCursor(eventCursor)} aria-label={`Go to event ${event.sequence}: ${event.label}`}>
                              <span><i aria-hidden />#{event.sequence}</span>
                              <b>{event.label}</b>
                              <time dateTime={event.at}>{formatTime(event.at)}</time>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>

                <div className={`gaggle-replay__approval ${pendingApproval ? "is-pending" : ""}`}>
                  <div className="gaggle-replay__approvalhead">
                    <span><i aria-hidden />{pendingApproval ? "Waiting for scientist approval" : "Scientist approval boundary"}</span>
                    <a href={caseCrateHref} download>{trace.artifacts.caseCrate.name}</a>
                  </div>
                  {pendingApproval ? (
                    <>
                      <p>{pendingApproval.label}</p>
                      <dl>
                        <div><dt>Immutable proposal ID</dt><dd><code>{trace.approval.proposal.proposalId}</code></dd></div>
                        <div><dt>SHA-256</dt><dd><code>{trace.approval.proposal.proposalHash}</code></dd></div>
                      </dl>
                      <small>No approve control exists in this replay. The guarded write can only resume inside the persistent TrueForge session.</small>
                    </>
                  ) : (
                    <p>The verified replay has not reached an approval request at this event. Continue or scrub forward to inspect the exact immutable boundary.</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
