import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { RecallSnapshotSchema, type RecallSnapshot } from "@revoke/domain";

export const RecallNumberSchema = RecallSnapshotSchema.shape.recallNumber.pipe(
  // The live connector is intentionally not an arbitrary URL fetcher.
  // It only serves the two allowlisted notices in the submitted case.
  RecallSnapshotSchema.shape.recallNumber.refine(
    (value) => value === "26-601" || value === "26-717",
    "Recall is not allowlisted for this demo.",
  ),
);

const fixtureByRecallNumber = {
  "26-601": "cuisinart-july-2026.json",
  "26-717": "cuisinart-august-expansion-2026.json",
} as const;

export type AllowedRecallNumber = keyof typeof fixtureByRecallNumber;

export function isAllowedRecallNumber(value: string): value is AllowedRecallNumber {
  return Object.hasOwn(fixtureByRecallNumber, value);
}

export async function loadRecallFixture(recallNumber: AllowedRecallNumber): Promise<RecallSnapshot> {
  const fixtureUrl = new URL(
    "../../../fixtures/recalls/" + fixtureByRecallNumber[recallNumber],
    import.meta.url,
  );
  const parsed = RecallSnapshotSchema.parse(
    JSON.parse(await readFile(fileURLToPath(fixtureUrl), "utf8")),
  );
  if (parsed.recallNumber !== recallNumber) {
    throw new Error("Recall fixture identity does not match its allowlist entry.");
  }
  return parsed;
}
