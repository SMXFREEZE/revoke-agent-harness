/* global URL */

const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

const AGENT_LABELS = new Map(
  [
    ["defense", ["defense", "Defense"]],
    ["prosecution", ["prosecution", "Prosecution"]],
    ["methodologist", ["methodologist", "Methodologist"]],
    ["evidence clerk", ["evidence_clerk", "Evidence Clerk"]],
    ["experimentalist", ["experimentalist", "Experimentalist"]],
    ["blind red team", ["red_team", "Blind Red Team"]],
    ["juror mechanistic rigor", ["juror_mechanistic_rigor", "Juror: Mechanistic rigor"]],
    ["juror human evidence", ["juror_human_evidence", "Juror: Human evidence"]],
    ["juror ecological compatibility", ["juror_ecological_compatibility", "Juror: Ecological compatibility"]],
    [
      "juror methodological conservatism",
      ["juror_methodological_conservatism", "Juror: Methodological conservatism"],
    ],
    ["juror balanced evidence", ["juror_balanced_evidence", "Juror: Balanced evidence"]],
    ["disagreement analyst", ["disagreement_analyst", "Disagreement Analyst"]],
  ].map(([key, value]) => [key, value]),
);

const TOOL_DEFINITIONS = new Map(
  [
    ["search_engine", ["search_engine", "Bright Data", "Search live evidence"]],
    ["scrape_as_markdown", ["scrape_as_markdown", "Bright Data", "Extract source evidence"]],
    ["get_synthetic_case", ["get_synthetic_case", "Gaggle Lab MCP", "Read synthetic case"]],
    [
      "preview_experimental_proposal",
      ["preview_experimental_proposal", "Gaggle Lab MCP", "Preview immutable proposal"],
    ],
    [
      "promote_experimental_proposal",
      ["promote_experimental_proposal", "Gaggle Lab MCP", "Request proposal promotion"],
    ],
    [
      "get_investigation_audit",
      ["get_investigation_audit", "Gaggle Lab MCP", "Read investigation audit"],
    ],
    ["exec", ["sandbox.exec", "Daytona", "Execute deterministic experiment"]],
    ["create_sub_agent", ["create_sub_agent", "TrueForge", "Delegate specialist investigation"]],
    ["list_tools", ["list_tools", "TrueForge", "Discover available tools"]],
    ["get_tool_info", ["get_tool_info", "TrueForge", "Load tool contract"]],
    ["get_current_datetime", ["get_current_datetime", "TrueForge", "Read current time"]],
  ].map(([key, value]) => [key, value]),
);

const CONNECTOR_LABELS = new Map([
  ["bright-data", "Bright Data"],
  ["gaggle-lab", "Gaggle Lab MCP"],
]);

const FORBIDDEN_ARTIFACT_KEYS = new Set([
  "apiKey",
  "api_key",
  "arguments",
  "authorization",
  "command",
  "commands",
  "content",
  "input",
  "output",
  "raw",
  "refreshToken",
  "refresh_token",
  "result",
  "sandboxId",
  "sandbox_id",
  "secret",
  "token",
  "accessToken",
  "access_token",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value) {
  return isRecord(value) ? value : undefined;
}

function asString(value) {
  return typeof value === "string" ? value : undefined;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseJsonRecord(value) {
  if (isRecord(value)) return value;
  if (typeof value !== "string" || value.length > 100_000) return undefined;
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return undefined;
  }
}

function normalizeTimestamp(value, label = "event timestamp") {
  if (typeof value !== "string" || !ISO_TIMESTAMP_PATTERN.test(value)) {
    throw new Error(`${label} must be an ISO-8601 timestamp.`);
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) {
    throw new Error(`${label} is not a valid timestamp.`);
  }
  return new Date(milliseconds).toISOString();
}

function safeSessionId(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9._-]{1,64}$/.test(value)) {
    throw new Error("TrueForge session id is invalid.");
  }
  return value;
}

function safeProposal(value) {
  const record = asRecord(value);
  if (!record) return undefined;
  const proposalId = asString(record.proposalId ?? record.proposal_id);
  const proposalHash = asString(record.proposalHash ?? record.proposal_hash);
  if (!proposalId || !SAFE_ID_PATTERN.test(proposalId) || !proposalHash || !HASH_PATTERN.test(proposalHash)) {
    return undefined;
  }
  return { proposalId, proposalHash };
}

