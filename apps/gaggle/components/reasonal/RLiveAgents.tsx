"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LiveAction, LiveSnapshot } from "@/lib/trueforge-live-contract";
import { RWordReveal } from "./reveal";

const DEFAULT_OBJECTIVE = "Identify the most defensible synthetic consortium change for increasing predicted support of butyrate-producing pathways while preserving ecological compatibility.";
const STORAGE_KEY = "gaggle-live-session-v1";

type RuntimeStatus = { available: boolean; source?: string; sessionId?: string | null; error?: string };

function endpoint(): string {
  const configured = process.env.NEXT_PUBLIC_GAGGLE_LIVE_API?.trim();
  return configured ? `${configured.replace(/\/$/, "")}/api/trueforge` : "/api/trueforge";
}

async function callRuntime<T>(action: LiveAction, signal?: AbortSignal): Promise<T> {
  const response = await fetch(endpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
    cache: "no-store",
    signal,
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : `Live runtime request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }
  return payload as T;
}

function labelStatus(status: LiveSnapshot["status"]): string {
  if (status === "waiting_approval") return "Waiting for scientist";
  if (status === "complete") return "Investigation complete";
  if (status === "failed") return "Stopped safely";
  return "Agents working live";
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function RLiveAgents() {
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);
  const [busy, setBusy] = useState<"connect" | "start" | "decision" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exactApprovalChecked, setExactApprovalChecked] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const pollController = useRef<AbortController | null>(null);

  const applySnapshot = useCallback((next: LiveSnapshot) => {
    setSnapshot(next);
    setRuntime({ available: true, source: next.source, sessionId: next.sessionId });
    window.localStorage.setItem(STORAGE_KEY, next.sessionId);
    setError(null);
  }, []);

  const connect = useCallback(async (preferredSessionId?: string) => {
    setBusy("connect");
    try {
      const result = await callRuntime<LiveSnapshot | RuntimeStatus>({ action: "attach", sessionId: preferredSessionId });
      if ("mode" in result && result.mode === "live") applySnapshot(result);
      else setRuntime(result);
    } catch (connectError) {
      setRuntime({ available: false });
      setError(connectError instanceof Error ? connectError.message : "Could not connect to TrueForge.");
    } finally {
      setBusy(null);
    }
  }, [applySnapshot]);

  useEffect(() => {
    const controller = new AbortController();
    const remembered = window.localStorage.getItem(STORAGE_KEY) ?? undefined;
    async function bootstrap() {
      try {
        const status = await callRuntime<RuntimeStatus>({ action: "status" }, controller.signal);
        setRuntime(status);
        if (status.available && (remembered || status.sessionId)) await connect(remembered ?? status.sessionId ?? undefined);
      } catch (bootstrapError) {
        if (!controller.signal.aborted) {
          setRuntime({ available: false });
          setError(bootstrapError instanceof Error ? bootstrapError.message : "TrueForge is unavailable.");
        }
      }
    }
    void bootstrap();
    return () => controller.abort();
  }, [connect]);

  useEffect(() => {
    pollController.current?.abort();
    if (!snapshot || snapshot.status === "failed") return;
    const controller = new AbortController();
    pollController.current = controller;
    const interval = window.setInterval(() => {
      void callRuntime<LiveSnapshot>({ action: "poll", sessionId: snapshot.sessionId }, controller.signal)
        .then(applySnapshot)
        .catch((pollError: unknown) => {
          if (!controller.signal.aborted) setError(pollError instanceof Error ? pollError.message : "Live polling paused.");
        });
    }, snapshot.status === "running" ? 1800 : 5000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [applySnapshot, snapshot]);

  async function start() {
    setBusy("start");
    setError(null);
    setExactApprovalChecked(false);
    try {
      applySnapshot(await callRuntime<LiveSnapshot>({ action: "start", objective }));
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "The investigation could not start.");
    } finally {
      setBusy(null);
    }
  }

  async function decide(decision: "allow" | "deny") {
    const pending = snapshot?.pendingApproval;
    if (!snapshot || !pending || (decision === "allow" && !exactApprovalChecked)) return;
    setBusy("decision");
    setError(null);
    try {
      applySnapshot(await callRuntime<LiveSnapshot>({
        action: "decide",
        sessionId: snapshot.sessionId,
        turnId: pending.turnId,
        threadId: pending.threadId,
        toolCallId: pending.toolCallId,
        proposalId: pending.proposalId,
        proposalHash: pending.proposalHash,
        decision,
      }));
      setExactApprovalChecked(false);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "The decision could not be applied.");
    } finally {
      setBusy(null);
    }
  }

  const activeAgent = useMemo(() => {
    if (!snapshot) return null;
    return snapshot.agents.find((agent) => agent.id === selectedAgentId)
      ?? snapshot.agents.find((agent) => agent.status === "running")
      ?? snapshot.agents.at(-1)
      ?? null;
  }, [selectedAgentId, snapshot]);
  const currentEvent = snapshot?.events.at(-1) ?? null;

  return (
    <section className="rz-sec gaggle-live-section" id="agents">
      <div className="rz-card-w">
        <div className="rz-agents rz-agents--live">
          <div className="rz-agents__copy">
            <span className="kick" style={{ color: "#0e8fd0" }}>Live TrueForge product</span>
            <RWordReveal as="h2" className="rz-agents__title" text="Start it. Watch it work. Stay in control." />
            <p className="rz-agents__lead">This is the real persistent agent—not a recording. Enter a synthetic R&amp;D objective, watch independent specialists and sponsor tools execute, refresh safely, then approve or reject the exact guarded proposal.</p>
            <label className="gaggle-live__objective">
              <span>Synthetic investigation objective</span>
              <textarea value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={600} rows={5} disabled={busy !== null} />
            </label>
            <div className="gaggle-live__actions">
              <button type="button" className="gaggle-live__start" onClick={() => void start()} disabled={!runtime?.available || busy !== null || objective.trim().length < 20}>
                {busy === "start" ? "Launching agents…" : "Run live investigation"}
              </button>
              {runtime?.sessionId && !snapshot ? (
                <button type="button" className="gaggle-live__connect" onClick={() => void connect(runtime.sessionId ?? undefined)} disabled={busy !== null}>Reconnect session</button>
              ) : null}
            </div>
            <p className="rz-agents__note" role="status">
              <span className={`rz-agents__notedot ${runtime?.available ? "" : "is-offline"}`} aria-hidden />
              {runtime === null ? "Locating TrueForge…" : runtime.available ? "TrueForge connected · credentials stay server-side" : "Live runtime unavailable"}
            </p>
            {error ? <p className="gaggle-live__error" role="alert">{error}</p> : null}
          </div>

          <div className="gaggle-runtime gaggle-live rz-agents__beamcard" aria-live="polite" aria-busy={busy !== null || snapshot?.status === "running"}>
            {!snapshot ? (
              <div className="gaggle-live__empty">
                <span className="gaggle-live__orb" aria-hidden />
                <b>{runtime?.available ? "TrueForge is ready" : "Connecting to the harness"}</b>
                <p>{runtime?.available ? "Launch a fresh investigation or reconnect to the persistent golden session." : "The control plane will appear when the private runtime responds."}</p>
              </div>
            ) : (
              <>
                <header className="gaggle-live__head">
                  <div><span className={`gaggle-live__status is-${snapshot.status}`}><i aria-hidden />{labelStatus(snapshot.status)}</span><strong>TrueForge · live session</strong></div>
                  <code title={snapshot.sessionId}>{snapshot.sessionId}</code>
                </header>
                <dl className="gaggle-replay__metrics" aria-label="Live run totals">
                  <div><dt>Agents</dt><dd>{snapshot.metrics.agentCount}</dd></div>
                  <div><dt>Events</dt><dd>{snapshot.metrics.eventCount}</dd></div>
                  <div><dt>Tools</dt><dd>{snapshot.metrics.toolCallCount}</dd></div>
                  <div><dt>Bright Data</dt><dd>{snapshot.metrics.brightDataCount}</dd></div>
                  <div><dt>Daytona</dt><dd>{snapshot.metrics.daytonaCount}</dd></div>
                  <div><dt>Turns</dt><dd>{snapshot.metrics.turnCount}</dd></div>
                </dl>
                <div className="gaggle-replay__workspace gaggle-live__workspace">
                  <div className="gaggle-replay__agents">
                    <div className="gaggle-replay__columnhead"><span>Actual agent lifecycle</span><small>{snapshot.agents.filter((agent) => agent.status === "running").length} running</small></div>
                    <ul aria-label="Live TrueForge specialist lifecycle">
                      {snapshot.agents.length === 0 ? <li className="gaggle-live__queued">Chief Scientist is preparing bounded delegations…</li> : snapshot.agents.map((agent) => (
                        <li key={agent.id}>
                          <button type="button" className={activeAgent?.id === agent.id ? "is-active" : ""} onClick={() => setSelectedAgentId(agent.id)} aria-pressed={activeAgent?.id === agent.id}>
                            <i className={`is-${agent.status}`} aria-hidden />
                            <span><b>{agent.label}</b><small>{agent.id}</small></span>
                            <em>{agent.status}</em>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="gaggle-replay__events">
                    <div className="gaggle-replay__columnhead"><span>Live tool + event feed</span><small>auto reconnect</small></div>
                    {currentEvent ? (
                      <article className="gaggle-replay__current">
                        <div className="gaggle-replay__eventmeta"><span>#{currentEvent.sequence}</span><code>{currentEvent.type}</code><em>{formatTime(currentEvent.at)}</em></div>
                        <h3>{currentEvent.label}</h3><p>{currentEvent.detail}</p>
                        <div className="gaggle-replay__badges">{currentEvent.provider ? <span>{currentEvent.provider}</span> : null}{currentEvent.tool ? <code>{currentEvent.tool}</code> : null}</div>
                      </article>
                    ) : <div className="gaggle-live__feed-empty">First durable event is being written…</div>}
                    <ol className="gaggle-replay__feed" aria-label="Recent live events">
                      {snapshot.events.slice(-8).toReversed().map((event) => <li key={`${event.id}-${event.sequence}`}><div><span><i aria-hidden />#{event.sequence}</span><b>{event.label}</b><time dateTime={event.at}>{formatTime(event.at)}</time></div></li>)}
                    </ol>
                  </div>
                </div>
                <div className={`gaggle-live__approval ${snapshot.pendingApproval ? "is-pending" : ""}`}>
                  {snapshot.pendingApproval ? (
                    <>
                      <div className="gaggle-replay__approvalhead"><span><i aria-hidden />TrueForge stopped before write</span><strong>Synthetic R&amp;D record only</strong></div>
                      <p>The guarded MCP tool has not executed. Review the exact immutable target; rejecting produces zero promotion.</p>
                      <dl>
                        <div><dt>Operation</dt><dd><code>{snapshot.pendingApproval.operation}</code></dd></div>
                        <div><dt>Proposal ID</dt><dd><code>{snapshot.pendingApproval.proposalId}</code></dd></div>
                        <div className="is-wide"><dt>SHA-256</dt><dd><code>{snapshot.pendingApproval.proposalHash}</code></dd></div>
                      </dl>
                      <label className="gaggle-live__exact"><input type="checkbox" checked={exactApprovalChecked} onChange={(event) => setExactApprovalChecked(event.target.checked)} disabled={busy !== null} /><span>I approve this exact ID and SHA-256 for synthetic promotion.</span></label>
                      <div className="gaggle-live__decision-buttons">
                        <button type="button" className="is-reject" onClick={() => void decide("deny")} disabled={busy !== null}>Reject · zero mutation</button>
                        <button type="button" className="is-approve" onClick={() => void decide("allow")} disabled={!exactApprovalChecked || busy !== null}>{busy === "decision" ? "Submitting…" : "Approve exact proposal"}</button>
                      </div>
                    </>
                  ) : (
                    <div className="gaggle-live__approval-wait"><span><i aria-hidden />Approval boundary</span><p>{snapshot.status === "running" ? "The harness will stop here before any guarded proposal promotion." : "No consequential write is pending."}</p></div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
