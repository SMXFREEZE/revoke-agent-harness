import { access, mkdir, mkdtemp, open, readFile, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { basename, dirname, resolve } from "node:path";

const ARTIFACT_NAMES = ["trace.json", "case-crate.json"];
const LOCK_LEASE_MS = 30_000;
const LOCK_OWNER_FILE = "owner.json";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeSynced(path, content) {
  const handle = await open(path, "wx");
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function syncDirectory(path) {
  let handle;
  try {
    handle = await open(path, "r");
    await handle.sync();
  } catch (error) {
    if (process.platform !== "win32" || !["EACCES", "EBADF", "EISDIR", "EPERM"].includes(error?.code)) {
      throw error;
    }
  } finally {
    await handle?.close();
  }
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}

async function readLockOwner(lockDirectory) {
  try {
    return JSON.parse(await readFile(resolve(lockDirectory, LOCK_OWNER_FILE), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
}

function validLockOwner(owner) {
  return (
    owner?.schemaVersion === 1 &&
    typeof owner.ownerId === "string" &&
    Number.isInteger(owner.pid) &&
    typeof owner.hostname === "string" &&
    Number.isFinite(Date.parse(owner.leaseExpiresAt))
  );
}

async function acquireLock(lockDirectory, lockOptions = {}) {
  const now = lockOptions.now ?? Date.now;
  const currentHostname = lockOptions.hostname ?? hostname();
  const isProcessAlive = lockOptions.isProcessAlive ?? processIsAlive;
  const leaseDurationMs = lockOptions.leaseDurationMs ?? LOCK_LEASE_MS;
  const owner = {
    schemaVersion: 1,
    ownerId: randomUUID(),
    pid: lockOptions.pid ?? process.pid,
    hostname: currentHostname,
    acquiredAt: new Date(now()).toISOString(),
    leaseExpiresAt: new Date(now() + leaseDurationMs).toISOString(),
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidateDirectory = await mkdtemp(`${lockDirectory}.candidate-`);
    try {
      await writeSynced(resolve(candidateDirectory, LOCK_OWNER_FILE), `${JSON.stringify(owner)}\n`);
      await syncDirectory(candidateDirectory);
      try {
        await rename(candidateDirectory, lockDirectory);
        return owner;
      } catch (error) {
        if (!(await exists(lockDirectory))) throw error;
      }
    } finally {
      await rm(candidateDirectory, { recursive: true, force: true });
    }

    const existingOwner = await readLockOwner(lockDirectory);
    const demonstrablyStale =
      validLockOwner(existingOwner) &&
      existingOwner.hostname === currentHostname &&
      Date.parse(existingOwner.leaseExpiresAt) <= now() &&
      !isProcessAlive(existingOwner.pid);
    if (!demonstrablyStale) {
      throw new Error("A Gaggle artifact export is already in progress.");
    }

    const staleDirectory = `${lockDirectory}.stale-${existingOwner.ownerId}-${randomUUID()}`;
    try {
      await rename(lockDirectory, staleDirectory);
      await rm(staleDirectory, { recursive: true, force: true });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error("Could not acquire the Gaggle artifact export lock.");
}

async function releaseLock(lockDirectory, ownerId) {
  const owner = await readLockOwner(lockDirectory);
  if (owner?.ownerId === ownerId) {
    await rm(lockDirectory, { recursive: true, force: true });
  }
}

export async function publishArtifactPair({
  outputDirectory,
  artifacts,
  beforePublishArtifact,
  beforeRestoreArtifact,
  lockOptions,
}) {
  if (!outputDirectory || typeof outputDirectory !== "string") {
    throw new Error("An output directory is required.");
  }
  for (const name of ARTIFACT_NAMES) {
    if (typeof artifacts?.[name] !== "string") throw new Error(`Missing artifact bytes for ${name}.`);
  }

  const parentDirectory = dirname(outputDirectory);
  const lockDirectory = resolve(parentDirectory, `.${basename(outputDirectory)}.export.lock`);
  await mkdir(parentDirectory, { recursive: true });
  const lockOwner = await acquireLock(lockDirectory, lockOptions);

  let transactionDirectory;
  let preserveTransactionDirectory = false;
  try {
    await mkdir(outputDirectory, { recursive: true });
    transactionDirectory = await mkdtemp(resolve(parentDirectory, ".gaggle-export-"));
    const published = [];
    const backups = [];
    try {
      for (const name of ARTIFACT_NAMES) {
        await writeSynced(resolve(transactionDirectory, name), artifacts[name]);
      }
      for (const name of ARTIFACT_NAMES) {
        const target = resolve(outputDirectory, name);
        if (await exists(target)) {
          const backup = resolve(transactionDirectory, `previous-${name}`);
          await rename(target, backup);
          backups.push({ name, target, backup });
        }
      }
      for (const [index, name] of ARTIFACT_NAMES.entries()) {
        await beforePublishArtifact?.({ name, index });
        const target = resolve(outputDirectory, name);
        await rename(resolve(transactionDirectory, name), target);
        published.push(target);
      }
      await syncDirectory(outputDirectory);
    } catch (error) {
      const rollbackErrors = [];
      for (const target of published.reverse()) {
        try {
          await rm(target, { force: true });
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      const restoreErrors = [];
      for (const [index, { name, target, backup }] of backups.reverse().entries()) {
        try {
          await beforeRestoreArtifact?.({ name, target, backup, index });
          await rename(backup, target);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
          restoreErrors.push(rollbackError);
        }
      }
      if (rollbackErrors.length > 0) {
        preserveTransactionDirectory = restoreErrors.length > 0;
        const recoveryMessage = preserveTransactionDirectory
          ? ` Recovery files were preserved at ${transactionDirectory}.`
          : "";
        const aggregateError = new AggregateError(
          [error, ...rollbackErrors],
          `Artifact pair publication and rollback failed.${recoveryMessage}`,
          { cause: error },
        );
        if (preserveTransactionDirectory) aggregateError.recoveryDirectory = transactionDirectory;
        throw aggregateError;
      }
      throw error;
    }
  } finally {
    try {
      if (transactionDirectory && !preserveTransactionDirectory) {
        await rm(transactionDirectory, { recursive: true, force: true });
      }
    } finally {
      await releaseLock(lockDirectory, lockOwner.ownerId);
    }
  }
}
