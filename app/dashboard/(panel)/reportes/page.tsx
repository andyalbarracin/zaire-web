// File: page.tsx — Reporte mensual por cliente
import { listClients, getMonthlyReport } from '@/lib/zaire-ops/queries';
import { STATUS_LABEL, STATUS_COLOR, minutesToHours } from '@/lib/zaire-ops/types';
import { sendReportAction } from './actions';

export const dynamic = 'force-dynamic';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default async function ReportesPage({
  searchParams,
}: { searchParams: Promise<{ client?: string; year?: string; month?: string; sent?: string; err?: string }> }) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;
  const clients = await listClients();
  const report = sp.client ? await getMonthlyReport(sp.client, year, month) : null;
  const pct = report && report.includedMinutes > 0
    ? Math.min(100, (report.minutes / report.includedMinutes) * 100) : 0;

  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// CLIENTES</div><h1 className="zo-h1">Reporte mensual</h1><div className="zo-sub">Resumen de soporte para enviar al cliente</div></div>
      </div>

      {sp.sent && <div className="zo-card" style={{ marginBottom: 16, background: 'rgba(34,197,94,.08)', borderColor: 'rgba(34,197,94,.3)', color: '#9be8b3' }}>Reporte enviado por email al cliente.</div>}
      {sp.err && <div className="zo-error" style={{ marginBottom: 16 }}>{sp.err}</div>}

      <div className="zo-card">
        <form method="get" className="zo-form" style={{ maxWidth: '100%' }}>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Cliente</label>
              <select className="zo-select" name="client" defaultValue={sp.client ?? ''} required>
                <option value="" disabled>Elegí…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="zo-field"><label className="zo-flabel">Período</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="zo-select" name="month" defaultValue={month}>{MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
                <select className="zo-select" name="year" defaultValue={year} style={{ width: 110 }}>{[year + 1, year, year - 1].map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
            </div>
          </div>
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">Generar reporte</button></div>
        </form>
      </div>

      {report && report.client && (
        <div className="zo-card zo-section-gap">
          <div className="zo-lbl">// REPORTE · {report.client.name.toUpperCase()}</div>
          <h2 className="zo-h1" style={{ fontSize: 22, marginTop: 6 }}>{MONTHS[month - 1]} {year}</h2>

          <div className="zo-kpis c4" style={{ marginTop: 20 }}>
            <div className="zo-kpi"><div className="zo-kpi-n">{report.received}</div><div className="zo-kpi-l">Recibidas</div></div>
            <div className="zo-kpi"><div className="zo-kpi-n">{report.resolved}</div><div className="zo-kpi-l">Resueltas</div></div>
            <div className="zo-kpi"><div className="zo-kpi-n">{report.inProgress}</div><div className="zo-kpi-l">En progreso</div></div>
            <div className="zo-kpi accent"><div className="zo-kpi-n">{minutesToHours(report.minutes)}</div><div className="zo-kpi-l">Horas consumidas</div></div>
          </div>

          {report.includedMinutes > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="zo-flabel" style={{ marginBottom: 8 }}>Consumo del plan · {minutesToHours(report.minutes)} de {minutesToHours(report.includedMinutes)}</div>
              <div className="zo-bar"><div className="zo-bar-fill" style={{ width: `${pct}%`, background: report.minutes > report.includedMinutes ? '#E71D0A' : '#FF6A00' }} /></div>
            </div>
          )}

          <div className="zo-card-title" style={{ marginTop: 26 }}>// INCIDENCIAS DEL PERÍODO</div>
          {report.tickets.length === 0 ? (
            <div className="zo-empty">Sin incidencias en el período.</div>
          ) : (
            <div className="zo-table-wrap"><table className="zo-table">
              <thead><tr><th>ID</th><th>Título</th><th>Estado</th></tr></thead>
              <tbody>{report.tickets.map(t => (
                <tr key={t.id}>
                  <td className="zo-mono">{t.ticket_number ?? '—'}</td>
                  <td>{t.title}</td>
                  <td><span className="zo-chip"><span className="zo-dot" style={{ background: STATUS_COLOR[t.status] }} />{STATUS_LABEL[t.status]}</span></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}

          <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={`/dashboard/reportes-print?client=${sp.client}&year=${year}&month=${month}`} target="_blank" rel="noopener noreferrer">
              <button className="zo-btn" type="button">Imprimir / PDF</button>
            </a>
            <form action={sendReportAction}>
              <input type="hidden" name="client" value={sp.client ?? ''} />
              <input type="hidden" name="year" value={String(year)} />
              <input type="hidden" name="month" value={String(month)} />
              <button className="zo-btn zo-btn-primary" type="submit">Enviar por email al cliente</button>
            </form>
          </div>
          {report.client?.email
            ? <div className="zo-sub" style={{ marginTop: 10, fontSize: 12 }}>Se enviará a {report.client.email}.</div>
            : <div className="zo-sub" style={{ marginTop: 10, fontSize: 12, color: '#FFC107' }}>Cargá el email del cliente en su ficha para poder enviar.</div>}
        </div>
      )}
    </>
  );
}
