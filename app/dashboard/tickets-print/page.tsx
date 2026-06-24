// File: page.tsx — Incidencia imprimible: bitácora/log (creación + updates) en PDF vía navegador.
import { requireUser } from '@/lib/zaire-ops/auth';
import { getTicket, listComments, listTimeEntries } from '@/lib/zaire-ops/queries';
import { STATUS_LABEL, PRIORITY_LABEL, humanLabel, minutesToHours } from '@/lib/zaire-ops/types';
import PrintButton from '@/app/dashboard/reportes-print/print-button';

export const dynamic = 'force-dynamic';
const box = (s: React.ReactNode) => <div style={{ background: '#fff', minHeight: '100vh', color: '#111', padding: 48 }}>{s}</div>;
const lbl: React.CSSProperties = { fontFamily: 'monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', margin: '24px 0 8px' };

export default async function TicketPrintPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireUser();
  const { id } = await searchParams;
  if (!id) return box('Falta la incidencia.');
  const ticket = await getTicket(id);
  if (!ticket) return box('Incidencia no encontrada.');

  const [comments, entries] = await Promise.all([listComments(id), listTimeEntries({ ticketId: id })]);
  const totalMin = entries.reduce((s, e) => s + (e.minutes ?? 0), 0);
  const dt = (s: string) => new Date(s).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111' }}>
      <div className="zo-noprint" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <a href={`/dashboard/tickets/${ticket.id}`} style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>← Volver</a>
        <PrintButton />
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '44px 44px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #111', paddingBottom: 14, marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: 'sans-serif', fontSize: 20, fontWeight: 900 }}>ZAIRE</div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#FF6A00' }}>Bitácora de incidencia</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}>{ticket.ticket_number ?? '—'}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>Creada {dt(ticket.created_at)}</div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'sans-serif', fontSize: 21, fontWeight: 800, margin: '0 0 8px' }}>{ticket.title}</h1>
        <div style={{ fontSize: 12.5, color: '#555' }}>
          {ticket.client?.name ?? '—'} · {STATUS_LABEL[ticket.status]} · Prioridad {PRIORITY_LABEL[ticket.priority]}
          {ticket.assignee?.full_name ? ` · ${ticket.assignee.full_name}` : ''}
        </div>

        {ticket.description && (<><div style={lbl}>Detalle</div><div style={{ fontSize: 13, lineHeight: 1.6, color: '#222', whiteSpace: 'pre-wrap' }}>{ticket.description}</div></>)}
        {ticket.resolution && (<><div style={lbl}>Resolución</div><div style={{ fontSize: 13, lineHeight: 1.6, color: '#222', whiteSpace: 'pre-wrap' }}>{ticket.resolution}</div></>)}

        <div style={lbl}>Actividad / log</div>
        {comments.length === 0 ? (
          <div style={{ fontSize: 12.5, color: '#888' }}>Sin actividad registrada.</div>
        ) : (
          <div style={{ borderLeft: '2px solid #eee', paddingLeft: 16 }}>
            {comments.map(c => (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#999' }}>{dt(c.created_at)} · {c.author?.full_name ?? (c.is_system ? 'Sistema' : 'Usuario')}{c.is_internal ? ' · (interna)' : ''}</div>
                <div style={{ fontSize: 13, color: c.is_system ? '#666' : '#1a1a1a', fontStyle: c.is_system ? 'italic' : 'normal', whiteSpace: 'pre-wrap' }}>{c.body}</div>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <>
            <div style={lbl}>Horas registradas · total {minutesToHours(totalMin)}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee', fontSize: 12.5 }}>
              <thead><tr>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#888', borderBottom: '1px solid #eee', fontWeight: 600 }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#888', borderBottom: '1px solid #eee', fontWeight: 600 }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#888', borderBottom: '1px solid #eee', fontWeight: 600 }}>Descripción</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#888', borderBottom: '1px solid #eee', fontWeight: 600 }}>Tiempo</th>
              </tr></thead>
              <tbody>{entries.map(e => (
                <tr key={e.id}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2f2f2' }}>{e.entry_date}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2f2f2' }}>{humanLabel(e.work_type)}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2f2f2' }}>{e.description ?? '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f2f2f2', textAlign: 'right', fontFamily: 'monospace' }}>{minutesToHours(e.minutes)}</td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        <div style={{ marginTop: 36, fontFamily: 'monospace', fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', borderTop: '1px solid #eee', paddingTop: 14 }}>
          Documento generado por Zaire Ops · zairetech.com
        </div>
      </div>
    </div>
  );
}
