import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GaggleLabStore } from "./store.js";

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const CONTROLLED_WRITE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

function toolResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function buildMcpServer(store: GaggleLabStore): McpServer {
  const server = new McpServer(
    { name: "gaggle-lab", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "get_synthetic_case",
    {
      title: "Get the synthetic microbiome R&D case",
      description: "Returns the reproducible, non-identifiable Case GGG-0042 fixture.",
      inputSchema: {},
      annotations: READ_ONLY,
    },
    () => Promise.resolve(toolResult({ environment: "synthetic-rd-prototype", case: store.getCase() })),
  );

  server.registerTool(
    "preview_experimental_proposal",
    {
      title: "Preview an experimental candidate proposal",
      description:
        "Creates an immutable proposal preview without promoting a product, making a clinical claim, or changing an external system.",
      inputSchema: { candidateIds: z.array(z.string().min(1)).min(1) },
      annotations: READ_ONLY,
    },
    ({ candidateIds }) =>
      Promise.resolve(
        toolResult({
          environment: "synthetic-rd-prototype",
          proposal: store.preview(candidateIds),
        }),
      ),
  );

  server.registerTool(
    "promote_experimental_proposal",
    {
      title: "Approve for experimental validation",
      description:
        "Updates only the synthetic R&D proposal record. TrueForge must obtain human approval for this exact proposal id and hash before invocation.",
      inputSchema: {
        proposalId: z.string().min(1),
        proposalHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
        approvedBy: z.string().min(1),
      },
      annotations: CONTROLLED_WRITE,
    },
    (input) =>
      Promise.resolve(
        toolResult({
          environment: "synthetic-rd-prototype",
          externalMutationPerformed: false,
          ...store.promote(input),
        }),
      ),
  );

  server.registerTool(
    "get_investigation_audit",
    {
      title: "Get the append-only investigation audit",
      description: "Returns preview and scientist-approval events in sequence order.",
      inputSchema: {},
      annotations: READ_ONLY,
    },
    () => Promise.resolve(toolResult({ environment: "synthetic-rd-prototype", events: store.auditLog() })),
  );

  return server;
}
