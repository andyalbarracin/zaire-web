// File: page.tsx — Detalle + edición de cliente
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClient, listProjects, listTickets } from '@/lib/zaire-ops/queries';
import ClientFields from '@/app/dashboard/_components/client-fields';
import { updateClientAction } from '../actions';
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/zaire-ops/types';

export const dynamic = 'force-dynamic';

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const [projects, tickets] = await Promise.all([listProjects(id), listTickets({ clientId: id })]);

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// CLIENTE</div>
          <h1 className="zo-h1">{client.name}</h1>
          <div className="zo-sub">{client.plan ?? 'Sin plan'} · {client.monthly_support_hours}h/mes incluidas</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/dashboard/facturas?client=${client.id}`}><button className="zo-btn zo-btn-sm">Facturas</button></Link>
          <Link href={`/dashboard/reportes?client=${client.id}`}><button className="zo-btn zo-btn-sm">Reporte</button></Link>
          <Link href="/dashboard/clientes"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
        </div>
      </div>

      <div className="zo-kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="zo-kpi accent"><div className="zo-kpi-n">{tickets.length}</div><div className="zo-kpi-l">Incidencias</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n">{projects.length}</div><div className="zo-kpi-l">Proyectos</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n">{client.monthly_support_hours}h</div><div className="zo-kpi-l">Horas incluidas/mes</div></div>
      </div>

      <div className="zo-card">
        <div className="zo-card-title">// EDITAR CLIENTE</div>
        <form action={updateClientAction.bind(null, client.id)} className="zo-form">
          <ClientFields client={client} />
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">Guardar cambios</button></div>
        </form>
      </div>

      <div className="zo-section-gap">
        <div className="zo-pagehead">
          <div className="zo-card-title">// INCIDENCIAS DEL CLIENTE</div>
          <Link href={`/dashboard/tickets/nuevo?client=${client.id}`}><button className="zo-btn zo-btn-sm">+ Incidencia</button></Link>
        </div>
        {tickets.length === 0 ? (
          <div className="zo-table-wrap"><div className="zo-empty">Sin incidencias para este cliente.</div></div>
        ) : (
          <div className="zo-table-wrap"><table className="zo-table">
            <thead><tr><th>ID</th><th>Título</th><th>Estado</th></tr></thead>
            <tbody>{tickets.map(t => (
              <tr key={t.id}>
                <td className="zo-mono">{t.ticket_number ?? '—'}</td>
                <td><Link href={`/dashboard/tickets/${t.id}`} className="zo-rowlink">{t.title}</Link></td>
                <td><span className="zo-chip"><span className="zo-dot" style={{ background: STATUS_COLOR[t.status] }} />{STATUS_LABEL[t.status]}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
