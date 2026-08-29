import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadGaggleFixture } from "../src/fixtures.js";
import { GaggleLabStore } from "../src/store.js";

const clients: Client[] = [];
const servers: Array<ReturnType<ReturnType<typeof createApp>["listen"]>> = [];

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

describe("Gaggle lab MCP contract", () => {
  it("marks proposal promotion as a policy-gated write", async () => {
    const app = createApp(new GaggleLabStore(await loadGaggleFixture()));
    const httpServer = app.listen(0, "127.0.0.1");
    servers.push(httpServer);
    await new Promise<void>((resolve) => httpServer.once("listening", resolve));
    const address = httpServer.address() as AddressInfo;
    const client = new Client({ name: "gaggle-contract-test", version: "0.1.0" });
    clients.push(client);
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${address.port}/mcp`),
      ) as unknown as Transport,
    );

    const tools = await client.listTools();
    const readTool = tools.tools.find((tool) => tool.name === "get_synthetic_case");
    const writeTool = tools.tools.find(
      (tool) => tool.name === "promote_experimental_proposal",
    );
    expect(readTool?.annotations?.readOnlyHint).toBe(true);
    expect(writeTool?.annotations?.readOnlyHint).toBe(false);
    expect(writeTool?.annotations?.idempotentHint).toBe(true);
  });
});
