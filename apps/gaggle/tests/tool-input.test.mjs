import { describe, expect, it } from "vitest";
import { MAX_MICROBE_NAME_LENGTH, findMicrobeMatch, parseMicrobeName } from "../mcp/tool-input.mjs";

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

    expect(findMicrobeMatch(abundance, "E. coli")?.species).toBe("Escherichia coli");
    expect(findMicrobeMatch(abundance, "Akkermansia")?.species).toBe("Akkermansia muciniphila");
    expect(findMicrobeMatch(abundance, "coli")).toBeNull();
  });
});
