import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'),
  },
  transpilePackages: ['@material/web'],
  // Local dev is accessed via both localhost and 127.0.0.1 on this machine.
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  turbopack: {},
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config: any) => {
    config.resolve.alias['swr'] = path.resolve(process.cwd(), '../node_modules/swr');
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' http://localhost:3000 http://127.0.0.1:3000 ws://localhost:3001 ws://127.0.0.1:3001 https://storage.googleapis.com https://statvision-api-prod-chsbu3g4oa-uc.a.run.app https://dev-3os8m0zyfxmx60nn.us.auth0.com",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "frame-src 'self' https://dev-3os8m0zyfxmx60nn.us.auth0.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
