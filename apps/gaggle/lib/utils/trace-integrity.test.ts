import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { verifyTraceIntegrity } from "./trace-integrity";

type ExportedTrace = {
  timeline: Array<{ label: string }>;
};

describe("browser trace integrity", () => {
  it("rejects a mutated timeline field when the exporter hash is unchanged", async () => {
    const tracePath = new URL("../../public/runs/gaggle-0042/trace.json", import.meta.url);
    const trace: unknown = JSON.parse(await readFile(tracePath, "utf8"));

    expect(await verifyTraceIntegrity(trace)).toBe(true);

    const tamperedTrace = structuredClone(trace) as ExportedTrace;
    tamperedTrace.timeline[0].label = `${tamperedTrace.timeline[0].label} (tampered)`;

    expect(await verifyTraceIntegrity(tamperedTrace)).toBe(false);
  });
});
