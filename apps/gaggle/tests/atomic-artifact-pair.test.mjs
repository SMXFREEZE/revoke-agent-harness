import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { publishArtifactPair } from "../../../scripts/lib/atomic-artifact-pair.mjs";

const temporaryDirectories = [];

async function temporaryOutput() {
  const root = await mkdtemp(resolve(tmpdir(), "gaggle-artifacts-"));
  temporaryDirectories.push(root);
  return resolve(root, "gaggle-0042");
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("atomic Gaggle artifact publication", () => {
  it("publishes the linked trace and case crate together", async () => {
    const outputDirectory = await temporaryOutput();
    await publishArtifactPair({
      outputDirectory,
      artifacts: { "trace.json": "trace-v1", "case-crate.json": "crate-v1" },
    });
    await expect(readFile(resolve(outputDirectory, "trace.json"), "utf8")).resolves.toBe("trace-v1");
    await expect(readFile(resolve(outputDirectory, "case-crate.json"), "utf8")).resolves.toBe("crate-v1");
  });

  it("restores the previous pair when the second publish step fails", async () => {
    const outputDirectory = await temporaryOutput();
    await publishArtifactPair({
      outputDirectory,
      artifacts: { "trace.json": "trace-v1", "case-crate.json": "crate-v1" },
    });
    await expect(
      publishArtifactPair({
        outputDirectory,
        artifacts: { "trace.json": "trace-v2", "case-crate.json": "crate-v2" },
        beforePublishArtifact: ({ index }) => {
          if (index === 1) throw new Error("simulated second-file failure");
        },
      }),
    ).rejects.toThrow("simulated second-file failure");
    await expect(readFile(resolve(outputDirectory, "trace.json"), "utf8")).resolves.toBe("trace-v1");
    await expect(readFile(resolve(outputDirectory, "case-crate.json"), "utf8")).resolves.toBe("crate-v1");
  });

  it("preserves backup files and reports their path when a restore fails", async () => {
    const outputDirectory = await temporaryOutput();
    await publishArtifactPair({
      outputDirectory,
      artifacts: { "trace.json": "trace-v1", "case-crate.json": "crate-v1" },
    });

    let publicationError;
    try {
      await publishArtifactPair({
        outputDirectory,
        artifacts: { "trace.json": "trace-v2", "case-crate.json": "crate-v2" },
        beforePublishArtifact: ({ index }) => {
          if (index === 1) throw new Error("simulated publish failure");
        },
        beforeRestoreArtifact: ({ name }) => {
          if (name === "case-crate.json") throw new Error("simulated restore failure");
        },
      });
    } catch (error) {
      publicationError = error;
    }

    expect(publicationError).toBeInstanceOf(AggregateError);
    expect(publicationError.recoveryDirectory).toMatch(/\.gaggle-export-/);
    expect(publicationError.message).toContain(publicationError.recoveryDirectory);
    await expect(
      readFile(resolve(publicationError.recoveryDirectory, "previous-case-crate.json"), "utf8"),
    ).resolves.toBe("crate-v1");
  });

  it("reclaims an expired lock only after its same-host owner is confirmed dead", async () => {
    const outputDirectory = await temporaryOutput();
    const lockDirectory = resolve(outputDirectory, "..", ".gaggle-0042.export.lock");
    await mkdir(lockDirectory);
    await writeFile(
      resolve(lockDirectory, "owner.json"),
      JSON.stringify({
        schemaVersion: 1,
        ownerId: "crashed-export",
        pid: 4242,
        hostname: "test-host",
        acquiredAt: "2026-01-01T00:00:00.000Z",
        leaseExpiresAt: "2026-01-01T00:00:01.000Z",
      }),
    );

    await publishArtifactPair({
      outputDirectory,
      artifacts: { "trace.json": "trace-v1", "case-crate.json": "crate-v1" },
      lockOptions: {
        hostname: "test-host",
        now: () => Date.parse("2026-01-01T00:01:00.000Z"),
        isProcessAlive: () => false,
      },
    });

    await expect(readFile(resolve(outputDirectory, "trace.json"), "utf8")).resolves.toBe("trace-v1");
    await expect(readFile(resolve(outputDirectory, "case-crate.json"), "utf8")).resolves.toBe("crate-v1");
  });

  it("rejects concurrent publication instead of interleaving artifact pairs", async () => {
    const outputDirectory = await temporaryOutput();
    let releaseFirst;
    let markFirstEntered;
    const firstEntered = new Promise((resolvePromise) => {
      markFirstEntered = resolvePromise;
    });
    const holdFirst = new Promise((resolvePromise) => {
      releaseFirst = resolvePromise;
    });
    const firstPublish = publishArtifactPair({
      outputDirectory,
      artifacts: { "trace.json": "trace-v1", "case-crate.json": "crate-v1" },
      beforePublishArtifact: async ({ index }) => {
        if (index === 0) {
          markFirstEntered();
          await holdFirst;
        }
      },
    });
    await firstEntered;
    await expect(
      publishArtifactPair({
        outputDirectory,
        artifacts: { "trace.json": "trace-v2", "case-crate.json": "crate-v2" },
      }),
    ).rejects.toThrow("already in progress");
    releaseFirst();
    await firstPublish;
  });
});
