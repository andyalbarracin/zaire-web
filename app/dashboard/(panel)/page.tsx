// File: page.tsx
// Path: zaire-web/app/dashboard/(panel)/page.tsx
// Description: Inicio del panel — KPIs operativos + últimas incidencias.

import Link from 'next/link';
import { getDashboardStats } from '@/lib/zaire-ops/queries';
import { minutesToHours, STATUS_LABEL, STATUS_COLOR } from '@/lib/zaire-ops/types';
import RowLink from '@/app/dashboard/_components/row-link';
import { receivables, money } from '@/lib/zaire-ops/billing';

export const dynamic = 'force-dynamic';

export default async function InicioPage() {
  const [s, rec] = await Promise.all([getDashboardStats(), receivables()]);
  const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

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

      <div className="zo-kpis">
        <div className="zo-kpi accent"><div className="zo-kpi-n">{s.openTickets}</div><div className="zo-kpi-l">Incidencias abiertas</div></div>
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
