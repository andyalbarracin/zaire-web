// File: layout.tsx — Base del Portal de Clientes. Aislado, noindex.
import type { Metadata } from 'next';
import './portal.css';

export const metadata: Metadata = {
  title: 'Portal de Clientes · ZAIRE',
  robots: { index: false, follow: false },
};

export default function PortalBaseLayout({ children }: { children: React.ReactNode }) {
  return <div className="zp-root">{children}</div>;
}
