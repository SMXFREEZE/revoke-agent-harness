export type LiveAction =
  | { action: "status" }
  | { action: "attach"; sessionId?: string }
  | { action: "start"; objective: string }
  | { action: "stop"; sessionId: string }
  | { action: "poll"; sessionId: string }
  | {
      action: "decide";
      sessionId: string;
      turnId: string;
      threadId: string;
      toolCallId: string;
      proposalId: string;
      proposalHash: string;
      decision: "allow" | "deny";
    };

export type LiveAgent = {
  id: string;
  label: string;
  status: "running" | "complete" | "failed";
  startedAt: string;
  completedAt: string | null;
};

export type LiveEvent = {
  id: string;
  sequence: number;
  at: string;
  type: string;
  label: string;
  detail: string;
  agent?: string;
  provider?: string;
  tool?: string;
};

export type PendingApproval = {
  turnId: string;
  threadId: string;
  toolCallId: string;
  proposalId: string;
  proposalHash: string;
  operation: "promote_experimental_proposal";
};

export type LiveSnapshot = {
  available: true;
  source: "TrueForge";
  mode: "live";
  sessionId: string;
  status: "running" | "waiting_approval" | "complete" | "failed";
  updatedAt: string;
  agents: LiveAgent[];
  events: LiveEvent[];
  pendingApproval: PendingApproval | null;
  metrics: {
    eventCount: number;
    turnCount: number;
    agentCount: number;
    toolCallCount: number;
    brightDataCount: number;
    daytonaCount: number;
  };
};

type UnknownRecord = Record<string, unknown>;

const SESSION_ID = /^[0-9a-z]{26}$/;
const TURN_ID = /^[0-9a-z]{26}(?:\.[0-9a-z-]{1,24})?$/;
const THREAD_ID = /^[0-9A-Za-z_-]{1,128}$/;
const TOOL_CALL_ID = /^[0-9A-Za-z_-]{1,160}$/;
const PROPOSAL_ID = /^[0-9A-Za-z_-]{3,128}$/;
const PROPOSAL_HASH = /^sha256:[a-f0-9]{64}$/;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: UnknownRecord, field: string, pattern: RegExp): string {
  const value = record[field];
  if (typeof value !== "string" || !pattern.test(value)) {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

function normalizeObjective(value: unknown): string {
  if (typeof value !== "string") throw new Error("Objective is required.");
  const withoutControls = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127 ? " " : character;
  }).join("");
  const objective = withoutControls.replace(/\s+/g, " ").trim();
  if (objective.length < 20 || objective.length > 600) {
    throw new Error("Objective must contain 20 to 600 characters.");
  }
  return objective;
}

export function parseLiveAction(value: unknown): LiveAction {
  if (!isRecord(value) || typeof value.action !== "string") throw new Error("Invalid request.");
  switch (value.action) {
    case "status":
      return { action: "status" };
    case "attach":
      if (value.sessionId === undefined) return { action: "attach" };
      return { action: "attach", sessionId: requiredString(value, "sessionId", SESSION_ID) };
    case "start":
      return { action: "start", objective: normalizeObjective(value.objective) };
    case "stop":
      return { action: "stop", sessionId: requiredString(value, "sessionId", SESSION_ID) };
    case "poll":
      return { action: "poll", sessionId: requiredString(value, "sessionId", SESSION_ID) };
    case "decide": {
      if (value.decision !== "allow" && value.decision !== "deny") throw new Error("Invalid decision.");
      return {
        action: "decide",
        sessionId: requiredString(value, "sessionId", SESSION_ID),
        turnId: requiredString(value, "turnId", TURN_ID),
        threadId: requiredString(value, "threadId", THREAD_ID),
        toolCallId: requiredString(value, "toolCallId", TOOL_CALL_ID),
        proposalId: requiredString(value, "proposalId", PROPOSAL_ID),
        proposalHash: requiredString(value, "proposalHash", PROPOSAL_HASH),
        decision: value.decision,
      };
    }
    default:
      throw new Error("Unsupported action.");
  }
}

function safeDate(value: unknown): string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : new Date(0).toISOString();
}

function textContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .filter(isRecord)
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => String(part.text))
    .join(" ");
}

function compact(value: string, max = 220): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

type ToolDescriptor = {
  id: string;
  sourceEventId: string;
  tool: string;
  provider: string;
  proposalId?: string;
  proposalHash?: string;
  detail: string;
};

