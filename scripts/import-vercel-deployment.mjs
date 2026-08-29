import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const API_ORIGIN = "https://api.vercel.com";

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requireArgument(name) {
  const value = readArgument(name);
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

function parseToken(raw) {
  const trimmed = raw.trim();
  const match = trimmed.match(
    /^\s*VERCEL(?:_API|_TOKEN)?\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m,
  );
  return (match?.[1] ?? trimmed).trim();
}

async function apiRequest(url, token, attempts = 5) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      return response;
    }

    if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      const delay = retryAfter > 0 ? retryAfter * 1_000 : attempt * 600;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    const body = await response.text();
    throw new Error(`Vercel API ${response.status}: ${body.slice(0, 300)}`);
  }

  throw new Error("Vercel API request exhausted all retry attempts.");
}

function flattenFiles(entries, parent = "") {
  const files = [];

  for (const entry of entries) {
    const relativePath = parent ? `${parent}/${entry.name}` : entry.name;
    if (
      !entry.name ||
      entry.name === "." ||
      entry.name === ".." ||
      path.posix.isAbsolute(relativePath) ||
      relativePath.split("/").includes("..")
    ) {
      throw new Error(`Unsafe source path returned by Vercel: ${relativePath}`);
    }

    if (entry.type === "directory") {
      files.push(...flattenFiles(entry.children ?? [], relativePath));
    } else if (entry.type === "file" && entry.uid) {
      files.push({ path: relativePath, uid: entry.uid, mode: entry.mode });
    } else {
      throw new Error(`Unsupported source entry: ${relativePath} (${entry.type})`);
    }
  }

  return files;
}

async function mapConcurrent(items, concurrency, worker) {
  let cursor = 0;
  const results = new Array(items.length);

  async function runWorker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  );
  return results;
}

async function assertTargetIsEmpty(target) {
  try {
    const details = await stat(target);
    if (!details.isDirectory()) {
      throw new Error(`Import target is not a directory: ${target}`);
    }
    const { readdir } = await import("node:fs/promises");
    if ((await readdir(target)).length > 0) {
      throw new Error(`Refusing to overwrite non-empty import target: ${target}`);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

async function main() {
  const deploymentId = requireArgument("--deployment");
  const teamId = requireArgument("--team");
  const tokenFile = path.resolve(requireArgument("--token-file"));
  const target = path.resolve(requireArgument("--target"));
  const token = parseToken(await readFile(tokenFile, "utf8"));

  if (!token) {
    throw new Error("The Vercel API token file is empty.");
  }

  await assertTargetIsEmpty(target);
  await mkdir(target, { recursive: true });

  const manifestUrl = new URL(
    `/v6/deployments/${encodeURIComponent(deploymentId)}/files`,
    API_ORIGIN,
  );
  manifestUrl.searchParams.set("teamId", teamId);
  const manifest = await (await apiRequest(manifestUrl, token)).json();
  const sourceRoot = manifest.find(
    (entry) => entry.name === "src" && entry.type === "directory",
  );

  if (!sourceRoot) {
    throw new Error("The deployment manifest did not contain a src directory.");
  }

  const files = flattenFiles(sourceRoot.children ?? []);
  let totalBytes = 0;

  await mapConcurrent(files, 8, async (file, index) => {
    const contentUrl = new URL(
      `/v8/deployments/${encodeURIComponent(deploymentId)}/files/${encodeURIComponent(file.uid)}`,
      API_ORIGIN,
    );
    contentUrl.searchParams.set("teamId", teamId);
    const payload = await (await apiRequest(contentUrl, token)).json();
    const data = Buffer.from(payload.data, "base64");
    const digest = createHash("sha1").update(data).digest("hex");

    if (digest !== file.uid) {
      throw new Error(`Hash mismatch for ${file.path}`);
    }

    const destination = path.resolve(target, ...file.path.split("/"));
    const relativeDestination = path.relative(target, destination);
    if (relativeDestination.startsWith("..") || path.isAbsolute(relativeDestination)) {
      throw new Error(`Unsafe destination path: ${destination}`);
    }

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, data, {
      mode: file.mode && (file.mode & 0o111) ? 0o755 : 0o644,
    });
    totalBytes += data.byteLength;

    if ((index + 1) % 50 === 0 || index + 1 === files.length) {
      console.log(`Imported ${index + 1}/${files.length} files`);
    }
  });

  console.log(
    `Imported ${files.length} verified files (${totalBytes} bytes) into ${target}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
