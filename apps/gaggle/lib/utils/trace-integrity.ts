const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new TypeError("Trace integrity payload contains a non-JSON value.");
    }
    return serialized;
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

/** Mirrors the exporter's sorted-json-v1 payload exactly. */
export function serializeTraceIntegrityPayload(trace: unknown): string {
  const serialized = JSON.stringify(trace);
  if (serialized === undefined) {
    throw new TypeError("Trace integrity payload is not JSON serializable.");
  }

  const payload: unknown = JSON.parse(serialized);
  if (!isRecord(payload) || !isRecord(payload.run) || !isRecord(payload.run.integrity)) {
    throw new TypeError("Trace integrity metadata is missing.");
  }

  delete payload.run.integrity.value;
  return canonicalJson(payload);
}

export async function calculateTraceIntegrity(trace: unknown): Promise<string> {
  const canonicalPayload = serializeTraceIntegrityPayload(trace);
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalPayload),
  );
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}

export async function verifyTraceIntegrity(trace: unknown): Promise<boolean> {
  if (!isRecord(trace) || !isRecord(trace.run) || !isRecord(trace.run.integrity)) return false;
  const expected = trace.run.integrity.value;
  if (typeof expected !== "string" || !SHA256_PATTERN.test(expected)) return false;
  return (await calculateTraceIntegrity(trace)) === expected;
}