function safeAgentDefinition(value) {
  const normalized = asString(value)?.trim().toLowerCase();
  const definition = normalized ? AGENT_LABELS.get(normalized) : undefined;
  if (!definition) return { role: "specialist", label: "Specialist agent" };
  return { role: definition[0], label: definition[1] };
}

function safeToolDefinition(name) {
  const definition = typeof name === "string" ? TOOL_DEFINITIONS.get(name) : undefined;
  if (!definition) return undefined;
  return { tool: definition[0], provider: definition[1], label: definition[2] };
}

function safeToolCall(value) {
  const call = asRecord(value);
  const fn = asRecord(call?.function);
  const callId = asString(call?.id);
  let functionName = asString(fn?.name) ?? asString(call?.name);
  let parsedArguments = parseJsonRecord(fn?.arguments ?? call?.arguments);

  if (functionName === "call_tool") {
    functionName = asString(
      parsedArguments?.tool_name ?? parsedArguments?.toolName ?? parsedArguments?.name,
    );
    parsedArguments = parseJsonRecord(
      parsedArguments?.input ??
        parsedArguments?.arguments ??
        parsedArguments?.tool_arguments ??
        parsedArguments?.toolArguments,
    );
  }

  const definition = safeToolDefinition(functionName);
  if (!callId || !definition) return undefined;
  return {
    callId,
    ...definition,
    ...(definition.tool === "promote_experimental_proposal"
      ? { proposal: safeProposal(parsedArguments) }
      : {}),
  };
}

function rawEventKey(item) {
  const event = asRecord(item?.event);
  const turnId = asString(item?.turn_id);
  const eventId = asString(event?.id);
  if (!turnId || !eventId) {
    throw new Error("Every TrueForge session event must have a turn id and event id.");
  }
  return `${turnId}:${eventId}`;
}

function rawEventTimestamp(item) {
  return normalizeTimestamp(asRecord(item?.event)?.created_at);
}

export function orderAndDedupeSessionEvents(items) {
  if (!Array.isArray(items)) throw new Error("TrueForge session events must be an array.");
  const unique = new Map();
  for (const item of items) {
    if (!isRecord(item) || !isRecord(item.event)) {
      throw new Error("TrueForge returned a malformed session event.");
    }
    const key = rawEventKey(item);
    const existing = unique.get(key);
    if (existing && JSON.stringify(existing) !== JSON.stringify(item)) {
      throw new Error(`TrueForge returned conflicting duplicate event ${key}.`);
    }
    if (!existing) unique.set(key, item);
  }
  return [...unique.values()].sort((left, right) => {
    const timeOrder = rawEventTimestamp(left).localeCompare(rawEventTimestamp(right));
    if (timeOrder !== 0) return timeOrder;
    return rawEventKey(left).localeCompare(rawEventKey(right));
  });
}

export function assertLoopbackBaseUrl(value) {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("TrueForge export is restricted to an uncredentialed loopback HTTP URL.");
  }
  return url.toString().replace(/\/$/, "");
}

export async function fetchAllSessionEvents({
  baseUrl = "http://localhost:8790",
  sessionId,
  fetchImpl,
  pageSize = 100,
}) {
  const safeBaseUrl = assertLoopbackBaseUrl(baseUrl);
  const safeId = safeSessionId(sessionId);
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required.");
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("TrueForge event page size must be between 1 and 100.");
  }

  const events = [];
  const seenTokens = new Set();
  let pageToken;
  for (let page = 0; page < 100; page += 1) {
    const url = new URL(
      `${safeBaseUrl}/api/v1/sessions/${encodeURIComponent(safeId)}/events`,
    );
    url.searchParams.set("limit", String(pageSize));
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      redirect: "error",
    });
    if (!response?.ok) {
      const status = Number.isInteger(response?.status) ? response.status : "unknown";
      throw new Error(`TrueForge session event request failed with HTTP ${status}.`);
    }
    const body = await response.json();
    if (!isRecord(body) || !Array.isArray(body.data) || !isRecord(body.pagination)) {
      throw new Error("TrueForge returned an invalid paginated event response.");
    }
    events.push(...body.data);

    const nextPageToken = asString(body.pagination.next_page_token);
    if (!nextPageToken) return orderAndDedupeSessionEvents(events);
    if (seenTokens.has(nextPageToken)) {
      throw new Error("TrueForge repeated an event pagination token.");
    }
    seenTokens.add(nextPageToken);
    pageToken = nextPageToken;
  }
  throw new Error("TrueForge event pagination exceeded the 100-page safety limit.");
}

