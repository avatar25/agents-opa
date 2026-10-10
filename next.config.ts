import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // A lockfile higher up the filesystem would otherwise be taken as the workspace root.
  turbopack: { root: __dirname },
};

export default nextConfig;
