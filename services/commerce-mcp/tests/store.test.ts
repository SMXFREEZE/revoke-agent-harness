import { beforeEach, describe, expect, it } from "vitest";
import { loadDemoFixtures } from "../src/fixtures.js";
import { CommerceStore } from "../src/store.js";

const targets = [
  "SKU-CUIS-CGWM024",
  "SKU-CUIS-CGWM059",
  "SKU-CUIS-FCB501",
  "SKU-CUIS-LEGACY18",
];

describe("CommerceStore approval boundary support", () => {
  let store: CommerceStore;

  beforeEach(async () => {
    const fixtures = await loadDemoFixtures();
    store = new CommerceStore(fixtures.catalog, fixtures.orders);
  });

  it("does not mutate state while previewing a proposal", () => {
    const before = store.listCatalog();
    const proposal = store.previewContainment("26-717", targets);

    expect(proposal.changes).toHaveLength(4);
    expect(store.listCatalog()).toEqual(before);
    expect(store.auditLog().at(-1)?.event).toBe("containment.previewed");
  });

  it("rejects an apply call whose idempotency key does not match the proposal", () => {
    const proposal = store.previewContainment("26-717", targets);

    expect(() =>
      store.applyContainment({
        proposalId: proposal.proposalId,
        idempotencyKey: "invented",
        approvedBy: "judge@example.test",
      }),
    ).toThrow(/does not match/);
    expect(
      store.listCatalog().filter((item) => targets.includes(item.sku)),
    ).toSatisfy((items: Array<{ status: string }>) =>
      items.every((item) => item.status === "active"),
    );
  });

  it("applies one approved proposal and makes replay idempotent", () => {
    const proposal = store.previewContainment("26-717", targets);
    const first = store.applyContainment({
      proposalId: proposal.proposalId,
      idempotencyKey: proposal.idempotencyKey,
      approvedBy: "judge@example.test",
    });
    const replay = store.applyContainment({
      proposalId: proposal.proposalId,
      idempotencyKey: proposal.idempotencyKey,
      approvedBy: "judge@example.test",
    });

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.receipt.receiptId).toBe(first.receipt.receiptId);
    expect(
      store.listCatalog().filter((item) => targets.includes(item.sku)),
    ).toSatisfy((items: Array<{ status: string; inventoryHeld: boolean }>) =>
      items.every((item) => item.status === "quarantined" && item.inventoryHeld),
    );
    expect(store.auditLog().filter((event) => event.event === "containment.applied")).toHaveLength(
      1,
    );
  });

  it("rolls back from the immutable receipt and keeps rollback idempotent", () => {
    const proposal = store.previewContainment("26-717", targets);
    const applied = store.applyContainment({
      proposalId: proposal.proposalId,
      idempotencyKey: proposal.idempotencyKey,
      approvedBy: "judge@example.test",
    });
    const rollbackKey = "rollback:" + applied.receipt.receiptId;
    const rolledBack = store.rollbackContainment({
      receiptId: applied.receipt.receiptId,
      idempotencyKey: rollbackKey,
      approvedBy: "judge@example.test",
    });
    const replay = store.rollbackContainment({
      receiptId: applied.receipt.receiptId,
      idempotencyKey: rollbackKey,
      approvedBy: "judge@example.test",
    });

    expect(rolledBack.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(
      store.listCatalog().filter((item) => targets.includes(item.sku)),
    ).toSatisfy((items: Array<{ status: string; inventoryHeld: boolean }>) =>
      items.every((item) => item.status === "active" && !item.inventoryHeld),
    );
  });

  it("creates only test-sink drafts for affected pseudonymous customers", () => {
    const proposal = store.previewContainment("26-717", targets);
    const applied = store.applyContainment({
      proposalId: proposal.proposalId,
      idempotencyKey: proposal.idempotencyKey,
      approvedBy: "judge@example.test",
    });
    const draftKey = "draft-notices:" + applied.receipt.receiptId;
    const drafted = store.createNoticeDrafts({
      receiptId: applied.receipt.receiptId,
      idempotencyKey: draftKey,
      approvedBy: "judge@example.test",
    });

    expect(drafted.receipt.action).toBe("notices.drafted");
    expect(drafted.receipt.changes).toHaveLength(3);
    expect(drafted.receipt.changes).toSatisfy(
      (changes: Array<Record<string, unknown>>) =>
        changes.every(
          (change) => change.delivery === "test-sink" && change.status === "draft",
        ),
    );
  });
});

