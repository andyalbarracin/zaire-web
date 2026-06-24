// File: team-email.ts — emails INTERNOS al equipo (asignación / comentario en incidencia).
import { STATUS_LABEL, PRIORITY_LABEL, type ZoTicket } from './types';

function esc(s = ''): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function ticketLink(id: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com').replace(/\/$/, '');
  return `${base}/dashboard/tickets/${id}`;
}

function shell(num: string, heading: string, inner: string, ticketId: string): string {
  return `
  <div style="font-family:sans-serif;max-width:540px;margin:0 auto;color:#111">
    <div style="background:#111;padding:22px 32px">
      <span style="font-family:monospace;font-size:15px;font-weight:700;color:#fff;letter-spacing:.15em">ZAIRE</span>
      <span style="font-family:monospace;font-size:9px;color:#FF6A00;letter-spacing:.1em;text-transform:uppercase;margin-left:12px">OPS · EQUIPO</span>
    </div>
    <div style="padding:32px;background:#F5F5F0">
      <p style="font-family:monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin:0 0 6px">// ${esc(num)}</p>
      <h1 style="font-family:sans-serif;font-size:18px;font-weight:800;color:#111;margin:0 0 14px">${heading}</h1>
      ${inner}
      <a href="${ticketLink(ticketId)}" style="display:inline-block;margin-top:18px;background:#111;color:#fff;text-decoration:none;font-size:13px;padding:10px 18px;border-radius:6px">Abrir incidencia →</a>
    </div>
    <div style="background:#111;padding:14px 32px"><span style="font-family:monospace;font-size:9px;color:#666;letter-spacing:.08em">ZAIRE Ops · zairetech.com</span></div>
  </div>`;
}

export function buildAssignmentEmail(t: ZoTicket, assigneeName: string): { subject: string; html: string } {
  const num = t.ticket_number ?? 'Incidencia';
  const inner = `
    <p style="font-size:14px;color:#333;margin:0 0 8px">Hola ${esc(assigneeName)}, te asignaron una incidencia:</p>
    <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 10px">${esc(t.title)}</p>
    <p style="font-size:13px;color:#555;margin:0">Estado: ${STATUS_LABEL[t.status]} · Prioridad: ${PRIORITY_LABEL[t.priority]} · Cliente: ${esc(t.client?.name ?? '—')}</p>`;
  return { subject: `Te asignaron ${num} · ZAIRE Ops`, html: shell(num, 'Nueva incidencia asignada', inner, t.id) };
}

export function buildCommentEmail(t: ZoTicket, commentBody: string, authorName: string, assigneeName: string): { subject: string; html: string } {
  const num = t.ticket_number ?? 'Incidencia';
  const inner = `
    <p style="font-size:14px;color:#333;margin:0 0 10px">Hola ${esc(assigneeName)}, ${esc(authorName)} comentó en <strong>${esc(t.title)}</strong>:</p>
    <blockquote style="margin:0;padding:12px 16px;background:#fff;border-left:3px solid #FF6A00;border-radius:4px;font-size:14px;color:#222;white-space:pre-wrap">${esc(commentBody)}</blockquote>`;
  return { subject: `Nuevo comentario en ${num} · ZAIRE Ops`, html: shell(num, 'Nuevo comentario', inner, t.id) };
}
