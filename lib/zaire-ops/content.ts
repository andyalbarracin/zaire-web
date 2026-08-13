// File: content.ts
// Path: zaire-web/lib/zaire-ops/content.ts
// Description: Content deck (gestor de contenidos, v1) — capa de datos server-only.
//   Tablas zo_content_stages + zo_content_items. Media a Storage 'zo-files'.
//   Resiliente: si las tablas no existen aún, las lecturas devuelven vacío.

import { createSupabaseAdmin } from './supabase-admin';

const db = () => createSupabaseAdmin();

export interface ContentStage { id: string; name: string; position: number; color: string; created_at: string; }
export interface ContentMedia { url: string; type: string; name: string; }
export interface ContentItem {
  id: string; title: string; subtitle: string | null; body: string | null;
  url: string | null; platform: string | null; content_date: string | null;
  status_id: string | null; media: ContentMedia[];
  owner_id: string | null; created_by: string | null;
  reviewed_by: string | null; reviewed_at: string | null;
  position: number; created_at: string; updated_at: string;
}
export type ContentItemInput = Partial<Pick<ContentItem, 'title' | 'subtitle' | 'body' | 'url' | 'platform' | 'content_date' | 'status_id' | 'media' | 'owner_id'>>;

/* ── Estados ── */
export async function listContentStages(): Promise<ContentStage[]> {
  try {
    const { data, error } = await db().from('zo_content_stages').select('*').order('position', { ascending: true });
    if (error) return [];
    return (data ?? []) as ContentStage[];
  } catch { return []; }
}
export async function createContentStage(name: string, color = '#3b82f6'): Promise<void> {
  const { data } = await db().from('zo_content_stages').select('position').order('position', { ascending: false }).limit(1);
  const nextPos = ((data?.[0]?.position as number | undefined) ?? -1) + 1;
  const { error } = await db().from('zo_content_stages').insert({ name: name.trim() || 'Estado', color, position: nextPos });
  if (error) throw new Error(error.message);
}
export async function updateContentStage(id: string, patch: Partial<Pick<ContentStage, 'name' | 'color'>>): Promise<void> {
  const { error } = await db().from('zo_content_stages').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}
export async function reorderContentStages(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => db().from('zo_content_stages').update({ position: i }).eq('id', id)));
}
export async function deleteContentStage(id: string, reassignTo: string | null): Promise<void> {
  await db().from('zo_content_items').update({ status_id: reassignTo }).eq('status_id', id);
  const { error } = await db().from('zo_content_stages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ── Items ── */
export async function listContentItems(): Promise<ContentItem[]> {
  try {
    const { data, error } = await db().from('zo_content_items').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (error) return [];
    return ((data ?? []) as ContentItem[]).map(i => ({ ...i, media: Array.isArray(i.media) ? i.media : [] }));
  } catch { return []; }
}
export async function createContentItem(input: ContentItemInput, createdBy: string | null): Promise<void> {
  const { error } = await db().from('zo_content_items').insert({
    title: input.title ?? '', subtitle: input.subtitle ?? null, body: input.body ?? null,
    url: input.url ?? null, platform: input.platform ?? null, content_date: input.content_date || null,
    status_id: input.status_id ?? null, media: input.media ?? [],
    created_by: createdBy, owner_id: input.owner_id ?? createdBy,
  });
  if (error) throw new Error(error.message);
}
export async function updateContentItem(id: string, input: ContentItemInput): Promise<void> {
  const patch: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
  if ('content_date' in patch && !patch.content_date) patch.content_date = null;  // '' → null (date válida)
  const { error } = await db().from('zo_content_items').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setContentReviewed(id: string, reviewerId: string | null): Promise<void> {
  const { error } = await db().from('zo_content_items').update({
    reviewed_by: reviewerId,
    reviewed_at: reviewerId ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error(error.message);
}
export async function deleteContentItem(id: string): Promise<void> {
  const { error } = await db().from('zo_content_items').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}
export async function moveContentItem(id: string, statusId: string | null): Promise<void> {
  const { error } = await db().from('zo_content_items').update({ status_id: statusId, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

// Import masivo de contenidos (CSV/XLS): título y texto.
export async function bulkInsertContentItems(rows: { title?: string; body?: string }[], statusId: string | null, createdBy: string | null): Promise<number> {
  const payload = rows
    .map(r => ({ title: (r.title ?? '').trim(), body: (r.body ?? '').trim() || null }))
    .filter(r => r.title || r.body)
    .map(r => ({ ...r, status_id: statusId, media: [] as ContentMedia[], created_by: createdBy, owner_id: createdBy }));
  if (!payload.length) return 0;
  const { error } = await db().from('zo_content_items').insert(payload);
  if (error) throw new Error(error.message);
  return payload.length;
}

// Sube un archivo de media al bucket zo-files y devuelve su URL pública.
export async function uploadContentMedia(file: File): Promise<ContentMedia | null> {
  const a = createSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const { error } = await a.storage.from('zo-content').upload(path, buffer, { contentType: file.type || 'application/octet-stream' });
  if (error) return null;
  const url = a.storage.from('zo-content').getPublicUrl(path).data.publicUrl;
  return { url, type: file.type || '', name: file.name };
}
