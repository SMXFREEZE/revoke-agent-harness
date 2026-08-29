import { createApp } from "./app.js";

const port = Number.parseInt(process.env.REVOKE_EVIDENCE_MCP_PORT ?? "8940", 10);
const host = "127.0.0.1";

createApp().listen(port, host, () => {
  console.log(`REVOKE CPSC evidence MCP listening at http://${host}:${port}/mcp`);
});
