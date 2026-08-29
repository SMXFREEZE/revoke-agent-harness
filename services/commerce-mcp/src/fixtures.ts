import { access, readFile } from "node:fs/promises";
import path from "node:path";
import {
  RecallSnapshotSchema,
  CatalogItemSchema,
  OrderSchema,
  buildContainmentTargets,
  buildRecallExpansion,
  matchExpansionToCatalog,
  type CatalogItem,
  type Order,
} from "@revoke/domain";

const CATALOG_RELATIVE_PATH = path.join("fixtures", "catalog", "demo-catalog.json");
const ORDERS_RELATIVE_PATH = path.join("fixtures", "catalog", "demo-orders.json");
const PREVIOUS_RECALL_RELATIVE_PATH = path.join(
  "fixtures",
  "recalls",
  "cuisinart-july-2026.json",
);
const CURRENT_RECALL_RELATIVE_PATH = path.join(
  "fixtures",
  "recalls",
  "cuisinart-august-expansion-2026.json",
);

async function findRepositoryRoot(start: string): Promise<string> {
  let current = path.resolve(start);

  while (true) {
    try {
      await access(path.join(current, CATALOG_RELATIVE_PATH));
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) {
        throw new Error("Unable to locate REVOKE fixture root.");
      }
      current = parent;
    }
  }
}

async function readJson(relativePath: string): Promise<unknown> {
  const root = await findRepositoryRoot(process.cwd());
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8")) as unknown;
}

export interface DemoFixtures {
  catalog: CatalogItem[];
  orders: Order[];
  actionableTargetsByRecall: Record<string, string[]>;
}

export async function loadDemoFixtures(): Promise<DemoFixtures> {
  const [catalogInput, ordersInput, previousRecallInput, currentRecallInput] = await Promise.all([
    readJson(CATALOG_RELATIVE_PATH),
    readJson(ORDERS_RELATIVE_PATH),
    readJson(PREVIOUS_RECALL_RELATIVE_PATH),
    readJson(CURRENT_RECALL_RELATIVE_PATH),
  ]);
  const catalog = CatalogItemSchema.array().parse(catalogInput);
  const orders = OrderSchema.array().parse(ordersInput);
  const previousRecall = RecallSnapshotSchema.parse(previousRecallInput);
  const currentRecall = RecallSnapshotSchema.parse(currentRecallInput);
  const expansion = buildRecallExpansion(previousRecall, currentRecall);
  const matches = matchExpansionToCatalog(expansion, currentRecall, catalog);

  return {
    catalog,
    orders,
    actionableTargetsByRecall: {
      [currentRecall.recallNumber]: buildContainmentTargets(matches, catalog),
    },
  };
}
