import { createHash } from "node:crypto";
import {
  RecallSnapshotSchema,
  canonicalizeIdentifier,
  type RecallIdentifier,
  type RecallSnapshot,
} from "@revoke/domain";
import * as cheerio from "cheerio";

export type VerificationSignals = {
  title: boolean;
  recallNumber: boolean;
  relatedRecallNumbers: boolean;
  publicationDate: boolean;
  units: boolean;
  manufacturer: boolean;
  productCategory: boolean;
  hazard: boolean;
  remedy: boolean;
  identifiers: Record<string, boolean>;
  noUnknownIdentifiers: boolean;
  familyScope: boolean;
};

export type VerifiedRecallSnapshot = {
  snapshot: RecallSnapshot;
  validation: {
    valid: true;
    signals: VerificationSignals;
    documentBytes: number;
  };
};

type ExtractedRecall = Omit<RecallSnapshot, "evidence"> & {
  familyRationale: string | null;
};

const MONTH_PATTERN =
  "January|February|March|April|May|June|July|August|September|October|November|December";

function normalizeText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function fieldText($: cheerio.CheerioAPI, selectors: string[]): string {
  for (const selector of selectors) {
    const value = normalizeText($(selector).first().text());
    if (value.length > 0) return value;
  }
  return "";
}

function firstMatch(value: string, pattern: RegExp, label: string): RegExpMatchArray {
  const match = value.match(pattern);
  if (match === null) throw new Error(`Live CPSC extraction failed: ${label}.`);
  return match;
}

function parseDate(value: string): string {
  const match = firstMatch(
    value,
    new RegExp(`\\b(${MONTH_PATTERN})\\s+(\\d{1,2}),\\s+(\\d{4})\\b`, "i"),
    "publicationDate",
  );
  const parsed = new Date(`${match[1]} ${match[2]}, ${match[3]} UTC`);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error("Live CPSC extraction failed: publicationDate.");
  }
  return parsed.toISOString().slice(0, 10);
}

