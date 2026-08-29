import { describe, expect, it } from "vitest";
import {
  BLAST_MAX_BODY_BYTES,
  BlastGuardError,
  FixedWindowRateLimiter,
  normalizeBlastSubmission,
  readBlastSubmission,
} from "../lib/ggg/blast-guard";

const validRead = "ACGT".repeat(10);

describe("BLAST request boundary", () => {
  it("accepts only the bounded default database request", () => {
    expect(normalizeBlastSubmission({ reads: [validRead] })).toEqual({
      reads: [validRead],
      db: "core_nt",
    });
    expect(() => normalizeBlastSubmission({ reads: [validRead], db: "nt" })).toThrowError(
      new BlastGuardError("unsupported database", 400),
    );
  });

  it("rejects excessive, malformed, and oversized reads", () => {
    expect(() => normalizeBlastSubmission({ reads: Array(13).fill(validRead) })).toThrow(/1-12/);
    expect(() => normalizeBlastSubmission({ reads: ["not-dna-not-dna-not-dna"] })).toThrow(/invalid DNA/);
    expect(() => normalizeBlastSubmission({ reads: ["A".repeat(1_001)] })).toThrow(/invalid DNA/);
  });

  it("stops reading request bodies at the byte limit", async () => {
    const req = new Request("https://example.test/api/identify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reads: ["A".repeat(BLAST_MAX_BODY_BYTES)] }),
    });
    await expect(readBlastSubmission(req)).rejects.toMatchObject({ status: 413 });
  });

  it("enforces fixed-window quotas without resetting an existing key", () => {
    const limiter = new FixedWindowRateLimiter(2, 1_000, 1);
    expect(limiter.consume("same", 0)).toEqual({ allowed: true });
    expect(limiter.consume("same", 1)).toEqual({ allowed: true });
    expect(limiter.consume("same", 2)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(limiter.consume("same", 1_001)).toEqual({ allowed: true });
  });
});
