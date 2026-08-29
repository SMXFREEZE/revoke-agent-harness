export const BLAST_MAX_BODY_BYTES = 16 * 1024;
export const BLAST_MAX_READS = 12;
export const BLAST_MAX_READ_LENGTH = 1_000;
export const BLAST_MIN_READ_LENGTH = 20;
export const BLAST_DATABASE = "core_nt" as const;

export class BlastGuardError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BlastGuardError";
  }
}

export type BlastSubmission = {
  reads: string[];
  db: typeof BLAST_DATABASE;
};

export function normalizeBlastSubmission(value: unknown): BlastSubmission {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new BlastGuardError("invalid request", 400);
  }

  const body = value as Record<string, unknown>;
  if (body.db !== undefined && body.db !== BLAST_DATABASE) {
    throw new BlastGuardError("unsupported database", 400);
  }
  if (!Array.isArray(body.reads) || body.reads.length < 1 || body.reads.length > BLAST_MAX_READS) {
    throw new BlastGuardError(`reads must contain 1-${BLAST_MAX_READS} sequences`, 400);
  }

  const reads = body.reads.map((read) => {
    if (typeof read !== "string") {
      throw new BlastGuardError("each read must be a DNA sequence", 400);
    }
    const sequence = read.trim().toUpperCase();
    if (
      sequence.length < BLAST_MIN_READ_LENGTH ||
      sequence.length > BLAST_MAX_READ_LENGTH ||
      !/^[ACGTRYSWKMBDHVN]+$/.test(sequence)
    ) {
      throw new BlastGuardError("invalid DNA sequence", 400);
    }
    return sequence;
  });

  return { reads, db: BLAST_DATABASE };
}

export async function readBlastSubmission(req: Request): Promise<BlastSubmission> {
  if (!req.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    throw new BlastGuardError("content type must be application/json", 415);
  }

  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > BLAST_MAX_BODY_BYTES) {
    throw new BlastGuardError("request body too large", 413);
  }
  if (!req.body) {
    throw new BlastGuardError("request body required", 400);
  }

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let json = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > BLAST_MAX_BODY_BYTES) {
      await reader.cancel();
      throw new BlastGuardError("request body too large", 413);
    }
    json += decoder.decode(value, { stream: true });
  }
  json += decoder.decode();

  try {
    return normalizeBlastSubmission(JSON.parse(json));
  } catch (error) {
    if (error instanceof BlastGuardError) throw error;
    throw new BlastGuardError("invalid JSON", 400);
  }
}

type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export class FixedWindowRateLimiter {
  readonly #entries = new Map<string, { count: number; resetAt: number }>();

  constructor(
    readonly limit: number,
    readonly windowMs: number,
    readonly maxKeys = 1_024,
  ) {}

  consume(key: string, now = Date.now()): RateLimitResult {
    if (!this.#entries.has(key) && this.#entries.size >= this.maxKeys) this.#purge(now);

    const current = this.#entries.get(key);
    if (!current || current.resetAt <= now) {
      this.#entries.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }
    if (current.count >= this.limit) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
    }
    current.count += 1;
    return { allowed: true };
  }

  #purge(now: number) {
    for (const [key, entry] of this.#entries) {
      if (entry.resetAt <= now) this.#entries.delete(key);
    }
    while (this.#entries.size >= this.maxKeys) {
      const oldest = this.#entries.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.#entries.delete(oldest);
    }
  }
}

export function blastClientKey(req: Request): string {
  return (
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  ).slice(0, 128);
}
