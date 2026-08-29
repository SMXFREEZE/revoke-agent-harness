import { access, readFile } from "node:fs/promises";
import path from "node:path";
import {
  CatalogItemSchema,
  OrderSchema,
  type CatalogItem,
  type Order,
} from "@revoke/domain";

const CATALOG_RELATIVE_PATH = path.join("fixtures", "catalog", "demo-catalog.json");
const ORDERS_RELATIVE_PATH = path.join("fixtures", "catalog", "demo-orders.json");

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
}

export async function loadDemoFixtures(): Promise<DemoFixtures> {
  const [catalog, orders] = await Promise.all([
    readJson(CATALOG_RELATIVE_PATH),
    readJson(ORDERS_RELATIVE_PATH),
  ]);

  return {
    catalog: CatalogItemSchema.array().parse(catalog),
    orders: OrderSchema.array().parse(orders),
  };
}

