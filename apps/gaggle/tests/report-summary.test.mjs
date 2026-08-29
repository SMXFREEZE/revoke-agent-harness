import { describe, expect, it } from "vitest";
import {
  classificationEvidenceFor,
  guardReport,
  reportEligibility,
  summarisePlan,
  summariseReport,
} from "../mcp/report-summary.mjs";

const sparseReport = {
  reportEligible: false,
  classified: 2,
  quality: { qualityGatePassed: true, rawReads: 20, reads: 20, passPct: 100 },
  classificationEvidence: {
    sufficient: false,
    classifiedReads: 2,
    retainedReads: 20,
    classifiedPct: 10,
    minClassifiedReads: 20,
    minClassifiedPct: 50,
  },
  scores: null,
  abundance: [{ species: "Sparse match", pct: 100, status: "high", phylum: "Firmicutes" }],
  recommendations: [{ strain: "Must not leak", tag: "Sparse", why: "Not enough evidence" }],
};

describe("MCP report eligibility boundary", () => {
  it("returns a typed insufficient-evidence summary without taxa, flags, scores, or a plan", () => {
    const summary = summariseReport(sparseReport, {
      analysisId: "analysis-sparse",
      operation: "analyze_gut_sample",
    });

    expect(summary).toMatchObject({
      analysisId: "analysis-sparse",
      operation: "analyze_gut_sample",
      status: "insufficient_evidence",
      reportEligible: false,
      reason: "insufficient_classified_evidence",
      classificationEvidence: {
        sufficient: false,
        classifiedReads: 2,
        retainedReads: 20,
        classifiedPct: 10,
        minClassifiedPct: 50,
      },
    });
    for (const forbidden of ["gutHealthScore", "diversity", "enterotype", "taxa", "flagged", "plan"]) {
      expect(summary).not.toHaveProperty(forbidden);
    }
  });

  it("applies the same typed guard to analyze, report, plan, and microbe operations", () => {
    const responses = [
      summariseReport(sparseReport, { analysisId: "id", operation: "analyze_gut_sample" }),
      summariseReport(sparseReport, { analysisId: "id", operation: "get_report" }),
      summarisePlan(sparseReport, { analysisId: "id", operation: "get_plan" }),
      guardReport(sparseReport, { analysisId: "id", operation: "explain_microbe" }),
    ];

    expect(responses.map((response) => response.operation)).toEqual([
      "analyze_gut_sample",
      "get_report",
      "get_plan",
      "explain_microbe",
    ]);
    for (const response of responses) {
      expect(response.status).toBe("insufficient_evidence");
      expect(response.reportEligible).toBe(false);
      expect(response.classificationEvidence.minClassifiedPct).toBe(50);
      expect(response).not.toHaveProperty("taxa");
      expect(response).not.toHaveProperty("flagged");
      expect(response).not.toHaveProperty("plan");
    }
  });

  it("enforces the 50 percent evidence floor even if an input advertises a weaker threshold", () => {
    const forgedWeakThreshold = {
      ...sparseReport,
      reportEligible: true,
      classified: 20,
      quality: { qualityGatePassed: true, rawReads: 100, reads: 100, passPct: 100 },
      classificationEvidence: {
        sufficient: true,
        classifiedReads: 20,
        retainedReads: 100,
        classifiedPct: 20,
        minClassifiedReads: 20,
        minClassifiedPct: 5,
      },
      scores: { scfa: 50, resilience: 50, dysbiosis: 50 },
    };

    expect(classificationEvidenceFor(forgedWeakThreshold).minClassifiedPct).toBe(50);
    expect(reportEligibility(forgedWeakThreshold).eligible).toBe(false);
  });

  it("recomputes classification share from bounded counts instead of trusting supplied percentages", () => {
    const inconsistent = {
      ...sparseReport,
      reportEligible: true,
      quality: { qualityGatePassed: true, rawReads: 100, reads: 100, passPct: 100 },
      classificationEvidence: {
        sufficient: true,
        classifiedReads: 2,
        retainedReads: 100,
        classifiedPct: 100,
        minClassifiedReads: 20,
        minClassifiedPct: 50,
      },
      scores: { scfa: 50, resilience: 50, dysbiosis: 50 },
    };

    const evidence = classificationEvidenceFor(inconsistent);
    expect(evidence.classifiedPct).toBe(2);
    expect(evidence.sufficient).toBe(false);
    expect(reportEligibility(inconsistent).eligible).toBe(false);
  });

  it("allows a complete report only at or above the 50 percent boundary", () => {
    const eligible = {
      reportEligible: true,
      classified: 20,
      quality: { qualityGatePassed: true, rawReads: 40, reads: 40, passPct: 100 },
      classificationEvidence: {
        sufficient: true,
        classifiedReads: 20,
        retainedReads: 40,
        classifiedPct: 50,
        minClassifiedReads: 20,
        minClassifiedPct: 50,
      },
      scores: { scfa: 60, resilience: 70, dysbiosis: 20 },
      diversity: { shannon: 3.1, richness: 4 },
      abundance: [],
      recommendations: [],
      fbRatio: 1.2,
      enterotype: "Unclassified",
    };

    expect(reportEligibility(eligible).eligible).toBe(true);
    expect(summariseReport(eligible).status).toBe("report_ready");
  });
});
