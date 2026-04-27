// File: next.config.mjs
// Path: zaire-web/next.config.mjs
// Last modified: 2026-04-27
// Description: Next.js configuration for ZAIRE web app

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilita instrumentation.ts para parchear localStorage roto en Node.js 22+
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