function buildTurnMap(orderedEvents) {
  const turnIds = [];
  for (const item of orderedEvents) {
    if (!turnIds.includes(item.turn_id)) turnIds.push(item.turn_id);
  }
  return new Map(turnIds.map((turnId, index) => [turnId, `turn-${index + 1}`]));
}

function buildAgents(orderedEvents, turnMap) {
  const agents = new Map();
  for (const item of orderedEvents) {
    const event = item.event;
    const threadId = asString(event.thread_id);
    if (!threadId) continue;
    if (event.type === "thread.created") {
      const agentInfo = asRecord(event.agent_info);
      const definition = safeAgentDefinition(agentInfo?.name ?? event.title);
      if (!agents.has(threadId)) {
        agents.set(threadId, {
          _threadId: threadId,
          role: definition.role,
          label: definition.label,
          status: "running",
          turn: turnMap.get(item.turn_id) ?? "turn-unknown",
          startedAt: normalizeTimestamp(event.created_at),
          completedAt: null,
          toolCallCount: 0,
        });
      }
    }
    if (event.type === "thread.done") {
      const existing = agents.get(threadId);
      if (existing) {
        existing.status = asRecord(event.state)?.status === "done" ? "complete" : "error";
        existing.completedAt = normalizeTimestamp(event.created_at);
      }
    }
  }

  return [...agents.values()]
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt) || left.label.localeCompare(right.label))
    .map((agent, index) => ({ ...agent, id: `agent-${String(index + 1).padStart(2, "0")}` }));
}

function buildToolCallMap(orderedEvents) {
  const calls = new Map();
  let rawToolCallCount = 0;
  for (const item of orderedEvents) {
    if (item.event.type !== "model.message") continue;
    for (const value of asArray(item.event.tool_calls)) {
      rawToolCallCount += 1;
      const call = safeToolCall(value);
      if (call) calls.set(call.callId, call);
    }
  }
  return { calls, rawToolCallCount };
}

function timelineEntry({ at, turn, type, label, agent, provider, tool, status, proposal }) {
  return {
    at,
    turn,
    type,
    label,
    ...(agent ? { agent } : {}),
    ...(provider ? { provider } : {}),
    ...(tool ? { tool } : {}),
    ...(status ? { status } : {}),
    ...(proposal ? { proposal } : {}),
  };
}