function decodeToolCall(call: UnknownRecord, sourceEventId: string): ToolDescriptor | null {
  if (typeof call.id !== "string" || !isRecord(call.function) || typeof call.function.name !== "string") return null;
  const baseName = call.function.name;
  let provider = "TrueForge";
  let tool = baseName;
  let detail = "Harness tool dispatched";
  let proposalId: string | undefined;
  let proposalHash: string | undefined;

  if (baseName === "exec") {
    provider = "Daytona";
    detail = "Deterministic experiment executed in an isolated Daytona sandbox";
  } else if (baseName === "create_sub_agent") {
    detail = "Bounded specialist delegated by the TrueForge harness";
  } else if (baseName === "call_tool" && typeof call.function.arguments === "string") {
    try {
      const args: unknown = JSON.parse(call.function.arguments);
      if (isRecord(args)) {
        const mcpServer = typeof args.mcp_server === "string" ? args.mcp_server : "MCP";
        tool = typeof args.tool_name === "string" ? args.tool_name : "call_tool";
        provider = mcpServer === "bright-data" ? "Bright Data" : mcpServer === "gaggle-lab" ? "Gaggle Lab" : mcpServer;
        detail = `${provider} · ${tool}`;
        if (isRecord(args.input)) {
          if (typeof args.input.query === "string") detail = `${detail} · ${compact(args.input.query, 120)}`;
          if (typeof args.input.proposalId === "string") proposalId = args.input.proposalId;
          if (typeof args.input.proposalHash === "string") proposalHash = args.input.proposalHash;
        }
      }
    } catch {
      detail = "MCP tool dispatched through TrueForge";
    }
  }

  return { id: call.id, sourceEventId, tool, provider, proposalId, proposalHash, detail };
}

function eventRecord(item: unknown): { turnId: string; event: UnknownRecord } | null {
  if (!isRecord(item) || typeof item.turn_id !== "string" || !isRecord(item.event)) return null;
  return { turnId: item.turn_id, event: item.event };
}

