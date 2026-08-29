import { describe, expect, it } from "vitest";
import {
  assessReportEvidence,
  bacterialShareOfClassified,
  isBacterialPhylum,
} from "./report-evidence";

describe("full report evidence gate", () => {
  it("routes a bacterial minority match to sequence intelligence", () => {
    const evidence = assessReportEvidence({
      retainedReads: 1_000,
      classifiedReads: 50,
      bacterialReads: 50,
    });

    expect(evidence.classifiedPct).toBe(5);
    expect(evidence.bacterialPct).toBe(5);
    expect(evidence.representative).toBe(false);
    expect(evidence.bacterialDominant).toBe(false);
  });

  it("allows a representative bacterial majority of all retained reads", () => {
    const evidence = assessReportEvidence({
      retainedReads: 100,
      classifiedReads: 70,
      bacterialReads: 60,
    });

    expect(evidence.representative).toBe(true);
    expect(evidence.bacterialPct).toBe(60);
    expect(evidence.bacterialDominant).toBe(true);
  });

  it("does not turn a matched-subset majority into sample-wide dominance", () => {
    const evidence = assessReportEvidence({
      retainedReads: 100,
      classifiedReads: 60,
      bacterialReads: 48,
    });

    expect(evidence.representative).toBe(true);
    expect(evidence.bacterialPct).toBe(48);
    expect(evidence.bacterialDominant).toBe(false);
  });

  it("does not count Euryarchaeota or Methanobrevibacter matches as bacteria", () => {
    const bacterialShare = bacterialShareOfClassified({
      Euryarchaeota: 60,
      Firmicutes: 40,
    });
    const evidence = assessReportEvidence({
      retainedReads: 100,
      classifiedReads: 100,
      bacterialReads: bacterialShare,
    });

    expect(isBacterialPhylum("Euryarchaeota")).toBe(false);
    expect(isBacterialPhylum("Firmicutes")).toBe(true);
    expect(bacterialShare).toBe(40);
    expect(evidence.bacterialDominant).toBe(false);
  });

  it("fails closed for missing or invalid counts", () => {
    const evidence = assessReportEvidence({
      retainedReads: 0,
      classifiedReads: Number.NaN,
      bacterialReads: undefined,
    });

    expect(evidence.representative).toBe(false);
    expect(evidence.bacterialDominant).toBe(false);
  });
});
