// File: layout.tsx
// Path: zaire-web/app/dashboard/layout.tsx
// Description: Layout base de Zaire Ops. Carga el CSS del panel y aplica el
//              fondo oscuro. NO requiere auth (para que /dashboard/login funcione).
//              noindex: sección privada, fuera del público.

import type { Metadata } from 'next';
import './zaire-ops.css';

export const metadata: Metadata = {
  title: 'Zaire Ops',
  robots: { index: false, follow: false },
};

// La CSP del middleware exige un nonce por request en cada <script>. Una página estática
// (pre-generada, ej. el login) no lo puede llevar → el navegador bloquea todo (pantalla negra).
// Render dinámico en todo /dashboard para que Next firme los scripts con el nonce.
export const dynamic = 'force-dynamic';

export default function ZaireOpsBaseLayout({ children }: { children: React.ReactNode }) {
  return <div className="zo-root">{children}</div>;
}
