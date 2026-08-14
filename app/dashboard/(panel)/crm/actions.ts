'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/zaire-ops/auth';
import {
  createLead, updateLead, deleteLead, moveLead, bulkInsertLeads,
  getLead, listLeadEvents, addLeadEvent, uploadLeadFile,
  createStage, updateStage, reorderStages, deleteStage,
  type CrmLeadInput, type CrmAttachment,
} from '@/lib/zaire-ops/crm';
import { researchLead, enrichLeadFromWeb, callScript, emailDraft } from '@/lib/zaire-ops/research';
import { sendLeadEmail } from '@/lib/zaire-ops/mailer';
import { getMyProfile } from '@/lib/zaire-ops/profiles';
import { analizarLead } from '@/lib/sales/analyze';
import type { LeadAnalysis } from '@/lib/sales/types';
import type { ResearchFields } from '@/lib/zaire-ops/research';
import { resolveProviderSettings } from '@/lib/zaire-ops/llm-config';
import { getCached, setCached, hashInput } from '@/lib/zaire-ops/ai-cache';
import { recordUsage } from '@/lib/zaire-ops/ai-usage';
import { checkAiRateLimit } from '@/lib/zaire-ops/rate-limit';

const RATE_MSG = 'Alcanzaste el límite de generaciones por hora. Probá en un rato.';

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
  | { fields: ResearchFields; brief: string; analysis: LeadAnalysis | null; providers: string[]; sources?: { title: string; uri: string }[]; cached?: boolean }
  | { error: string };

// Un solo click: research (completa campos vacíos) + motor KB (módulos, speech, preguntas, objeciones).
// Ambos por la cadena openai→gemini→groq; el motor SIEMPRE se apoya en la KB.
export async function researchLeadA(leadId: string): Promise<InvestigateResult> {
  const u = await requireUser();
  if (!(await checkAiRateLimit(u.id))) return { error: RATE_MSG };
  const lead = await getLead(leadId);
  if (!lead) return { error: 'Lead no encontrado.' };

  const empleadosNum = (() => { const m = (lead.employees ?? '').match(/\d+/); return m ? Number(m[0]) : undefined; })();
  const notas = [
    lead.modules_interest && `Interés declarado: ${lead.modules_interest}`,
    lead.budget && `Presupuesto: ${lead.budget}`,
    lead.notes,
  ].filter(Boolean).join(' · ') || undefined;

  const settings = await resolveProviderSettings();

  // Caché: mismas condiciones (datos del lead + roles/modelos) → no gastamos tokens de nuevo.
  const cacheKey = hashInput('lead', {
    company: lead.company, name: lead.name, industry: lead.industry, market_notes: lead.market_notes,
    website: lead.website, employees: lead.employees, modules_interest: lead.modules_interest,
    budget: lead.budget, notes: lead.notes,
    primary: settings.primary, secondary: settings.secondary, fallback: settings.fallback, models: settings.models,
  });
  const cached = await getCached<{ fields: ResearchFields; brief: string; analysis: LeadAnalysis | null; providers: string[]; sources?: { title: string; uri: string }[] }>(cacheKey);
  if (cached) return { ...cached, cached: true };

  const report = { used: [] as string[] };

  // Etapa 1 (búsqueda web real con Gemini grounded) + Etapa 2 (análisis KB), en paralelo.
  const [enrich, analysis] = await Promise.all([
    enrichLeadFromWeb(lead),
    analizarLead({
      nombre: lead.company || lead.name || 'Lead',
      rubro: lead.industry || undefined,
      descripcion: lead.market_notes || undefined,
      web: lead.website || undefined,
      empleados: empleadosNum,
      notas,
    }, settings, report).catch(() => null),
  ]);

  let fields: ResearchFields = {};
  let sources: { title: string; uri: string }[] = [];
  if ('fields' in enrich) {
    fields = enrich.fields;
    sources = enrich.sources;
    if (!report.used.includes('gemini(web)')) report.used.push('gemini(web)');
  } else {
    // Fallback sin web (Gemini no configurado): research por inferencia.
    const research = await researchLead(lead, settings, report);
    if ('fields' in research) fields = research.fields;
  }

  // Si no vino interés/módulos, lo tomamos del motor KB.
  if (analysis && !fields.modules_interest && analysis.modulos_recomendados.length) {
    fields.modules_interest = analysis.modulos_recomendados.map((m) => m.nombre).join(', ');
  }

  const brief = analysis ? briefFromAnalysis(analysis) : '';
  if (!brief && Object.keys(fields).length === 0 && !analysis) {
    return { error: 'La IA no devolvió un resultado útil.' };
  }

  if (brief) await updateLead(leadId, { research: brief });
  const provs = report.used.join(', ') || 'IA';
  await addLeadEvent(leadId, u.id, `Investigación con IA (respondió: ${provs}).`, 'system');
  await recordUsage(report.used);
  const result = { fields, brief, analysis, providers: report.used, sources };
  await setCached(cacheKey, 'lead', result);
  touch(leadId);
  return result;
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
  const u = await requireUser();
  if (!(await checkAiRateLimit(u.id))) return { error: RATE_MSG };
  const lead = await getLead(leadId);
  if (!lead) return { error: 'Lead no encontrado.' };
  return callScript(lead, stageName, lastNote, await resolveProviderSettings());
}

export async function emailDraftA(leadId: string, stageName?: string): Promise<{ subject: string; body: string } | { error: string }> {
  const u = await requireUser();
  if (!(await checkAiRateLimit(u.id))) return { error: RATE_MSG };
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