export function projectTrueForgeSnapshot(
  sessionId: string,
  rawTurns: unknown,
  rawItems: unknown,
): LiveSnapshot {
  if (!SESSION_ID.test(sessionId) || !Array.isArray(rawTurns) || !Array.isArray(rawItems)) {
    throw new Error("TrueForge returned an invalid session payload.");
  }

  const turns = rawTurns.filter(isRecord).toSorted((a, b) => safeDate(a.created_at).localeCompare(safeDate(b.created_at)));
  const items = rawItems.map(eventRecord).filter((item): item is NonNullable<typeof item> => item !== null)
    .toSorted((a, b) => safeDate(a.event.created_at).localeCompare(safeDate(b.event.created_at)));
  const tools = new Map<string, ToolDescriptor>();

  for (const { event } of items) {
    if (event.type !== "model.message" || !Array.isArray(event.tool_calls) || typeof event.id !== "string") continue;
    for (const call of event.tool_calls) {
      if (!isRecord(call)) continue;
      const decoded = decodeToolCall(call, event.id);
      if (decoded) tools.set(decoded.id, decoded);
    }
  }

  const agents = new Map<string, LiveAgent>();
  const projected: LiveEvent[] = [];
  let toolCallCount = 0;
  let brightDataCount = 0;
  let daytonaCount = 0;

  function push(event: UnknownRecord, fields: Omit<LiveEvent, "id" | "sequence" | "at" | "type">) {
    projected.push({
      id: typeof event.id === "string" ? event.id : `event-${projected.length + 1}`,
      sequence: projected.length + 1,
      at: safeDate(event.created_at),
      type: typeof event.type === "string" ? event.type : "unknown",
      ...fields,
    });
  }

  for (const { event } of items) {
    const type = typeof event.type === "string" ? event.type : "unknown";
    const threadId = typeof event.thread_id === "string" ? event.thread_id : undefined;
    if (type === "thread.created" && threadId) {
      const label = typeof event.title === "string" ? event.title : threadId;
      agents.set(threadId, { id: threadId, label, status: "running", startedAt: safeDate(event.created_at), completedAt: null });
      push(event, { label: `${label} started`, detail: "Independent TrueForge specialist thread", agent: label, provider: "TrueForge" });
      continue;
    }
    if (type === "thread.done" && threadId) {
      const existing = agents.get(threadId);
      const label = existing?.label ?? (typeof event.title === "string" ? event.title : threadId);
      const state = isRecord(event.state) && event.state.status === "error" ? "failed" : "complete";
      agents.set(threadId, { id: threadId, label, status: state, startedAt: existing?.startedAt ?? safeDate(event.created_at), completedAt: safeDate(event.created_at) });
      push(event, { label: `${label} ${state}`, detail: "Specialist result persisted by TrueForge", agent: label, provider: "TrueForge" });
      continue;
    }
    if (type === "model.message" && Array.isArray(event.tool_calls)) {
      for (const call of event.tool_calls) {
        if (!isRecord(call) || typeof call.id !== "string") continue;
        const decoded = tools.get(call.id);
        if (!decoded) continue;
        toolCallCount += 1;
        if (decoded.provider === "Bright Data") brightDataCount += 1;
        if (decoded.provider === "Daytona") daytonaCount += 1;
        push(event, { label: `${decoded.tool} requested`, detail: decoded.detail, provider: decoded.provider, tool: decoded.tool });
      }
      const content = textContent(event.content);
      if (content) push(event, { label: "Chief Scientist update", detail: compact(content), provider: "TrueForge" });
      continue;
    }
    if (type === "tool.response") {
      const decoded = typeof event.tool_call_id === "string" ? tools.get(event.tool_call_id) : undefined;
      push(event, {
        label: `${decoded?.tool ?? "Tool"} completed`,
        detail: decoded ? `${decoded.provider} result admitted to the investigation ledger` : "Tool result persisted",
        provider: decoded?.provider ?? "TrueForge",
        tool: decoded?.tool,
      });
      continue;
    }
    if (type === "sandbox.created") {
      daytonaCount += 1;
      push(event, { label: "Daytona sandbox created", detail: "Isolated deterministic experiment environment", provider: "Daytona" });
      continue;
    }
    if (type === "tool.approval_required") {
      push(event, { label: "Scientist approval required", detail: "TrueForge stopped before the guarded synthetic write", provider: "TrueForge" });
      continue;
    }
    if (type === "turn.created" || type === "turn.done") {
      push(event, {
        label: type === "turn.created" ? "Persistent turn started" : "Persistent turn checkpointed",
        detail: "Durable TrueForge session state",
        provider: "TrueForge",
      });
    }
  }

  const latestTurn = turns.at(-1);
  const latestState = latestTurn && isRecord(latestTurn.state) ? latestTurn.state : null;
  let status: LiveSnapshot["status"] = "running";
  if (latestState?.status === "error" || latestState?.status === "cancelled") status = "failed";
  else if (latestState?.status === "done") status = "complete";

  let pendingApproval: PendingApproval | null = null;
  if (latestState?.status === "done" && Array.isArray(latestState.required_actions)) {
    const requirement = latestState.required_actions.find(
      (entry) => isRecord(entry) && entry.type === "tool.approval_required" && typeof entry.thread_id === "string" && Array.isArray(entry.tool_calls),
    );
    if (isRecord(requirement) && typeof requirement.thread_id === "string" && Array.isArray(requirement.tool_calls)) {
      const requested = requirement.tool_calls.find(isRecord);
      const toolCallId = requested && typeof requested.id === "string" ? requested.id : "";
      const decoded = tools.get(toolCallId);
      if (
        decoded?.tool === "promote_experimental_proposal"
        && decoded.proposalId && PROPOSAL_ID.test(decoded.proposalId)
        && decoded.proposalHash && PROPOSAL_HASH.test(decoded.proposalHash)
        && latestTurn && typeof latestTurn.id === "string"
      ) {
        pendingApproval = {
          turnId: latestTurn.id,
          threadId: requirement.thread_id,
          toolCallId,
          proposalId: decoded.proposalId,
          proposalHash: decoded.proposalHash,
          operation: "promote_experimental_proposal",
        };
        status = "waiting_approval";
      }
    }
  }

  const updatedAt = projected.at(-1)?.at ?? new Date(0).toISOString();
  return {
    available: true,
    source: "TrueForge",
    mode: "live",
    sessionId,
    status,
    updatedAt,
    agents: [...agents.values()],
    events: projected.slice(-80).map((event, index, recent) => ({
      ...event,
      sequence: Math.max(1, projected.length - recent.length + index + 1),
    })),
    pendingApproval,
    metrics: {
      eventCount: items.length,
      turnCount: turns.length,
      agentCount: agents.size,
      toolCallCount,
      brightDataCount,
      daytonaCount,
    },
  };
}