export function projectTrueForgeRun(items, { sessionId, runId = "gaggle-0042" }) {
  const orderedEvents = orderAndDedupeSessionEvents(items);
  if (orderedEvents.length === 0) throw new Error("TrueForge session has no events.");
  const safeId = safeSessionId(sessionId);
  const turnMap = buildTurnMap(orderedEvents);
  const agentsWithPrivateIds = buildAgents(orderedEvents, turnMap);
  const agentByThread = new Map(agentsWithPrivateIds.map((agent) => [agent._threadId, agent]));
  const { calls, rawToolCallCount } = buildToolCallMap(orderedEvents);
  const explicitDecisions = new Map();
  const pendingApprovals = new Map();
  const seenApprovalRequirements = new Set();
  const timeline = [];
  const turnStates = new Map();
  let continuationCount = 0;
  let recoveryCount = 0;
  let toolResponseCount = 0;
  let brightDataSearchCount = 0;
  let brightDataScrapeCount = 0;
  let daytonaSandboxCount = 0;
  let daytonaExecCount = 0;
  let approvalRequiredCount = 0;
  let approvalAllowedCount = 0;
  let approvalDeniedCount = 0;
  let approvalProtocolViolationCount = 0;

  const push = (entry) => timeline.push(entry);

  for (const item of orderedEvents) {
    const event = item.event;
    const at = normalizeTimestamp(event.created_at);
    const turn = turnMap.get(item.turn_id) ?? "turn-unknown";
    const agent = agentByThread.get(asString(event.thread_id));

    if (event.type === "turn.created") {
      const previousTurnId = asString(event.previous_turn_id);
      const previousTurn = previousTurnId ? turnMap.get(previousTurnId) : undefined;
      if (previousTurnId) {
        continuationCount += 1;
        if (["cancelled", "error"].includes(turnStates.get(previousTurnId))) recoveryCount += 1;
      }
      turnStates.set(item.turn_id, "running");
      push(
        timelineEntry({
          at,
          turn,
          type: previousTurn ? "turn.resumed" : "turn.started",
          label: previousTurn ? `${turn} resumed from ${previousTurn}` : `${turn} started`,
          status: "running",
        }),
      );

      for (const input of asArray(event.input)) {
        if (!isRecord(input) || input.type !== "user.tool_approval") continue;
        const callId = asString(input.tool_call_id);
        const decision = asString(asRecord(input.approval)?.status);
        const call = callId ? calls.get(callId) : undefined;
        if (!callId || !call || !seenApprovalRequirements.has(callId)) {
          approvalProtocolViolationCount += 1;
          continue;
        }
        if (decision !== "allow" && decision !== "deny") {
          approvalProtocolViolationCount += 1;
          continue;
        }
        explicitDecisions.set(callId, decision);
        pendingApprovals.delete(callId);
        if (decision === "allow") approvalAllowedCount += 1;
        if (decision === "deny") approvalDeniedCount += 1;
        push(
          timelineEntry({
            at,
            turn,
            type: decision === "allow" ? "approval.allowed" : "approval.denied",
            label:
              decision === "allow"
                ? "Scientist explicitly approved the pending tool call"
                : "Scientist rejected the pending tool call",
            provider: call.provider,
            tool: call.tool,
            status: decision === "allow" ? "allowed" : "denied",
          }),
        );
      }
      continue;
    }

    if (event.type === "turn.done") {
      const state = asRecord(event.state);
      const status = asString(state?.status) ?? "error";
      turnStates.set(item.turn_id, status);
      const waiting = status === "done" && asArray(state?.required_actions).length > 0;
      push(
        timelineEntry({
          at,
          turn,
          type:
            status === "cancelled"
              ? "turn.cancelled"
              : status === "error"
                ? "turn.failed"
                : waiting
                  ? "turn.waiting"
                  : "turn.completed",
          label:
            status === "cancelled"
              ? `${turn} reached its execution limit`
              : status === "error"
                ? `${turn} failed safely`
                : waiting
                  ? `${turn} paused for a required human action`
                  : `${turn} completed`,
          status: waiting ? "waiting" : status,
        }),
      );
      continue;
    }

    if (event.type === "thread.created" && agent) {
      push(
        timelineEntry({
          at,
          turn,
          type: "agent.started",
          label: `${agent.label} started`,
          agent: agent.label,
          status: "running",
        }),
      );
      continue;
    }

    if (event.type === "thread.done" && agent) {
      const status = asRecord(event.state)?.status === "done" ? "complete" : "error";
      push(
        timelineEntry({
          at,
          turn,
          type: status === "complete" ? "agent.completed" : "agent.failed",
          label: status === "complete" ? `${agent.label} completed` : `${agent.label} failed safely`,
          agent: agent.label,
          status,
        }),
      );
      continue;
    }

    if (event.type === "mcp.initialize") {
      for (const server of asArray(event.mcp_servers)) {
        const connectorName = asString(asRecord(server)?.name);
        const provider = connectorName ? CONNECTOR_LABELS.get(connectorName) : undefined;
        if (!provider) continue;
        push(
          timelineEntry({
            at,
            turn,
            type: "connector.ready",
            label: `${provider} connector initialized`,
            provider,
            status: "ready",
          }),
        );
      }
      continue;
    }

    if (event.type === "sandbox.created") {
      daytonaSandboxCount += 1;
      push(
        timelineEntry({
          at,
          turn,
          type: "sandbox.started",
          label: "Daytona sandbox created",
          provider: "Daytona",
          status: "ready",
        }),
      );
      continue;
    }

    if (event.type === "model.message") {
      for (const rawCall of asArray(event.tool_calls)) {
        const call = safeToolCall(rawCall);
        if (!call) continue;
        if (agent) agent.toolCallCount += 1;
        if (call.tool === "search_engine") brightDataSearchCount += 1;
        if (call.tool === "scrape_as_markdown") brightDataScrapeCount += 1;
        if (call.tool === "sandbox.exec") daytonaExecCount += 1;
        push(
          timelineEntry({
            at,
            turn,
            type: "tool.requested",
            label: call.label,
            agent: agent?.label,
            provider: call.provider,
            tool: call.tool,
            status: "requested",
          }),
        );
      }
      continue;
    }

    if (event.type === "tool.approval_required") {
      for (const reference of asArray(event.tool_calls)) {
        const callId = asString(asRecord(reference)?.id);
        const call = callId ? calls.get(callId) : undefined;
        if (!callId || !call) continue;
        approvalRequiredCount += 1;
        seenApprovalRequirements.add(callId);
        pendingApprovals.set(callId, call);
        push(
          timelineEntry({
            at,
            turn,
            type: "approval.required",
            label: "Waiting for exact scientist approval",
            agent: agent?.label,
            provider: call.provider,
            tool: call.tool,
            status: "waiting",
            proposal: call.proposal,
          }),
        );
      }
      continue;
    }

    if (event.type === "tool.response") {
      toolResponseCount += 1;
      const callId = asString(event.tool_call_id);
      const call = callId ? calls.get(callId) : undefined;
      if (!call) continue;
      const isError = event.is_error === true;
      if (call.tool === "promote_experimental_proposal") {
        const decision = explicitDecisions.get(callId);
        if (decision !== "allow" && decision !== "deny") approvalProtocolViolationCount += 1;
        pendingApprovals.delete(callId);
        if (decision === "deny") {
          push(
            timelineEntry({
              at,
              turn,
              type: "tool.denied",
              label: "Proposal promotion remained unexecuted after rejection",
              agent: agent?.label,
              provider: call.provider,
              tool: call.tool,
              status: "denied",
            }),
          );
          continue;
        }
      }
      push(
        timelineEntry({
          at,
          turn,
          type: isError ? "tool.failed" : "tool.completed",
          label: isError ? `${call.label} failed safely` : `${call.label} completed`,
          agent: agent?.label,
          provider: call.provider,
          tool: call.tool,
          status: isError ? "error" : "complete",
        }),
      );
    }
  }

  const pendingPromotion = [...pendingApprovals.values()].find(
    (call) => call.tool === "promote_experimental_proposal" && call.proposal,
  );
  const latestTurnState = turnStates.get(
    [...turnMap.keys()][turnMap.size - 1],
  );
  const approvalStatus = pendingPromotion
    ? "waiting_for_scientist"
    : approvalAllowedCount > 0
      ? "explicitly_allowed"
      : approvalDeniedCount > 0
        ? "rejected"
        : "not_reached";
  const runStatus =
    approvalProtocolViolationCount > 0
      ? "invalid"
      : approvalStatus === "waiting_for_scientist"
        ? "awaiting_approval"
        : latestTurnState === "running"
          ? "running"
          : latestTurnState === "error" || latestTurnState === "cancelled"
            ? "attention_required"
            : "incomplete";

  const agents = agentsWithPrivateIds.map(
    ({ id, role, label, status, turn, startedAt, completedAt, toolCallCount }) => ({
      id,
      role,
      label,
      status,
      turn,
      startedAt,
      completedAt,
      toolCallCount,
    }),
  );
  return {
    schemaVersion: 1,
    run: {
      id: SAFE_ID_PATTERN.test(runId) ? runId : "gaggle-run",
      sessionId: safeId,
      source: "TrueForge",
      status: runStatus,
      startedAt: rawEventTimestamp(orderedEvents[0]),
      updatedAt: rawEventTimestamp(orderedEvents[orderedEvents.length - 1]),
    },
    summary: {
      eventCount: orderedEvents.length,
      turnCount: turnMap.size,
      continuationCount,
      recoveryCount,
      dynamicSubagentCount: agents.length,
      completedAgentCount: agents.filter((agent) => agent.status === "complete").length,
      erroredAgentCount: agents.filter((agent) => agent.status === "error").length,
      toolCallCount: rawToolCallCount,
      toolResponseCount,
      brightData: {
        searchCount: brightDataSearchCount,
        scrapeCount: brightDataScrapeCount,
      },
      daytona: {
        sandboxCount: daytonaSandboxCount,
        execCount: daytonaExecCount,
      },
      approval: {
        requiredCount: approvalRequiredCount,
        allowedCount: approvalAllowedCount,
        deniedCount: approvalDeniedCount,
        protocolViolationCount: approvalProtocolViolationCount,
      },
    },
    approval: {
      status: approvalStatus,
      ...(pendingPromotion?.proposal ? { proposal: pendingPromotion.proposal } : {}),
    },
    agents,
    timeline: timeline.map((entry, index) => ({ sequence: index + 1, ...entry })),
  };
}

