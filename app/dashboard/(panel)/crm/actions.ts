'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/zaire-ops/auth';
import {
  createLead, updateLead, deleteLead, moveLead, bulkInsertLeads,
  getLead, listLeadEvents, addLeadEvent, uploadLeadFile,
  createStage, updateStage, reorderStages, deleteStage,
  type CrmLeadInput, type CrmAttachment,
} from '@/lib/zaire-ops/crm';
import { researchLead, type ResearchResult } from '@/lib/zaire-ops/research';

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

/* ── Etapas ── */
export async function createStageA(name: string, color: string) { await requireUser(); await createStage(name, color); touch(); }
export async function updateStageA(id: string, patch: { name?: string; color?: string }) { await requireUser(); await updateStage(id, patch); touch(); }
export async function reorderStagesA(ids: string[]) { await requireUser(); await reorderStages(ids); touch(); }
export async function deleteStageA(id: string, reassignTo: string | null) { await requireUser(); await deleteStage(id, reassignTo); touch(); }
