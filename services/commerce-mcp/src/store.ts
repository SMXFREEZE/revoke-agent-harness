import { createHash, randomUUID } from "node:crypto";
import {
  CatalogItemSchema,
  OrderSchema,
  type CatalogItem,
  type Order,
} from "@revoke/domain";
import { z } from "zod";
import {
  verifyApprovalArtifact,
  type ApprovalArtifact,
  type ApprovalOperation,
} from "./approval.js";

const ProposalSchema = z.object({
  proposalId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  recallNumber: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  changes: z.array(
    z.object({
      sku: z.string().min(1),
      before: z.object({
        status: z.enum(["active", "quarantined"]),
        inventoryHeld: z.boolean(),
      }),
      after: z.object({
        status: z.literal("quarantined"),
        inventoryHeld: z.literal(true),
      }),
    }),
  ),
});

const ReceiptSchema = z.object({
  receiptId: z.string().uuid(),
  action: z.enum(["containment.applied", "containment.rolled_back", "notices.drafted"]),
  recallNumber: z.string().min(1),
  executedAt: z.string().datetime({ offset: true }),
  approvedBy: z.string().min(1),
  idempotencyKey: z.string().min(1),
  targetSkus: z.array(z.string().min(1)),
  changes: z.array(z.record(z.string(), z.unknown())),
  rollbackAvailable: z.boolean(),
});

const AuditEventSchema = z.object({
  sequence: z.number().int().positive(),
  event: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  details: z.record(z.string(), z.unknown()),
});

export type ContainmentProposal = z.infer<typeof ProposalSchema>;
export type ActionReceipt = z.infer<typeof ReceiptSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;

