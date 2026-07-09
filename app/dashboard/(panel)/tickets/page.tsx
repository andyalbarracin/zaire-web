// File: page.tsx — Incidencias (lista + filtros estado / mis incidencias)
import Link from 'next/link';
import { listTickets } from '@/lib/zaire-ops/queries';
import { getMyProfile } from '@/lib/zaire-ops/profiles';
import Avatar from '@/app/dashboard/_components/avatar';
import RowLink from '@/app/dashboard/_components/row-link';
import ConfirmButton from '@/app/dashboard/_components/confirm-button';
import { freeResolvedMediaAction } from './actions';
import {
  STATUS_LABEL, STATUS_COLOR, PRIORITY_LABEL, PRIORITY_COLOR,
  TICKET_STATUSES, minutesToHours,
} from '@/lib/zaire-ops/types';

export const dynamic = 'force-dynamic';

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ status?: string; assigned?: string; freed?: string; tk?: string }> }) {
  const { status, assigned, freed, tk } = await searchParams;
  const me = await getMyProfile();
  const mine = assigned === 'me';
  const tickets = await listTickets({ status, assignedTo: mine ? me?.id : undefined });

  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// OPERACIÓN</div><h1 className="zo-h1">Incidencias</h1><div className="zo-sub">{tickets.length} incidencia(s)</div></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <form action={freeResolvedMediaAction}><ConfirmButton message="¿Liberar la media (imágenes/videos) de todas las incidencias resueltas y cerradas? Se borran esos archivos del almacenamiento para ahorrar espacio; los registros quedan.">Liberar media resueltas</ConfirmButton></form>
          <Link href="/dashboard/tickets/nuevo"><button className="zo-btn zo-btn-primary">+ Nueva incidencia</button></Link>
        </div>
      </div>

      {freed !== undefined && <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, background: 'rgba(34,197,94,.12)', border: '1px solid #22c55e', color: '#22c55e', fontSize: 13 }}>Media liberada: {freed} archivo(s) de {tk ?? 0} incidencia(s) resuelta(s). ✓</div>}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        <Link href="/dashboard/tickets"><span className="zo-chip" style={!status && !mine ? { background: '#FF6A00', color: '#111' } : {}}>Todas</span></Link>
        <Link href="/dashboard/tickets?assigned=me"><span className="zo-chip" style={mine ? { background: '#FF6A00', color: '#111' } : {}}>Mis incidencias</span></Link>
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
          <thead><tr><th>ID</th><th>Título</th><th>Cliente</th><th>Asignado</th><th>Prioridad</th><th>Estado</th><th>Horas</th></tr></thead>
          <tbody>{tickets.map(t => (
            <RowLink key={t.id} href={`/dashboard/tickets/${t.id}`}>
              <td className="zo-mono">{t.ticket_number ?? '—'}</td>
              <td className="zo-rowlink">{t.title}</td>
              <td>{t.client?.name ?? '—'}</td>
              <td>{t.assignee?.full_name
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Avatar profile={t.assignee} size={20} /> {t.assignee.full_name}</span>
                : <span style={{ color: '#666' }}>—</span>}</td>
              <td><span className="zo-chip"><span className="zo-dot" style={{ background: PRIORITY_COLOR[t.priority] }} />{PRIORITY_LABEL[t.priority]}</span></td>
              <td><span className="zo-chip"><span className="zo-dot" style={{ background: STATUS_COLOR[t.status] }} />{STATUS_LABEL[t.status]}</span></td>
              <td className="zo-mono">{minutesToHours(t.actual_minutes)}</td>
            </RowLink>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
