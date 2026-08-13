'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/zaire-ops/auth';
import {
  createContentItem, updateContentItem, deleteContentItem, moveContentItem, uploadContentMedia,
  createContentStage, updateContentStage, reorderContentStages, deleteContentStage,
  type ContentItemInput, type ContentMedia,
} from '@/lib/zaire-ops/content';

const touch = () => revalidatePath('/dashboard/contenidos');

export async function createItemA(input: ContentItemInput) { await requireUser(); await createContentItem(input); touch(); }
export async function updateItemA(id: string, input: ContentItemInput) { await requireUser(); await updateContentItem(id, input); touch(); }
export async function deleteItemA(id: string) { await requireUser(); await deleteContentItem(id); touch(); }
export async function moveItemA(id: string, statusId: string | null) { await requireUser(); await moveContentItem(id, statusId); touch(); }

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
