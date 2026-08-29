import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const ApprovalOperationSchema = z.enum([
  "apply_containment",
  "rollback_containment",
  "create_notice_drafts",
]);

const ApprovalArtifactPayloadSchema = z.object({
  version: z.literal(1),
  operation: ApprovalOperationSchema,
  resourceId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  approvedBy: z.string().min(1),
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  nonce: z.string().uuid(),
});

export const ApprovalArtifactSchema = ApprovalArtifactPayloadSchema.extend({
  signature: z.string().regex(/^[a-f0-9]{64}$/),
});

export type ApprovalOperation = z.infer<typeof ApprovalOperationSchema>;
export type ApprovalArtifact = z.infer<typeof ApprovalArtifactSchema>;

type ApprovalBinding = Pick<
  ApprovalArtifact,
  "operation" | "resourceId" | "idempotencyKey"
>;

function assertSecret(secret: string): void {
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("Approval signing secret must contain at least 32 bytes.");
  }
}

function canonicalPayload(payload: z.infer<typeof ApprovalArtifactPayloadSchema>): string {
  return JSON.stringify([
    payload.version,
    payload.operation,
    payload.resourceId,
    payload.idempotencyKey,
    payload.approvedBy,
    payload.issuedAt,
    payload.expiresAt,
    payload.nonce,
  ]);
}

function signatureFor(
  secret: string,
  payload: z.infer<typeof ApprovalArtifactPayloadSchema>,
): string {
  return createHmac("sha256", secret).update(canonicalPayload(payload)).digest("hex");
}

/**
 * Called only by the trusted approval boundary after a human approves the exact
 * operation. It is exported so that the approval service and tests can share
 * the wire contract; it is never registered as an MCP tool.
 */
export function createApprovalArtifact(
  secret: string,
  input: ApprovalBinding & {
    approvedBy: string;
    now?: Date;
    expiresInSeconds?: number;
    nonce?: string;
  },
): ApprovalArtifact {
  assertSecret(secret);
  const now = input.now ?? new Date();
  const expiresInSeconds = input.expiresInSeconds ?? 300;
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 600) {
    throw new Error("Approval lifetime must be between 1 and 600 seconds.");
  }
  const payload = ApprovalArtifactPayloadSchema.parse({
    version: 1,
    operation: input.operation,
    resourceId: input.resourceId,
    idempotencyKey: input.idempotencyKey,
    approvedBy: input.approvedBy,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiresInSeconds * 1_000).toISOString(),
    nonce: input.nonce ?? randomUUID(),
  });
  return ApprovalArtifactSchema.parse({ ...payload, signature: signatureFor(secret, payload) });
}

export function verifyApprovalArtifact(
  secret: string,
  artifactInput: unknown,
  expected: ApprovalBinding,
  now = new Date(),
): ApprovalArtifact {
  assertSecret(secret);
  const artifact = ApprovalArtifactSchema.parse(artifactInput);
  const { signature, ...payload } = artifact;
  const expectedSignature = Buffer.from(signatureFor(secret, payload), "hex");
  const receivedSignature = Buffer.from(signature, "hex");
  if (!timingSafeEqual(receivedSignature, expectedSignature)) {
    throw new Error("Approval artifact signature is invalid.");
  }
  if (
    artifact.operation !== expected.operation ||
    artifact.resourceId !== expected.resourceId ||
    artifact.idempotencyKey !== expected.idempotencyKey
  ) {
    throw new Error("Approval artifact is not bound to this exact operation.");
  }

  const issuedAt = Date.parse(artifact.issuedAt);
  const expiresAt = Date.parse(artifact.expiresAt);
  if (issuedAt > now.getTime() + 30_000 || expiresAt <= now.getTime()) {
    throw new Error("Approval artifact is expired or not yet valid.");
  }
  if (expiresAt - issuedAt > 600_000) {
    throw new Error("Approval artifact lifetime exceeds the maximum.");
  }
  return artifact;
}
