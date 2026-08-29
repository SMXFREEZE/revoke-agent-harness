import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import express, { type Express } from "express";
import { buildMcpServer } from "./mcp.js";

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "cpsc-recalls", writes: false });
  });

  app.post("/mcp", async (request, response) => {
    try {
      const server = buildMcpServer();
      const transport = new StreamableHTTPServerTransport();
      response.on("close", () => {
        void transport.close();
        void server.close();
      });
      // Isolate the MCP SDK exactOptionalPropertyTypes declaration mismatch.
      await server.connect(transport as unknown as Transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      console.error(
        "[cpsc-recalls] request failed:",
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
