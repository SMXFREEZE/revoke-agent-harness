import { createHash } from "node:crypto";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const SAFE_EXECUTION_STATE = Object.freeze({
  exactCandidateStrainSupported: false,
  untrustedTextExecuted: false,
  writeToolsUsed: false,
  clinicalUse: false,
});

export function compileEvidenceValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

export function hashContent(rawText) {
  return `sha256:${createHash("sha256").update(rawText, "utf8").digest("hex")}`;
}

export function validateSignalGroups(rawText, signalGroups) {
  const normalizedText = rawText.toLocaleLowerCase("en-US");
  const matches = [];
  const missing = [];

  for (const group of signalGroups) {
    const matchedTerm = group.anyOf.find((term) =>
      normalizedText.includes(term.toLocaleLowerCase("en-US")),
    );
    if (matchedTerm) {
      matches.push({ id: group.id, matchedTerm });
    } else {
      missing.push(group.id);
    }
  }

  return { valid: missing.length === 0, matches, missing };
}

function formatSchemaErrors(errors) {
  return (errors ?? []).map((error) => ({
    path: error.instancePath || "/",
    keyword: error.keyword,
    message: error.message ?? "schema validation failed",
  }));
}

function quarantinedResult({ failureCode, errors, primaryFailure = null, recoveryUsed = false }) {
  return {
    admitted: false,
    status: "quarantined",
    failureCode,
    errors,
    primaryFailure,
    recoveryUsed,
    record: null,
    safety: SAFE_EXECUTION_STATE,
  };
}

function sourcePolicyFailure(manifest, sourceUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return "source_url_invalid";
  }

  if (!manifest.sourcePolicy.allowedProtocols.includes(parsedUrl.protocol)) {
    return "source_protocol_not_allowed";
  }
  if (!manifest.sourcePolicy.allowedHosts.includes(parsedUrl.hostname)) {
    return "source_host_not_allowed";
  }
  return null;
}

function canonicalizeSourceUrl(sourceUrl) {
  const canonicalUrl = new URL(sourceUrl);
  canonicalUrl.hash = "";
  return canonicalUrl.toString();
}

function extractWithSignals({
  rawText,
  manifest,
  sourceUrl,
  queryId,
  retrievedAt,
  liveOrFixture,
  extractorVersion,
  extractorStrategy,
  validateRecord,
}) {
  const policyFailure = sourcePolicyFailure(manifest, sourceUrl);
  if (policyFailure) {
    return quarantinedResult({
      failureCode: policyFailure,
      errors: [{ path: "/retrieval/sourceUrl", message: policyFailure }],
    });
  }

  const query = manifest.queries.find((entry) => entry.id === queryId);
  if (!query) {
    return quarantinedResult({
      failureCode: "unknown_query",
      errors: [{ path: "/query/id", message: `Unknown query id: ${queryId}` }],
    });
  }

  const signalValidation = validateSignalGroups(
    rawText,
    manifest.liveCheck.scrapeSignalGroups,
  );
  if (!signalValidation.valid) {
    return quarantinedResult({
      failureCode: "missing_required_signals",
      errors: signalValidation.missing.map((id) => ({
        path: "/validation/requiredSignals",
        message: `Missing required signal group: ${id}`,
      })),
    });
  }

  const contentHash = hashContent(rawText);
  const safeQueryId = queryId.replaceAll(/[^A-Za-z0-9-]/g, "-");
  const record = {
    schemaVersion: "1.0",
    evidenceId: `${manifest.goldenCase.caseId}-${safeQueryId}-${contentHash.slice(7, 19)}`,
    caseId: manifest.goldenCase.caseId,
    candidateId: manifest.goldenCase.candidateId,
    query: {
      id: query.id,
      role: query.role,
      text: query.text,
    },
    retrieval: {
      sourceUrl,
      canonicalUrl: canonicalizeSourceUrl(
        manifest.goldenCase.canonicalUrl ?? sourceUrl,
      ),
      publisher: manifest.goldenCase.publisher,
      retrievedAt,
      provider: manifest.provider,
      tool: "scrape_as_markdown",
      extractorVersion,
      extractorStrategy,
      contentHash,
      liveOrFixture,
    },
    biologicalScope: {
      taxa: [...manifest.goldenCase.taxa],
      taxonomicLevel: manifest.goldenCase.taxonomicLevel,
      exactCandidateStrain: false,
    },
    evidence: {
      claim: manifest.goldenCase.safeClaim,
      direction: manifest.goldenCase.direction,
      studyType: manifest.goldenCase.studyType,
    },
    methodologyFlags: [...manifest.goldenCase.methodologyFlags],
    validation: {
      schemaStatus: "valid",
      requiredSignals: signalValidation.matches,
    },
    safety: { ...SAFE_EXECUTION_STATE },
  };

  if (!validateRecord(record)) {
    return quarantinedResult({
      failureCode: "schema_validation_failed",
      errors: formatSchemaErrors(validateRecord.errors),
    });
  }

  return {
    admitted: true,
    status: "valid",
    failureCode: null,
    errors: [],
    primaryFailure: null,
    recoveryUsed: extractorStrategy === manifest.extractors.recovery.strategy,
    record,
    safety: SAFE_EXECUTION_STATE,
  };
}

export function extractPrimaryEvidence(options) {
  let headingPattern;
  try {
    headingPattern = new RegExp(
      options.manifest.extractors.primary.requiredHeadingPattern,
      "im",
    );
  } catch {
    return quarantinedResult({
      failureCode: "invalid_primary_heading_pattern",
      errors: [{ path: "/extractors/primary/requiredHeadingPattern", message: "Invalid regex" }],
    });
  }

  if (!headingPattern.test(options.rawText)) {
    return quarantinedResult({
      failureCode: "missing_required_heading",
      errors: [{ path: "/evidence/claim", message: "Primary abstract heading was not found" }],
    });
  }

  return extractWithSignals({
    ...options,
    extractorVersion: options.manifest.extractors.primary.version,
    extractorStrategy: options.manifest.extractors.primary.strategy,
  });
}

export function recoverBiotechEvidence(options) {
  const primary = extractPrimaryEvidence(options);
  if (primary.admitted) {
    return primary;
  }

  const recovered = extractWithSignals({
    ...options,
    extractorVersion: options.manifest.extractors.recovery.version,
    extractorStrategy: options.manifest.extractors.recovery.strategy,
  });

  return {
    ...recovered,
    primaryFailure: primary.failureCode,
    recoveryUsed: true,
  };
}

export function verifyDriftFixture({ fixture, manifest, validateRecord }) {
  const result = recoverBiotechEvidence({
    rawText: fixture.driftedMarkdown,
    manifest,
    sourceUrl: fixture.sourceUrl,
    queryId: fixture.queryId,
    retrievedAt: fixture.retrievedAt,
    liveOrFixture: "fixture",
    validateRecord,
  });

  const expected = fixture.expected;
  const verified =
    result.admitted &&
    result.primaryFailure === expected.primaryFailureCode &&
    result.recoveryUsed === expected.recoveryUsed &&
    result.record?.retrieval.extractorStrategy === expected.recoveryStrategy &&
    result.record?.validation.schemaStatus === expected.schemaStatus &&
    result.record?.safety.exactCandidateStrainSupported ===
      expected.exactCandidateStrainSupported &&
    result.record?.safety.untrustedTextExecuted === expected.untrustedTextExecuted &&
    result.record?.safety.writeToolsUsed === expected.writeToolsUsed;

  return { verified, result };
}
