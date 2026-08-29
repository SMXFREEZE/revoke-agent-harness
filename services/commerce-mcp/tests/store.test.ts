import { beforeEach, describe, expect, it } from "vitest";
import { createApprovalArtifact, type ApprovalOperation } from "../src/approval.js";
import { loadDemoFixtures } from "../src/fixtures.js";
import { CommerceStore } from "../src/store.js";

const approvalSecret = "test-only-approval-secret-with-at-least-32-bytes";
const targets = [
  "SKU-CUIS-CGWM024",
  "SKU-CUIS-CGWM059",
  "SKU-CUIS-FCB501",
  "SKU-CUIS-LEGACY18",
];

describe("CommerceStore approval and target boundaries", () => {
  let store: CommerceStore;

  beforeEach(async () => {
    const fixtures = await loadDemoFixtures();
    store = new CommerceStore(
      fixtures.catalog,
      fixtures.orders,
      fixtures.actionableTargetsByRecall,
      approvalSecret,
    );
  });

  function approval(
    operation: ApprovalOperation,
    resourceId: string,
    idempotencyKey: string,
  ) {
    return createApprovalArtifact(approvalSecret, {
      operation,
      resourceId,
      idempotencyKey,
      approvedBy: "judge@example.test",
    });
  }

  it("does not mutate state while previewing an evidence-derived proposal", () => {
    const before = store.listCatalog();
    const proposal = store.previewContainment("26-717", targets);

    expect(proposal.changes).toHaveLength(4);
    expect(store.listCatalog()).toEqual(before);
    expect(store.auditLog().at(-1)?.event).toBe("containment.previewed");
  });

  it("rejects an active SKU that is not in the trusted match artifact", () => {
    expect(() =>
      store.previewContainment("26-717", ["SKU-OTHER-CGR221"]),
    ).toThrow(/not an evidence-derived actionable target/);
    expect(store.auditLog()).toHaveLength(0);
  });

  it("rejects an apply call whose idempotency key does not match the proposal", () => {
    const proposal = store.previewContainment("26-717", targets);
    const inventedKey = "invented";

    expect(() =>
      store.applyContainment({
        proposalId: proposal.proposalId,
        idempotencyKey: inventedKey,
        approval: approval("apply_containment", proposal.proposalId, inventedKey),
      }),
    ).toThrow(/does not match/);
    expect(store.listCatalog().filter((item) => targets.includes(item.sku))).toSatisfy(
      (items: Array<{ status: string }>) => items.every((item) => item.status === "active"),
    );
  });

  it("rejects caller-forged approval metadata", () => {
    const proposal = store.previewContainment("26-717", targets);
    const valid = approval("apply_containment", proposal.proposalId, proposal.idempotencyKey);

    expect(() =>
      store.applyContainment({
        proposalId: proposal.proposalId,
        idempotencyKey: proposal.idempotencyKey,
        approval: { ...valid, approvedBy: "forged@example.test" },
      }),
    ).toThrow(/signature is invalid/);
  });

  it("applies one signed proposal and makes same-operation replay idempotent", () => {
    const proposal = store.previewContainment("26-717", targets);
    const signed = approval("apply_containment", proposal.proposalId, proposal.idempotencyKey);
    const first = store.applyContainment({
      proposalId: proposal.proposalId,
      idempotencyKey: proposal.idempotencyKey,
      approval: signed,
    });
    const replay = store.applyContainment({
      proposalId: proposal.proposalId,
      idempotencyKey: proposal.idempotencyKey,
      approval: signed,
    });

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.receipt.receiptId).toBe(first.receipt.receiptId);
    expect(replay.receipt.approvedBy).toBe("judge@example.test");
    expect(store.auditLog().filter((event) => event.event === "containment.applied")).toHaveLength(1);
  });

  it("rejects an approval artifact reused for a different operation", () => {
    const proposal = store.previewContainment("26-717", targets);
    const applied = store.applyContainment({
      proposalId: proposal.proposalId,
      idempotencyKey: proposal.idempotencyKey,
      approval: approval("apply_containment", proposal.proposalId, proposal.idempotencyKey),
    });
    const rollbackKey = "rollback:" + applied.receipt.receiptId;

    expect(() =>
      store.rollbackContainment({
        receiptId: applied.receipt.receiptId,
        idempotencyKey: rollbackKey,
        approval: approval("apply_containment", applied.receipt.receiptId, rollbackKey),
      }),
    ).toThrow(/not bound to this exact operation/);
  });

  it("rolls back from the immutable receipt and keeps rollback idempotent", () => {
    const proposal = store.previewContainment("26-717", targets);
    const applied = store.applyContainment({
      proposalId: proposal.proposalId,
      idempotencyKey: proposal.idempotencyKey,
      approval: approval("apply_containment", proposal.proposalId, proposal.idempotencyKey),
    });
    const rollbackKey = "rollback:" + applied.receipt.receiptId;
    const signed = approval("rollback_containment", applied.receipt.receiptId, rollbackKey);
    const rolledBack = store.rollbackContainment({
      receiptId: applied.receipt.receiptId,
      idempotencyKey: rollbackKey,
      approval: signed,
    });
    const replay = store.rollbackContainment({
      receiptId: applied.receipt.receiptId,
      idempotencyKey: rollbackKey,
      approval: signed,
    });

    expect(rolledBack.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(store.listCatalog().filter((item) => targets.includes(item.sku))).toSatisfy(
      (items: Array<{ status: string; inventoryHeld: boolean }>) =>
        items.every((item) => item.status === "active" && !item.inventoryHeld),
    );
  });

  it("creates only signed test-sink drafts for affected pseudonymous customers", () => {
    const proposal = store.previewContainment("26-717", targets);
    const applied = store.applyContainment({
      proposalId: proposal.proposalId,
      idempotencyKey: proposal.idempotencyKey,
      approval: approval("apply_containment", proposal.proposalId, proposal.idempotencyKey),
    });
    const draftKey = "draft-notices:" + applied.receipt.receiptId;
    const drafted = store.createNoticeDrafts({
      receiptId: applied.receipt.receiptId,
      idempotencyKey: draftKey,
      approval: approval("create_notice_drafts", applied.receipt.receiptId, draftKey),
    });

    expect(drafted.receipt.action).toBe("notices.drafted");
    expect(drafted.receipt.changes).toHaveLength(3);
    expect(drafted.receipt.changes).toSatisfy(
      (changes: Array<Record<string, unknown>>) =>
        changes.every((change) => change.delivery === "test-sink" && change.status === "draft"),
    );
  });
});
