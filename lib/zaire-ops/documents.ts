// File: documents.ts — Documentos del cliente (zo_documents). Server-only.
import { createSupabaseAdmin } from './supabase-admin';

const db = () => createSupabaseAdmin();

export type DocType = 'handoff' | 'presupuesto' | 'informe' | 'contrato' | 'otro';
export const DOC_TYPES: DocType[] = ['handoff', 'presupuesto', 'informe', 'contrato', 'otro'];
export const DOC_TYPE_LABEL: Record<DocType, string> = {
  handoff: 'Handoff / Entrega', presupuesto: 'Presupuesto', informe: 'Informe',
  contrato: 'Contrato', otro: 'Otro',
};

export interface ZoDocument {
  id: string; client_id: string; title: string; type: DocType;
  file_url: string; visible_to_client: boolean; uploaded_at: string;
}

export async function listDocuments(clientId: string, onlyVisible = false): Promise<ZoDocument[]> {
  let q = db().from('zo_documents').select('*').eq('client_id', clientId).order('uploaded_at', { ascending: false });
  if (onlyVisible) q = q.eq('visible_to_client', true);
  const { data } = await q;
  return (data ?? []) as ZoDocument[];
}

export async function getDocument(id: string): Promise<ZoDocument | null> {
  const { data } = await db().from('zo_documents').select('*').eq('id', id).single();
  return (data as ZoDocument) ?? null;
}

export async function uploadDocumentFile(clientId: string, file: File): Promise<string | null> {
  if (!file || file.size === 0 || file.size > 50 * 1024 * 1024) return null;
  const a = db();
  const safe = file.name.replace(/[^\w.\-]/g, '_');
  const path = `documents/${clientId}/${Date.now()}-${safe}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await a.storage.from('zo-files').upload(path, buffer, { contentType: file.type || 'application/octet-stream' });
  if (error) return null;
  return a.storage.from('zo-files').getPublicUrl(path).data.publicUrl;
}

export async function createDocument(input: { client_id: string; title: string; type: DocType; file_url: string; visible_to_client: boolean }): Promise<void> {
  const { error } = await db().from('zo_documents').insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await db().from('zo_documents').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
