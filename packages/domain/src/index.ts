import { z } from "zod";

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const DateTimeSchema = z.string().datetime({ offset: true });

export const SourceEvidenceSchema = z.object({
  sourceUrl: z.url(),
  publisher: z.string().min(1),
  retrievedAt: DateTimeSchema,
  extractor: z.string().min(1),
  contentHash: z.string().min(8),
  mode: z.enum(["live", "fixture"]),
});

export const RecallIdentifierSchema = z.object({
  type: z.enum(["model", "upc", "sku"]),
  value: z.string().min(1),
});

export const FamilyScopeSchema = z.object({
  brand: z.string().min(1),
  category: z.string().min(1),
  includeAll: z.literal(true),
  rationale: z.string().min(1),
});

export const RecallSnapshotSchema = z.object({
  recallNumber: z.string().min(1),
  relatedRecallNumbers: z.array(z.string().min(1)).default([]),
  title: z.string().min(1),
  publicationDate: DateSchema,
  jurisdiction: z.string().min(1),
  manufacturer: z.string().min(1),
  productCategory: z.string().min(1),
  hazard: z.string().min(1),
  remedy: z.string().min(1),
  units: z.number().int().nonnegative(),
  identifiers: z.array(RecallIdentifierSchema),
  familyScope: FamilyScopeSchema.nullable().default(null),
  evidence: z.array(SourceEvidenceSchema).min(1),
});

export const CatalogItemSchema = z.object({
  sku: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  upc: z.string().min(1).optional(),
  title: z.string().min(1),
  category: z.string().min(1),
  firstSoldAt: DateSchema,
  status: z.enum(["active", "quarantined"]),
  inventoryUnits: z.number().int().nonnegative(),
  unitPriceCents: z.number().int().nonnegative(),
  inventoryHeld: z.boolean(),
});

export const OrderItemSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const OrderSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  placedAt: DateTimeSchema,
  items: z.array(OrderItemSchema).min(1),
});

export const RecallExpansionSchema = z.object({
  previousRecallNumber: z.string().min(1),
  currentRecallNumber: z.string().min(1),
  addedIdentifiers: z.array(RecallIdentifierSchema),
  familyScopeAdded: z.boolean(),
});

export const MatchResultSchema = z.object({
  sku: z.string().min(1),
  kind: z.enum(["exact_identifier", "family_scope", "fuzzy_candidate"]),
  confidence: z.enum(["high", "manual_review"]),
  actionable: z.boolean(),
  reason: z.string().min(1),
  matchedIdentifier: z.string().min(1).optional(),
  similarity: z.number().min(0).max(1).optional(),
});

export const ExposureSchema = z.object({
  targetSkus: z.array(z.string().min(1)),
  inventoryUnits: z.number().int().nonnegative(),
  orderUnits: z.number().int().nonnegative(),
  affectedOrders: z.number().int().nonnegative(),
  affectedCustomers: z.number().int().nonnegative(),
  inventoryRetailValueCents: z.number().int().nonnegative(),
  soldRetailValueCents: z.number().int().nonnegative(),
});

export type SourceEvidence = z.infer<typeof SourceEvidenceSchema>;
export type RecallIdentifier = z.infer<typeof RecallIdentifierSchema>;
export type FamilyScope = z.infer<typeof FamilyScopeSchema>;
export type RecallSnapshot = z.infer<typeof RecallSnapshotSchema>;
export type CatalogItem = z.infer<typeof CatalogItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type RecallExpansion = z.infer<typeof RecallExpansionSchema>;
export type MatchResult = z.infer<typeof MatchResultSchema>;
export type Exposure = z.infer<typeof ExposureSchema>;

export function canonicalizeIdentifier(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function identifierKey(identifier: RecallIdentifier): string {
  return identifier.type + ":" + canonicalizeIdentifier(identifier.value);
}

function scopesAreEqual(left: FamilyScope | null, right: FamilyScope | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }

  return (
    canonicalizeIdentifier(left.brand) === canonicalizeIdentifier(right.brand) &&
    canonicalizeIdentifier(left.category) === canonicalizeIdentifier(right.category) &&
    left.includeAll === right.includeAll
  );
}

export function buildRecallExpansion(
  previousInput: RecallSnapshot,
  currentInput: RecallSnapshot,
): RecallExpansion {
  const previous = RecallSnapshotSchema.parse(previousInput);
  const current = RecallSnapshotSchema.parse(currentInput);

  const isRelated =
    current.relatedRecallNumbers.includes(previous.recallNumber) ||
    previous.relatedRecallNumbers.includes(current.recallNumber);

  if (!isRelated) {
    throw new Error(
      "Recall snapshots are not linked by relatedRecallNumbers; refusing to infer an expansion.",
    );
  }

  if (
    canonicalizeIdentifier(previous.manufacturer) !==
    canonicalizeIdentifier(current.manufacturer)
  ) {
    throw new Error("Recall manufacturer changed; human reconciliation is required.");
  }

  const priorKeys = new Set(previous.identifiers.map(identifierKey));
  const addedIdentifiers = current.identifiers.filter(
    (identifier) => !priorKeys.has(identifierKey(identifier)),
  );

  return RecallExpansionSchema.parse({
    previousRecallNumber: previous.recallNumber,
    currentRecallNumber: current.recallNumber,
    addedIdentifiers,
    familyScopeAdded: !scopesAreEqual(previous.familyScope, current.familyScope),
  });
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  if (left.length === 0) {
    return right.length;
  }
  if (right.length === 0) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const insertion = (current[rightIndex - 1] ?? 0) + 1;
      const deletion = (previous[rightIndex] ?? 0) + 1;
      const substitution =
        (previous[rightIndex - 1] ?? 0) +
        (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(insertion, deletion, substitution);
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length] ?? Math.max(left.length, right.length);
}

