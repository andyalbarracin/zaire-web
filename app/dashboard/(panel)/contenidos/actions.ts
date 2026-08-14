'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/zaire-ops/auth';
import {
  createContentItem, updateContentItem, deleteContentItem, moveContentItem, uploadContentMedia, bulkInsertContentItems, setContentReviewed,
  createContentStage, updateContentStage, reorderContentStages, deleteContentStage,
  type ContentItemInput, type ContentMedia,
} from '@/lib/zaire-ops/content';
import { generateContentText, generateContentImage, type GeneratedText } from '@/lib/zaire-ops/content-ai';
import { resolveProviderSettings } from '@/lib/zaire-ops/llm-config';

const touch = () => revalidatePath('/dashboard/contenidos');

/* ── Generación con IA (texto + imagen) ── */
export async function generateTextA(input: { prompt: string; platform?: string; title?: string }): Promise<GeneratedText | { error: string }> {
  await requireUser();
  if (!input.prompt?.trim()) return { error: 'Escribí una idea o tema para generar.' };
  return generateContentText(input, await resolveProviderSettings());
}

export async function generateImageA(prompt: string): Promise<ContentMedia | { error: string }> {
  await requireUser();
  if (!prompt?.trim()) return { error: 'Escribí un prompt para la imagen.' };
  return generateContentImage(prompt, await resolveProviderSettings());
}

export async function createItemA(input: ContentItemInput) { const u = await requireUser(); await createContentItem(input, u.id); touch(); }
export async function updateItemA(id: string, input: ContentItemInput) { await requireUser(); await updateContentItem(id, input); touch(); }
export async function deleteItemA(id: string) { await requireUser(); await deleteContentItem(id); touch(); }
export async function moveItemA(id: string, statusId: string | null) { await requireUser(); await moveContentItem(id, statusId); touch(); }
export async function setReviewedA(id: string, reviewed: boolean) { const u = await requireUser(); await setContentReviewed(id, reviewed ? u.id : null); touch(); }

export async function importItemsA(rows: { title?: string; body?: string }[], statusId: string | null): Promise<{ inserted: number }> {
  const u = await requireUser();
  const inserted = await bulkInsertContentItems(rows, statusId, u.id);
  touch();
  return { inserted };
}

export async function uploadMediaA(fd: FormData): Promise<ContentMedia | null> {
  await requireUser();
  const file = fd.get('file');
  if (!(file instanceof File)) return null;
  return uploadContentMedia(file);
}

export async function createStageA(name: string, color: string) { await requireUser(); await createContentStage(name, color); touch(); }
export async function updateStageA(id: string, patch: { name?: string; color?: string }) { await requireUser(); await updateContentStage(id, patch); touch(); }
export async function reorderStagesA(ids: string[]) { await requireUser(); await reorderContentStages(ids); touch(); }
export async function deleteStageA(id: string, reassignTo: string | null) { await requireUser(); await deleteContentStage(id, reassignTo); touch(); }
