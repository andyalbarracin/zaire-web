// File: page.tsx — Acuerdos del cliente (solo lectura + PDF).
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { listAgreements, AGREEMENT_STATUS_LABEL, AGREEMENT_STATUS_COLOR } from '@/lib/zaire-ops/agreements';

export const dynamic = 'force-dynamic';

export default async function PortalAcuerdos() {
  const { clientId, email } = await requirePortalClient();
  await logPortalEvent({ clientId, email, event: 'view_agreements' });
  const agreements = (await listAgreements(clientId)).filter(a => a.status !== 'borrador');

  return (
    <>
      <div className="zp-lbl">// ACUERDOS</div>
      <h1 className="zp-h1">Tus acuerdos</h1>
      {agreements.length === 0 ? (
        <div className="zp-table-wrap"><div style={{ padding: 24, color: '#888' }}>No hay acuerdos para mostrar.</div></div>
      ) : (
        <div className="zp-table-wrap"><table className="zp-table">
          <thead><tr><th>Proyecto</th><th>Plan</th><th>Estado</th><th>Firmado</th><th>Acuerdo</th><th>PDF</th></tr></thead>
          <tbody>{agreements.map(a => (
            <tr key={a.id}>
              <td><a className="zp-rowlink" href={`/portal/acuerdos/${a.id}`}>{a.project_name}</a></td>
              <td><a className="zp-rowlink" href={`/portal/acuerdos/${a.id}`}>{a.plan ?? '—'}</a></td>
              <td><span className="zp-chip"><span className="zp-dot" style={{ background: AGREEMENT_STATUS_COLOR[a.status] }} />{a.status === 'enviado' ? 'Pendiente de firma' : AGREEMENT_STATUS_LABEL[a.status]}</span></td>
              <td className="zp-nowrap" style={{ fontFamily: 'var(--fm,monospace)' }}>{a.signed_at ? new Date(a.signed_at).toLocaleDateString('es-AR') : '—'}</td>
              <td><a className="zp-chip" href={`/portal/acuerdos/${a.id}`} style={a.status === 'enviado' ? { background: 'rgba(255,106,0,.16)', color: '#FF6A00' } : undefined}>{a.status === 'enviado' ? 'Firmar →' : 'Abrir →'}</a></td>
              <td><a className="zp-chip" href={`/portal/acuerdos/${a.id}/print`} target="_blank" rel="noopener noreferrer">Ver →</a></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
