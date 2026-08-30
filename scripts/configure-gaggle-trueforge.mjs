import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* global AbortSignal */

const requiredEnvironment = ["OPENAI_API_KEY", "DAYTONA_API_KEY", "BRIGHTDATA_API_KEY"];
for (const name of requiredEnvironment) {
  if (!process.env[name]?.trim()) throw new Error(`Required sponsor credential ${name} is not available.`);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.TRUEFORGE_LOCAL_URL?.trim() || "http://127.0.0.1:8790";
const url = new URL(baseUrl);
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
  throw new Error("The configuration script only sends sponsor credentials to a loopback TrueForge instance.");
}
const apiBase = `${baseUrl.replace(/\/$/, "")}/api/v1`;

async function trueForge(pathname, { method = "GET", body } = {}) {
  const response = await fetch(`${apiBase}${pathname}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) throw new Error(`TrueForge ${method} ${pathname} failed with HTTP ${response.status}.`);
  return response.status === 204 ? {} : response.json();
}

async function main() {
  const health = await fetch("http://127.0.0.1:8942/health", { signal: AbortSignal.timeout(5_000) });
  if (!health.ok) throw new Error("gaggle-lab is not healthy on the loopback interface.");

  await trueForge("/settings/model-providers", {
    method: "PUT",
    body: {
      manifest: {
        type: "openai",
        base_url: "https://api.openai.com/v1",
        auth: { api_key: process.env.OPENAI_API_KEY },
        models: [{
          model_id: "gpt-5.6-sol",
          name: "gpt-5-6-sol",
          properties: {
            context_length: 1_050_000,
            max_output_tokens: 128_000,
            reasoning_efforts: ["none", "low", "medium", "high", "xhigh", "max"],
          },
        }],
      },
    },
  });

  await trueForge("/settings/sandbox-providers", {
    method: "PUT",
    body: {
      manifest: {
        type: "daytona",
        auth: { api_key: process.env.DAYTONA_API_KEY },
        exec_timeout_ms: 120_000,
        auto_stop_interval_in_minutes: 5,
        auto_archive_interval_in_minutes: 60,
        auto_delete_interval_in_minutes: 1_440,
      },
    },
  });

  const connectors = [
    {
      name: "bright-data",
      expected: ["search_engine", "scrape_as_markdown"],
      manifest: {
        type: "remote",
        name: "bright-data",
        url: "https://mcp.brightdata.com/mcp?tools=search_engine,scrape_as_markdown",
        description: "Live public microbiome evidence search and collection with provenance.",
        auth: { type: "header", headers: { Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}` } },
      },
    },
    {
      name: "gaggle-lab",
      expected: ["get_synthetic_case", "preview_experimental_proposal", "promote_experimental_proposal", "get_investigation_audit"],
      manifest: {
        type: "remote",
        name: "gaggle-lab",
        url: "http://127.0.0.1:8942/mcp",
        description: "Synthetic microbiome case, immutable proposal preview, guarded scientist approval, and audit.",
      },
    },
  ];

  for (const connector of connectors) {
    await trueForge("/settings/mcp-servers", { method: "PUT", body: { manifest: connector.manifest } });
    const tools = await trueForge(`/mcp-servers/${connector.name}/tools`);
    const names = Array.isArray(tools.data) ? tools.data.map((tool) => tool.name) : [];
    const missing = connector.expected.filter((name) => !names.includes(name));
    if (missing.length > 0) throw new Error(`${connector.name} is missing required tools: ${missing.join(", ")}.`);
  }

  const manifest = JSON.parse(await readFile(path.join(root, "agents", "gaggle.agent.json"), "utf8"));
  const agents = await trueForge("/agents");
  const existing = Array.isArray(agents.data) ? agents.data.find((agent) => agent.name === "gaggle") : undefined;
  const saved = existing
    ? await trueForge(`/agents/${existing.id}`, { method: "PUT", body: { manifest } })
    : await trueForge("/agents", { method: "POST", body: { name: "gaggle", manifest } });
  if (!saved.data?.id) throw new Error("TrueForge did not persist the Gaggle agent.");

  process.stdout.write("trueforge_configuration=verified\n");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "TrueForge configuration failed."}\n`);
  process.exitCode = 1;
});
