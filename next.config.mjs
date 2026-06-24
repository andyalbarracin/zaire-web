// File: next.config.mjs
// Path: zaire-web/next.config.mjs
// Last modified: 2026-04-27
// Description: Next.js configuration for ZAIRE web app

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Permite subir adjuntos de hasta 50MB vía Server Actions (Zaire Ops).
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
