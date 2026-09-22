import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Makes Link and router hrefs checked against the real route tree, so the
  // literal route types already used across the app actually catch typos.
  typedRoutes: true,
};

export default nextConfig;
