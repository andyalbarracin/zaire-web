// File: layout.tsx — Shell autenticado del portal. Gate + navegación.
import Link from 'next/link';
import { requirePortalClient } from '@/lib/zaire-ops/portal';
import { getClient } from '@/lib/zaire-ops/queries';
import { portalSignOut } from './actions';

const NAV = [
  ['/portal', 'Inicio'], ['/portal/finanzas', 'Finanzas'], ['/portal/acuerdos', 'Acuerdos'],
  ['/portal/documentos', 'Documentos'], ['/portal/empresa', 'Mi empresa'], ['/portal/incidencias', 'Incidencias'],
] as const;

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const { clientId } = await requirePortalClient();
  const client = await getClient(clientId);
  return (
    <div className="zp-shell">
      <div className="zp-topbar">
        <div className="zp-brand">ZAIRE <em>·</em> {client?.name ?? 'Portal'}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <nav className="zp-nav">{NAV.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</nav>
          <form action={portalSignOut}><button className="zp-btn" type="submit">Salir</button></form>
        </div>
      </div>
      {children}
    </div>
  );
}
