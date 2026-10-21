// File: crm-digest.ts
// Path: zaire-web/lib/zaire-ops/crm-digest.ts
// Description: Resumen diario por email de actividades del CRM (vencidas + de hoy), uno por persona.
//              Destinatario: responsable de la actividad; si no tiene, quien la creó; si tampoco,
//              los owners. Solo lectura: arma los emails, no modifica datos.

import { listPendingActivities, type CrmActivityWithLead } from './crm';
import { listProfiles, type ZoProfile } from './profiles';
import { CRM_ACTIVITY_LABEL } from './crm-constants';
import { fmtDayShort } from './dates';

export interface CrmDigest {
  to: string;
  name: string;
  subject: string;
  html: string;
  overdue: number;
  today: number;
}

function esc(s = ''): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const siteBase = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com').replace(/\/$/, '');

/** Agrupa pendientes por destinatario (puro, testeable). */
export function groupByRecipient(acts: CrmActivityWithLead[], ownerIds: string[]): Map<string, CrmActivityWithLead[]> {
  const out = new Map<string, CrmActivityWithLead[]>();
  for (const a of acts) {
    const targets = a.assignee_id ? [a.assignee_id] : a.author_id ? [a.author_id] : ownerIds;
    for (const id of targets) {
      if (!out.has(id)) out.set(id, []);
      out.get(id)!.push(a);
    }
  }
  return out;
}

function rows(list: CrmActivityWithLead[], tone: string): string {
  return list.map(a => {
    const lead = esc(a.lead_name || a.lead_company || '(sin nombre)');
    const when = `${fmtDayShort(a.due_date)}${a.due_time ? ` ${a.due_time}` : ''}`;
    return `
      <tr><td style="padding:10px 0;border-top:1px solid #e4e4dc">
        <a href="${siteBase()}/dashboard/crm/${a.lead_id}" style="color:#111;text-decoration:none;font-size:14px;font-weight:700">${esc(a.title)}</a>
        <div style="font-size:12px;color:${tone};margin-top:3px">${CRM_ACTIVITY_LABEL[a.kind]} · ${when} · ${lead}</div>
        ${a.description ? `<div style="font-size:12px;color:#666;margin-top:4px;line-height:1.5">${esc(a.description.slice(0, 240))}</div>` : ''}
      </td></tr>`;
  }).join('');
}

export function buildDigestEmail(name: string, overdue: CrmActivityWithLead[], today: CrmActivityWithLead[]): { subject: string; html: string } {
  const section = (title: string, list: CrmActivityWithLead[], tone: string) => list.length === 0 ? '' : `
    <p style="font-family:monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${tone};margin:22px 0 4px">// ${title} (${list.length})</p>
    <table style="width:100%;border-collapse:collapse">${rows(list, tone)}</table>`;
  const html = `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
    <div style="background:#111;padding:22px 32px">
      <span style="font-family:monospace;font-size:15px;font-weight:700;color:#fff;letter-spacing:.15em">ZAIRE</span>
      <span style="font-family:monospace;font-size:9px;color:#FF6A00;letter-spacing:.1em;text-transform:uppercase;margin-left:12px">OPS · CRM</span>
    </div>
    <div style="padding:28px 32px;background:#F5F5F0">
      <h1 style="font-size:18px;font-weight:800;margin:0 0 6px">Hola ${esc(name)}, esto tenés en el CRM</h1>
      <p style="font-size:13px;color:#555;margin:0">${today.length} para hoy${overdue.length ? ` · ${overdue.length} vencida${overdue.length === 1 ? '' : 's'}` : ''}.</p>
      ${section('Vencidas', overdue, '#c0392b')}
      ${section('Hoy', today, '#d35400')}
      <a href="${siteBase()}/dashboard/crm?view=calendar" style="display:inline-block;margin-top:22px;background:#111;color:#fff;text-decoration:none;font-size:13px;padding:10px 18px;border-radius:6px">Abrir calendario →</a>
    </div>
    <div style="background:#111;padding:14px 32px"><span style="font-family:monospace;font-size:9px;color:#666;letter-spacing:.08em">ZAIRE Ops · resumen diario de actividades</span></div>
  </div>`;
  const subject = `CRM · ${today.length} para hoy${overdue.length ? ` · ${overdue.length} vencida${overdue.length === 1 ? '' : 's'}` : ''} · ZAIRE Ops`;
  return { subject, html };
}

/** Emails a mandar hoy. `null` si la tabla de actividades no existe (migración 0017). */
export async function buildCrmDigests(today: string): Promise<CrmDigest[] | null> {
  const acts = await listPendingActivities({ until: today });
  if (acts === null) return null;
  if (acts.length === 0) return [];
  const profiles = await listProfiles();
  const byId = new Map<string, ZoProfile>(profiles.map(p => [p.id, p]));
  const owners = profiles.filter(p => p.role === 'owner').map(p => p.id);

  const out: CrmDigest[] = [];
  for (const [id, list] of groupByRecipient(acts, owners)) {
    const p = byId.get(id);
    if (!p?.email) continue;
    const overdue = list.filter(a => a.due_date < today);
    const todays = list.filter(a => a.due_date === today);
    const name = p.full_name || p.email.split('@')[0];
    out.push({ to: p.email, name, ...buildDigestEmail(name, overdue, todays), overdue: overdue.length, today: todays.length });
  }
  return out;
}