export function validateGoldenRunProjection(projection) {
  const failures = [];
  if (projection?.schemaVersion !== 1) failures.push("schemaVersion must be 1");
  if ((projection?.summary?.turnCount ?? 0) < 4) failures.push("at least four turns are required");
  if ((projection?.summary?.dynamicSubagentCount ?? 0) < 12) {
    failures.push("at least twelve dynamic subagents are required");
  }
  if ((projection?.summary?.brightData?.searchCount ?? 0) < 1) {
    failures.push("a Bright Data search is required");
  }
  if ((projection?.summary?.brightData?.scrapeCount ?? 0) < 1) {
    failures.push("a Bright Data scrape is required");
  }
  if ((projection?.summary?.daytona?.sandboxCount ?? 0) < 1) {
    failures.push("a Daytona sandbox event is required");
  }
  if ((projection?.summary?.daytona?.execCount ?? 0) < 1) {
    failures.push("a Daytona sandbox execution is required");
  }
  if ((projection?.summary?.approval?.requiredCount ?? 0) < 1) {
    failures.push("a TrueForge tool approval checkpoint is required");
  }
  if ((projection?.summary?.approval?.protocolViolationCount ?? 0) !== 0) {
    failures.push("an approval protocol violation was detected");
  }
  if (projection?.approval?.status !== "waiting_for_scientist") {
    failures.push("the run must be waiting for scientist approval");
  }
  if (
    !SAFE_ID_PATTERN.test(projection?.approval?.proposal?.proposalId ?? "") ||
    !HASH_PATTERN.test(projection?.approval?.proposal?.proposalHash ?? "")
  ) {
    failures.push("the pending approval must carry an exact proposal id and SHA-256 hash");
  }
  if (failures.length > 0) {
    throw new Error(`Golden run proof failed: ${failures.join("; ")}.`);
  }
  return projection;
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

export function serializeTraceIntegrityPayload(trace) {
  const payload = JSON.parse(JSON.stringify(trace));
  const integrity = asRecord(asRecord(payload?.run)?.integrity);
  if (!integrity) throw new Error("Trace integrity metadata is missing.");
  delete integrity.value;
  return canonicalJson(payload);
}

export function finalizeRunTrace(projection, { exportedAt, integrityHash }) {
  validateGoldenRunProjection(projection);
  if (!HASH_PATTERN.test(integrityHash)) throw new Error("Sanitized trace integrity hash is invalid.");
  return {
    ...projection,
    run: {
      ...projection.run,
      exportedAt: normalizeTimestamp(exportedAt, "export timestamp"),
      integrity: {
        algorithm: "sha256",
        canonicalization: "sorted-json-v1",
        scope: "entire-trace-with-run.integrity.value-omitted",
        value: integrityHash,
      },
    },
    artifacts: {
      caseCrate: {
        name: "Scientific Evidence Case Crate",
        path: "case-crate.json",
        mediaType: "application/json",
      },
    },
  };
}

function safePublicSource(value) {
  const record = asRecord(value);
  const rawUrl = asString(record?.sourceUrl);
  if (!rawUrl) return undefined;
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return undefined;
  }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return undefined;
  url.search = "";
  url.hash = "";
  const id = asString(record.id);
  const retrievedAt = asString(record.retrievedAt);
  if (!id || !SAFE_ID_PATTERN.test(id) || !retrievedAt) return undefined;
  const sourceType = asString(record.sourceType);
  const scope = asString(record.scope);
  const direction = asString(record.direction);
  return {
    id,
    url: url.toString(),
    publisher: url.hostname === "pubmed.ncbi.nlm.nih.gov" ? "PubMed / NCBI" : url.hostname,
    retrievedAt: normalizeTimestamp(retrievedAt, "evidence retrieval timestamp"),
    sourceType: /^[a-z_]{1,40}$/.test(sourceType ?? "") ? sourceType : "other",
    biologicalScope: /^[a-z_]{1,40}$/.test(scope ?? "") ? scope : "unspecified",
    direction: ["supports", "contradicts"].includes(direction) ? direction : "unspecified",
    methodologyFlags: asArray(record.methodologyFlags)
      .filter((flag) => typeof flag === "string" && /^[a-z0-9_:-]{1,64}$/.test(flag))
      .slice(0, 20),
  };
}

