// File: page.tsx — Detalle de incidencia (edición + asignación + adjuntos + actividad + horas)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getTicket, listClients, listProjects, listTimeEntries, listComments, listAttachments,
} from '@/lib/zaire-ops/queries';
import { listProfiles } from '@/lib/zaire-ops/profiles';
import TicketFields from '@/app/dashboard/_components/ticket-fields';
import Avatar from '@/app/dashboard/_components/avatar';
import {
  updateTicketAction, logTimeAction, addCommentAction, uploadAttachmentAction, deleteAttachmentAction,
} from '../actions';
import {
  STATUS_LABEL, STATUS_COLOR, PRIORITY_LABEL, PRIORITY_COLOR,
  WORK_TYPES, humanLabel, minutesToHours,
} from '@/lib/zaire-ops/types';

export const dynamic = 'force-dynamic';

const dt = (s: string) => new Date(s).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const [clients, projects, members, entries, comments, attachments] = await Promise.all([
    listClients(), listProjects(), listProfiles(),
    listTimeEntries({ ticketId: id }), listComments(id), listAttachments(id),
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
            {ticket.assignee?.full_name
              ? <span className="zo-chip"><Avatar profile={ticket.assignee} size={16} /> {ticket.assignee.full_name}</span>
              : <span className="zo-chip" style={{ color: '#777' }}>Sin asignar</span>}
          </div>
        </div>
        <Link href="/dashboard/tickets"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>

      <div className="zo-card">
        <div className="zo-card-title">// EDITAR INCIDENCIA</div>
        <form action={updateTicketAction.bind(null, ticket.id)} className="zo-form">
          <TicketFields ticket={ticket} clients={clients} projects={projects} members={members} edit />
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">Guardar cambios</button></div>
        </form>
      </div>

      {/* Adjuntos */}
      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// ADJUNTOS · {attachments.length}</div>
        <form action={uploadAttachmentAction.bind(null, ticket.id)} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: attachments.length ? 16 : 0 }}>
          <input className="zo-input" name="file" type="file" style={{ flex: 1 }} />
          <button className="zo-btn zo-btn-sm" type="submit">Subir</button>
        </form>
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attachments.map(a => (
              <div key={a.id} className="zo-attach">
                <a href={a.file_url} target="_blank" rel="noopener noreferrer">📎 {a.file_name ?? a.file_url}</a>
                <form action={deleteAttachmentAction.bind(null, ticket.id, a.id)}><button className="zo-btn zo-btn-ghost zo-btn-sm" type="submit">Borrar</button></form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actividad / comentarios */}
      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// ACTIVIDAD</div>
        <form action={addCommentAction.bind(null, ticket.id)} className="zo-form" style={{ maxWidth: '100%', marginBottom: 22 }}>
          <textarea className="zo-textarea" name="body" required placeholder="Agregar un comentario o nota…" style={{ minHeight: 80 }} />
          <div className="zo-form-actions" style={{ justifyContent: 'space-between' }}>
            <label className="zo-checkbox"><input type="checkbox" name="is_internal" /> Nota interna (no visible al cliente)</label>
            <button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">Comentar</button>
          </div>
        </form>

        {comments.length === 0 ? (
          <div className="zo-empty" style={{ padding: 24 }}>Sin actividad todavía.</div>
        ) : (
          <div className="zo-timeline">
            {comments.map(c => c.is_system ? (
              <div key={c.id} className="zo-tl-system">
                <span className="zo-dot" /><span><b>{c.author?.full_name ?? 'Sistema'}</b> {c.body} · {dt(c.created_at)}</span>
              </div>
            ) : (
              <div key={c.id} className="zo-comment">
                <Avatar profile={c.author ?? {}} size={32} />
                <div className="zo-comment-body">
                  <div className="zo-comment-head">
                    <span className="zo-comment-author">{c.author?.full_name ?? 'Usuario'}{c.is_internal && <span className="zo-badge-internal" style={{ marginLeft: 8 }}>Interna</span>}</span>
                    <span className="zo-comment-time">{dt(c.created_at)}</span>
                  </div>
                  <div className="zo-comment-text">{c.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Horas */}
      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// REGISTRAR HORAS · total {minutesToHours(totalMin)}</div>
        <form action={logTimeAction.bind(null, ticket.id, ticket.client_id, ticket.project_id)} className="zo-form" style={{ maxWidth: '100%' }}>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Horas *</label><input className="zo-input" name="hours" type="number" min="0" step="0.25" required placeholder="1.5" /></div>
            <div className="zo-field"><label className="zo-flabel">Tipo de trabajo</label>
              <select className="zo-select" name="work_type" defaultValue="soporte">{WORK_TYPES.map(w => <option key={w} value={w}>{humanLabel(w)}</option>)}</select>
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
                <tr key={e.id}><td className="zo-mono">{e.entry_date}</td><td>{humanLabel(e.work_type)}</td><td>{e.description ?? '—'}</td><td className="zo-mono">{minutesToHours(e.minutes)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
