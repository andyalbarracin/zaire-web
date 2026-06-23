// File: page.tsx — Incidencias (lista + filtro por estado)
import Link from 'next/link';
import { listTickets } from '@/lib/zaire-ops/queries';
import {
  STATUS_LABEL, STATUS_COLOR, PRIORITY_LABEL, PRIORITY_COLOR,
  TICKET_STATUSES, minutesToHours,
} from '@/lib/zaire-ops/types';

export const dynamic = 'force-dynamic';

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const tickets = await listTickets({ status });

  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// OPERACIÓN</div><h1 className="zo-h1">Incidencias</h1><div className="zo-sub">{tickets.length} incidencia(s){status ? ` · ${STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}` : ''}</div></div>
        <Link href="/dashboard/tickets/nuevo"><button className="zo-btn zo-btn-primary">+ Nueva incidencia</button></Link>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        <Link href="/dashboard/tickets"><span className={`zo-chip${!status ? '' : ''}`} style={!status ? { background: '#FF6A00', color: '#111' } : {}}>Todas</span></Link>
        {TICKET_STATUSES.map(st => (
          <Link key={st} href={`/dashboard/tickets?status=${st}`}>
            <span className="zo-chip" style={status === st ? { background: '#222', color: '#fff', borderColor: STATUS_COLOR[st] } : {}}>
              <span className="zo-dot" style={{ background: STATUS_COLOR[st] }} />{STATUS_LABEL[st]}
            </span>
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">Sin incidencias. <Link href="/dashboard/tickets/nuevo" style={{ color: '#FF6A00' }}>Creá la primera →</Link></div></div>
      ) : (
        <div className="zo-table-wrap"><table className="zo-table">
          <thead><tr><th>ID</th><th>Título</th><th>Cliente</th><th>Prioridad</th><th>Estado</th><th>Horas</th></tr></thead>
          <tbody>{tickets.map(t => (
            <tr key={t.id}>
              <td className="zo-mono">{t.ticket_number ?? '—'}</td>
              <td><Link href={`/dashboard/tickets/${t.id}`} className="zo-rowlink">{t.title}</Link></td>
              <td>{t.client?.name ?? '—'}</td>
              <td><span className="zo-chip"><span className="zo-dot" style={{ background: PRIORITY_COLOR[t.priority] }} />{PRIORITY_LABEL[t.priority]}</span></td>
              <td><span className="zo-chip"><span className="zo-dot" style={{ background: STATUS_COLOR[t.status] }} />{STATUS_LABEL[t.status]}</span></td>
              <td className="zo-mono">{minutesToHours(t.actual_minutes)}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
