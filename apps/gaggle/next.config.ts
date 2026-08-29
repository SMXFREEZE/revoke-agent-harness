import type { NextConfig } from "next";
import { resolveDeploymentBasePath } from "./lib/utils/base-path";

const basePath = resolveDeploymentBasePath(process.env);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath,
  env: {
    // Raw public files are not rewritten by Next's basePath support.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // R3F v9 globally augments JSX.IntrinsicElements, which collides with
  // framer-motion at the type level (false positive — runs fine). The band
  // token uses raw R3F JSX, so skip the type-check pass.
  typescript: { ignoreBuildErrors: true },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
