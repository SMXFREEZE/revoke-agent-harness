import { readFile } from "node:fs/promises";
import { URL } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

import {
  compileEvidenceValidator,
  recoverBiotechEvidence,
  validateSignalGroups,
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

const token = process.env.BRIGHTDATA_API_KEY ?? process.env.BRIGHT_DATA_API;
const useRemoteTransport = process.argv.includes("--remote-header");
const validateRecord = compileEvidenceValidator(evidenceSchema);

function resultText(result) {
  const parts = result.content
    .filter((content) => content.type === "text")
    .map((content) => content.text);
  if (result.structuredContent !== undefined) {
    parts.push(JSON.stringify(result.structuredContent));
  }
  return parts.join("\n");
}

function redactError(error) {
  const initial = error instanceof Error ? error.message : "Unknown Bright Data MCP error";
  const withoutToken = token ? initial.split(token).join("[REDACTED_SECRET]") : initial;
  return withoutToken.replaceAll(/Bearer\s+[^\s,;]+/gi, "Bearer [REDACTED_SECRET]");
}

function childEnvironment(apiToken) {
  const allowedKeys = [
    "APPDATA",
    "COMSPEC",
    "HOME",
    "LOCALAPPDATA",
    "NPM_CONFIG_CACHE",
    "PATH",
    "Path",
    "PATHEXT",
    "SYSTEMROOT",
    "SystemRoot",
    "TEMP",
    "TMP",
    "USERPROFILE",
  ];
  const environment = Object.fromEntries(
    allowedKeys
      .filter((key) => process.env[key] !== undefined)
      .map((key) => [key, process.env[key]]),
  );
  return {
    ...environment,
    API_TOKEN: apiToken,
    PRO_MODE: "false",
    RATE_LIMIT: manifest.rateLimit,
    TOOLS: manifest.tools.join(","),
  };
}

if (!token) {
  console.error("Bright Data credential is not available in the current process.");
  process.exitCode = 2;
} else {
  const driftVerification = verifyDriftFixture({
    fixture: driftFixture,
    manifest,
    validateRecord,
  });
  if (!driftVerification.verified) {
    throw new Error("The committed Gaggle drift/recovery fixture did not satisfy its contract.");
  }

  const transport = useRemoteTransport
    ? new StreamableHTTPClientTransport(
        new URL(`https://mcp.brightdata.com/mcp?tools=${manifest.tools.join(",")}`),
        { requestInit: { headers: { authorization: `Bearer ${token}` } } },
      )
    : new StdioClientTransport({
        command: process.platform === "win32" ? "npx.cmd" : "npx",
        args: ["-y", manifest.integration],
        env: childEnvironment(token),
        stderr: "pipe",
      });
  const client = new Client({ name: "gaggle-biotech-evidence-check", version: "1.0.0" });

  try {
    await client.connect(transport);
    const available = await client.listTools();
    const publishedTools = available.tools.map((tool) => tool.name).sort();
    const requiredTools = [...manifest.tools].sort();
    if (JSON.stringify(publishedTools) !== JSON.stringify(requiredTools)) {
      throw new Error(
        `Least-privilege tool contract failed. Expected ${requiredTools.join(", ")}; received ${publishedTools.join(", ")}.`,
      );
    }

    const liveQuery = manifest.queries.find(
      (query) => query.id === manifest.liveCheck.queryId,
    );
    if (!liveQuery) {
      throw new Error("The live query id is not present in the Gaggle evidence manifest.");
    }

    const searchResult = CallToolResultSchema.parse(
      await client.callTool({
        name: "search_engine",
        arguments: { query: liveQuery.text, engine: "google" },
      }),
    );
    const scrapeResult = CallToolResultSchema.parse(
      await client.callTool({
        name: "scrape_as_markdown",
        arguments: { url: manifest.liveCheck.sourceUrl },
      }),
    );
    if (searchResult.isError === true || scrapeResult.isError === true) {
      throw new Error("A required Bright Data tool returned an MCP error result.");
    }

    const searchText = resultText(searchResult);
    const scrapeText = resultText(scrapeResult);
    const searchValidation = validateSignalGroups(
      searchText,
      manifest.liveCheck.searchSignalGroups,
    );
    if (!searchValidation.valid) {
      throw new Error(
        `Live search failed required signal groups: ${searchValidation.missing.join(", ")}.`,
      );
    }

    const liveExtraction = recoverBiotechEvidence({
      rawText: scrapeText,
      manifest,
      sourceUrl: manifest.liveCheck.sourceUrl,
      queryId: manifest.liveCheck.queryId,
      retrievedAt: new Date().toISOString(),
      liveOrFixture: "live",
      validateRecord,
    });
    if (!liveExtraction.admitted || !liveExtraction.record) {
      const validationDetails = liveExtraction.errors
        .map((error) => error.message)
        .join("; ");
      throw new Error(
        `Live source was quarantined: ${liveExtraction.failureCode ?? "unknown validation failure"}${validationDetails ? ` (${validationDetails})` : ""}.`,
      );
    }

    console.log(
      JSON.stringify({
        status: "ok",
        provider: "bright-data-mcp",
        pipelineId: manifest.pipelineId,
        transport: useRemoteTransport ? "streamable-http-header" : "stdio",
        integration: manifest.integration,
        requiredTools,
        publishedToolCount: publishedTools.length,
        leastPrivilegeToolsVerified: true,
        independentQueryRoles: manifest.queries.map((query) => query.role),
        liveSearchVerified: true,
        liveSourceSchemaValidated: true,
        liveExtractorStrategy: liveExtraction.record.retrieval.extractorStrategy,
        liveContentHash: liveExtraction.record.retrieval.contentHash,
        driftRecoveryVerified: true,
        driftPrimaryFailure: driftVerification.result.primaryFailure,
        driftRecoveryStrategy:
          driftVerification.result.record?.retrieval.extractorStrategy ?? null,
        exactCandidateStrainSupported: false,
        untrustedTextExecuted: false,
        writeToolsUsed: false,
        searchResponseCharacters: searchText.length,
        scrapeResponseCharacters: scrapeText.length,
      }),
    );
  } catch (error) {
    console.error(redactError(error));
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => undefined);
  }
}
