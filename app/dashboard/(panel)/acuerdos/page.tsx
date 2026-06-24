// File: page.tsx — Acuerdos (lista)
import Link from 'next/link';
import { listAgreements, AGREEMENT_STATUS_LABEL, AGREEMENT_STATUS_COLOR } from '@/lib/zaire-ops/agreements';
import RowLink from '@/app/dashboard/_components/row-link';

export const dynamic = 'force-dynamic';

export default async function AcuerdosPage() {
  const items = await listAgreements();
  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// COMERCIAL</div><h1 className="zo-h1">Acuerdos</h1><div className="zo-sub">{items.length} acuerdo(s)</div></div>
        <Link href="/dashboard/acuerdos/nuevo"><button className="zo-btn zo-btn-primary">+ Nuevo acuerdo</button></Link>
      </div>
      {items.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">Sin acuerdos. <Link href="/dashboard/acuerdos/nuevo" style={{ color: '#FF6A00' }}>Creá el primero →</Link></div></div>
      ) : (
        <div className="zo-table-wrap"><table className="zo-table">
          <thead><tr><th>Proyecto</th><th>Cliente</th><th>Plan</th><th>Estado</th><th>Firmado</th></tr></thead>
          <tbody>{items.map(a => (
            <RowLink key={a.id} href={`/dashboard/acuerdos/${a.id}`}>
              <td className="zo-rowlink">{a.project_name}</td>
              <td>{a.client?.name ?? '—'}</td>
              <td>{a.plan ?? '—'}</td>
              <td><span className="zo-chip"><span className="zo-dot" style={{ background: AGREEMENT_STATUS_COLOR[a.status] }} />{AGREEMENT_STATUS_LABEL[a.status]}</span></td>
              <td className="zo-mono">{a.signed_at ? new Date(a.signed_at).toLocaleDateString('es-AR') : '—'}</td>
            </RowLink>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
