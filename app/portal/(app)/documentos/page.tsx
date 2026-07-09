// File: page.tsx — Documentos visibles del cliente (descarga).
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { listDocuments, DOC_TYPE_LABEL } from '@/lib/zaire-ops/documents';

export const dynamic = 'force-dynamic';

export default async function PortalDocumentos() {
  const { clientId, email } = await requirePortalClient();
  await logPortalEvent({ clientId, email, event: 'view_documents' });
  const docs = await listDocuments(clientId, true);

  return (
    <>
      <div className="zp-lbl">// DOCUMENTOS</div>
      <h1 className="zp-h1">Tus documentos</h1>
      <div className="zp-sub">Handoffs, presupuestos e informes que compartimos con vos.</div>
      {docs.length === 0 ? (
        <div className="zp-table-wrap"><div style={{ padding: 24, color: '#888' }}>Todavía no hay documentos.</div></div>
      ) : (
        <div className="zp-table-wrap"><table className="zp-table">
          <thead><tr><th>Título</th><th>Tipo</th><th>Fecha</th><th>Archivo</th></tr></thead>
          <tbody>{docs.map(d => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td><span className="zp-chip">{DOC_TYPE_LABEL[d.type]}</span></td>
              <td style={{ fontFamily: 'var(--fm,monospace)' }}>{new Date(d.uploaded_at).toLocaleDateString('es-AR')}</td>
              <td><a className="zp-chip" href={d.file_url} target="_blank" rel="noopener noreferrer">Descargar →</a></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
