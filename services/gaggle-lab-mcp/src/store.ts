import { createHash, randomUUID } from "node:crypto";
import type { GaggleFixture } from "./fixtures.js";

interface AuditEvent {
  sequence: number;
  eventId: string;
  type: "proposal_previewed" | "proposal_promoted";
  proposalId: string;
  at: string;
  approvedBy?: string;
}

interface Proposal {
  caseId: string;
  candidateIds: string[];
  model: "experimental-rd-compatibility-v1";
  status: "scientist_approval_required" | "approved_for_experimental_validation";
  proposalId: string;
  proposalHash: string;
}

function canonicalProposal(caseId: string, candidateIds: string[]) {
  return {
    caseId,
    candidateIds,
    model: "experimental-rd-compatibility-v1" as const,
    status: "scientist_approval_required" as const,
  };
}

export class GaggleLabStore {
  private readonly audit: AuditEvent[] = [];
  private readonly proposals = new Map<string, Proposal>();

  constructor(private readonly fixture: GaggleFixture) {}

  getCase() {
    return this.fixture;
  }

  preview(candidateIdsInput: string[]) {
    const known = new Set(this.fixture.initialCandidates.map((candidate) => candidate.id));
    const candidateIds = [...new Set(candidateIdsInput)];
    if (candidateIds.length !== candidateIdsInput.length) {
      throw new Error("Candidate ids must be unique.");
    }
    for (const candidateId of candidateIds) {
      if (!known.has(candidateId)) {
        throw new Error(`Unknown candidate id: ${candidateId}`);
      }
    }
    const expected = this.fixture.approval.candidateIds;
    if (
      candidateIds.length !== expected.length ||
      candidateIds.some((candidateId, index) => candidateId !== expected[index])
    ) {
      throw new Error("Candidate set does not match the deliberated proposal.");
    }

    const canonical = canonicalProposal(this.fixture.caseId, candidateIds);
    const proposalHash =
      "sha256:" + createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
    if (proposalHash !== this.fixture.approval.proposalHash) {
      throw new Error("Fixture proposal hash failed integrity verification.");
    }

    const existing = this.proposals.get(this.fixture.approval.proposalId);
    if (existing) {
      return { ...existing, mutationPerformed: false, replay: true };
    }

    const proposal: Proposal = {
      ...canonical,
      proposalId: this.fixture.approval.proposalId,
      proposalHash,
    };
    this.proposals.set(proposal.proposalId, proposal);
    this.appendAudit("proposal_previewed", proposal.proposalId);
    return { ...proposal, mutationPerformed: false, replay: false };
  }

  promote(input: { proposalId: string; proposalHash: string; approvedBy: string }) {
    const proposal = this.proposals.get(input.proposalId);
    if (!proposal || proposal.proposalHash !== input.proposalHash) {
      throw new Error("Proposal id and hash must match an exact preview.");
    }
    if (proposal.status === "approved_for_experimental_validation") {
      return { ...proposal, replay: true };
    }
    proposal.status = "approved_for_experimental_validation";
    this.appendAudit("proposal_promoted", proposal.proposalId, input.approvedBy);
    return { ...proposal, replay: false };
  }

  auditLog(): AuditEvent[] {
    return this.audit.map((event) => ({ ...event }));
  }

  private appendAudit(type: AuditEvent["type"], proposalId: string, approvedBy?: string) {
    this.audit.push({
      sequence: this.audit.length + 1,
      eventId: randomUUID(),
      type,
      proposalId,
      at: new Date().toISOString(),
      ...(approvedBy ? { approvedBy } : {}),
    });
  }
}
