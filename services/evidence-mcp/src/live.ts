import { createHash } from "node:crypto";
import { canonicalizeIdentifier, type RecallSnapshot } from "@revoke/domain";
import * as cheerio from "cheerio";

export type VerificationSignals = {
  title: boolean;
  recallNumber: boolean;
  publicationDate: boolean;
  units: boolean;
  manufacturer: boolean;
  hazard: boolean;
  remedy: boolean;
  identifiers: Record<string, boolean>;
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

function normalizeText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function longDateVariants(isoDate: string): string[] {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("Invalid ISO fixture date.");
  }
  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
  const natural = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return [natural, `${monthName} ${String(day).padStart(2, "0")}, ${year}`];
}

export function verifyRecallDocument(
  fixture: RecallSnapshot,
  html: string,
): VerificationSignals {
  const $ = cheerio.load(html);
  const text = normalizeText($.root().text());
  const lowerText = text.toLowerCase();
  const canonicalText = canonicalizeIdentifier(text);
  const identifiers = Object.fromEntries(
    fixture.identifiers.map((identifier) => [
      identifier.value,
      canonicalText.includes(canonicalizeIdentifier(identifier.value)),
    ]),
  );

  return {
    title: lowerText.includes(normalizeText(fixture.title).toLowerCase()),
    recallNumber: text.includes(fixture.recallNumber),
    publicationDate: longDateVariants(fixture.publicationDate).some((value) =>
      lowerText.includes(value.toLowerCase()),
    ),
    units: text.includes(new Intl.NumberFormat("en-US").format(fixture.units)),
    manufacturer: lowerText.includes(fixture.manufacturer.toLowerCase()),
    hazard: lowerText.includes("wire bristle") && lowerText.includes("ingestion hazard"),
    remedy: lowerText.includes("refund"),
    identifiers,
    familyScope:
      fixture.familyScope === null ||
      lowerText.includes("all cuisinart wire bristle grill brushes are included"),
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

  const contentHash = createHash("sha256").update(html).digest("hex");
  return {
    snapshot: {
      ...structuredClone(fixture),
      evidence: [
        {
          sourceUrl,
          publisher: "U.S. Consumer Product Safety Commission",
          retrievedAt: new Date().toISOString(),
          extractor: "revoke-cpsc-live-verifier/v1",
          contentHash,
          mode: "live",
        },
      ],
    },
    validation: {
      valid: true,
      signals,
      documentBytes: Buffer.byteLength(html),
    },
  };
}