function hashPayload(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export class CommerceStore {
  readonly #catalog: Map<string, CatalogItem>;
  readonly #orders: Order[];
  readonly #actionableTargetsByRecall: Map<string, Set<string>>;
  readonly #approvalSecret: string;
  readonly #proposals = new Map<string, ContainmentProposal>();
  readonly #receiptsById = new Map<string, ActionReceipt>();
  readonly #receiptsByIdempotencyKey = new Map<string, ActionReceipt>();
  readonly #audit: AuditEvent[] = [];

  constructor(
    catalogInput: CatalogItem[],
    ordersInput: Order[],
    actionableTargetsByRecallInput: Record<string, string[]>,
    approvalSecret: string,
  ) {
    const catalog = CatalogItemSchema.array().parse(catalogInput);
    this.#catalog = new Map(catalog.map((item) => [item.sku, structuredClone(item)]));
    this.#orders = structuredClone(OrderSchema.array().parse(ordersInput));
    this.#actionableTargetsByRecall = new Map(
      Object.entries(actionableTargetsByRecallInput).map(([recallNumber, skus]) => [
        z.string().min(1).parse(recallNumber),
        new Set(z.array(z.string().min(1)).parse(skus)),
      ]),
    );
    this.#approvalSecret = approvalSecret;
  }

  listCatalog(): CatalogItem[] {
    return [...this.#catalog.values()]
      .map((item) => structuredClone(item))
      .sort((left, right) => left.sku.localeCompare(right.sku));
  }

  getOrdersBySkus(skus: string[]): Order[] {
    const targetSet = new Set(uniqueSorted(skus));
    return this.#orders
      .filter((order) => order.items.some((item) => targetSet.has(item.sku)))
      .map((order) => structuredClone(order));
  }

  previewContainment(recallNumber: string, skusInput: string[]): ContainmentProposal {
    const skus = uniqueSorted(z.array(z.string().min(1)).min(1).parse(skusInput));
    const evidenceDerivedTargets = this.#actionableTargetsByRecall.get(recallNumber);
    if (evidenceDerivedTargets === undefined) {
      throw new Error("No trusted actionable-target artifact exists for recall " + recallNumber + ".");
    }
    const changes = skus.map((sku) => {
      if (!evidenceDerivedTargets.has(sku)) {
        throw new Error("SKU is not an evidence-derived actionable target: " + sku);
      }
      const item = this.#catalog.get(sku);
      if (item === undefined) {
        throw new Error("Unknown catalog SKU: " + sku);
      }
      if (item.status !== "active" || item.inventoryHeld) {
        throw new Error("SKU is not eligible for a new containment action: " + sku);
      }
      return {
        sku,
        before: {
          status: item.status,
          inventoryHeld: item.inventoryHeld,
        },
        after: {
          status: "quarantined" as const,
          inventoryHeld: true as const,
        },
      };
    });

    const proposalDigest = hashPayload({ recallNumber, changes });
    const proposal = ProposalSchema.parse({
      proposalId: "proposal-" + proposalDigest.slice(0, 16),
      idempotencyKey: recallNumber + ":containment:" + proposalDigest.slice(0, 24),
      recallNumber,
      createdAt: new Date().toISOString(),
      changes,
    });

    this.#proposals.set(proposal.proposalId, proposal);
    this.#record("containment.previewed", {
      proposalId: proposal.proposalId,
      recallNumber,
      targetSkus: skus,
    });
    return structuredClone(proposal);
  }

  applyContainment(input: {
    proposalId: string;
    idempotencyKey: string;
    approval: ApprovalArtifact;
  }): { receipt: ActionReceipt; replayed: boolean } {
    const proposal = this.#proposals.get(input.proposalId);
    if (proposal === undefined) {
      throw new Error("Unknown or expired containment proposal.");
    }
    if (proposal.idempotencyKey !== input.idempotencyKey) {
      throw new Error("Idempotency key does not match the previewed proposal.");
    }
    const approval = this.#verifyApproval(
      input.approval,
      "apply_containment",
      proposal.proposalId,
      input.idempotencyKey,
    );
    const replay = this.#replayFor(
      input.idempotencyKey,
      "containment.applied",
      proposal.recallNumber,
      proposal.changes.map((change) => change.sku),
    );
    if (replay !== undefined) {
      return replay;
    }

    for (const change of proposal.changes) {
      const item = this.#catalog.get(change.sku);
      if (
        item === undefined ||
        item.status !== change.before.status ||
        item.inventoryHeld !== change.before.inventoryHeld
      ) {
        throw new Error(
          "Catalog state changed after preview; create a new proposal before applying.",
        );
      }
    }

    for (const change of proposal.changes) {
      const item = this.#catalog.get(change.sku);
      if (item !== undefined) {
        item.status = change.after.status;
        item.inventoryHeld = change.after.inventoryHeld;
      }
    }

    const receipt = ReceiptSchema.parse({
      receiptId: randomUUID(),
      action: "containment.applied",
      recallNumber: proposal.recallNumber,
      executedAt: new Date().toISOString(),
      approvedBy: approval.approvedBy,
      idempotencyKey: input.idempotencyKey,
      targetSkus: proposal.changes.map((change) => change.sku),
      changes: proposal.changes,
      rollbackAvailable: true,
    });

    this.#saveReceipt(receipt);
    this.#record("containment.applied", {
      proposalId: proposal.proposalId,
      receiptId: receipt.receiptId,
      approvedBy: approval.approvedBy,
      targetSkus: receipt.targetSkus,
    });
    return { receipt: structuredClone(receipt), replayed: false };
  }

  rollbackContainment(input: {
    receiptId: string;
    idempotencyKey: string;
    approval: ApprovalArtifact;
  }): { receipt: ActionReceipt; replayed: boolean } {
    const source = this.#receiptsById.get(input.receiptId);
    if (source === undefined || source.action !== "containment.applied") {
      throw new Error("A valid containment receipt is required for rollback.");
    }

    const expectedKey = "rollback:" + source.receiptId;
    if (input.idempotencyKey !== expectedKey) {
      throw new Error("Rollback idempotency key must be " + expectedKey + ".");
    }
    const approval = this.#verifyApproval(
      input.approval,
      "rollback_containment",
      source.receiptId,
      input.idempotencyKey,
    );
    const replay = this.#replayFor(
      input.idempotencyKey,
      "containment.rolled_back",
      source.recallNumber,
      source.targetSkus,
    );
    if (replay !== undefined) {
      return replay;
    }

    const rollbackChanges: Array<Record<string, unknown>> = [];
    for (const rawChange of source.changes) {
      const parsed = z
        .object({
          sku: z.string(),
          before: z.object({
            status: z.enum(["active", "quarantined"]),
            inventoryHeld: z.boolean(),
          }),
        })
        .parse(rawChange);
      const item = this.#catalog.get(parsed.sku);
      if (item === undefined) {
        throw new Error("Rollback target is missing: " + parsed.sku);
      }
      rollbackChanges.push({
        sku: parsed.sku,
        before: {
          status: item.status,
          inventoryHeld: item.inventoryHeld,
        },
        after: parsed.before,
      });
      item.status = parsed.before.status;
      item.inventoryHeld = parsed.before.inventoryHeld;
    }

    const receipt = ReceiptSchema.parse({
      receiptId: randomUUID(),
      action: "containment.rolled_back",
      recallNumber: source.recallNumber,
      executedAt: new Date().toISOString(),
      approvedBy: approval.approvedBy,
      idempotencyKey: input.idempotencyKey,
      targetSkus: source.targetSkus,
      changes: rollbackChanges,
      rollbackAvailable: false,
    });
    this.#saveReceipt(receipt);
    this.#record("containment.rolled_back", {
      sourceReceiptId: source.receiptId,
      receiptId: receipt.receiptId,
      approvedBy: approval.approvedBy,
      targetSkus: receipt.targetSkus,
    });
    return { receipt: structuredClone(receipt), replayed: false };
  }

  createNoticeDrafts(input: {
    receiptId: string;
    idempotencyKey: string;
    approval: ApprovalArtifact;
  }): { receipt: ActionReceipt; replayed: boolean } {
    const source = this.#receiptsById.get(input.receiptId);
    if (source === undefined || source.action !== "containment.applied") {
      throw new Error("Notices require a successful containment receipt.");
    }

    const expectedKey = "draft-notices:" + source.receiptId;
    if (input.idempotencyKey !== expectedKey) {
      throw new Error("Notice idempotency key must be " + expectedKey + ".");
    }
    const approval = this.#verifyApproval(
      input.approval,
      "create_notice_drafts",
      source.receiptId,
      input.idempotencyKey,
    );
    const replay = this.#replayFor(
      input.idempotencyKey,
      "notices.drafted",
      source.recallNumber,
      source.targetSkus,
    );
    if (replay !== undefined) {
      return replay;
    }

    const orders = this.getOrdersBySkus(source.targetSkus);
    const customers = uniqueSorted(orders.map((order) => order.customerId));
    const changes = customers.map((customerId) => ({
      draftId: "draft-" + hashPayload({ source: source.receiptId, customerId }).slice(0, 12),
      customerId,
      delivery: "test-sink",
      status: "draft",
    }));

    const receipt = ReceiptSchema.parse({
      receiptId: randomUUID(),
      action: "notices.drafted",
      recallNumber: source.recallNumber,
      executedAt: new Date().toISOString(),
      approvedBy: approval.approvedBy,
      idempotencyKey: input.idempotencyKey,
      targetSkus: source.targetSkus,
      changes,
      rollbackAvailable: false,
    });
    this.#saveReceipt(receipt);
    this.#record("notices.drafted", {
      sourceReceiptId: source.receiptId,
      receiptId: receipt.receiptId,
      approvedBy: approval.approvedBy,
      draftCount: changes.length,
      delivery: "test-sink",
    });
    return { receipt: structuredClone(receipt), replayed: false };
  }

  auditLog(): AuditEvent[] {
    return structuredClone(this.#audit);
  }

  #verifyApproval(
    artifact: ApprovalArtifact,
    operation: ApprovalOperation,
    resourceId: string,
    idempotencyKey: string,
  ): ApprovalArtifact {
    return verifyApprovalArtifact(this.#approvalSecret, artifact, {
      operation,
      resourceId,
      idempotencyKey,
    });
  }

  #replayFor(
    idempotencyKey: string,
    expectedAction: ActionReceipt["action"],
    expectedRecallNumber: string,
    expectedTargetSkus: string[],
  ): { receipt: ActionReceipt; replayed: true } | undefined {
    const existing = this.#receiptsByIdempotencyKey.get(idempotencyKey);
    if (existing === undefined) {
      return undefined;
    }
    if (
      existing.action !== expectedAction ||
      existing.recallNumber !== expectedRecallNumber ||
      JSON.stringify(uniqueSorted(existing.targetSkus)) !==
        JSON.stringify(uniqueSorted(expectedTargetSkus))
    ) {
      throw new Error("Idempotency key is already bound to a different operation.");
    }
    return { receipt: structuredClone(existing), replayed: true };
  }

  #saveReceipt(receipt: ActionReceipt): void {
    this.#receiptsById.set(receipt.receiptId, receipt);
    this.#receiptsByIdempotencyKey.set(receipt.idempotencyKey, receipt);
  }

  #record(event: string, details: Record<string, unknown>): void {
    this.#audit.push(
      AuditEventSchema.parse({
        sequence: this.#audit.length + 1,
        event,
        occurredAt: new Date().toISOString(),
        details,
      }),
    );
  }
}
