// File: leads.ts
// Path: zaire-web/lib/zaire-ops/leads.ts
// Description: Sistema de handoff — capa de datos de los leads del sitio (tabla
//   `leads`, poblada por el chat / formulario de contacto). Server-only, usa el
//   cliente admin (service role) gateado por el auth del panel. Independiente
//   del flujo público (que solo inserta en `leads`).

import { createSupabaseAdmin } from './supabase-admin';

const db = () => createSupabaseAdmin();

export type LeadStatus = 'nuevo' | 'contactado' | 'diagnostico' | 'propuesta' | 'ganado' | 'perdido';

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string | null;
  name: string | null;
  email: string;
  whatsapp: string | null;
  company: string | null;
  employees: string | null;
  challenge: string | null;
  message: string | null;
  conversation: string | null;
  need: string | null;
  source: string | null;
  ai_knowledge: string | null;
  status: LeadStatus;
  notes: string | null;
  converted_client_id: string | null;
}

export const LEAD_STATUSES: LeadStatus[] = ['nuevo', 'contactado', 'diagnostico', 'propuesta', 'ganado', 'perdido'];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', diagnostico: 'Diagnóstico',
  propuesta: 'Propuesta', ganado: 'Ganado', perdido: 'Perdido',
};

export const LEAD_STATUS_COLOR: Record<LeadStatus, string> = {
  nuevo: '#3b82f6', contactado: '#a855f7', diagnostico: '#FF6A00',
  propuesta: '#FFC107', ganado: '#22c55e', perdido: '#6b7280',
};

// Normaliza status por si algún registro viejo tiene un valor fuera de la lista.
export function leadStatus(s: string | null | undefined): LeadStatus {
  return LEAD_STATUSES.includes(s as LeadStatus) ? (s as LeadStatus) : 'nuevo';
}

export async function listLeads(): Promise<Lead[]> {
  const { data } = await db().from('leads').select('*').order('created_at', { ascending: false });
  return ((data ?? []) as Lead[]).map(l => ({ ...l, status: leadStatus(l.status) }));
}

export async function getLead(id: string): Promise<Lead | null> {
  const { data } = await db().from('leads').select('*').eq('id', id).single();
  if (!data) return null;
  return { ...(data as Lead), status: leadStatus((data as Lead).status) };
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<void> {
  const { error } = await db().from('leads').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await db().from('leads').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// KPI liviano para el inicio / badge: leads sin gestionar (nuevos).
export async function countNewLeads(): Promise<number> {
  const { count } = await db().from('leads').select('id', { count: 'exact', head: true }).eq('status', 'nuevo');
  return count ?? 0;
}
