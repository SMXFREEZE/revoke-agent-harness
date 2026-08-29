import { describe, expect, it, vi } from "vitest";
import {
  assertSanitizedArtifact,
  buildScientificEvidenceCaseCrate,
  fetchAllSessionEvents,
  finalizeRunTrace,
  orderAndDedupeSessionEvents,
  projectTrueForgeRun,
  validateGoldenRunProjection,
} from "../lib/trueforge-run.mjs";

const SESSION_ID = "01m17kj6cy2prqvxret528beb4";
const PROPOSAL_HASH = `sha256:${"a".repeat(64)}`;
const FIXTURE_HASH = `sha256:${"b".repeat(64)}`;
const TRACE_HASH = `sha256:${"c".repeat(64)}`;

function item(turn, id, type, second, details = {}) {
  return {
    turn_id: turn,
    event: {
      id,
      type,
      thread_id: details.thread_id ?? null,
      created_at: `2026-08-29T20:00:${String(second).padStart(2, "0")}.000Z`,
      ...details,
    },
  };
}

function toolCall(id, name, args = {}) {
  return { id, function: { name, arguments: JSON.stringify(args) } };
}

function goldenEvents() {
  const events = [];
  events.push(item("turn-a", "e-001", "turn.created", 0, { previous_turn_id: null, input: [] }));
  events.push(item("turn-a", "e-002", "sandbox.created", 1, { sandbox_id: "secret-daytona-id" }));
  events.push(
    item("turn-a", "e-003", "model.message", 2, {
      thread_id: "main",
      content: "never export this model text",
      tool_calls: [
        toolCall("tc-exec", "exec", { command: "cat /secret" }),
        toolCall("tc-search", "call_tool", {
          tool_name: "search_engine",
          arguments: { query: "private raw query" },
        }),
        toolCall("tc-scrape", "call_tool", {
          tool_name: "scrape_as_markdown",
          arguments: { url: "https://example.test/?token=secret" },
        }),
      ],
    }),
  );

  const roles = [
    "Defense",
    "Prosecution",
    "Methodologist",
    "Evidence Clerk",
    "Experimentalist",
    "Blind Red Team",
    "Juror Mechanistic Rigor",
    "Juror Human Evidence",
    "Juror Ecological Compatibility",
    "Juror Methodological Conservatism",
    "Juror Balanced Evidence",
    "Disagreement Analyst",
  ];
  roles.forEach((role, index) => {
    const threadId = `thread-${index + 1}`;
    const offset = 3 + index * 2;
    events.push(
      item("turn-a", `e-agent-start-${index}`, "thread.created", offset, {
        thread_id: threadId,
        title: role,
        agent_info: { name: role, input: "private specialist prompt" },
      }),
    );
    events.push(
      item("turn-a", `e-agent-done-${index}`, "thread.done", offset + 1, {
        thread_id: threadId,
        title: role,
        state: { status: "done", output: { content: "private specialist answer" } },
      }),
    );
  });
  events.push(
    item("turn-a", "e-turn-a-done", "turn.done", 27, {
      state: { status: "cancelled", reason: "server-execution-timeout", output: "private" },
    }),
  );
  events.push(
    item("turn-b", "e-turn-b", "turn.created", 28, {
      previous_turn_id: "turn-a",
      input: [{ type: "user.message", content: "private continuation instructions" }],
    }),
  );
  events.push(item("turn-b", "e-turn-b-done", "turn.done", 29, { state: { status: "done" } }));
  events.push(
    item("turn-c", "e-turn-c", "turn.created", 30, {
      previous_turn_id: "turn-b",
      input: [],
    }),
  );
  events.push(item("turn-c", "e-turn-c-done", "turn.done", 31, { state: { status: "done" } }));
  events.push(
    item("turn-d", "e-turn-d", "turn.created", 32, {
      previous_turn_id: "turn-c",
      input: [],
    }),
  );
  events.push(
    item("turn-d", "e-promote-call", "model.message", 33, {
      thread_id: "main",
      content: "private rationale",
      tool_calls: [
        toolCall("tc-promote", "call_tool", {
          tool_name: "promote_experimental_proposal",
          input: {
            proposalId: "gaggle-proposal-0042",
            proposalHash: PROPOSAL_HASH,
            approvedBy: "should-not-export",
          },
        }),
      ],
    }),
  );
  events.push(
    item("turn-d", "e-approval", "tool.approval_required", 34, {
      thread_id: "main",
      tool_calls: [{ id: "tc-promote", source_event_id: "e-promote-call" }],
    }),
  );
  events.push(
    item("turn-d", "e-turn-d-done", "turn.done", 35, {
      state: { status: "done", required_actions: [{ type: "tool.approval_required" }] },
    }),
  );
  return events;
}

