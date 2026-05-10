/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@material/web'],
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
