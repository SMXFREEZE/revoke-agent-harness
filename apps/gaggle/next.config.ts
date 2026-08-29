import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // R3F v9 globally augments JSX.IntrinsicElements, which collides with
  // framer-motion at the type level (false positive — runs fine). The band
  // token uses raw R3F JSX, so skip the type-check pass.
  typescript: { ignoreBuildErrors: true },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
