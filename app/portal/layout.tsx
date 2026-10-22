// File: layout.tsx — Base del Portal de Clientes. Aislado, noindex.
import type { Metadata } from 'next';
import './portal.css';

export const metadata: Metadata = {
  title: 'Portal de Clientes · ZAIRE',
  robots: { index: false, follow: false },
};

// La CSP del middleware exige un nonce por request en cada <script>: sin render dinámico,
// las páginas estáticas (ej. el login) salen sin nonce y el navegador las bloquea.
export const dynamic = 'force-dynamic';

export default function PortalBaseLayout({ children }: { children: React.ReactNode }) {
  return <div className="zp-root">{children}</div>;
}
