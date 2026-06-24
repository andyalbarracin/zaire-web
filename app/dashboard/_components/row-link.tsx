// File: row-link.tsx — fila de tabla clickeable en su totalidad (navega al detalle)
'use client';

import { useRouter } from 'next/navigation';

export default function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr className="zo-rowclick" style={{ cursor: 'pointer' }} onClick={() => router.push(href)}>
      {children}
    </tr>
  );
}
