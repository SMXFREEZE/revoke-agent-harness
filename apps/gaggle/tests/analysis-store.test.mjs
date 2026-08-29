import { describe, expect, it } from "vitest";
import { createAnalysisStore } from "../mcp/analysis-store.mjs";

describe("analysis store", () => {
  it("keeps concurrent reports isolated by analysis ID", () => {
    let nextId = 0;
    const store = createAnalysisStore({ idFactory: () => `analysis-${++nextId}` });
    const firstId = store.create({ sample: "first" });
    const secondId = store.create({ sample: "second" });

    expect(firstId).not.toBe(secondId);
    expect(store.get(firstId)).toEqual({ sample: "first" });
    expect(store.get(secondId)).toEqual({ sample: "second" });
  });

  it("expires idle reports and bounds retained analyses", () => {
    let clock = 0;
    let nextId = 0;
    const store = createAnalysisStore({
      ttlMs: 100,
      maxEntries: 2,
      now: () => clock,
      idFactory: () => `analysis-${++nextId}`,
    });

    const firstId = store.create({ sample: "first" });
    clock = 10;
    const secondId = store.create({ sample: "second" });
    clock = 20;
    expect(store.get(firstId)).toEqual({ sample: "first" });
    clock = 30;
    const thirdId = store.create({ sample: "third" });

    expect(store.get(firstId)).toEqual({ sample: "first" });
    expect(store.get(secondId)).toBeNull();
    expect(store.get(thirdId)).toEqual({ sample: "third" });

    clock = 131;
    expect(store.get(firstId)).toBeNull();
    expect(store.get(thirdId)).toBeNull();
    expect(store.size).toBe(0);
  });
});
