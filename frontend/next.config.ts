import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'),
  },
  transpilePackages: ['@material/web'],
  turbopack: {},
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
  webpack: (config: any) => {
    config.resolve.alias['swr'] = path.resolve(process.cwd(), '../node_modules/swr');
    return config;
  },
};

export default nextConfig;
