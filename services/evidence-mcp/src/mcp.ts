import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildRecallExpansion, type RecallSnapshot } from "@revoke/domain";
import { z } from "zod";
import {
  isAllowedRecallNumber,
  loadRecallFixture,
  type AllowedRecallNumber,
} from "./fixtures.js";
import { fetchVerifiedRecall } from "./live.js";

const READ_ONLY_OPEN_WORLD = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

const READ_ONLY_CLOSED_WORLD = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

async function snapshotFor(
  recallNumber: AllowedRecallNumber,
  mode: "live" | "fixture",
): Promise<{ snapshot: RecallSnapshot; validation: unknown }> {
  const fixture = await loadRecallFixture(recallNumber);
  if (mode === "fixture") {
    return {
      snapshot: fixture,
      validation: {
        valid: true,
        source: "captured-fixture",
        warning: "Demo fallback only; a fixture is not sufficient for an approved action.",
      },
    };
  }
  return fetchVerifiedRecall(fixture);
}

export function buildMcpServer(): McpServer {
  const server = new McpServer(
    { name: "cpsc-recalls", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "get_source_policy",
    {
      title: "Get REVOKE evidence source policy",
      description:
        "Explains why authoritative CPSC pages and Bright Data non-government discovery are separate evidence lanes.",
      inputSchema: {},
      annotations: READ_ONLY_CLOSED_WORLD,
    },
    () =>
      Promise.resolve(
        result({
          authoritative: "Direct read-only verification of allowlisted cpsc.gov notices",
          discovery:
            "Bright Data search plus scrape of non-government manufacturer or retailer pages",
          governmentDomainPolicy:
            "Do not ask Bright Data to bypass its policy block on government domains.",
          writeAllowed: false,
        }),
      ),
  );

  server.registerTool(
    "get_recall_snapshot",
    {
      title: "Get a verified CPSC recall snapshot",
      description:
        "Fetches an allowlisted CPSC notice and verifies every captured title, date, unit, identifier, hazard, remedy, and family-scope signal.",
      inputSchema: {
        recallNumber: z.enum(["26-601", "26-717"]),
        mode: z.enum(["live", "fixture"]).default("live"),
      },
      annotations: READ_ONLY_OPEN_WORLD,
    },
    async ({ recallNumber, mode }) => result(await snapshotFor(recallNumber, mode)),
  );

  server.registerTool(
    "compare_recall_expansion",
    {
      title: "Compare the verified Cuisinart recall expansion",
      description:
        "Verifies both allowlisted CPSC notices and computes identifiers and family scope added by recall 26-717 over 26-601.",
      inputSchema: {
        previousRecallNumber: z.literal("26-601").default("26-601"),
        currentRecallNumber: z.literal("26-717").default("26-717"),
        mode: z.enum(["live", "fixture"]).default("live"),
      },
      annotations: READ_ONLY_OPEN_WORLD,
    },
    async ({ previousRecallNumber, currentRecallNumber, mode }) => {
      if (
        !isAllowedRecallNumber(previousRecallNumber) ||
        !isAllowedRecallNumber(currentRecallNumber)
      ) {
        throw new Error("Recall pair is outside the allowlist.");
      }
      const [previous, current] = await Promise.all([
        snapshotFor(previousRecallNumber, mode),
        snapshotFor(currentRecallNumber, mode),
      ]);
      return result({
        mode,
        previous,
        current,
        expansion: buildRecallExpansion(previous.snapshot, current.snapshot),
      });
    },
  );

  return server;
}
