// File: page.tsx — Reporte mensual en versión imprimible (PDF vía navegador).
// Fuera del shell (sin sidebar), fondo blanco. Protegido por middleware/auth.
import { requireUser } from '@/lib/zaire-ops/auth';
import { getMonthlyReport } from '@/lib/zaire-ops/queries';
import { STATUS_LABEL, minutesToHours } from '@/lib/zaire-ops/types';
import PrintButton from './print-button';

export const dynamic = 'force-dynamic';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default async function ReportePrintPage({
  searchParams,
}: { searchParams: Promise<{ client?: string; year?: string; month?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  if (!sp.client) {
    return <div style={{ background: '#fff', minHeight: '100vh', color: '#111', padding: 48 }}>Falta el cliente.</div>;
  }
  const report = await getMonthlyReport(sp.client, year, month);

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111' }}>
      <div className="zo-noprint" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <a href={`/dashboard/reportes?client=${sp.client}&year=${year}&month=${month}`} style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>← Volver al panel</a>
        <PrintButton />
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: '.15em' }}>ZAIRE</div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#FF6A00' }}>Reporte de soporte</div>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>{MONTHS[month - 1]} {year}</div>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#888' }}>// {report.client?.name ?? 'Cliente'}</div>
        <h1 style={{ fontFamily: 'sans-serif', fontSize: 30, fontWeight: 800, textTransform: 'uppercase', margin: '6px 0 24px' }}>Reporte mensual</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
          {([['Recibidas', report.received], ['Resueltas', report.resolved], ['En progreso', report.inProgress], ['Horas', minutesToHours(report.minutes)]] as const).map(([l, n], i) => (
            <div key={l} style={{ border: '1px solid #e5e3dd', borderRadius: 4, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: i === 3 ? '#FF6A00' : '#111' }}>{n}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        {report.includedMinutes > 0 && (
          <p style={{ fontSize: 13, color: '#555', margin: '0 0 6px' }}>
            Horas de soporte: <strong>{minutesToHours(report.minutes)}</strong> de {minutesToHours(report.includedMinutes)} incluidas
            {report.minutes > report.includedMinutes ? ' (excedido)' : ''}.
          </p>
        )}

        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', margin: '26px 0 10px' }}>// Incidencias del período</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee' }}>
          <thead><tr>{['ID', 'Título', 'Estado'].map(h => <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', borderBottom: '1px solid #eee' }}>{h}</th>)}</tr></thead>
          <tbody>
            {report.tickets.length === 0
              ? <tr><td colSpan={3} style={{ padding: 14, fontSize: 13, color: '#888' }}>Sin incidencias en el período.</td></tr>
              : report.tickets.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: '#888', borderBottom: '1px solid #f0f0f0' }}>{t.ticket_number ?? '—'}</td>
                  <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid #f0f0f0' }}>{t.title}</td>
                  <td style={{ padding: '9px 12px', fontSize: 12, color: '#555', borderBottom: '1px solid #f0f0f0' }}>{STATUS_LABEL[t.status]}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <div style={{ marginTop: 40, fontFamily: 'monospace', fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', borderTop: '1px solid #eee', paddingTop: 14 }}>© ZAIRE {year} · Generado por Zaire Ops</div>
      </div>
    </div>
  );
}
