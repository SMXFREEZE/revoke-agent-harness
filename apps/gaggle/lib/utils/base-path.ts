type DeploymentEnvironment = Readonly<Record<string, string | undefined>>;

export function normalizeBasePath(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "/") return "";

  const rooted = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return rooted.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
}

export function resolveDeploymentBasePath(env: DeploymentEnvironment): string {
  if (env.NEXT_PUBLIC_BASE_PATH !== undefined) {
    return normalizeBasePath(env.NEXT_PUBLIC_BASE_PATH);
  }

  if (env.GITHUB_ACTIONS !== "true") return "";

  const repository = env.GITHUB_REPOSITORY?.split("/").filter(Boolean).at(-1);
  if (!repository || repository.endsWith(".github.io")) return "";

  return normalizeBasePath(repository);
}

export const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** Prefix raw public files and same-origin fetches. Next Link handles basePath itself. */
export function withBasePath(path: string, basePath = BASE_PATH): string {
  const normalized = normalizeBasePath(basePath);
  if (!normalized || !path.startsWith("/") || path.startsWith("//")) return path;

  if (
    path === normalized ||
    path.startsWith(`${normalized}/`) ||
    path.startsWith(`${normalized}?`) ||
    path.startsWith(`${normalized}#`)
  ) {
    return path;
  }

  return `${normalized}${path}`;
}
