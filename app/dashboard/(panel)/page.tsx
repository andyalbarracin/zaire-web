// File: page.tsx
// Path: zaire-web/app/dashboard/(panel)/page.tsx
// Description: Inicio del panel — KPIs operativos + últimas incidencias.

import Link from 'next/link';
import { getDashboardStats } from '@/lib/zaire-ops/queries';
import { minutesToHours, STATUS_LABEL, STATUS_COLOR } from '@/lib/zaire-ops/types';
import RowLink from '@/app/dashboard/_components/row-link';
import { receivables, money } from '@/lib/zaire-ops/billing';
import { listPendingActivities } from '@/lib/zaire-ops/crm';
import { APP_TZ, todayLocal } from '@/lib/zaire-ops/dates';

export const dynamic = 'force-dynamic';

export default async function InicioPage() {
  const todayIso = todayLocal();
  const [s, rec, dueActs] = await Promise.all([getDashboardStats(), receivables(), listPendingActivities({ until: todayIso })]);
  const tasksToday = dueActs?.filter(a => a.due_date === todayIso).length ?? 0;
  const tasksOverdue = dueActs?.filter(a => a.due_date < todayIso).length ?? 0;
  const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: APP_TZ });

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// PANEL · INICIO</div>
          <h1 className="zo-h1">Resumen</h1>
          <div className="zo-sub">{today}</div>
        </div>
        <Link href="/dashboard/tickets/nuevo"><button className="zo-btn zo-btn-primary">+ Nueva incidencia</button></Link>
      </div>

      <div className={`zo-kpis${dueActs ? ' c3' : ''}`}>
        <div className="zo-kpi accent"><div className="zo-kpi-n">{s.openTickets}</div><div className="zo-kpi-l">Incidencias abiertas</div></div>
        {dueActs && (
          <Link href="/dashboard/crm?view=calendar"><div className="zo-kpi" style={{ cursor: 'pointer' }}>
            <div className="zo-kpi-n" style={{ color: tasksOverdue > 0 ? '#ff8a7d' : tasksToday > 0 ? '#FF6A00' : undefined }}>{tasksToday}</div>
            <div className="zo-kpi-l">Tareas CRM hoy{tasksOverdue > 0 ? ` · ${tasksOverdue} vencida${tasksOverdue === 1 ? '' : 's'}` : ''}</div>
          </div></Link>
        )}
        <div className="zo-kpi"><div className="zo-kpi-n">{minutesToHours(s.minutesThisMonth)}</div><div className="zo-kpi-l">Horas registradas (mes)</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n">{s.activeClients}</div><div className="zo-kpi-l">Clientes activos</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n">{s.activeProjects}</div><div className="zo-kpi-l">Proyectos activos</div></div>
        <Link href="/dashboard/facturas?filter=porcobrar"><div className="zo-kpi" style={{ cursor: 'pointer' }}><div className="zo-kpi-n" style={{ color: rec.totalDue > 0 ? '#FFC107' : '#22c55e' }}>{money(rec.totalDue, rec.currency)}</div><div className="zo-kpi-l">Por cobrar{rec.overdueDue > 0 ? ` · ${money(rec.overdueDue, rec.currency)} vencido` : ''}</div></div></Link>
      </div>

      <div className="zo-card-title">// ÚLTIMAS INCIDENCIAS</div>
      {s.recentTickets.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">
          Todavía no hay incidencias. <Link href="/dashboard/tickets/nuevo" className="zo-rowlink" style={{ color: '#FF6A00' }}>Creá la primera →</Link>
        </div></div>
      ) : (
        <div className="zo-table-wrap">
          <table className="zo-table">
            <thead><tr><th>ID</th><th>Título</th><th>Cliente</th><th>Estado</th><th>Creada</th></tr></thead>
            <tbody>
              {s.recentTickets.map(t => (
                <RowLink key={t.id} href={`/dashboard/tickets/${t.id}`}>
                  <td className="zo-mono">{t.ticket_number ?? '—'}</td>
                  <td className="zo-rowlink">{t.title}</td>
                  <td>{t.client?.name ?? '—'}</td>
                  <td><span className="zo-chip"><span className="zo-dot" style={{ background: STATUS_COLOR[t.status] }} />{STATUS_LABEL[t.status]}</span></td>
                  <td className="zo-mono">{new Date(t.created_at).toLocaleDateString('es-AR')}</td>
                </RowLink>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
