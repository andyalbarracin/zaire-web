'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/zaire-ops/auth';
import {
  createLead, updateLead, deleteLead, moveLead, bulkInsertLeads,
  getLead, listLeadEvents, addLeadEvent, uploadLeadFile,
  createStage, updateStage, reorderStages, deleteStage,
  type CrmLeadInput, type CrmAttachment,
} from '@/lib/zaire-ops/crm';
import { researchLead, callScript, emailDraft } from '@/lib/zaire-ops/research';
import { sendLeadEmail } from '@/lib/zaire-ops/mailer';
import { getMyProfile } from '@/lib/zaire-ops/profiles';
import { analizarLead } from '@/lib/sales/analyze';
import type { LeadAnalysis } from '@/lib/sales/types';
import { resolveProviderSettings } from '@/lib/zaire-ops/llm-config';

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

export type InvestigateResult =
  | { fields: import('@/lib/zaire-ops/research').ResearchFields; brief: string; analysis: LeadAnalysis | null }
  | { error: string };

// Un solo click: research (completa campos vacíos) + motor KB (módulos, speech, preguntas, objeciones).
// Ambos por la cadena openai→gemini→groq; el motor SIEMPRE se apoya en la KB.
export async function researchLeadA(leadId: string): Promise<InvestigateResult> {
  const u = await requireUser();
  const lead = await getLead(leadId);
  if (!lead) return { error: 'Lead no encontrado.' };

  const empleadosNum = (() => { const m = (lead.employees ?? '').match(/\d+/); return m ? Number(m[0]) : undefined; })();
  const notas = [
    lead.modules_interest && `Interés declarado: ${lead.modules_interest}`,
    lead.budget && `Presupuesto: ${lead.budget}`,
    lead.notes,
  ].filter(Boolean).join(' · ') || undefined;

  const settings = await resolveProviderSettings();

  // En paralelo: research (campos + brief libre) y motor KB (playbook estructurado).
  const [research, analysis] = await Promise.all([
    researchLead(lead, settings),
    analizarLead({
      nombre: lead.company || lead.name || 'Lead',
      rubro: lead.industry || undefined,
      descripcion: lead.market_notes || undefined,
      web: lead.website || undefined,
      empleados: empleadosNum,
      notas,
    }, settings).catch(() => null),
  ]);

  const fields = 'fields' in research ? research.fields : {};
  // Si no hay módulos sugeridos por research, los tomamos del motor KB.
  if (analysis && !fields.modules_interest && analysis.modulos_recomendados.length) {
    fields.modules_interest = analysis.modulos_recomendados.map((m) => m.nombre).join(', ');
  }

  // El brief persistido prioriza el playbook KB; si el motor falló, cae al brief de research.
  const brief = analysis
    ? briefFromAnalysis(analysis)
    : ('brief' in research ? research.brief : '');

  if (!brief && Object.keys(fields).length === 0 && !analysis) {
    return 'error' in research ? research : { error: 'La IA no devolvió un resultado útil.' };
  }

  if (brief) await updateLead(leadId, { research: brief });
  await addLeadEvent(leadId, u.id, 'Investigación con IA (research + motor KB).', 'system');
  touch(leadId);
  return { fields, brief, analysis };
}

// Arma el brief de texto (persistido en lead.research) a partir del análisis KB.
function briefFromAnalysis(a: LeadAnalysis): string {
  const mods = a.modulos_recomendados.map((m) => `- ${m.nombre} (${m.prioridad}): ${m.por_que}`).join('\n');
  const preg = a.preguntas_calificacion.map((q) => `- ${q.pregunta}${q.oro ? ' ⭐' : ''}`).join('\n');
  const obj = a.objeciones_probables.map((o) => `- "${o.objecion}" → ${o.respuesta}`).join('\n');
  return [
    `1) Lectura rápida\n${a.lectura_rapida}`,
    `Industria: ${a.industria_detectada} · Tamaño: ${a.tamano_estimado} · Confianza: ${a.confianza}`,
    `2) Módulos que encajan\n${mods}`,
    `3) Ángulo de entrada\n${a.angulo_entrada}`,
    `Speech\n• Apertura: ${a.speech.apertura}\n• Cuerpo: ${a.speech.cuerpo}\n• Cierre: ${a.speech.cierre}`,
    `4) Preguntas para calificar\n${preg}`,
    `5) Objeciones probables\n${obj}`,
    a.datos_faltantes.length ? `Datos faltantes: ${a.datos_faltantes.join(' · ')}` : '',
    `Próximo paso: ${a.proximo_paso}`,
  ].filter(Boolean).join('\n\n');
}

/* ── Llamada / Email (IA + envío) ── */
export async function callScriptA(leadId: string, stageName?: string, lastNote?: string | null): Promise<{ text: string } | { error: string }> {
  await requireUser();
  const lead = await getLead(leadId);
  if (!lead) return { error: 'Lead no encontrado.' };
  return callScript(lead, stageName, lastNote, await resolveProviderSettings());
}

export async function emailDraftA(leadId: string, stageName?: string): Promise<{ subject: string; body: string } | { error: string }> {
  await requireUser();
  const lead = await getLead(leadId);
  if (!lead) return { error: 'Lead no encontrado.' };
  return emailDraft(lead, stageName, await resolveProviderSettings());
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
