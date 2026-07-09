// File: page.tsx — Datos de la empresa del cliente + accesos habilitados (solo lectura v1).
import { requirePortalClient, logPortalEvent, listClientUsers } from '@/lib/zaire-ops/portal';
import { getClient } from '@/lib/zaire-ops/queries';
import { money } from '@/lib/zaire-ops/billing';

export const dynamic = 'force-dynamic';

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '13px 0', borderBottom: '1px solid #161616' }}>
      <span style={{ fontFamily: 'var(--fm,monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#888' }}>{label}</span>
      <span style={{ fontSize: 14, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

export default async function PortalEmpresa() {
  const { clientId, email } = await requirePortalClient();
  await logPortalEvent({ clientId, email, event: 'view_company' });
  const [client, users] = await Promise.all([getClient(clientId), listClientUsers(clientId)]);

  const desde = client?.created_at ? new Date(client.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long' }) : null;
  const horas = client?.monthly_support_hours ? `${client.monthly_support_hours} h/mes` : null;
  const fee = client?.monthly_fee ? money(client.monthly_fee, client.currency) : null;

  return (
    <>
      <div className="zp-lbl">// MI EMPRESA</div>
      <h1 className="zp-h1">{client?.name}</h1>
      <div className="zp-sub">Datos de tu cuenta en ZAIRE. ¿Algo desactualizado? Escribinos a hola@zairetech.com.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div className="zp-card">
          <div className="zp-lbl" style={{ marginBottom: 4 }}>Datos de la empresa</div>
          <Row label="Empresa" value={client?.name} />
          <Row label="Contacto" value={client?.contact_name} />
          <Row label="Email" value={client?.email} />
          <Row label="WhatsApp" value={client?.whatsapp} />
        </div>

        <div className="zp-card">
          <div className="zp-lbl" style={{ marginBottom: 4 }}>Tu plan</div>
          <Row label="Plan" value={client?.plan} />
          <Row label="Abono mensual" value={fee} />
          <Row label="Horas de soporte" value={horas} />
          <Row label="Cliente desde" value={desde} />
        </div>

        <div className="zp-card">
          <div className="zp-lbl" style={{ marginBottom: 10 }}>Accesos habilitados al portal</div>
          {users.length === 0 ? (
            <div style={{ fontSize: 13, color: '#777' }}>Sin accesos cargados.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                  <span className="zp-dot" style={{ background: u.email.toLowerCase() === email.toLowerCase() ? '#22c55e' : '#555' }} />
                  <span>{u.email}</span>
                  {u.email.toLowerCase() === email.toLowerCase() && <span className="zp-chip">Vos</span>}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#666', marginTop: 12, lineHeight: 1.6 }}>
            Para sumar o quitar accesos, escribinos a hola@zairetech.com.
          </div>
        </div>
      </div>
    </>
  );
}
