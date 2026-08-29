# Bright Data Gaggle evidence pipeline

The Gaggle has a dedicated, version-controlled biotech retrieval contract in
addition to REVOKE's recall collector. It is intentionally limited to Bright
Data's `search_engine` and `scrape_as_markdown` tools.

## Golden-path behavior

1. Defense, Prosecution, and Methodologist receive three distinct search
   queries from `configs/bright-data/gaggle-evidence.manifest.json`.
2. The live sponsor probe searches for the configured literature record and
   scrapes that exact public research-index page through Bright Data.
3. Required taxon, substrate, endpoint, and source-identity signal groups must
   all be present. The normalized record must then pass
   `schemas/gaggle-evidence-record.schema.json` before admission.
4. The committed drift fixture removes the primary `Abstract` heading. The
   primary extractor records `missing_required_heading`; the semantic fallback
   reuses the same hashed text, validates every signal group, and emits a valid
   record without restarting the investigation.
5. Missing signals or schema errors fail closed. No partial evidence record is
   returned to the scientific workflow.

The fixture also contains a hostile instruction inside scraped text. Tests
prove that it remains inert data, cannot claim exact-strain support, and cannot
invoke a write tool. This pipeline is experimental R&D evidence handling, not
clinical validation.

## Reproduce

From the repository root:

```powershell
npm run sponsor:test:bright-data:gaggle
npm run sponsor:check:bright-data:gaggle:remote
```

The test is deterministic and needs no credential. The live check loads the
owner's credential through `scripts/import-sponsor-env.ps1`, sends it only as
the Bright Data MCP authorization value, and prints metadata and hashes rather
than scraped content or secrets. A successful live result reports
`liveSearchVerified`, `liveSourceSchemaValidated`, and
`driftRecoveryVerified` as `true`.

Use `npm run sponsor:check:bright-data:gaggle` for the pinned stdio MCP instead
of the hosted transport. The existing recall probe remains available as
`npm run sponsor:check:bright-data`.

## Evidence artifacts

- `configs/bright-data/gaggle-evidence.manifest.json` — queries, allowlist,
  required signals, provenance, drift policy, and safety policy.
- `schemas/gaggle-evidence-record.schema.json` — canonical admitted-record
  boundary.
- `fixtures/bright-data/gaggle-pubmed-heading-drift.json` — deterministic
  before-admission drift and prompt-injection fixture.
- `scripts/lib/gaggle-evidence-contract.mjs` — hashing, signal validation,
  schema validation, quarantine, and recovery implementation.
- `scripts/check-bright-data-gaggle.mjs` — credential-safe live MCP probe.
- `scripts/gaggle-evidence-contract.test.mjs` — least privilege, recovery,
  fail-closed, and safety regression tests.
