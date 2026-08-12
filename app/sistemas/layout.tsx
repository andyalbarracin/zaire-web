// File: layout.tsx
// Path: zaire-web/app/sistemas/layout.tsx
// Last modified: 2026-08-12
// Description: Layout de /sistemas (server component) para exportar metadata SEO
//              propia de la página. La page es 'use client' y no puede exportar
//              metadata; este layout la envuelve sin agregar markup visual.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zaire Industrial — suite industrial: órdenes, campo, activos, stock y comercial',
  description:
    'Zaire Industrial es la suite modular para empresas que mantienen, reparan y operan activos: órdenes de trabajo, trabajo de campo, activos, stock y comercial sobre un mismo backend. El dato se carga una vez y viaja solo.',
  openGraph: {
    title: 'Zaire Industrial — suite industrial modular',
    description:
      'Órdenes, campo, activos, stock y comercial sobre un mismo backend. Con cliente en producción en oil & gas.',
  },
};

export default function SistemasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
