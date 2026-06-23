// File: layout.tsx
// Path: zaire-web/app/dashboard/(panel)/layout.tsx
// Description: Shell autenticado de Zaire Ops (sidebar + topbar). requireUser()
//              como defensa en profundidad (el middleware ya protege /dashboard).

import { requireUser } from '@/lib/zaire-ops/auth';
import Sidebar from '../_components/sidebar';
import { signOut } from '../actions';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="zo-shell">
      <Sidebar />
      <div className="zo-main">
        <header className="zo-topbar">
          <div className="zo-topbar-crumb">// ZAIRE OPS · PANEL</div>
          <div className="zo-topbar-right">
            <span className="zo-user">{user.email}</span>
            <form action={signOut}>
              <button className="zo-btn zo-btn-ghost zo-btn-sm" type="submit">Salir</button>
            </form>
          </div>
        </header>
        <div className="zo-page">{children}</div>
      </div>
    </div>
  );
}