export function identifierSimilarity(left: string, right: string): number {
  const normalizedLeft = canonicalizeIdentifier(left);
  const normalizedRight = canonicalizeIdentifier(right);
  const longest = Math.max(normalizedLeft.length, normalizedRight.length);
  if (longest === 0) {
    return 1;
  }
  return 1 - levenshteinDistance(normalizedLeft, normalizedRight) / longest;
}

function catalogIdentifier(item: CatalogItem, type: RecallIdentifier["type"]): string | undefined {
  if (type === "model") {
    return item.model;
  }
  if (type === "upc") {
    return item.upc;
  }
  return item.sku;
}

export function matchExpansionToCatalog(
  expansionInput: RecallExpansion,
  currentRecallInput: RecallSnapshot,
  catalogInput: CatalogItem[],
): MatchResult[] {
  const expansion = RecallExpansionSchema.parse(expansionInput);
  const recall = RecallSnapshotSchema.parse(currentRecallInput);
  const catalog = z.array(CatalogItemSchema).parse(catalogInput);
  const recallBrand = canonicalizeIdentifier(recall.manufacturer);

  const results: MatchResult[] = [];

  for (const item of catalog) {
    if (canonicalizeIdentifier(item.brand) !== recallBrand) {
      continue;
    }

    const exact = expansion.addedIdentifiers.find((identifier) => {
      const value = catalogIdentifier(item, identifier.type);
      return (
        value !== undefined &&
        canonicalizeIdentifier(value) === canonicalizeIdentifier(identifier.value)
      );
    });

    if (exact !== undefined) {
      results.push({
        sku: item.sku,
        kind: "exact_identifier",
        confidence: "high",
        actionable: true,
        reason: "Exact normalized " + exact.type + " match to the recall expansion.",
        matchedIdentifier: exact.value,
      });
      continue;
    }

    const scope = recall.familyScope;
    if (
      expansion.familyScopeAdded &&
      scope !== null &&
      scope.includeAll &&
      canonicalizeIdentifier(item.brand) === canonicalizeIdentifier(scope.brand) &&
      canonicalizeIdentifier(item.category) === canonicalizeIdentifier(scope.category)
    ) {
      results.push({
        sku: item.sku,
        kind: "family_scope",
        confidence: "high",
        actionable: true,
        reason: scope.rationale,
      });
      continue;
    }

    let closest:
      | { identifier: RecallIdentifier; similarity: number }
      | undefined;

    for (const identifier of expansion.addedIdentifiers) {
      if (identifier.type !== "model") {
        continue;
      }
      const similarity = identifierSimilarity(item.model, identifier.value);
      if (closest === undefined || similarity > closest.similarity) {
        closest = { identifier, similarity };
      }
    }

    if (closest !== undefined && closest.similarity >= 0.72) {
      results.push({
        sku: item.sku,
        kind: "fuzzy_candidate",
        confidence: "manual_review",
        actionable: false,
        reason:
          "Similar model text is insufficient for containment; exact authority evidence is required.",
        matchedIdentifier: closest.identifier.value,
        similarity: Number(closest.similarity.toFixed(4)),
      });
    }
  }

  return z.array(MatchResultSchema).parse(results);
}

export function buildContainmentTargets(
  matchesInput: MatchResult[],
  catalogInput: CatalogItem[],
): string[] {
  const matches = z.array(MatchResultSchema).parse(matchesInput);
  const catalog = z.array(CatalogItemSchema).parse(catalogInput);
  const items = new Map(catalog.map((item) => [item.sku, item]));

  return matches
    .filter((match) => match.actionable)
    .map((match) => items.get(match.sku))
    .filter((item): item is CatalogItem => item !== undefined && item.status === "active")
    .map((item) => item.sku)
    .sort();
}

export function computeExposure(
  targetSkusInput: string[],
  catalogInput: CatalogItem[],
  ordersInput: Order[],
): Exposure {
  const targetSkus = z.array(z.string().min(1)).parse(targetSkusInput);
  const catalog = z.array(CatalogItemSchema).parse(catalogInput);
  const orders = z.array(OrderSchema).parse(ordersInput);
  const targetSet = new Set(targetSkus);
  const itemBySku = new Map(catalog.map((item) => [item.sku, item]));

  let inventoryUnits = 0;
  let inventoryRetailValueCents = 0;
  for (const sku of targetSet) {
    const item = itemBySku.get(sku);
    if (item === undefined) {
      throw new Error("Unknown target SKU: " + sku);
    }
    inventoryUnits += item.inventoryUnits;
    inventoryRetailValueCents += item.inventoryUnits * item.unitPriceCents;
  }

  let orderUnits = 0;
  let soldRetailValueCents = 0;
  let affectedOrders = 0;
  const customers = new Set<string>();

  for (const order of orders) {
    let orderAffected = false;
    for (const line of order.items) {
      if (!targetSet.has(line.sku)) {
        continue;
      }
      const item = itemBySku.get(line.sku);
      if (item === undefined) {
        throw new Error("Order references an unknown target SKU: " + line.sku);
      }
      orderAffected = true;
      orderUnits += line.quantity;
      soldRetailValueCents += line.quantity * item.unitPriceCents;
    }
    if (orderAffected) {
      affectedOrders += 1;
      customers.add(order.customerId);
    }
  }

  return ExposureSchema.parse({
    targetSkus: [...targetSet].sort(),
    inventoryUnits,
    orderUnits,
    affectedOrders,
    affectedCustomers: customers.size,
    inventoryRetailValueCents,
    soldRetailValueCents,
  });
}

