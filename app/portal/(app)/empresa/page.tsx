// File: page.tsx — Datos de la empresa del cliente (solo lectura v1).
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { getClient } from '@/lib/zaire-ops/queries';

export const dynamic = 'force-dynamic';

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #161616' }}>
      <span style={{ fontFamily: 'var(--fm,monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#888' }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value || '—'}</span>
    </div>
  );
}

export default async function PortalEmpresa() {
  const { clientId, email } = await requirePortalClient();
  await logPortalEvent({ clientId, email, event: 'view_company' });
  const client = await getClient(clientId);

  return (
    <>
      <div className="zp-lbl">// MI EMPRESA</div>
      <h1 className="zp-h1">{client?.name}</h1>
      <div className="zp-card" style={{ maxWidth: 560 }}>
        <Row label="Empresa" value={client?.name} />
        <Row label="Contacto" value={client?.contact_name} />
        <Row label="Email" value={client?.email} />
        <Row label="WhatsApp" value={client?.whatsapp} />
        <Row label="Plan" value={client?.plan} />
      </div>
      <div className="zp-sub" style={{ marginTop: 14 }}>¿Algún dato desactualizado? Escribinos a hola@zairetech.com.</div>
    </>
  );
}
