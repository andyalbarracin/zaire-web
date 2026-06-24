// File: report-email.ts
// Path: zaire-web/lib/zaire-ops/report-email.ts
// Description: HTML branded del reporte mensual para enviar al cliente (Resend).

import { STATUS_LABEL, minutesToHours, type ZoClient, type ZoTicket } from './types';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export interface ReportData {
  client: ZoClient | null;
  received: number;
  resolved: number;
  inProgress: number;
  minutes: number;
  includedMinutes: number;
  tickets: ZoTicket[];
}

export function buildReportEmailHtml(report: ReportData, year: number, month: number): { subject: string; html: string } {
  const clientName = report.client?.name ?? 'Cliente';
  const period = `${MONTHS[month - 1]} ${year}`;

  const stat = (n: string, l: string, accent = false) => `
    <td style="padding:14px 10px;text-align:center;border:1px solid #e5e3dd">
      <div style="font-family:sans-serif;font-size:26px;font-weight:800;color:${accent ? '#FF6A00' : '#111'}">${n}</div>
      <div style="font-family:monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#888;margin-top:4px">${l}</div>
    </td>`;

  const rows = report.tickets.length
    ? report.tickets.map(t => `
      <tr>
        <td style="padding:10px 12px;font-family:monospace;font-size:11px;color:#888;border-bottom:1px solid #eee">${t.ticket_number ?? '—'}</td>
        <td style="padding:10px 12px;font-size:13px;color:#222;border-bottom:1px solid #eee">${escapeHtml(t.title)}</td>
        <td style="padding:10px 12px;font-size:12px;color:#555;border-bottom:1px solid #eee">${STATUS_LABEL[t.status]}</td>
      </tr>`).join('')
    : '<tr><td colspan="3" style="padding:16px;font-size:13px;color:#888">Sin incidencias en el período.</td></tr>';

  const planLine = report.includedMinutes > 0
    ? `<p style="font-size:13px;color:#555;margin:0 0 4px">Horas de soporte: <strong>${minutesToHours(report.minutes)}</strong> de ${minutesToHours(report.includedMinutes)} incluidas${report.minutes > report.includedMinutes ? ' <span style="color:#E71D0A">(excedido)</span>' : ''}.</p>`
    : `<p style="font-size:13px;color:#555;margin:0 0 4px">Horas de soporte utilizadas: <strong>${minutesToHours(report.minutes)}</strong>.</p>`;

  const html = `
  <div style="font-family:sans-serif;max-width:620px;margin:0 auto;color:#111">
    <div style="background:#111;padding:24px 36px">
      <span style="font-family:monospace;font-size:16px;font-weight:700;color:#fff;letter-spacing:.15em">ZAIRE</span>
      <span style="font-family:monospace;font-size:9px;color:#FF6A00;letter-spacing:.1em;text-transform:uppercase;margin-left:14px">REPORTE DE SOPORTE</span>
    </div>
    <div style="padding:36px;background:#F5F5F0">
      <p style="font-family:monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin:0 0 6px">// ${escapeHtml(clientName)}</p>
      <h1 style="font-family:sans-serif;font-size:24px;font-weight:800;text-transform:uppercase;color:#111;margin:0 0 4px">Reporte mensual</h1>
      <p style="font-size:14px;color:#555;margin:0 0 24px">${period}</p>

      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>${stat(String(report.received), 'Recibidas')}${stat(String(report.resolved), 'Resueltas')}${stat(String(report.inProgress), 'En progreso')}${stat(minutesToHours(report.minutes), 'Horas', true)}</tr>
      </table>

      ${planLine}

      <div style="font-family:monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#888;margin:26px 0 10px">// Incidencias del período</div>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-radius:2px">
        <thead><tr>
          <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#888;border-bottom:1px solid #eee">ID</th>
          <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#888;border-bottom:1px solid #eee">Título</th>
          <th style="padding:10px 12px;text-align:left;font-family:monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#888;border-bottom:1px solid #eee">Estado</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:18px 36px;background:#111">
      <span style="font-family:monospace;font-size:9px;color:#aaa;letter-spacing:.08em;text-transform:uppercase">© ZAIRE ${year} · Reporte generado por Zaire Ops</span>
    </div>
  </div>`;

  return { subject: `Reporte de soporte — ${clientName} · ${period}`, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}
