import { randomUUID } from "node:crypto";

export const DEFAULT_ANALYSIS_TTL_MS = 30 * 60_000;
export const DEFAULT_MAX_ANALYSES = 32;

export function createAnalysisStore({
  ttlMs = DEFAULT_ANALYSIS_TTL_MS,
  maxEntries = DEFAULT_MAX_ANALYSES,
  now = () => Date.now(),
  idFactory = () => randomUUID(),
} = {}) {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new TypeError("ttlMs must be positive");
  if (!Number.isInteger(maxEntries) || maxEntries < 1) throw new TypeError("maxEntries must be positive");

  const entries = new Map();

  function purgeExpired(at = now()) {
    for (const [analysisId, entry] of entries) {
      if (entry.expiresAt <= at) entries.delete(analysisId);
    }
  }

  function makeRoom() {
    while (entries.size >= maxEntries) {
      let oldestId = null;
      let oldestAccess = Number.POSITIVE_INFINITY;
      for (const [analysisId, entry] of entries) {
        if (entry.lastAccessedAt < oldestAccess) {
          oldestId = analysisId;
          oldestAccess = entry.lastAccessedAt;
        }
      }
      if (oldestId === null) break;
      entries.delete(oldestId);
    }
  }

  return {
    create(report) {
      const createdAt = now();
      purgeExpired(createdAt);
      makeRoom();

      let analysisId;
      do analysisId = idFactory(); while (entries.has(analysisId));
      entries.set(analysisId, {
        report,
        createdAt,
        lastAccessedAt: createdAt,
        expiresAt: createdAt + ttlMs,
      });
      return analysisId;
    },

    get(analysisId) {
      if (typeof analysisId !== "string" || analysisId.length < 1 || analysisId.length > 128) return null;
      const accessedAt = now();
      purgeExpired(accessedAt);
      const entry = entries.get(analysisId);
      if (!entry) return null;
      entry.lastAccessedAt = accessedAt;
      entry.expiresAt = accessedAt + ttlMs;
      return entry.report;
    },

    delete(analysisId) {
      return entries.delete(analysisId);
    },

    get size() {
      purgeExpired();
      return entries.size;
    },
  };
}
