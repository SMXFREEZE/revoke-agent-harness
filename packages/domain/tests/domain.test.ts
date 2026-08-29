import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  analyzeJuryDisagreement,
  approveExperimentalProposal,
  buildBeliefRevision,
  CatalogItemSchema,
  OrderSchema,
  RecallSnapshotSchema,
  buildContainmentTargets,
  buildRecallExpansion,
  canonicalizeIdentifier,
  computeExposure,
  identifierSimilarity,
  matchExpansionToCatalog,
  prototypeEvidenceWeight,
  rankGaggleCandidates,
} from "../src/index.js";

async function readFixture<T>(relativePath: string): Promise<T> {
  const url = new URL("../../../fixtures/" + relativePath, import.meta.url);
  return JSON.parse(await readFile(url, "utf8")) as T;
}

describe("recall expansion", () => {
  it("extracts the thirteen identifiers added by the official August expansion", async () => {
    const july = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-july-2026.json"),
    );
    const august = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-august-expansion-2026.json"),
    );

    const expansion = buildRecallExpansion(july, august);

    expect(expansion.addedIdentifiers).toHaveLength(13);
    expect(expansion.familyScopeAdded).toBe(true);
    expect(expansion.addedIdentifiers.map((item) => item.value)).toContain("CGWM-024");
  });

  it("refuses to infer an expansion between unrelated recalls", async () => {
    const july = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-july-2026.json"),
    );
    const august = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-august-expansion-2026.json"),
    );

    expect(() =>
      buildRecallExpansion(
        {
          ...july,
          relatedRecallNumbers: [],
        },
        {
          ...august,
          relatedRecallNumbers: [],
        },
      ),
    ).toThrow(/not linked/);
  });
});

describe("catalog matching safety", () => {
  it("normalizes separators without weakening exact identifier semantics", () => {
    expect(canonicalizeIdentifier(" ccb-012/021 ")).toBe("CCB012021");
    expect(identifierSimilarity("CCB-395", "CB-395")).toBeGreaterThan(0.8);
  });

  it("keeps fuzzy-only candidates out of containment targets", async () => {
    const july = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-july-2026.json"),
    );
    const august = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-august-expansion-2026.json"),
    );
    const catalog = CatalogItemSchema.array().parse(
      await readFixture("catalog/demo-catalog.json"),
    );

    const expansion = buildRecallExpansion(july, august);
    const matches = matchExpansionToCatalog(expansion, august, catalog);
    const review = matches.find((match) => match.sku === "SKU-CUIS-CCB395-REVIEW");

    expect(review).toMatchObject({
      kind: "fuzzy_candidate",
      actionable: false,
      confidence: "manual_review",
    });

    const targets = buildContainmentTargets(matches, catalog);
    expect(targets).toEqual([
      "SKU-CUIS-CGWM024",
      "SKU-CUIS-CGWM059",
      "SKU-CUIS-FCB501",
      "SKU-CUIS-LEGACY18",
    ]);
    expect(targets).not.toContain("SKU-CUIS-CCB395-REVIEW");
    expect(targets).not.toContain("SKU-CUIS-CCB100");
  });
});

describe("exposure computation", () => {
  it("computes inventory and sold exposure from records rather than model prose", async () => {
    const catalog = CatalogItemSchema.array().parse(
      await readFixture("catalog/demo-catalog.json"),
    );
    const orders = OrderSchema.array().parse(await readFixture("catalog/demo-orders.json"));
    const targets = [
      "SKU-CUIS-CGWM024",
      "SKU-CUIS-CGWM059",
      "SKU-CUIS-FCB501",
      "SKU-CUIS-LEGACY18",
    ];

    expect(computeExposure(targets, catalog, orders)).toEqual({
      targetSkus: [...targets].sort(),
      inventoryUnits: 312,
      orderUnits: 5,
      affectedOrders: 4,
      affectedCustomers: 3,
      inventoryRetailValueCents: 480688,
      soldRetailValueCents: 8195,
    });
  });

  it("fails closed when a target SKU does not exist", async () => {
    const catalog = CatalogItemSchema.array().parse(
      await readFixture("catalog/demo-catalog.json"),
    );

    expect(() => computeExposure(["missing-sku"], catalog, [])).toThrow(/Unknown target SKU/);
  });
});

