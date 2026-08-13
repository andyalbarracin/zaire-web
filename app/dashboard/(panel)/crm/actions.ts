'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/zaire-ops/auth';
import {
  createLead, updateLead, deleteLead, moveLead, bulkInsertLeads,
  createStage, updateStage, reorderStages, deleteStage,
  type CrmLeadInput,
} from '@/lib/zaire-ops/crm';

const touch = () => revalidatePath('/dashboard/crm');

/* ── Leads ── */
export async function createLeadA(input: CrmLeadInput) {
  await requireUser();
  await createLead(input);
  touch();
}

export async function updateLeadA(id: string, input: CrmLeadInput) {
  await requireUser();
  await updateLead(id, input);
  touch();
}

export async function deleteLeadA(id: string) {
  await requireUser();
  await deleteLead(id);
  touch();
}

export async function moveLeadA(id: string, stageId: string | null) {
  await requireUser();
  await moveLead(id, stageId);
  touch();
}

export async function importLeadsA(rows: CrmLeadInput[], stageId: string | null, source: string | null): Promise<{ inserted: number }> {
  await requireUser();
  const inserted = await bulkInsertLeads(rows, stageId, source);
  touch();
  return { inserted };
}

/* ── Etapas ── */
export async function createStageA(name: string, color: string) {
  await requireUser();
  await createStage(name, color);
  touch();
}

export async function updateStageA(id: string, patch: { name?: string; color?: string }) {
  await requireUser();
  await updateStage(id, patch);
  touch();
}

export async function reorderStagesA(ids: string[]) {
  await requireUser();
  await reorderStages(ids);
  touch();
}

export async function deleteStageA(id: string, reassignTo: string | null) {
  await requireUser();
  await deleteStage(id, reassignTo);
  touch();
}
