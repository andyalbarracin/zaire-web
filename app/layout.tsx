// File: layout.tsx
// Path: zaire-web/app/layout.tsx
// Last modified: 2026-04-27
// Description: Layout raíz de Next.js. Carga fuentes Google (Raleway + Roboto)
//              y aplica metadata SEO base para ZAIRE.

import type { Metadata } from 'next';
import { Raleway, Roboto } from 'next/font/google';
import './globals.css';

/* Raleway — fuente de headlines */
const raleway = Raleway({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-raleway',
  display: 'swap',
});

/* Roboto — fuente de cuerpo */
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ZAIRE — Intelligent Operations Studio',
    template: '%s | ZAIRE',
  },
  description:
    'Diseñamos operaciones conectadas con workflows, IA y agentes. Sistemas inteligentes para ventas, operación y crecimiento.',
  keywords: ['automatización', 'agentes IA', 'n8n', 'Claude', 'workflows', 'operaciones', 'Argentina'],
  authors: [{ name: 'ZAIRE Studio' }],
  icons: {
    icon: [
      { url: '/assets/favicon.ico' },
      { url: '/assets/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/assets/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'ZAIRE',
    title: 'ZAIRE — Intelligent Operations Studio',
    description: 'Diseñamos operaciones conectadas con workflows, IA y agentes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZAIRE — Intelligent Operations Studio',
    description: 'Diseñamos operaciones conectadas con workflows, IA y agentes.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${raleway.variable} ${roboto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
