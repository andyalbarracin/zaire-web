// File: ticket-email.ts — HTML branded para notificar al cliente sobre una incidencia (Resend).
import { STATUS_LABEL, PRIORITY_LABEL, type ZoTicket } from './types';

function esc(s = ''): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildTicketEmailHtml(t: ZoTicket, clientName: string): { subject: string; html: string } {
  const num = t.ticket_number ?? '';
  const subject = `Actualización de tu solicitud ${num} · ZAIRE`;
  const row = (label: string, value?: string | null) =>
    value ? `<p style="margin:0 0 8px;font-size:13.5px;color:#333"><strong style="color:#111">${label}:</strong> ${esc(value)}</p>` : '';

  const html = `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
    <div style="background:#111;padding:24px 36px">
      <span style="font-family:monospace;font-size:16px;font-weight:700;color:#fff;letter-spacing:.15em">ZAIRE</span>
      <span style="font-family:monospace;font-size:9px;color:#FF6A00;letter-spacing:.1em;text-transform:uppercase;margin-left:14px">SOPORTE</span>
    </div>
    <div style="padding:36px;background:#F5F5F0">
      <p style="font-family:monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin:0 0 6px">// ${esc(num)}</p>
      <h1 style="font-family:sans-serif;font-size:21px;font-weight:800;color:#111;margin:0 0 4px">${esc(t.title)}</h1>
      <p style="font-size:14px;color:#555;margin:0 0 22px">Hola ${esc(clientName)}, te compartimos el estado de tu solicitud.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e3dd;border-radius:4px">
        <tr><td style="padding:16px 18px">
          ${row('Estado', STATUS_LABEL[t.status])}
          ${row('Prioridad', PRIORITY_LABEL[t.priority])}
          ${row('Detalle', t.description)}
          ${row('Resolución', t.resolution)}
        </td></tr>
      </table>
      <p style="font-size:12px;color:#999;margin:22px 0 0">Cualquier duda, respondé este correo. — Equipo ZAIRE</p>
    </div>
    <div style="background:#111;padding:16px 36px"><span style="font-family:monospace;font-size:9px;color:#666;letter-spacing:.08em">ZAIRE · zairetech.com</span></div>
  </div>`;
  return { subject, html };
}
