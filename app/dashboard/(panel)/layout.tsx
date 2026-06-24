// File: layout.tsx
// Path: zaire-web/app/dashboard/(panel)/layout.tsx
// Description: Shell autenticado de Zaire Ops (sidebar + topbar con perfil).

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getMyProfile } from '@/lib/zaire-ops/profiles';
import Sidebar from '../_components/sidebar';
import Avatar from '../_components/avatar';
import OpsFooter from '../_components/ops-footer';
import { signOut } from '../actions';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyProfile();
  if (!profile) redirect('/dashboard/login');

  const collapsed = (await cookies()).get('zo_sidebar')?.value === 'collapsed';

  return (
    <div className={`zo-shell${collapsed ? ' zo-collapsed' : ''}`}>
      <Sidebar role={profile.role} defaultCollapsed={collapsed} />
      <div className="zo-main">
        <header className="zo-topbar">
          <div className="zo-topbar-crumb">// ZAIRE OPS · PANEL</div>
          <div className="zo-topbar-right">
            <Link href="/dashboard/cuenta">
              <Avatar profile={profile} size={28} />
              <span className="zo-user">{profile.full_name ?? profile.email}</span>
            </Link>
            <form action={signOut}>
              <button className="zo-btn zo-btn-ghost zo-btn-sm" type="submit">Salir</button>
            </form>
          </div>
        </header>
        <div className="zo-page">{children}</div>
        <OpsFooter />
      </div>
    </div>
  );
}
