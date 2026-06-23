// File: page.tsx — Detalle de incidencia (edición + registro de horas)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTicket, listClients, listProjects, listTimeEntries } from '@/lib/zaire-ops/queries';
import TicketFields from '@/app/dashboard/_components/ticket-fields';
import { updateTicketAction, logTimeAction } from '../actions';
import {
  STATUS_LABEL, STATUS_COLOR, PRIORITY_LABEL, PRIORITY_COLOR,
  WORK_TYPES, humanLabel, minutesToHours,
} from '@/lib/zaire-ops/types';

export const dynamic = 'force-dynamic';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const [clients, projects, entries] = await Promise.all([
    listClients(), listProjects(), listTimeEntries({ ticketId: id }),
  ]);
  const totalMin = entries.reduce((s, e) => s + (e.minutes ?? 0), 0);

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// {ticket.ticket_number ?? 'INCIDENCIA'}</div>
          <h1 className="zo-h1">{ticket.title}</h1>
          <div className="zo-sub" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <span className="zo-chip"><span className="zo-dot" style={{ background: STATUS_COLOR[ticket.status] }} />{STATUS_LABEL[ticket.status]}</span>
            <span className="zo-chip"><span className="zo-dot" style={{ background: PRIORITY_COLOR[ticket.priority] }} />{PRIORITY_LABEL[ticket.priority]}</span>
            <span className="zo-chip">{ticket.client?.name ?? '—'}</span>
            {ticket.project?.name && <span className="zo-chip">{ticket.project.name}</span>}
          </div>
        </div>
        <Link href="/dashboard/tickets"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>

      <div className="zo-card">
        <div className="zo-card-title">// EDITAR INCIDENCIA</div>
        <form action={updateTicketAction.bind(null, ticket.id)} className="zo-form">
          <TicketFields ticket={ticket} clients={clients} projects={projects} edit />
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">Guardar cambios</button></div>
        </form>
      </div>

      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// REGISTRAR HORAS · total {minutesToHours(totalMin)}</div>
        <form action={logTimeAction.bind(null, ticket.id, ticket.client_id, ticket.project_id)} className="zo-form" style={{ maxWidth: '100%' }}>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Minutos *</label><input className="zo-input" name="minutes" type="number" min="0" required placeholder="45" /></div>
            <div className="zo-field"><label className="zo-flabel">Tipo de trabajo</label>
              <select className="zo-select" name="work_type" defaultValue="soporte">
                {WORK_TYPES.map(w => <option key={w} value={w}>{humanLabel(w)}</option>)}
              </select>
            </div>
          </div>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Fecha</label><input className="zo-input" name="entry_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
            <div className="zo-field"><label className="zo-flabel">Descripción</label><input className="zo-input" name="description" placeholder="Ajuste filtro por fecha" /></div>
          </div>
          <div className="zo-grid2">
            <label className="zo-checkbox"><input type="checkbox" name="included_in_plan" defaultChecked /> Dentro del plan mensual</label>
            <label className="zo-checkbox"><input type="checkbox" name="billable" /> Facturable extra</label>
          </div>
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">+ Registrar horas</button></div>
        </form>

        {entries.length > 0 && (
          <div className="zo-table-wrap" style={{ marginTop: 18 }}>
            <table className="zo-table">
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Tiempo</th></tr></thead>
              <tbody>{entries.map(e => (
                <tr key={e.id}>
                  <td className="zo-mono">{e.entry_date}</td>
                  <td>{humanLabel(e.work_type)}</td>
                  <td>{e.description ?? '—'}</td>
                  <td className="zo-mono">{minutesToHours(e.minutes)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
