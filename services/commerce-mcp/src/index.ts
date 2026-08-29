import { createApp } from "./app.js";
import { loadDemoFixtures } from "./fixtures.js";
import { CommerceStore } from "./store.js";

const port = Number.parseInt(process.env.REVOKE_COMMERCE_MCP_PORT ?? "8941", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("REVOKE_COMMERCE_MCP_PORT must be a valid TCP port.");
}

const fixtures = await loadDemoFixtures();
const store = new CommerceStore(fixtures.catalog, fixtures.orders);
const app = createApp(store);

app.listen(port, "127.0.0.1", () => {
  console.log(
    "[revoke-commerce-mcp] listening on http://127.0.0.1:" + port + "/mcp",
  );
});

