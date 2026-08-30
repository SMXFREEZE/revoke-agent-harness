import { describe, expect, it } from "vitest";
import { parseLiveAction, projectTrueForgeSnapshot } from "./trueforge-live-contract";

const sessionId = "01m17kj6cy2prqvxret528beb4";
const turnId = "01m17w7fnhh8meqvxz5pawxswq.local";
const proposalHash = "sha256:fa33575d844316a3df6ab77ad8814ae1fdd11eab99291db1a1799ae70d525a8b";

describe("live TrueForge contract", () => {
  it("rejects malformed session identifiers and short objectives", () => {
    expect(() => parseLiveAction({ action: "poll", sessionId: "../settings" })).toThrow("Invalid sessionId");
    expect(() => parseLiveAction({ action: "start", objective: "too short" })).toThrow("20 to 600");
  });

  it("projects sponsor activity and the exact native approval boundary without reasoning content", () => {
    const sourceEventId = "event-model";
    const toolCallId = "call_exact_123";
    const snapshot = projectTrueForgeSnapshot(sessionId, [{
      id: turnId,
      created_at: "2026-08-29T23:00:00.000Z",
      state: {
        status: "done",
        required_actions: [{ type: "tool.approval_required", thread_id: "main", tool_calls: [{ id: toolCallId, source_event_id: sourceEventId }] }],
      },
    }], [
      { turn_id: turnId, event: { type: "turn.created", id: "turn-start", created_at: "2026-08-29T23:00:00.000Z" } },
      { turn_id: turnId, event: { type: "thread.created", id: "agent-start", thread_id: "defense", title: "Defense", created_at: "2026-08-29T23:00:01.000Z" } },
      { turn_id: turnId, event: {
        type: "model.message", id: sourceEventId, thread_id: "main", created_at: "2026-08-29T23:00:02.000Z", reasoning_content: "hidden chain of thought",
        tool_calls: [{ id: toolCallId, function: { name: "call_tool", arguments: JSON.stringify({ mcp_server: "gaggle-lab", tool_name: "promote_experimental_proposal", input: { proposalId: "gaggle-proposal-0042", proposalHash } }) } }],
      } },
      { turn_id: turnId, event: { type: "tool.approval_required", id: "approval", thread_id: "main", tool_calls: [{ id: toolCallId, source_event_id: sourceEventId }], created_at: "2026-08-29T23:00:03.000Z" } },
    ]);

    expect(snapshot.status).toBe("waiting_approval");
    expect(snapshot.pendingApproval).toEqual(expect.objectContaining({ proposalId: "gaggle-proposal-0042", proposalHash, toolCallId }));
    expect(JSON.stringify(snapshot)).not.toContain("hidden chain of thought");
    expect(snapshot.agents).toHaveLength(1);
  });

  it("requires exact proposal identity in decision requests", () => {
    expect(parseLiveAction({
      action: "decide", sessionId, turnId, threadId: "main", toolCallId: "call_exact_123",
      proposalId: "gaggle-proposal-0042", proposalHash, decision: "allow",
    })).toEqual(expect.objectContaining({ decision: "allow", proposalHash }));
    expect(() => parseLiveAction({
      action: "decide", sessionId, turnId, threadId: "main", toolCallId: "call_exact_123",
      proposalId: "gaggle-proposal-0042", proposalHash: "sha256:bad", decision: "allow",
    })).toThrow("Invalid proposalHash");
  });
});