export function buildScientificEvidenceCaseCrate({ trace, fixture, fixtureHash }) {
  if (!HASH_PATTERN.test(fixtureHash)) throw new Error("Fixture hash is invalid.");
  const caseRecord = asRecord(fixture);
  const experiment = asRecord(caseRecord?.experiment);
  const fixtureApproval = safeProposal(asRecord(caseRecord?.approval));
  const pendingProposal = trace?.approval?.proposal;
  if (
    !fixtureApproval ||
    fixtureApproval.proposalId !== pendingProposal?.proposalId ||
    fixtureApproval.proposalHash !== pendingProposal?.proposalHash
  ) {
    throw new Error("Fixture proposal does not match the pending TrueForge approval.");
  }
  const sources = asArray(caseRecord?.evidence).map(safePublicSource).filter(Boolean);
  const inputHash = asString(experiment?.inputHash);
  const resultHash = asString(experiment?.resultHash);
  if (!HASH_PATTERN.test(inputHash ?? "") || !HASH_PATTERN.test(resultHash ?? "")) {
    throw new Error("Fixture experiment hashes are invalid.");
  }
  const caseId = asString(caseRecord?.caseId);
  if (!caseId || !SAFE_ID_PATTERN.test(caseId)) throw new Error("Fixture case id is invalid.");

  return {
    schemaVersion: 1,
    name: "Scientific Evidence Case Crate",
    crateType: "scientific-evidence-case-crate",
    roCrateConformanceClaimed: false,
    generatedAt: trace.run.exportedAt,
    safety: {
      environment: "synthetic-rd-prototype",
      clinicalValidation: false,
      statement:
        "This crate records a synthetic experimental R&D workflow. It is not a diagnosis, treatment recommendation, or clinical validation.",
    },
    run: {
      id: trace.run.id,
      sessionId: trace.run.sessionId,
      orchestrator: "TrueForge",
      status: trace.run.status,
      sanitizedTracePath: "trace.json",
      sanitizedTraceIntegrity: trace.run.integrity,
    },
    case: {
      caseId,
      fixtureUrl:
        "https://raw.githubusercontent.com/SMXFREEZE/revoke-agent-harness/main/fixtures/gaggle/case-0042.json",
      fixtureHash,
    },
    proposal: {
      ...pendingProposal,
      status: "scientist_approval_required",
    },
    experiment: {
      id: SAFE_ID_PATTERN.test(asString(experiment?.id) ?? "") ? experiment.id : "experiment",
      model:
        asString(experiment?.model) === "experimental-rd-compatibility-v1"
          ? experiment.model
          : "experimental-rd-compatibility-v1",
      executor: "Daytona",
      inputHash,
      resultHash,
      clinicalValidation: false,
    },
    provenance: {
      evidenceCollector: "Bright Data",
      orchestrationRuntime: "TrueForge",
      deterministicExecutor: "Daytona",
      sources,
    },
    artifacts: [
      {
        name: "Sanitized TrueForge run trace",
        path: "trace.json",
        mediaType: "application/json",
        integrity: trace.run.integrity,
      },
      {
        name: "Synthetic case fixture",
        url: "https://raw.githubusercontent.com/SMXFREEZE/revoke-agent-harness/main/fixtures/gaggle/case-0042.json",
        mediaType: "application/json",
        hash: fixtureHash,
      },
    ],
  };
}

function containsSensitiveString(value) {
  return /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~-]+|\bsk-[A-Za-z0-9_-]{12,}|\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=])/i.test(
    value,
  );
}

export function assertSanitizedArtifact(value, path = "artifact") {
  if (typeof value === "string") {
    if (containsSensitiveString(value)) throw new Error(`${path} contains secret-shaped text.`);
    return value;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSanitizedArtifact(entry, `${path}[${index}]`));
    return value;
  }
  if (!isRecord(value)) return value;
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_ARTIFACT_KEYS.has(key)) {
      throw new Error(`${path}.${key} is forbidden in a public run artifact.`);
    }
    assertSanitizedArtifact(entry, `${path}.${key}`);
  }
  return value;
}
