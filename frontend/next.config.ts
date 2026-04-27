import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@material/web'],
  // Removed 'output: export' to support dynamic authenticated routes and SSR
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
