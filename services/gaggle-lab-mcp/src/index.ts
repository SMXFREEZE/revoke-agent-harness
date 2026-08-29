import { createApp } from "./app.js";
import { loadGaggleFixture } from "./fixtures.js";
import { GaggleLabStore } from "./store.js";

const port = Number.parseInt(process.env.GAGGLE_LAB_MCP_PORT ?? "8942", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("GAGGLE_LAB_MCP_PORT must be a valid TCP port.");
}

const store = new GaggleLabStore(await loadGaggleFixture());
createApp(store).listen(port, "127.0.0.1", () => {
  console.log(`[gaggle-lab-mcp] listening on http://127.0.0.1:${port}/mcp`);
});
