// File: crm.ts
// Path: zaire-web/lib/zaire-ops/crm.ts
// Description: CRM de marketing — capa de datos (server-only, service-role).
//   Tablas zo_crm_stages (etapas editables) y zo_crm_leads (prospectos importados).
//   Independiente del panel `leads` del sitio. Resiliente: si las tablas todavía
//   no existen (migración 0011 sin correr), las lecturas devuelven vacío.

import { z } from 'zod';
import { createSupabaseAdmin } from './supabase-admin';
import { validateUpload } from './upload-guard';
import { CRM_ACTIVITY_KINDS, CRM_ACTIVITY_LABEL, type CrmActivityKind } from './crm-constants';
import { isDateOnly } from './dates';

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

/* ── Actividades (agenda por lead + calendario) — migración 0017 ─────────────
   Lecturas: devuelven `null` si la tabla no existe (la UI muestra "corré 0017").
   Escrituras: lanzan, como el resto del archivo. Fechas sin hora ('YYYY-MM-DD'),
   hora opcional 'HH:MM' en hora Argentina. Los leads borrados (soft) se excluyen. */
export interface CrmActivity {
  id: string;
  lead_id: string;
  kind: CrmActivityKind;
  title: string;
  description: string | null;
  due_date: string;
  due_time: string | null;
  done_at: string | null;
  assignee_id: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface CrmActivityWithLead extends CrmActivity { lead_name: string | null; lead_company: string | null; }
export interface CrmActivityInput {
  lead_id: string;
  kind?: CrmActivityKind;
  title?: string;
  description?: string | null;
  due_date: string;
  due_time?: string | null;
  assignee_id?: string | null;
}
export type CrmActivityPatch = Partial<Omit<CrmActivityInput, 'lead_id'>>;

const ACT_COLS = 'id, lead_id, kind, title, description, due_date, due_time, done_at, assignee_id, author_id, created_at, updated_at';
const ACT_WITH_LEAD = `${ACT_COLS}, zo_crm_leads!inner(name, company, deleted_at)`;

const ActivityFields = z.object({
  kind: z.enum(CRM_ACTIVITY_KINDS),
  title: z.string().trim().max(200, 'El título es muy largo'),
  description: z.string().trim().max(2000, 'La descripción es muy larga').nullable(),
  due_date: z.string().refine(isDateOnly, 'Fecha inválida'),
  due_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inválida').or(z.literal('')).nullable(),
  assignee_id: z.string().uuid('Responsable inválido').or(z.literal('')).nullable(),
}).partial();

// Valida + normaliza: '' → null, hora a 'HH:MM', título vacío → nombre del tipo.
function cleanActivity(input: CrmActivityPatch): Record<string, unknown> {
  const p = ActivityFields.safeParse(input);
  if (!p.success) throw new Error(p.error.issues[0]?.message ?? 'Datos inválidos');
  const d = p.data;
  const out: Record<string, unknown> = {};
  if (d.kind !== undefined) out.kind = d.kind;
  if (d.title !== undefined) out.title = d.title;
  if (d.description !== undefined) out.description = d.description || null;
  if (d.due_date !== undefined) out.due_date = d.due_date;
  if (d.due_time !== undefined) out.due_time = d.due_time ? d.due_time.slice(0, 5) : null;
  if (d.assignee_id !== undefined) out.assignee_id = d.assignee_id || null;
  return out;
}

type ActivityRow = Omit<CrmActivity, 'kind'> & { kind: string; zo_crm_leads?: { name: string | null; company: string | null } | null };

function toActivity(r: ActivityRow): CrmActivity {
  const { zo_crm_leads: _lead, ...a } = r;
  void _lead;
  return { ...a, kind: (CRM_ACTIVITY_KINDS as readonly string[]).includes(a.kind) ? a.kind as CrmActivityKind : 'tarea', due_time: a.due_time ? a.due_time.slice(0, 5) : null };
}
function toActivityWithLead(r: ActivityRow): CrmActivityWithLead {
  return { ...toActivity(r), lead_name: r.zo_crm_leads?.name ?? null, lead_company: r.zo_crm_leads?.company ?? null };
}

export async function listLeadActivities(leadId: string): Promise<CrmActivity[] | null> {
  try {
    const { data, error } = await db().from('zo_crm_activities').select(ACT_COLS).eq('lead_id', leadId)
      .order('due_date', { ascending: true }).order('due_time', { ascending: true, nullsFirst: true });
    if (error) { console.warn('[crm] activities:', error.code, error.message); return null; }
    return (data as ActivityRow[]).map(toActivity);
  } catch { return null; }
}

export async function listActivitiesInRange(from: string, to: string): Promise<CrmActivityWithLead[] | null> {
  try {
    const { data, error } = await db().from('zo_crm_activities').select(ACT_WITH_LEAD)
      .is('zo_crm_leads.deleted_at', null)
      .gte('due_date', from).lte('due_date', to)
      .order('due_date', { ascending: true }).order('due_time', { ascending: true, nullsFirst: true })
      .limit(2000);
    if (error) { console.warn('[crm] activities range:', error.code, error.message); return null; }
    return (data as unknown as ActivityRow[]).map(toActivityWithLead);
  } catch { return null; }
}

/** Todas las pendientes (una sola query para badges, agenda, KPI y resumen diario). `until`: hasta esa fecha inclusive. */
export async function listPendingActivities(opts?: { until?: string }): Promise<CrmActivityWithLead[] | null> {
  try {
    let q = db().from('zo_crm_activities').select(ACT_WITH_LEAD)
      .is('zo_crm_leads.deleted_at', null)
      .is('done_at', null);
    if (opts?.until) q = q.lte('due_date', opts.until);
    const { data, error } = await q
      .order('due_date', { ascending: true }).order('due_time', { ascending: true, nullsFirst: true })
      .limit(1000);
    if (error) { console.warn('[crm] activities pending:', error.code, error.message); return null; }
    return (data as unknown as ActivityRow[]).map(toActivityWithLead);
  } catch { return null; }
}

export async function getActivity(id: string): Promise<CrmActivity | null> {
  const { data } = await db().from('zo_crm_activities').select(ACT_COLS).eq('id', id).maybeSingle();
  return data ? toActivity(data as ActivityRow) : null;
}

export async function createActivity(input: CrmActivityInput, authorId: string | null): Promise<CrmActivity> {
  if (!input.lead_id) throw new Error('Falta el lead');
  const row = cleanActivity({ kind: 'llamar', ...input });
  if (!row.due_date) throw new Error('Falta la fecha');
  if (!row.title) row.title = CRM_ACTIVITY_LABEL[row.kind as CrmActivityKind];
  const { data, error } = await db().from('zo_crm_activities')
    .insert({ ...row, lead_id: input.lead_id, author_id: authorId })
    .select(ACT_COLS).single();
  if (error) throw new Error(error.message);
  return toActivity(data as ActivityRow);
}

export async function updateActivity(id: string, patch: CrmActivityPatch): Promise<CrmActivity> {
  const row = cleanActivity(patch);
  if ('title' in row && !row.title) {
    const kind = (row.kind as CrmActivityKind | undefined) ?? (await getActivity(id))?.kind ?? 'tarea';
    row.title = CRM_ACTIVITY_LABEL[kind];
  }
  const { data, error } = await db().from('zo_crm_activities')
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq('id', id).select(ACT_COLS).single();
  if (error) throw new Error(error.message);
  return toActivity(data as ActivityRow);
}

/** Marca hecha / reabre. Condicional: si ya estaba en ese estado, `changed:false` (no duplica el log). */
export async function setActivityDone(id: string, done: boolean): Promise<{ row: CrmActivity; changed: boolean }> {
  const now = new Date().toISOString();
  const base = db().from('zo_crm_activities').update({ done_at: done ? now : null, updated_at: now }).eq('id', id);
  const { data, error } = await (done ? base.is('done_at', null) : base.not('done_at', 'is', null)).select(ACT_COLS).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return { row: toActivity(data as ActivityRow), changed: true };
  const row = await getActivity(id);
  if (!row) throw new Error('Actividad no encontrada');
  return { row, changed: false };
}

/** Borra y devuelve la fila borrada (para el log). */
export async function deleteActivity(id: string): Promise<CrmActivity | null> {
  const { data, error } = await db().from('zo_crm_activities').delete().eq('id', id).select(ACT_COLS).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toActivity(data as ActivityRow) : null;
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
