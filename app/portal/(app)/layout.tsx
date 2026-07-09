// File: layout.tsx — Shell autenticado del portal: sidebar colapsable + footer global.
import { cookies } from 'next/headers';
import { requirePortalClient } from '@/lib/zaire-ops/portal';
import { getClient } from '@/lib/zaire-ops/queries';
import { PortalSidebar, PortalMobileBar } from './portal-nav';

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const { clientId, email } = await requirePortalClient();
  const client = await getClient(clientId);
  const collapsed = (await cookies()).get('zp_sidebar')?.value === 'collapsed';
  const name = client?.name ?? 'Portal';

  return (
    <div className="zp-app" data-collapsed={collapsed ? 'true' : 'false'} data-open="false">
      <PortalSidebar clientName={name} email={email} />
      <div className="zp-main">
        <PortalMobileBar clientName={name} />
        <div className="zp-content">{children}</div>
        <footer className="zp-footer">© {new Date().getFullYear()} <em>ZAIRE</em> · Intelligent Operations Studio · zairetech.com</footer>
      </div>
    </div>
  );
}
