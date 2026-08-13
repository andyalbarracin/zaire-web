// File: crm.ts
// Path: zaire-web/lib/zaire-ops/crm.ts
// Description: CRM de marketing — capa de datos (server-only, service-role).
//   Tablas zo_crm_stages (etapas editables) y zo_crm_leads (prospectos importados).
//   Independiente del panel `leads` del sitio. Resiliente: si las tablas todavía
//   no existen (migración 0011 sin correr), las lecturas devuelven vacío.

import { createSupabaseAdmin } from './supabase-admin';

const db = () => createSupabaseAdmin();

export interface CrmStage {
  id: string;
  name: string;
  position: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
}

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
  created_at: string;
  updated_at: string;
}

// Campos editables de un lead desde el form/import.
export type CrmLeadInput = Partial<Pick<CrmLead, 'name' | 'phone' | 'company' | 'contact_person' | 'email' | 'source' | 'notes' | 'stage_id'>>;

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

export async function createLead(input: CrmLeadInput): Promise<void> {
  const { error } = await db().from('zo_crm_leads').insert({ ...clean(input) });
  if (error) throw new Error(error.message);
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

// Normaliza strings vacíos a null y recorta.
function clean(input: CrmLeadInput): CrmLeadInput {
  const out: CrmLeadInput = {};
  for (const [k, v] of Object.entries(input) as [keyof CrmLeadInput, unknown][]) {
    if (v === undefined) continue;
    if (typeof v === 'string') { const t = v.trim(); (out as Record<string, unknown>)[k] = t === '' ? null : t; }
    else (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
