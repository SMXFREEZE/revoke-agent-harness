import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertSanitizedArtifact,
  buildScientificEvidenceCaseCrate,
  fetchAllSessionEvents,
  finalizeRunTrace,
  projectTrueForgeRun,
  validateGoldenRunProjection,
} from "../apps/gaggle/lib/trueforge-run.mjs";

const DEFAULT_SESSION_ID = "01m17kj6cy2prqvxret528beb4";
const DEFAULT_BASE_URL = "http://localhost:8790";
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = resolve(repositoryRoot, "fixtures/gaggle/case-0042.json");
const outputDirectory = resolve(repositoryRoot, "apps/gaggle/public/runs/gaggle-0042");

function parseArguments(argv) {
  const options = {
    checkOnly: false,
    sessionId: DEFAULT_SESSION_ID,
    baseUrl: DEFAULT_BASE_URL,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.checkOnly = true;
      continue;
    }
    if (argument === "--session" || argument === "--base-url") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a value.`);
      if (argument === "--session") options.sessionId = value;
      if (argument === "--base-url") options.baseUrl = value;
      index += 1;
      continue;
    }
    throw new Error(`Unsupported argument: ${argument}`);
  }
  return options;
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

async function buildArtifacts(options) {
  const events = await fetchAllSessionEvents({
    baseUrl: options.baseUrl,
    sessionId: options.sessionId,
    fetchImpl: fetch,
  });
  const projection = validateGoldenRunProjection(
    projectTrueForgeRun(events, { sessionId: options.sessionId }),
  );
  const projectionHash = sha256(JSON.stringify(projection));
  const trace = finalizeRunTrace(projection, {
    exportedAt: new Date().toISOString(),
    hash: projectionHash,
  });

  const fixtureBytes = await readFile(fixturePath);
  const fixture = JSON.parse(fixtureBytes.toString("utf8"));
  const caseCrate = buildScientificEvidenceCaseCrate({
    trace,
    fixture,
    fixtureHash: sha256(fixtureBytes),
  });
  assertSanitizedArtifact(trace, "trace");
  assertSanitizedArtifact(caseCrate, "caseCrate");
  return { trace, caseCrate };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const artifacts = await buildArtifacts(options);
  if (!options.checkOnly) {
    await mkdir(outputDirectory, { recursive: true });
    await Promise.all([
      writeFile(
        resolve(outputDirectory, "trace.json"),
        `${JSON.stringify(artifacts.trace, null, 2)}\n`,
        "utf8",
      ),
      writeFile(
        resolve(outputDirectory, "case-crate.json"),
        `${JSON.stringify(artifacts.caseCrate, null, 2)}\n`,
        "utf8",
      ),
    ]);
  }
  console.log(
    JSON.stringify({
      status: options.checkOnly ? "verified" : "exported",
      sessionId: artifacts.trace.run.sessionId,
      runStatus: artifacts.trace.run.status,
      runHash: artifacts.trace.run.hash,
      turns: artifacts.trace.summary.turnCount,
      agents: artifacts.trace.summary.dynamicSubagentCount,
      output: options.checkOnly ? undefined : "apps/gaggle/public/runs/gaggle-0042",
    }),
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Gaggle run export failed.";
  console.error(message);
  process.exitCode = 1;
});
