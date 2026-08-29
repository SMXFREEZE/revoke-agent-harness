import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import express, { type Express } from "express";
import { buildMcpServer } from "./mcp.js";
import type { GaggleLabStore } from "./store.js";

export function createApp(store: GaggleLabStore): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "gaggle-lab-mcp", environment: "synthetic-rd-prototype" });
  });

  app.post("/mcp", async (request, response) => {
    try {
      const server = buildMcpServer(store);
      const transport = new StreamableHTTPServerTransport();
      response.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport as unknown as Transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      console.error(
        "[gaggle-lab-mcp] request failed:",
        error instanceof Error ? error.message : "unknown error",
      );
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  return app;
}
