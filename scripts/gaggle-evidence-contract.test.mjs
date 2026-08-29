import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

import {
  compileEvidenceValidator,
  recoverBiotechEvidence,
  verifyDriftFixture,
} from "./lib/gaggle-evidence-contract.mjs";

const readJson = async (url) => JSON.parse(await readFile(url, "utf8"));
const [manifest, evidenceSchema, driftFixture] = await Promise.all([
  readJson(new URL("../configs/bright-data/gaggle-evidence.manifest.json", import.meta.url)),
  readJson(new URL("../schemas/gaggle-evidence-record.schema.json", import.meta.url)),
  readJson(
    new URL("../fixtures/bright-data/gaggle-pubmed-heading-drift.json", import.meta.url),
  ),
]);

test("the biotech manifest is least privilege and assigns distinct research queries", () => {
  assert.deepEqual([...manifest.tools].sort(), ["scrape_as_markdown", "search_engine"]);
  assert.deepEqual(
    manifest.queries.map((query) => query.role).sort(),
    ["defense", "methodologist", "prosecution"],
  );
  assert.equal(new Set(manifest.queries.map((query) => query.text)).size, 3);
  assert.equal(manifest.safety.writeToolsAllowed, false);
  assert.equal(manifest.safety.scrapedInstructionsExecutable, false);
});

test("heading drift is visible, recovered semantically, and schema validated", () => {
  const validateRecord = compileEvidenceValidator(evidenceSchema);
  const verification = verifyDriftFixture({
    fixture: driftFixture,
    manifest,
    validateRecord,
  });

  assert.equal(verification.verified, true);
  assert.equal(verification.result.primaryFailure, "missing_required_heading");
  assert.equal(verification.result.recoveryUsed, true);
  assert.equal(verification.result.record?.validation.schemaStatus, "valid");
  assert.equal(
    verification.result.record?.retrieval.extractorStrategy,
    "semantic_required_signals",
  );
  assert.equal(
    verification.result.record?.retrieval.canonicalUrl,
    manifest.goldenCase.canonicalUrl,
  );
  assert.equal(verification.result.record?.safety.exactCandidateStrainSupported, false);
  assert.equal(verification.result.record?.safety.untrustedTextExecuted, false);
  assert.equal(verification.result.record?.safety.writeToolsUsed, false);
  assert.equal(
    JSON.stringify(verification.result.record).includes("promote_experimental_proposal"),
    false,
  );
});

test("missing biological signals fail closed without a partial evidence record", () => {
  const validateRecord = compileEvidenceValidator(evidenceSchema);
  const result = recoverBiotechEvidence({
    rawText: "# Changed page\n\n## Research summary\n\nNo relevant study was returned.",
    manifest,
    sourceUrl: manifest.liveCheck.sourceUrl,
    queryId: manifest.liveCheck.queryId,
    retrievedAt: "2026-08-29T16:00:00.000Z",
    liveOrFixture: "fixture",
    validateRecord,
  });

  assert.equal(result.admitted, false);
  assert.equal(result.status, "quarantined");
  assert.equal(result.failureCode, "missing_required_signals");
  assert.equal(result.record, null);
  assert.equal(result.safety.writeToolsUsed, false);
});

test("the canonical schema rejects evidence that claims an unsafe action occurred", () => {
  const validateRecord = compileEvidenceValidator(evidenceSchema);
  const verification = verifyDriftFixture({
    fixture: driftFixture,
    manifest,
    validateRecord,
  });
  const unsafeRecord = JSON.parse(JSON.stringify(verification.result.record));
  unsafeRecord.safety.writeToolsUsed = true;

  assert.equal(validateRecord(unsafeRecord), false);
  assert.ok(validateRecord.errors?.some((error) => error.instancePath === "/safety/writeToolsUsed"));
});
