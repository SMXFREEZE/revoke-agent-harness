import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CommerceStore } from "./store.js";

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
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

export function buildMcpServer(store: CommerceStore): McpServer {
  const server = new McpServer(
    { name: "revoke-commerce", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "get_demo_catalog",
    {
      title: "Get simulated merchant catalog",
      description:
        "Returns the clearly labeled simulated catalog used for the REVOKE hackathon demo.",
      inputSchema: {},
      annotations: READ_ONLY,
    },
    () => Promise.resolve(toolResult({ environment: "simulated", items: store.listCatalog() })),
  );

  server.registerTool(
    "get_orders_by_skus",
    {
      title: "Get simulated orders by SKU",
      description:
        "Returns pseudonymous simulated orders containing one or more requested SKUs.",
      inputSchema: {
        skus: z.array(z.string().min(1)).min(1),
      },
      annotations: READ_ONLY,
    },
    ({ skus }) =>
      Promise.resolve(
        toolResult({
          environment: "simulated",
          orders: store.getOrdersBySkus(skus),
        }),
      ),
  );

  server.registerTool(
    "preview_containment",
    {
      title: "Preview listing quarantine and inventory hold",
      description:
        "Creates an immutable before/after proposal without changing simulated commerce state.",
      inputSchema: {
        recallNumber: z.string().min(1),
        skus: z.array(z.string().min(1)).min(1),
      },
      annotations: READ_ONLY,
    },
    ({ recallNumber, skus }) =>
      Promise.resolve(
        toolResult({
          environment: "simulated",
          mutationPerformed: false,
          proposal: store.previewContainment(recallNumber, skus),
        }),
      ),
  );

  server.registerTool(
    "apply_containment",
    {
      title: "Apply listing quarantine and inventory hold",
      description:
        "Mutates only the simulated commerce environment. This tool must be human-approved in TrueForge before execution.",
      inputSchema: {
        proposalId: z.string().min(1),
        idempotencyKey: z.string().min(1),
        approvedBy: z.string().min(1),
      },
      annotations: CONTROLLED_WRITE,
    },
    (input) =>
      Promise.resolve(
        toolResult({
          environment: "simulated",
          ...store.applyContainment(input),
        }),
      ),
  );

  server.registerTool(
    "rollback_containment",
    {
      title: "Rollback a containment receipt",
      description:
        "Restores simulated catalog state from a prior receipt. Human approval is required in TrueForge.",
      inputSchema: {
        receiptId: z.string().uuid(),
        idempotencyKey: z.string().min(1),
        approvedBy: z.string().min(1),
      },
      annotations: CONTROLLED_WRITE,
    },
    (input) =>
      Promise.resolve(
        toolResult({
          environment: "simulated",
          ...store.rollbackContainment(input),
        }),
      ),
  );

  server.registerTool(
    "create_notice_drafts",
    {
      title: "Create customer notice drafts",
      description:
        "Creates drafts for pseudonymous demo customers in a test sink. It never sends real messages. Human approval is required in TrueForge.",
      inputSchema: {
        receiptId: z.string().uuid(),
        idempotencyKey: z.string().min(1),
        approvedBy: z.string().min(1),
      },
      annotations: CONTROLLED_WRITE,
    },
    (input) =>
      Promise.resolve(
        toolResult({
          environment: "simulated",
          delivery: "test-sink",
          ...store.createNoticeDrafts(input),
        }),
      ),
  );

  server.registerTool(
    "get_audit_log",
    {
      title: "Get simulated commerce audit log",
      description: "Returns proposals, approved actions, rollbacks, and draft creation events.",
      inputSchema: {},
      annotations: READ_ONLY,
    },
    () => Promise.resolve(toolResult({ environment: "simulated", events: store.auditLog() })),
  );

  return server;
}

