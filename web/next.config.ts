import type { NextConfig } from "next";

// Set GITHUB_PAGES=true in CI to enable the /rock-castle-gorge-maps base path.
const basePath = process.env.GITHUB_PAGES === "true" ? "/rock-castle-gorge-maps" : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
