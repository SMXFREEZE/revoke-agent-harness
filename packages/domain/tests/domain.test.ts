import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  CatalogItemSchema,
  OrderSchema,
  RecallSnapshotSchema,
  buildContainmentTargets,
  buildRecallExpansion,
  canonicalizeIdentifier,
  computeExposure,
  identifierSimilarity,
  matchExpansionToCatalog,
} from "../src/index.js";

async function readFixture<T>(relativePath: string): Promise<T> {
  const url = new URL("../../../fixtures/" + relativePath, import.meta.url);
  return JSON.parse(await readFile(url, "utf8")) as T;
}

describe("recall expansion", () => {
  it("extracts the thirteen identifiers added by the official August expansion", async () => {
    const july = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-july-2026.json"),
    );
    const august = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-august-expansion-2026.json"),
    );

    const expansion = buildRecallExpansion(july, august);

    expect(expansion.addedIdentifiers).toHaveLength(13);
    expect(expansion.familyScopeAdded).toBe(true);
    expect(expansion.addedIdentifiers.map((item) => item.value)).toContain("CGWM-024");
  });

  it("refuses to infer an expansion between unrelated recalls", async () => {
    const july = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-july-2026.json"),
    );
    const august = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-august-expansion-2026.json"),
    );

    expect(() =>
      buildRecallExpansion(
        {
          ...july,
          relatedRecallNumbers: [],
        },
        {
          ...august,
          relatedRecallNumbers: [],
        },
      ),
    ).toThrow(/not linked/);
  });
});

describe("catalog matching safety", () => {
  it("normalizes separators without weakening exact identifier semantics", () => {
    expect(canonicalizeIdentifier(" ccb-012/021 ")).toBe("CCB012021");
    expect(identifierSimilarity("CCB-395", "CB-395")).toBeGreaterThan(0.8);
  });

  it("keeps fuzzy-only candidates out of containment targets", async () => {
    const july = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-july-2026.json"),
    );
    const august = RecallSnapshotSchema.parse(
      await readFixture("recalls/cuisinart-august-expansion-2026.json"),
    );
    const catalog = CatalogItemSchema.array().parse(
      await readFixture("catalog/demo-catalog.json"),
    );

    const expansion = buildRecallExpansion(july, august);
    const matches = matchExpansionToCatalog(expansion, august, catalog);
    const review = matches.find((match) => match.sku === "SKU-CUIS-CCB395-REVIEW");

    expect(review).toMatchObject({
      kind: "fuzzy_candidate",
      actionable: false,
      confidence: "manual_review",
    });

    const targets = buildContainmentTargets(matches, catalog);
    expect(targets).toEqual([
      "SKU-CUIS-CGWM024",
      "SKU-CUIS-CGWM059",
      "SKU-CUIS-FCB501",
      "SKU-CUIS-LEGACY18",
    ]);
    expect(targets).not.toContain("SKU-CUIS-CCB395-REVIEW");
    expect(targets).not.toContain("SKU-CUIS-CCB100");
  });
});

describe("exposure computation", () => {
  it("computes inventory and sold exposure from records rather than model prose", async () => {
    const catalog = CatalogItemSchema.array().parse(
      await readFixture("catalog/demo-catalog.json"),
    );
    const orders = OrderSchema.array().parse(await readFixture("catalog/demo-orders.json"));
    const targets = [
      "SKU-CUIS-CGWM024",
      "SKU-CUIS-CGWM059",
      "SKU-CUIS-FCB501",
      "SKU-CUIS-LEGACY18",
    ];

    expect(computeExposure(targets, catalog, orders)).toEqual({
      targetSkus: [...targets].sort(),
      inventoryUnits: 312,
      orderUnits: 5,
      affectedOrders: 4,
      affectedCustomers: 3,
      inventoryRetailValueCents: 480688,
      soldRetailValueCents: 8195,
    });
  });

  it("fails closed when a target SKU does not exist", async () => {
    const catalog = CatalogItemSchema.array().parse(
      await readFixture("catalog/demo-catalog.json"),
    );

    expect(() => computeExposure(["missing-sku"], catalog, [])).toThrow(/Unknown target SKU/);
  });
});
