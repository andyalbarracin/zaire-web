// File: crm.ts
// Path: zaire-web/lib/zaire-ops/crm.ts
// Description: CRM de marketing — capa de datos (server-only, service-role).
//   Tablas zo_crm_stages (etapas editables) y zo_crm_leads (prospectos importados).
//   Independiente del panel `leads` del sitio. Resiliente: si las tablas todavía
//   no existen (migración 0011 sin correr), las lecturas devuelven vacío.

import { z } from 'zod';
import { createSupabaseAdmin } from './supabase-admin';
import { validateUpload } from './upload-guard';

const db = () => createSupabaseAdmin();

// Whitelist de campos válidos de un lead (evita mass-assignment de columnas ajenas) + shape de adjuntos.
const AttachmentSchema = z.object({ url: z.string(), type: z.string(), name: z.string() });
const LEAD_KEYS = [
  'name', 'phone', 'company', 'contact_person', 'email', 'source', 'notes', 'stage_id',
  'preferred_contact', 'contact_person_2', 'phone_2', 'website', 'city', 'address', 'budget',
  'modules_interest', 'industry', 'employees', 'market_notes', 'research', 'attachments',
] as const;

export interface CrmStage {
  id: string;
  name: string;
  position: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
}

export interface CrmAttachment { url: string; type: string; name: string; }

export interface CrmLead {
  id: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  contact_person: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;
  stage_id: string | null;
  position: number;
  // Ficha detallada
  preferred_contact: string | null;
  contact_person_2: string | null;
  phone_2: string | null;
  website: string | null;
  city: string | null;
  address: string | null;
  budget: string | null;
  modules_interest: string | null;
  industry: string | null;
  employees: string | null;
  market_notes: string | null;
  attachments: CrmAttachment[];
  research: string | null;
  created_at: string;
  updated_at: string;
}

// Campos editables de un lead desde el form/import.
export type CrmLeadInput = Partial<Pick<CrmLead,
  'name' | 'phone' | 'company' | 'contact_person' | 'email' | 'source' | 'notes' | 'stage_id' |
  'preferred_contact' | 'contact_person_2' | 'phone_2' | 'website' | 'city' | 'address' | 'budget' |
  'modules_interest' | 'industry' | 'employees' | 'market_notes' | 'attachments' | 'research'
>>;

export interface CrmLeadEvent {
  id: string;
  lead_id: string;
  author_id: string | null;
  kind: string;
  body: string;
  created_at: string;
}

/* ── Etapas ──────────────────────────────────────────────────────────────── */
export async function listStages(): Promise<CrmStage[]> {
  try {
    const { data, error } = await db().from('zo_crm_stages').select('*').order('position', { ascending: true });
    if (error) return [];
    return (data ?? []) as CrmStage[];
  } catch { return []; }
}

export async function createStage(name: string, color = '#3b82f6'): Promise<void> {
  const { data } = await db().from('zo_crm_stages').select('position').order('position', { ascending: false }).limit(1);
  const nextPos = ((data?.[0]?.position as number | undefined) ?? -1) + 1;
  const { error } = await db().from('zo_crm_stages').insert({ name: name.trim() || 'Etapa', color, position: nextPos });
  if (error) throw new Error(error.message);
}

export async function updateStage(id: string, patch: Partial<Pick<CrmStage, 'name' | 'color'>>): Promise<void> {
  const { error } = await db().from('zo_crm_stages').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function reorderStages(ids: string[]): Promise<void> {
  // Actualiza la posición de cada etapa según el orden recibido.
  await Promise.all(ids.map((id, i) => db().from('zo_crm_stages').update({ position: i }).eq('id', id)));
}

export async function deleteStage(id: string, reassignTo: string | null): Promise<void> {
  // Reasigna los leads de la etapa borrada a otra (o a null) y luego la elimina.
  await db().from('zo_crm_leads').update({ stage_id: reassignTo }).eq('stage_id', id);
  const { error } = await db().from('zo_crm_stages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ── Leads ───────────────────────────────────────────────────────────────── */
export async function listLeads(): Promise<CrmLead[]> {
  try {
    const { data, error } = await db()
      .from('zo_crm_leads')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []) as CrmLead[];
  } catch { return []; }
}

export async function getLead(id: string): Promise<CrmLead | null> {
  try {
    const { data } = await db().from('zo_crm_leads').select('*').eq('id', id).is('deleted_at', null).single();
    if (!data) return null;
    const l = data as CrmLead;
    return { ...l, attachments: Array.isArray(l.attachments) ? l.attachments : [] };
  } catch { return null; }
}

export async function createLead(input: CrmLeadInput): Promise<string> {
  const { data, error } = await db().from('zo_crm_leads').insert({ ...clean(input) }).select('id').single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

/* ── Log / chatter ───────────────────────────────────────────────────────── */
export async function listLeadEvents(leadId: string): Promise<CrmLeadEvent[]> {
  try {
    const { data } = await db().from('zo_crm_lead_events').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
    return (data ?? []) as CrmLeadEvent[];
  } catch { return []; }
}
export async function addLeadEvent(leadId: string, authorId: string | null, body: string, kind = 'note'): Promise<void> {
  const { error } = await db().from('zo_crm_lead_events').insert({ lead_id: leadId, author_id: authorId, body: body.trim(), kind });
  if (error) throw new Error(error.message);
}

/* ── Archivos del lead (bucket zo-crm) ───────────────────────────────────── */
export async function uploadLeadFile(file: File): Promise<CrmAttachment | null> {
  const check = validateUpload(file);
  if (!check.ok) return null;
  const a = createSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const { error } = await a.storage.from('zo-crm').upload(path, buffer, { contentType: check.contentType });
  if (error) return null;
  const url = a.storage.from('zo-crm').getPublicUrl(path).data.publicUrl;
  return { url, type: check.contentType, name: file.name };
}

export async function updateLead(id: string, patch: CrmLeadInput): Promise<void> {
  const { error } = await db().from('zo_crm_leads').update({ ...clean(patch), updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await db().from('zo_crm_leads').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function moveLead(id: string, stageId: string | null): Promise<void> {
  const { error } = await db().from('zo_crm_leads').update({ stage_id: stageId, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

// Inserta muchos leads de una (import CSV/XLS). Ignora filas totalmente vacías.
export async function bulkInsertLeads(rows: CrmLeadInput[], stageId: string | null, source: string | null): Promise<number> {
  const payload = rows
    .map(r => clean(r))
    .filter(r => r.name || r.phone || r.company || r.contact_person || r.email)
    .map(r => ({ ...r, stage_id: stageId, source: source ?? r.source ?? null }));
  if (payload.length === 0) return 0;
  const { error } = await db().from('zo_crm_leads').insert(payload);
  if (error) throw new Error(error.message);
  return payload.length;
}

// Whitelist + normaliza: solo claves conocidas, strings vacíos → null, adjuntos validados con zod.
function clean(input: CrmLeadInput): CrmLeadInput {
  const out: CrmLeadInput = {};
  for (const k of LEAD_KEYS) {
    const v = (input as Record<string, unknown>)[k];
    if (v === undefined) continue;
    if (k === 'attachments') {
      const p = z.array(AttachmentSchema).safeParse(v);
      if (p.success) out.attachments = p.data;
      continue;
    }
    if (typeof v === 'string') { const t = v.trim(); (out as Record<string, unknown>)[k] = t === '' ? null : t; }
    // tipos no-string en campos string se ignoran (defensa)
  }
  return out;
}
