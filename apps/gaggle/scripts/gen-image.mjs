// Azure gpt-image image generator for Tulum DJ Academy art.
// Usage: node scripts/gen-image.mjs "<prompt>" public/images/tulum/out.jpg [size]
// Reads keys from .env.local (AZURE_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_IMAGE_DEPLOYMENT, AZURE_OPENAI_API_VERSION).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const [, , prompt, outPath, size = "1024x1024"] = process.argv;
if (!prompt || !outPath) {
  console.error("usage: node scripts/gen-image.mjs <prompt> <outPath> [size]");
  process.exit(1);
}

const env = loadEnv();
const endpoint = env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
const deployment = env.AZURE_IMAGE_DEPLOYMENT;
const version = env.AZURE_OPENAI_API_VERSION || "2024-02-01";
const url = `${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${version}`;

const body = {
  prompt,
  n: 1,
  size,
  quality: env.AZURE_IMAGE_QUALITY || "high",
};

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", "api-key": env.AZURE_API_KEY },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error("HTTP", res.status, await res.text());
  process.exit(1);
}
const json = await res.json();
const b64 = json?.data?.[0]?.b64_json;
const remoteUrl = json?.data?.[0]?.url;
mkdirSync(dirname(outPath), { recursive: true });
if (b64) {
  writeFileSync(outPath, Buffer.from(b64, "base64"));
} else if (remoteUrl) {
  const img = await fetch(remoteUrl);
  writeFileSync(outPath, Buffer.from(await img.arrayBuffer()));
} else {
  console.error("no image in response:", JSON.stringify(json).slice(0, 400));
  process.exit(1);
}
console.log("saved", outPath);
