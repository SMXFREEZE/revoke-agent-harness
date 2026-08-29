import { describe, expect, it } from "vitest";
import { buildMicrobeResult } from "../mcp/microbe-result.mjs";
import { MAX_MICROBE_NAME_LENGTH, parseMicrobeName, resolveMicrobeQuery } from "../mcp/tool-input.mjs";

describe("MCP tool input guards", () => {
  it("rejects absent, empty, whitespace-only, and oversized microbe names", () => {
    expect(parseMicrobeName(undefined)).toBeNull();
    expect(parseMicrobeName(42)).toBeNull();
    expect(parseMicrobeName("")).toBeNull();
    expect(parseMicrobeName("  \t\n  ")).toBeNull();
    expect(parseMicrobeName("a".repeat(MAX_MICROBE_NAME_LENGTH + 1))).toBeNull();
  });

  it("trims a bounded microbe name before matching", () => {
    expect(parseMicrobeName("  Akkermansia muciniphila  ")).toBe("Akkermansia muciniphila");
  });

  it("resolves the advertised E. coli alias without matching an unrelated taxon", () => {
    const abundance = [
      { species: "Enterococcus coli" },
      { species: "Escherichia coli" },
      { species: "Akkermansia muciniphila" },
    ];

    expect(resolveMicrobeQuery(abundance, "E. coli")).toMatchObject({
      scope: "species",
      label: "Escherichia coli",
      taxa: [{ species: "Escherichia coli" }],
    });
    expect(resolveMicrobeQuery(abundance, "Akkermansia")).toMatchObject({
      scope: "genus",
      label: "Akkermansia",
      taxa: [{ species: "Akkermansia muciniphila" }],
    });
    expect(resolveMicrobeQuery(abundance, "coli")).toBeNull();
  });

  it("returns every exact-genus species so callers can aggregate deterministically", () => {
    const abundance = [
      { species: "Bacteroides vulgatus", pct: 8 },
      { species: "Other taxon", pct: 70 },
      { species: "Bacteroides uniformis", pct: 12 },
    ];

    const match = resolveMicrobeQuery(abundance, "Bacteroides");
    expect(match).toMatchObject({ scope: "genus", label: "Bacteroides" });
    expect(match.taxa.map((taxon) => taxon.species)).toEqual([
      "Bacteroides vulgatus",
      "Bacteroides uniformis",
    ]);
    expect(match.taxa.reduce((sum, taxon) => sum + taxon.pct, 0)).toBe(20);

    const response = buildMicrobeResult({ abundance }, "Bacteroides", {
      analysisId: "analysis-1",
      clinicalFor: () => "curated genus context",
    });
    expect(response).toMatchObject({
      analysisId: "analysis-1",
      status: "report_ready",
      microbe: "Bacteroides",
      scope: "genus",
      abundance: {
        scope: "genus",
        percent: 20,
        speciesCount: 2,
        taxa: [
          { species: "Bacteroides vulgatus", percent: 8 },
          { species: "Bacteroides uniformis", percent: 12 },
        ],
      },
      clinical: "curated genus context",
    });
  });

  it("does not report zero-abundance reference taxa as observed", () => {
    const report = {
      abundance: [
        { species: "Bacteroides vulgatus", pct: 0, reads: 0 },
        { species: "Bacteroides uniformis", pct: 0, reads: 0 },
        { species: "Escherichia coli", pct: 0, reads: 0 },
      ],
    };

    expect(buildMicrobeResult(report, "Bacteroides")).toMatchObject({
      scope: "genus",
      referenceMatched: true,
      found: false,
      abundance: null,
    });
    expect(buildMicrobeResult(report, "E. coli")).toMatchObject({
      microbe: "Escherichia coli",
      scope: "species",
      referenceMatched: true,
      found: false,
      abundance: null,
    });
  });

  it("keeps rounded genus totals equal to the returned species breakdown", () => {
    const response = buildMicrobeResult({
      abundance: [
        { species: "Bacteroides vulgatus", pct: 0.005, reads: 1 },
        { species: "Bacteroides uniformis", pct: 0.005, reads: 1 },
      ],
    }, "Bacteroides");

    expect(response.abundance.percent).toBe(0.01);
    expect(response.abundance.taxa.map((taxon) => taxon.percent)).toEqual([0.01, 0]);
    expect(response.abundance.taxa.reduce((sum, taxon) => sum + taxon.percent, 0))
      .toBe(response.abundance.percent);
  });

  it("keeps exact species aliases species-scoped", () => {
    const response = buildMicrobeResult({
      abundance: [{
        species: "Escherichia coli",
        pct: 1.234,
        reads: 12,
        status: "high",
        phylum: "Proteobacteria",
        healthyLo: 0,
        healthyHi: 1,
      }],
    }, "E. coli");

    expect(response).toMatchObject({
      microbe: "Escherichia coli",
      scope: "species",
      referenceMatched: true,
      found: true,
      abundance: {
        scope: "species",
        percent: 1.23,
        status: "high",
        phylum: "Proteobacteria",
        healthyRange: "0-1%",
      },
    });
  });
});
