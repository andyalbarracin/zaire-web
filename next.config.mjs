// File: next.config.mjs
// Path: zaire-web/next.config.mjs
// Description: Next.js configuration for ZAIRE web app + cabeceras de seguridad.

// Cabeceras base (todo el sitio): no rompen nada, suman defensa.
const BASE_SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

// Cabeceras endurecidas para áreas privadas (dashboard + portal): anti-clickjacking y
// permisos de dispositivo apagados. La CSP completa (con nonce para script-src) la aplica
// el middleware por request; acá no la duplicamos.
const PRIVATE_SECURITY_HEADERS = [
  ...BASE_SECURITY_HEADERS,
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

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
  async headers() {
    return [
      { source: '/dashboard/:path*', headers: PRIVATE_SECURITY_HEADERS },
      { source: '/portal/:path*', headers: PRIVATE_SECURITY_HEADERS },
      { source: '/:path*', headers: BASE_SECURITY_HEADERS },
    ];
  },
};

export default nextConfig;