function extractSentence(text: string, terms: string[], label: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const match = sentences.find((sentence) => {
    const lower = sentence.toLowerCase();
    return terms.every((term) => lower.includes(term));
  });
  if (match === undefined) throw new Error(`Live CPSC extraction failed: ${label}.`);
  return normalizeText(match);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function extractRecallDocument(html: string): ExtractedRecall {
  const $ = cheerio.load(html);
  const scopedText = normalizeText($("main").text() || $("body").text());
  const lowerText = scopedText.toLowerCase();

  const title = normalizeText($("h1").first().text());
  if (title.length === 0) throw new Error("Live CPSC extraction failed: title.");

  const recallField = fieldText($, [
    '[class*="field--name-field-recall-number"]',
    '[class*="recall-number"]',
  ]);
  const recallNumber = firstMatch(
    recallField || scopedText,
    /(?:recall\s*(?:number|no\.?)[\s:#-]*)?(\d{2}-\d{3})\b/i,
    "recallNumber",
  )[1];
  if (recallNumber === undefined) {
    throw new Error("Live CPSC extraction failed: recallNumber.");
  }

  const recallNumbers = unique(
    [...scopedText.matchAll(/\b\d{2}-\d{3}\b/g)].map((match) => match[0]),
  );
  const relatedRecallNumbers = recallNumbers
    .filter((value) => value !== recallNumber)
    .sort();

  const dateField = fieldText($, [
    '[class*="field--name-field-recall-date"]',
    '[class*="recall-date"]',
    "time",
  ]);
  const publicationDate = parseDate(dateField || scopedText);

  const unitsField = fieldText($, [
    '[class*="field--name-field-units"]',
    '[class*="recall-units"]',
  ]);
  const unitsMatch = firstMatch(
    unitsField || scopedText,
    unitsField
      ? /\b(\d[\d,]*)\b/
      : /\b(\d[\d,]{3,})\s+(?:cuisinart\s+)?(?:wire\s+bristle\s+)?(?:grill\s+)?(?:brush(?:es)?|units)\b/i,
    "units",
  );
  const units = Number((unitsMatch[1] ?? "").replaceAll(",", ""));
  if (!Number.isSafeInteger(units)) throw new Error("Live CPSC extraction failed: units.");

  const manufacturerMatch = title.match(
    /\b([A-Z][A-Za-z0-9&'-]+)\s+(?:wire[- ]bristle\s+)?grill\s+brush(?:es)?\b/i,
  );
  const manufacturer = manufacturerMatch?.[1];
  if (manufacturer === undefined) {
    throw new Error("Live CPSC extraction failed: manufacturer.");
  }

  if (!lowerText.includes("wire bristle") || !lowerText.includes("grill brush")) {
    throw new Error("Live CPSC extraction failed: productCategory.");
  }
  const productCategory = "wire-bristle-grill-brush";

  const hazardField = fieldText($, [
    '[class*="field--name-field-hazard"]',
    '[class*="recall-hazard"]',
  ]);
  const hazard =
    hazardField || extractSentence(scopedText, ["wire bristle", "hazard"], "hazard");
  const remedyField = fieldText($, [
    '[class*="field--name-field-remed"]',
    '[class*="recall-remed"]',
  ]);
  const remedy = remedyField || (lowerText.includes("refund") ? "Refund" : "");
  if (remedy.length === 0) throw new Error("Live CPSC extraction failed: remedy.");

  const identifierValues = unique(
    [...scopedText.matchAll(/\b[A-Z]{2,5}-[A-Z0-9]+(?:\/[A-Z0-9]+)?\b/g)].map(
      (match) => match[0],
    ),
  ).sort((left, right) => left.localeCompare(right));
  if (identifierValues.length === 0) {
    throw new Error("Live CPSC extraction failed: identifiers.");
  }
  const identifiers: RecallIdentifier[] = identifierValues.map((value) => ({
    type: "model",
    value,
  }));

  const familyRationale = lowerText.includes(
    "all cuisinart wire bristle grill brushes are included",
  )
    ? extractSentence(
        scopedText,
        ["all cuisinart wire bristle grill brushes are included"],
        "familyScope",
      )
    : null;
  const familyScope =
    familyRationale === null
      ? null
      : {
          brand: manufacturer,
          category: productCategory,
          includeAll: true as const,
          rationale: familyRationale,
        };

  return {
    recallNumber,
    relatedRecallNumbers,
    title,
    publicationDate,
    jurisdiction: "US-CPSC",
    manufacturer,
    productCategory,
    hazard,
    remedy,
    units,
    identifiers,
    familyScope,
    familyRationale,
  };
}

function identifierSet(identifiers: RecallIdentifier[]): Set<string> {
  return new Set(
    identifiers.map(
      (identifier) => `${identifier.type}:${canonicalizeIdentifier(identifier.value)}`,
    ),
  );
}

export function verifyRecallDocument(
  fixture: RecallSnapshot,
  html: string,
): VerificationSignals {
  const extracted = extractRecallDocument(html);
  const expectedIdentifiers = identifierSet(fixture.identifiers);
  const liveIdentifiers = identifierSet(extracted.identifiers);
  const identifiers = Object.fromEntries(
    fixture.identifiers.map((identifier) => [
      identifier.value,
      liveIdentifiers.has(`${identifier.type}:${canonicalizeIdentifier(identifier.value)}`),
    ]),
  );

  return {
    title: normalizeText(extracted.title) === normalizeText(fixture.title),
    recallNumber: extracted.recallNumber === fixture.recallNumber,
    relatedRecallNumbers:
      JSON.stringify(extracted.relatedRecallNumbers) ===
      JSON.stringify([...fixture.relatedRecallNumbers].sort()),
    publicationDate: extracted.publicationDate === fixture.publicationDate,
    units: extracted.units === fixture.units,
    manufacturer:
      canonicalizeIdentifier(extracted.manufacturer) ===
      canonicalizeIdentifier(fixture.manufacturer),
    productCategory: extracted.productCategory === fixture.productCategory,
    hazard:
      extracted.hazard.toLowerCase().includes("wire bristle") &&
      extracted.hazard.toLowerCase().includes("hazard"),
    remedy: extracted.remedy.toLowerCase().includes(fixture.remedy.toLowerCase()),
    identifiers,
    noUnknownIdentifiers: [...liveIdentifiers].every((value) => expectedIdentifiers.has(value)),
    familyScope:
      (fixture.familyScope === null && extracted.familyScope === null) ||
      (fixture.familyScope !== null &&
        extracted.familyScope !== null &&
        extracted.familyScope.includeAll &&
        canonicalizeIdentifier(extracted.familyScope.brand) ===
          canonicalizeIdentifier(fixture.familyScope.brand) &&
        extracted.familyScope.category === fixture.familyScope.category),
  };
}

function failedSignals(signals: VerificationSignals): string[] {
  const failures = Object.entries(signals)
    .filter(([key, value]) => key !== "identifiers" && value === false)
    .map(([key]) => key);
  const identifierFailures = Object.entries(signals.identifiers)
    .filter(([, valid]) => !valid)
    .map(([identifier]) => "identifier:" + identifier);
  return [...failures, ...identifierFailures];
}

export async function fetchVerifiedRecall(
  fixture: RecallSnapshot,
  fetchImplementation: typeof fetch = fetch,
): Promise<VerifiedRecallSnapshot> {
  const sourceUrl = fixture.evidence[0]?.sourceUrl;
  if (sourceUrl === undefined) {
    throw new Error("Recall fixture has no authoritative source URL.");
  }
  const url = new URL(sourceUrl);
  if (url.protocol !== "https:" || url.hostname !== "www.cpsc.gov") {
    throw new Error("Authoritative recall URL is outside the CPSC allowlist.");
  }

  const response = await fetchImplementation(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "REVOKE-Hackathon/0.1 evidence-verifier",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error("CPSC returned HTTP " + response.status + ".");
  }
  const html = await response.text();
  if (html.length < 1_000) {
    throw new Error("CPSC response was unexpectedly small.");
  }

  const signals = verifyRecallDocument(fixture, html);
  const failures = failedSignals(signals);
  if (failures.length > 0) {
    throw new Error("Live CPSC validation failed: " + failures.join(", "));
  }

  const extracted = extractRecallDocument(html);
  const contentHash = createHash("sha256").update(html).digest("hex");
  const snapshot = RecallSnapshotSchema.parse({
    recallNumber: extracted.recallNumber,
    relatedRecallNumbers: extracted.relatedRecallNumbers,
    title: extracted.title,
    publicationDate: extracted.publicationDate,
    jurisdiction: extracted.jurisdiction,
    manufacturer: extracted.manufacturer,
    productCategory: extracted.productCategory,
    hazard: extracted.hazard,
    remedy: extracted.remedy,
    units: extracted.units,
    identifiers: extracted.identifiers,
    familyScope: extracted.familyScope,
    evidence: [
      {
        sourceUrl,
        publisher: "U.S. Consumer Product Safety Commission",
        retrievedAt: new Date().toISOString(),
        extractor: "revoke-cpsc-live-parser/v2",
        contentHash,
        mode: "live",
      },
    ],
  });

  return {
    snapshot,
    validation: {
      valid: true,
      signals,
      documentBytes: Buffer.byteLength(html),
    },
  };
}
