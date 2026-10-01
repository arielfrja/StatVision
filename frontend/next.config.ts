import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Single shared BASE_URL handling for dev + prod (no env-specific branches).
    // Fixes preview-host bake bug by removing VERCEL_BRANCH_URL/VERCEL_URL
    // fallback that baked the preview host at build time. Must be provided via
    // environment (Vercel project env or local frontend/.env.local). Build
    // fails fast if unset so misconfig surfaces at build time.
    // TODO(prod-hardening, later): revisit per-environment BASE_URL strategy
    // if needed. Not split per scope update.
    NEXT_PUBLIC_BASE_URL: (() => {
      const base = process.env.NEXT_PUBLIC_BASE_URL;
      if (!base) {
        throw new Error(
          'Missing NEXT_PUBLIC_BASE_URL. Set it in Vercel env (e.g. https://frontend-cyan-eta-14.vercel.app) or frontend/.env.local'
        );
      }
      return base;
    })(),
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
    // Single shared CSP for dev + prod (no env-specific branches by design).
    // Keeps localhost/ws (wildcard ports, no hardcoded ports) alongside prod
    // entries so one config works locally and on Vercel.
    // TODO(prod-hardening, later): split dev/prod CSP — prod should drop
    // localhost/ws sources and 'unsafe-eval' (Eruda is dev-only, see
    // eruda-init.tsx NODE_ENV guard). Not implemented per scope update.
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
              "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:* https://storage.googleapis.com https://statvision-api-prod-chsbu3g4oa-uc.a.run.app https://dev-3os8m0zyfxmx60nn.us.auth0.com https://firebaseinstallations.googleapis.com https://statsvision-b87ee-default-rtdb.firebaseio.com wss://statsvision-b87ee-default-rtdb.firebaseio.com",
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