describe("TrueForge run export projection", () => {
  it("orders chronologically and deduplicates reconnect overlap", async () => {
    const first = item("turn-a", "e-1", "turn.created", 1, { previous_turn_id: null });
    const second = item("turn-a", "e-2", "turn.done", 2, { state: { status: "done" } });
    expect(orderAndDedupeSessionEvents([second, first, second]).map((entry) => entry.event.id)).toEqual([
      "e-1",
      "e-2",
    ]);

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [second], pagination: { next_page_token: "older" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [second, first], pagination: {} }),
      });
    const fetched = await fetchAllSessionEvents({ sessionId: SESSION_ID, fetchImpl });
    expect(fetched.map((entry) => entry.event.id)).toEqual(["e-1", "e-2"]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[0][0])).toContain("limit=100");
    expect(String(fetchImpl.mock.calls[1][0])).toContain("page_token=older");
  });

  it("projects real lifecycle, recovery, sponsor tools, and pending approval", () => {
    const projection = projectTrueForgeRun(goldenEvents().reverse(), { sessionId: SESSION_ID });
    expect(validateGoldenRunProjection(projection)).toBe(projection);
    expect(projection.run.status).toBe("awaiting_approval");
    expect(projection.summary).toMatchObject({
      turnCount: 4,
      continuationCount: 3,
      recoveryCount: 1,
      dynamicSubagentCount: 12,
      completedAgentCount: 12,
      brightData: { searchCount: 1, scrapeCount: 1 },
      daytona: { sandboxCount: 1, execCount: 1 },
      approval: { requiredCount: 1, allowedCount: 0, protocolViolationCount: 0 },
    });
    expect(projection.agents.every((agent) => agent.status === "complete")).toBe(true);
    expect(projection.timeline.some((entry) => entry.type === "turn.resumed")).toBe(true);
    expect(projection.approval).toEqual({
      status: "waiting_for_scientist",
      proposal: {
        proposalId: "gaggle-proposal-0042",
        proposalHash: PROPOSAL_HASH,
      },
    });
  });

  it("removes model content, raw arguments/results, commands, sandbox ids, and secrets", () => {
    const projection = projectTrueForgeRun(goldenEvents(), { sessionId: SESSION_ID });
    const trace = finalizeRunTrace(projection, {
      exportedAt: "2026-08-29T21:00:00.000Z",
      hash: TRACE_HASH,
    });
    expect(() => assertSanitizedArtifact(trace)).not.toThrow();
    const serialized = JSON.stringify(trace);
    for (const forbidden of [
      "never export",
      "private raw query",
      "cat /secret",
      "secret-daytona-id",
      "should-not-export",
      "example.test",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(serialized).toContain("gaggle-proposal-0042");
    expect(serialized).toContain(PROPOSAL_HASH);
    expect(trace.artifacts.caseCrate.path).toBe("case-crate.json");
  });

  it("never infers approval from a promotion response", () => {
    const events = goldenEvents();
    events.push(
      item("turn-d", "e-illicit-response", "tool.response", 35, {
        thread_id: "main",
        tool_call_id: "tc-promote",
        content: [{ type: "text", text: "untrusted success" }],
      }),
    );
    const projection = projectTrueForgeRun(events, { sessionId: SESSION_ID });
    expect(projection.run.status).toBe("invalid");
    expect(projection.approval.status).not.toBe("explicitly_allowed");
    expect(projection.summary.approval.protocolViolationCount).toBe(1);
    expect(() => validateGoldenRunProjection(projection)).toThrow(/approval protocol violation/i);
  });

  it("records a denied tool response as zero execution rather than implicit approval", () => {
    const events = goldenEvents();
    events.push(
      item("turn-e", "e-deny-turn", "turn.created", 36, {
        previous_turn_id: "turn-d",
        input: [
          {
            type: "user.tool_approval",
            thread_id: "main",
            tool_call_id: "tc-promote",
            approval: { status: "deny", reason: "private rationale" },
          },
        ],
      }),
      item("turn-e", "e-deny-response", "tool.response", 37, {
        thread_id: "main",
        tool_call_id: "tc-promote",
        content: [{ type: "text", text: "denied" }],
      }),
      item("turn-e", "e-deny-done", "turn.done", 38, { state: { status: "done" } }),
    );
    const projection = projectTrueForgeRun(events, { sessionId: SESSION_ID });
    expect(projection.approval.status).toBe("rejected");
    expect(projection.summary.approval).toMatchObject({
      allowedCount: 0,
      deniedCount: 1,
      protocolViolationCount: 0,
    });
    expect(
      projection.timeline.some(
        (entry) => entry.type === "tool.denied" && entry.tool === "promote_experimental_proposal",
      ),
    ).toBe(true);
    expect(
      projection.timeline.some(
        (entry) => entry.type === "tool.completed" && entry.tool === "promote_experimental_proposal",
      ),
    ).toBe(false);
  });

  it("builds a factual non-RO-Crate evidence download from sanitized data", () => {
    const projection = projectTrueForgeRun(goldenEvents(), { sessionId: SESSION_ID });
    const trace = finalizeRunTrace(projection, {
      exportedAt: "2026-08-29T21:00:00.000Z",
      hash: TRACE_HASH,
    });
    const fixture = {
      caseId: "GGG-0042",
      mode: "synthetic-rd-prototype",
      evidence: [
        {
          id: "E-001",
          sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/16672507/?token=remove-me#fragment",
          sourceType: "in_vitro_strain",
          scope: "strain_specific",
          direction: "supports",
          methodologyFlags: ["in_vitro_only"],
          retrievedAt: "2026-08-29T12:00:00-04:00",
        },
      ],
      experiment: {
        id: "EXP-004",
        model: "experimental-rd-compatibility-v1",
        inputHash: `sha256:${"d".repeat(64)}`,
        resultHash: `sha256:${"e".repeat(64)}`,
      },
      approval: {
        proposalId: "gaggle-proposal-0042",
        proposalHash: PROPOSAL_HASH,
      },
    };
    const crate = buildScientificEvidenceCaseCrate({ trace, fixture, fixtureHash: FIXTURE_HASH });
    expect(crate.name).toBe("Scientific Evidence Case Crate");
    expect(crate.roCrateConformanceClaimed).toBe(false);
    expect(crate.case.fixtureHash).toBe(FIXTURE_HASH);
    expect(crate.proposal.proposalHash).toBe(PROPOSAL_HASH);
    expect(crate.provenance.sources[0].url).toBe("https://pubmed.ncbi.nlm.nih.gov/16672507/");
    expect(() => assertSanitizedArtifact(crate)).not.toThrow();
  });
});
