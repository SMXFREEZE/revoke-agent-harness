import { describe, expect, it } from "vitest";
import { loadGaggleFixture } from "../src/fixtures.js";
import { GaggleLabStore } from "../src/store.js";

describe("Gaggle lab approval boundary", () => {
  it("previews without mutation and requires the exact hash to promote", async () => {
    const fixture = await loadGaggleFixture();
    const store = new GaggleLabStore(fixture);
    const preview = store.preview(fixture.approval.candidateIds);

    expect(preview).toMatchObject({
      mutationPerformed: false,
      status: "scientist_approval_required",
      proposalHash: fixture.approval.proposalHash,
    });
    expect(() =>
      store.promote({
        proposalId: preview.proposalId,
        proposalHash: "sha256:" + "0".repeat(64),
        approvedBy: "scientist",
      }),
    ).toThrow(/exact preview/);

    expect(
      store.promote({
        proposalId: preview.proposalId,
        proposalHash: preview.proposalHash,
        approvedBy: "scientist",
      }),
    ).toMatchObject({ status: "approved_for_experimental_validation", replay: false });
    expect(store.auditLog().map((event) => event.type)).toEqual([
      "proposal_previewed",
      "proposal_promoted",
    ]);
  });

  it("rejects candidates that were not in the deliberated proposal", async () => {
    const store = new GaggleLabStore(await loadGaggleFixture());
    expect(() => store.preview(["candidate-a"])).toThrow(/deliberated proposal/);
  });
});
