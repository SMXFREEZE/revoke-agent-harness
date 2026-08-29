import { access, mkdir, mkdtemp, open, rename, rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const ARTIFACT_NAMES = ["trace.json", "case-crate.json"];

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

export async function publishArtifactPair({ outputDirectory, artifacts, beforePublishArtifact }) {
  if (!outputDirectory || typeof outputDirectory !== "string") {
    throw new Error("An output directory is required.");
  }
  for (const name of ARTIFACT_NAMES) {
    if (typeof artifacts?.[name] !== "string") throw new Error(`Missing artifact bytes for ${name}.`);
  }

  const parentDirectory = dirname(outputDirectory);
  const lockDirectory = resolve(parentDirectory, `.${basename(outputDirectory)}.export.lock`);
  await mkdir(parentDirectory, { recursive: true });
  try {
    await mkdir(lockDirectory);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error("A Gaggle artifact export is already in progress.", { cause: error });
    }
    throw error;
  }

  let transactionDirectory;
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
          backups.push({ target, backup });
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
      for (const { target, backup } of backups.reverse()) {
        try {
          await rename(backup, target);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      if (rollbackErrors.length > 0) {
        throw new AggregateError(
          [error, ...rollbackErrors],
          "Artifact pair publication and rollback failed.",
          { cause: error },
        );
      }
      throw error;
    }
  } finally {
    try {
      if (transactionDirectory) await rm(transactionDirectory, { recursive: true, force: true });
    } finally {
      await rm(lockDirectory, { recursive: true, force: true });
    }
  }
}
