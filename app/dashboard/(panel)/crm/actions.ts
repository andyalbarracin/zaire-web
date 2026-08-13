'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/zaire-ops/auth';
import {
  createLead, updateLead, deleteLead, moveLead, bulkInsertLeads,
  getLead, listLeadEvents, addLeadEvent, uploadLeadFile,
  createStage, updateStage, reorderStages, deleteStage,
  type CrmLeadInput, type CrmAttachment,
} from '@/lib/zaire-ops/crm';
import { researchLead, callScript, emailDraft, type ResearchResult } from '@/lib/zaire-ops/research';
import { sendLeadEmail } from '@/lib/zaire-ops/mailer';
import { getMyProfile } from '@/lib/zaire-ops/profiles';

const touch = (id?: string) => { revalidatePath('/dashboard/crm'); if (id) revalidatePath(`/dashboard/crm/${id}`); };

/* ── Leads ── */
export async function createLeadA(input: CrmLeadInput): Promise<{ id: string }> {
  const u = await requireUser();
  const id = await createLead(input);
  await addLeadEvent(id, u.id, 'Lead creado.', 'system');
  touch(id);
  return { id };
}

export async function updateLeadA(id: string, input: CrmLeadInput) {
  await requireUser();
  await updateLead(id, input);
  touch(id);
}

export async function deleteLeadA(id: string) {
  await requireUser();
  await deleteLead(id);
  touch(id);
}

export async function moveLeadA(id: string, stageId: string | null, stageName?: string) {
  const u = await requireUser();
  await moveLead(id, stageId);
  if (stageName) await addLeadEvent(id, u.id, `Etapa → ${stageName}`, 'system');
  touch(id);
}

export async function importLeadsA(rows: CrmLeadInput[], stageId: string | null, source: string | null): Promise<{ inserted: number }> {
  await requireUser();
  const inserted = await bulkInsertLeads(rows, stageId, source);
  touch();
  return { inserted };
}

/* ── Log / archivos / IA ── */
export async function addEventA(leadId: string, body: string) {
  const u = await requireUser();
  if (!body.trim()) return;
  await addLeadEvent(leadId, u.id, body, 'note');
  touch(leadId);
}

export async function listEventsA(leadId: string) {
  await requireUser();
  return listLeadEvents(leadId);
}

export async function uploadLeadFileA(fd: FormData): Promise<CrmAttachment | null> {
  await requireUser();
  const file = fd.get('file');
  if (!(file instanceof File)) return null;
  return uploadLeadFile(file);
}

export async function researchLeadA(leadId: string): Promise<ResearchResult> {
  const u = await requireUser();
  const lead = await getLead(leadId);
  if (!lead) return { error: 'Lead no encontrado.' };
  const r = await researchLead(lead);
  if ('brief' in r) {
    if (r.brief) await updateLead(leadId, { research: r.brief });
    await addLeadEvent(leadId, u.id, 'Se generó un brief con IA (Investigar).', 'system');
    touch(leadId);
  }
  return r;
}

/* ── Llamada / Email (IA + envío) ── */
export async function callScriptA(leadId: string, stageName?: string, lastNote?: string | null): Promise<{ text: string } | { error: string }> {
  await requireUser();
  const lead = await getLead(leadId);
  if (!lead) return { error: 'Lead no encontrado.' };
  return callScript(lead, stageName, lastNote);
}

export async function emailDraftA(leadId: string, stageName?: string): Promise<{ subject: string; body: string } | { error: string }> {
  await requireUser();
  const lead = await getLead(leadId);
  if (!lead) return { error: 'Lead no encontrado.' };
  return emailDraft(lead, stageName);
}

export async function sendLeadEmailA(
  leadId: string,
  data: { to: string; subject: string; body: string },
  attachments: { name: string; url: string }[],
): Promise<{ ok: true } | { error: string }> {
  const u = await requireUser();
  const to = data.to.trim();
  if (!to || !/.+@.+\..+/.test(to)) return { error: 'Email de destino inválido.' };
  const me = await getMyProfile();
  const senderName = me?.full_name || me?.email || 'Zaire Technologies';

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const bodyHtml = esc(data.body).replace(/\n/g, '<br>');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.6">
${bodyHtml}
<br><br>—<br>
<b>${esc(senderName)}</b><br>
Director General · Zaire Technologies<br>
<a href="https://zairetech.com">zairetech.com</a> · <a href="mailto:hola@zairetech.com">hola@zairetech.com</a>
</div>`;

  const ok = await sendLeadEmail({
    to,
    subject: data.subject.trim() || 'Zaire',
    html,
    replyTo: me?.email,
    attachments: attachments.map(a => ({ filename: a.name, path: a.url })),
  });
  if (!ok) return { error: 'No se pudo enviar (revisá la configuración de Resend).' };

  await addLeadEvent(leadId, u.id, `Email enviado a ${to} — "${data.subject.trim() || 'Zaire'}"`, 'system');
  touch(leadId);
  return { ok: true };
}

/* ── Etapas ── */
export async function createStageA(name: string, color: string) { await requireUser(); await createStage(name, color); touch(); }
export async function updateStageA(id: string, patch: { name?: string; color?: string }) { await requireUser(); await updateStage(id, patch); touch(); }
export async function reorderStagesA(ids: string[]) { await requireUser(); await reorderStages(ids); touch(); }
export async function deleteStageA(id: string, reassignTo: string | null) { await requireUser(); await deleteStage(id, reassignTo); touch(); }