const initialCandidates = [
  {
    id: "candidate-a",
    label: "Candidate A",
    strain: "B. adolescentis GGG-A17",
    proposedRole: "acetate donor",
    pathwayComplementarity: 0.91,
    crossFeedingPotential: 0.93,
    ecosystemCompatibility: 0.82,
    evidenceStrength: 0.78,
    substrateCompetition: 0.18,
    uncertaintyPenalty: 0.22,
  },
  {
    id: "candidate-b",
    label: "Candidate B",
    strain: "A. hallii GGG-B42",
    proposedRole: "lactate-to-butyrate converter",
    pathwayComplementarity: 0.86,
    crossFeedingPotential: 0.8,
    ecosystemCompatibility: 0.9,
    evidenceStrength: 0.72,
    substrateCompetition: 0.24,
    uncertaintyPenalty: 0.2,
  },
  {
    id: "candidate-c",
    label: "Candidate C",
    strain: "F. prausnitzii GGG-C11",
    proposedRole: "butyrate network support",
    pathwayComplementarity: 0.78,
    crossFeedingPotential: 0.71,
    ecosystemCompatibility: 0.86,
    evidenceStrength: 0.68,
    substrateCompetition: 0.2,
    uncertaintyPenalty: 0.25,
  },
];

describe("The Gaggle deterministic R&D model", () => {
  it("changes its leader only after an explicit evidence-backed recomputation", () => {
    const revised = initialCandidates.map((candidate) =>
      candidate.id === "candidate-a"
        ? {
            ...candidate,
            evidenceStrength: 0.46,
            substrateCompetition: 0.88,
            uncertaintyPenalty: 0.52,
          }
        : candidate,
    );

    expect(rankGaggleCandidates(initialCandidates).map((entry) => entry.candidateId)).toEqual([
      "candidate-a",
      "candidate-b",
      "candidate-c",
    ]);

    const revision = buildBeliefRevision(
      initialCandidates,
      revised,
      "Sandbox competition result plus a species-to-strain methodology downgrade.",
    );
    expect(revision).toMatchObject({
      changedLeader: true,
      previousLeader: "candidate-a",
      currentLeader: "candidate-b",
    });
    expect(revision.changes.find((entry) => entry.candidateId === "candidate-a")).toMatchObject({
      previousRank: 1,
      currentRank: 3,
    });
  });

  it("weights species-level and methodology-flagged evidence below direct strain evidence", () => {
    const base = {
      id: "evidence-1",
      claim: "The candidate may participate in metabolite cross-feeding.",
      candidateId: "candidate-a",
      sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/16672507/",
      direction: "supports" as const,
      retrievedAt: "2026-08-29T12:00:00-04:00",
    };
    const direct = prototypeEvidenceWeight({
      ...base,
      sourceType: "direct_human_strain",
      scope: "strain_specific",
      methodologyFlags: [],
    });
    const extrapolated = prototypeEvidenceWeight({
      ...base,
      sourceType: "human_species",
      scope: "species_level",
      methodologyFlags: ["species_to_strain", "endpoint_mismatch"],
    });
    expect(direct).toBe(1);
    expect(extrapolated).toBeLessThan(0.4);
  });

  it("reports disagreement structure instead of averaging jury confidence", () => {
    const votes = [
      ["Mechanism", "mechanistic rigor", "promising", "model_assumption"],
      ["Human", "human evidence", "uncertain", "evidence_standard"],
      ["Ecology", "ecological fit", "promising", "model_assumption"],
      ["Methods", "methodological conservatism", "reject", "evidence_standard"],
      ["Balance", "balanced evidence", "promising", "uncertainty_weighting"],
    ] as const;
    const parsedVotes = votes.map(([judge, priority, verdict, disagreementClass], index) => ({
      judge,
      priority,
      verdict: verdict as "promising" | "uncertain" | "reject",
      confidence: 0.54 + index * 0.05,
      supportingFactor: "Deterministic compatibility output",
      uncertainty: "No direct human evidence for the exact synthetic strain",
      disagreementClass: disagreementClass as
        | "model_assumption"
        | "evidence_standard"
        | "uncertainty_weighting",
    }));

    expect(analyzeJuryDisagreement(parsedVotes)).toMatchObject({
      counts: { promising: 3, uncertain: 1, reject: 1 },
      level: "high",
    });
  });

  it("requires the exact proposal id and immutable hash for approval", () => {
    const request = {
      proposalId: "gaggle-proposal-0042",
      proposalHash:
        "sha256:fa33575d844316a3df6ab77ad8814ae1fdd11eab99291db1a1799ae70d525a8b",
      candidateIds: ["candidate-b", "candidate-c"],
      status: "scientist_approval_required" as const,
    };

    expect(() => approveExperimentalProposal(request, "APPROVE gaggle-proposal-0042")).toThrow(
      /exact immutable proposal/,
    );
    expect(
      approveExperimentalProposal(
        request,
        `APPROVE ${request.proposalId} ${request.proposalHash}`,
      ),
    ).toMatchObject({ status: "approved_for_experimental_validation" });
  });
});
