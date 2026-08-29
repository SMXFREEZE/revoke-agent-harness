import { describe, expect, it } from "vitest";
import { normalizeBasePath, resolveDeploymentBasePath, withBasePath } from "./base-path";

describe("deployment base path", () => {
  it("stays at the origin root outside GitHub Actions", () => {
    expect(resolveDeploymentBasePath({})).toBe("");
    expect(resolveDeploymentBasePath({ VERCEL: "1" })).toBe("");
  });

  it("derives the repository subpath for GitHub Pages builds", () => {
    expect(
      resolveDeploymentBasePath({
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "SMXFREEZE/revoke-agent-harness",
      }),
    ).toBe("/revoke-agent-harness");
  });

  it("honors and normalizes an explicit override", () => {
    expect(resolveDeploymentBasePath({ NEXT_PUBLIC_BASE_PATH: "//preview///" })).toBe("/preview");
    expect(normalizeBasePath("/")).toBe("");
  });

  it("prefixes raw same-origin paths exactly once", () => {
    expect(withBasePath("/img/gut-veg.jpg", "/revoke-agent-harness")).toBe(
      "/revoke-agent-harness/img/gut-veg.jpg",
    );
    expect(withBasePath("/revoke-agent-harness/img/gut-veg.jpg", "/revoke-agent-harness")).toBe(
      "/revoke-agent-harness/img/gut-veg.jpg",
    );
    expect(withBasePath("https://example.com/image.jpg", "/revoke-agent-harness")).toBe(
      "https://example.com/image.jpg",
    );
  });
});
