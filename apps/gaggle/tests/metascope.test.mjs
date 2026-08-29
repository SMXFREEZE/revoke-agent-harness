import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

function loadMetaScope() {
  const source = readFileSync(new URL("../public/engine/metascope.js", import.meta.url), "utf8");
  const context = { window: {}, setTimeout };
  vm.runInNewContext(source, context, { filename: "metascope.js" });
  return context.window.MetaScope;
}

const MetaScope = loadMetaScope();
const high = (length) => "I".repeat(length);

describe("MetaScope quality control and evidence guards", () => {
  it("keeps the reviewed source and browser runtime engine identical", () => {
    const source = readFileSync(new URL("../lib/ggg/metascope.js", import.meta.url), "utf8");
    const browserRuntime = readFileSync(new URL("../public/engine/metascope.js", import.meta.url), "utf8");
    expect(browserRuntime).toBe(source);
  });

  it("trims adapters and low-quality ends, then rejects unusable reads", () => {
    const adapter = "AGATCGGAAGAGC";
    const reads = [
      { seq: "A".repeat(40), qual: high(40) },
      { seq: `${"C".repeat(35)}${adapter}${"G".repeat(8)}`, qual: high(56) },
      { seq: "T".repeat(40), qual: `${high(35)}${"!".repeat(5)}` },
      { seq: "G".repeat(40), qual: "!".repeat(40) },
    ];

    const filtered = MetaScope.filterReads(reads, { minReportReads: 1 });

    expect(filtered.quality.rawReads).toBe(4);
    expect(filtered.quality.reads).toBe(3);
    expect(filtered.quality.filteredReads).toBe(1);
    expect(filtered.quality.adapterTrimmedReads).toBe(1);
    expect(filtered.quality.qualityTrimmedReads).toBe(2);
    expect(Array.from(filtered.reads, (read) => read.seq.length)).toEqual([40, 35, 35]);
    expect(filtered.quality.qualityGatePassed).toBe(true);
  });

  it("classifies and determines downstream eligibility from QC-retained reads only", async () => {
    const seq = "ACGTTGCATGTCAGTACGATCGTAGCTAGTCGATCGGATCC";
    const fastq = [
      "@good", seq, "+", high(seq.length),
      "@bad", seq, "+", "!".repeat(seq.length),
    ].join("\n");
    const reference = {
      k: 5,
      readLen: seq.length,
      taxa: [{
        id: "only", species: "Example taxon", phylum: "Firmicutes", genome: seq,
        named: true, concern: "none", healthyLo: 0, healthyHi: 100,
      }],
    };

    const result = await MetaScope.run(fastq, { reference });

    expect(result.quality.rawReads).toBe(2);
    expect(result.quality.reads).toBe(1);
    expect(result.classified).toBe(1);
    expect(result.reportEligible).toBe(false);
    expect(result.classificationEvidence.sufficient).toBe(false);
    expect(result.scores).toBeNull();
    expect(Array.from(result.recommendations)).toEqual([]);
  });

  it("withholds abundance scores and recommendations when classifications are zero or sparse despite passing QC", async () => {
    const matched = "ACGTTGCATGTCAGTACGATCGTAGCTAGTCGATCGGATCC";
    const unmatched = "A".repeat(matched.length);
    const reference = {
      k: 5,
      readLen: matched.length,
      taxa: [{
        id: "only", species: "Example taxon", phylum: "Firmicutes", genome: matched,
        named: true, concern: "none", healthyLo: 0, healthyHi: 100,
      }],
    };
    const asFastq = (sequences) => sequences.flatMap((seq, index) => [
      `@read-${index}`, seq, "+", high(seq.length),
    ]).join("\n");

    const [zero, sparse] = await Promise.all([
      MetaScope.run(asFastq(Array(20).fill(unmatched)), { reference }),
      MetaScope.run(asFastq([matched, matched, ...Array(18).fill(unmatched)]), { reference }),
    ]);

    expect(zero.quality.qualityGatePassed).toBe(true);
    expect(zero.classified).toBe(0);
    expect(sparse.quality.qualityGatePassed).toBe(true);
    expect(sparse.classified).toBe(2);
    for (const result of [zero, sparse]) {
      expect(result.classificationEvidence.sufficient).toBe(false);
      expect(result.classificationEvidence.minClassifiedPct).toBe(50);
      expect(result.reportEligible).toBe(false);
      expect(result.scores).toBeNull();
      expect(Array.from(result.recommendations)).toEqual([]);
    }
  });

  it("bases recommendation rationale on measured abundance, not invented history", () => {
    const recs = MetaScope.recommend(
      { lacto: 0.1 },
      { lacto: { concern: "low", healthyLo: 0.3, healthyHi: 1.5 } },
      { shannon: 3.5 },
      {},
    );
    const lacto = recs.find((rec) => rec.strain === "Lactobacillus rhamnosus GG");

    expect(lacto).toBeTruthy();
    expect(lacto.why).toMatch(/0\.10%/);
    expect(lacto.why).not.toMatch(/antibiotic|reported|noted|history/i);
  });

  it("aggregates genus evidence and leaves absent, weak, or tied evidence unclassified", () => {
    const taxa = [
      { id: "b1", species: "Bacteroides alpha" },
      { id: "b2", species: "Bacteroides beta" },
      { id: "p1", species: "Prevotella copri" },
      { id: "x1", species: "Other taxon" },
    ];

    expect(MetaScope.inferEnterotype({}, taxa, 100).label).toBe("Unclassified");
    expect(MetaScope.inferEnterotype({ b1: 2, p1: 1 }, taxa, 100).label).toBe("Unclassified");
    expect(MetaScope.inferEnterotype({ b1: 8, b2: 2, p1: 10 }, taxa, 100).label).toBe("Unclassified");

    const bacteroides = MetaScope.inferEnterotype({ b1: 12, b2: 10, p1: 3, x1: 75 }, taxa, 100);
    expect(bacteroides.label).toBe("Bacteroides-type (Type 1)");
    expect(bacteroides.bacteroides).toBe(22);
    expect(bacteroides.prevotella).toBe(3);
  });
});
