import { Daytona } from "@daytona/sdk";

/* global AbortSignal */

const REQUIRED = ["DAYTONA_API_KEY", "OPENAI_API_KEY", "BRIGHTDATA_API_KEY"];
for (const name of REQUIRED) {
  if (!process.env[name]?.trim()) throw new Error(`Required environment variable ${name} is unavailable.`);
}

const SANDBOX_NAME = "gaggle-live-trueforge";
const REPOSITORY = "https://github.com/SMXFREEZE/revoke-agent-harness.git";
const REPOSITORY_PATH = "/home/daytona/revoke";
const branch = process.env.GAGGLE_DEPLOY_REF?.trim() || "main";
if (!/^[A-Za-z0-9._/-]{1,120}$/.test(branch) || branch.startsWith("/") || branch.includes("..")) {
  throw new Error("GAGGLE_DEPLOY_REF is invalid.");
}

function progress(message) {
  if (!process.argv.includes("--json")) process.stdout.write(`${message}\n`);
}

async function run(sandbox, command, cwd = REPOSITORY_PATH, timeout = 180) {
  const result = await sandbox.process.executeCommand(command, cwd, undefined, timeout);
  if (result.exitCode !== 0) throw new Error(`Sandbox command failed with exit code ${result.exitCode}.`);
  return result.result.trim();
}

async function waitForHealth(sandbox, url, attempts = 40) {
  const probe = `node -e "fetch('${url}').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"`;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await sandbox.process.executeCommand(probe, REPOSITORY_PATH, undefined, 15);
    if (result.exitCode === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }
  throw new Error(`Service health check did not pass for ${new URL(url).port}.`);
}

async function replaceServiceSession(sandbox, sessionId, command) {
  const sessions = await sandbox.process.listSessions();
  if (sessions.some((session) => session.sessionId === sessionId)) await sandbox.process.deleteSession(sessionId);
  await sandbox.process.createSession(sessionId);
  await sandbox.process.executeSessionCommand(sessionId, { command, runAsync: true, suppressInputEcho: true });
}

async function findSandbox(daytona) {
  for await (const candidate of daytona.list({ labels: { app: "gaggle-live-trueforge" } })) {
    if (candidate.name === SANDBOX_NAME) return candidate;
  }
  return null;
}

async function main() {
  const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY });
  let sandbox = await findSandbox(daytona);
  const environment = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DAYTONA_API_KEY: process.env.DAYTONA_API_KEY,
    BRIGHTDATA_API_KEY: process.env.BRIGHTDATA_API_KEY,
    HOST: "0.0.0.0",
    PORT: "8790",
    SQLITE_PATH: "/home/daytona/trueforge-data/db.sqlite",
    NODE_ENV: "production",
  };

  if (!sandbox) {
    progress("daytona_sandbox=creating_private_runtime");
    sandbox = await daytona.create({
      name: SANDBOX_NAME,
      image: "node:22-bookworm",
      language: "typescript",
      public: false,
      envVars: environment,
      labels: { app: "gaggle-live-trueforge", sponsor: "trueforge-daytona" },
      autoStopInterval: 0,
      autoArchiveInterval: 0,
      autoDeleteInterval: -1,
    }, { timeout: 600 });
  } else {
    progress("daytona_sandbox=reusing_private_runtime");
    if (sandbox.state !== "started") await daytona.start(sandbox, 180);
    await sandbox.updateEnv(environment);
  }

  const repositoryCheck = await sandbox.process.executeCommand("test -d .git", REPOSITORY_PATH, undefined, 20);
  if (repositoryCheck.exitCode !== 0) {
    progress("repository=cloning");
    await sandbox.git.clone(REPOSITORY, REPOSITORY_PATH, branch, undefined, undefined, undefined, false, 1);
  } else {
    progress("repository=updating");
    await run(sandbox, `git fetch --depth=1 origin ${branch} && git checkout -B ${branch} origin/${branch}`);
  }

  progress("dependencies=installing");
  await run(sandbox, "npm ci --no-audit --no-fund", REPOSITORY_PATH, 900);
  await run(sandbox, "mkdir -p /home/daytona/trueforge-data", REPOSITORY_PATH, 30);

  progress("gaggle_lab=starting");
  await replaceServiceSession(sandbox, "gaggle-lab", `cd ${REPOSITORY_PATH} && exec npm run start --workspace @gaggle/lab-mcp`);
  await waitForHealth(sandbox, "http://127.0.0.1:8942/health");

  progress("trueforge=starting");
  await replaceServiceSession(sandbox, "trueforge", `cd ${REPOSITORY_PATH} && exec npx trueforge --port 8790`);
  await waitForHealth(sandbox, "http://127.0.0.1:8790/api/v1/agents", 60);

  progress("trueforge=configuring_sponsor_tools");
  await run(sandbox, "node scripts/configure-gaggle-trueforge.mjs", REPOSITORY_PATH, 360);
  const preview = await sandbox.getPreviewLink(8790);
  const check = await fetch(`${preview.url.replace(/\/$/, "")}/api/v1/agents`, {
    headers: preview.token ? { "x-daytona-preview-token": preview.token } : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  if (!check.ok) throw new Error(`Private TrueForge preview failed with HTTP ${check.status}.`);

  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ sandboxId: sandbox.id, url: preview.url, token: preview.token }));
  } else {
    process.stdout.write(`daytona_sandbox=ready:${sandbox.id}\ntrueforge_preview=verified_private\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Daytona deployment failed."}\n`);
  process.exitCode = 1;
});
