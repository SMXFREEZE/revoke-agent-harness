import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadDemoFixtures } from "../src/fixtures.js";
import { CommerceStore } from "../src/store.js";

const openClients: Client[] = [];
const openServers: Array<ReturnType<ReturnType<typeof createApp>["listen"]>> = [];

afterEach(async () => {
  await Promise.all(openClients.splice(0).map((client) => client.close()));
  await Promise.all(
    openServers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error !== undefined) {
              reject(error);
            } else {
              resolve();
            }
          });
        }),
    ),
  );
});

describe("MCP contract", () => {
  it("publishes read/write annotations and returns labeled simulated data", async () => {
    const fixtures = await loadDemoFixtures();
    const app = createApp(
      new CommerceStore(
        fixtures.catalog,
        fixtures.orders,
        fixtures.actionableTargetsByRecall,
        "test-only-approval-secret-with-at-least-32-bytes",
      ),
    );
    const httpServer = app.listen(0, "127.0.0.1");
    openServers.push(httpServer);
    await new Promise<void>((resolve) => httpServer.once("listening", resolve));
    const address = httpServer.address() as AddressInfo;

    const client = new Client({ name: "revoke-contract-test", version: "0.1.0" });
    openClients.push(client);
    const transport = new StreamableHTTPClientTransport(
      new URL("http://127.0.0.1:" + address.port + "/mcp"),
    );
    // The SDK transport works at runtime, but its declaration currently uses
    // explicit undefined accessors that conflict with exactOptionalPropertyTypes.
    await client.connect(transport as unknown as Transport);

    const tools = await client.listTools();
    const catalogTool = tools.tools.find((tool) => tool.name === "get_demo_catalog");
    const applyTool = tools.tools.find((tool) => tool.name === "apply_containment");

    expect(catalogTool?.annotations?.readOnlyHint).toBe(true);
    expect(applyTool?.annotations?.readOnlyHint).toBe(false);
    expect(applyTool?.annotations?.idempotentHint).toBe(true);

    const result = CallToolResultSchema.parse(
      await client.callTool({
        name: "get_demo_catalog",
        arguments: {},
      }),
    );
    const firstContent = result.content[0];
    expect(firstContent?.type).toBe("text");
    if (firstContent?.type !== "text") {
      throw new Error("Expected a text MCP result.");
    }
    expect(JSON.parse(firstContent.text)).toMatchObject({
      environment: "simulated",
    });
  });
});
