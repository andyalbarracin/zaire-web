// File: queries.ts
// Path: zaire-web/lib/zaire-ops/queries.ts
// Description: Capa de datos de Zaire Ops. Funciones puras reutilizables por
//              Server Components, Server Actions y futuras rutas API / MCP.
//              Usa el cliente admin (service role), gateado por auth en las rutas.

import { createSupabaseAdmin } from './supabase-admin';
import type { ZoClient, ZoProject, ZoTicket, ZoTimeEntry, ZoComment, ZoAttachment } from './types';
import { OPEN_STATUSES } from './types';

const db = () => createSupabaseAdmin();

// ── CLIENTES ─────────────────────────────────────────────────────────────────
export async function listClients(): Promise<ZoClient[]> {
  const { data } = await db().from('zo_clients').select('*').order('name');
  return (data ?? []) as ZoClient[];
}

export async function getClient(id: string): Promise<ZoClient | null> {
  const { data } = await db().from('zo_clients').select('*').eq('id', id).single();
  return (data as ZoClient) ?? null;
}

export async function createClient(input: Partial<ZoClient>): Promise<ZoClient> {
  const { data, error } = await db().from('zo_clients').insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as ZoClient;
}

export async function updateClient(id: string, input: Partial<ZoClient>): Promise<void> {
  const { error } = await db().from('zo_clients').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

// ── PROYECTOS ────────────────────────────────────────────────────────────────
export async function listProjects(clientId?: string): Promise<ZoProject[]> {
  let q = db().from('zo_projects').select('*, client:zo_clients(name)').order('created_at', { ascending: false });
  if (clientId) q = q.eq('client_id', clientId);
  const { data } = await q;
  return (data ?? []) as ZoProject[];
}

export async function getProject(id: string): Promise<ZoProject | null> {
  const { data } = await db().from('zo_projects').select('*, client:zo_clients(name)').eq('id', id).single();
  return (data as ZoProject) ?? null;
}

export async function createProject(input: Partial<ZoProject>): Promise<ZoProject> {
  const { data, error } = await db().from('zo_projects').insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as ZoProject;
}

export async function updateProject(id: string, input: Partial<ZoProject>): Promise<void> {
  const { error } = await db().from('zo_projects').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

// ── INCIDENCIAS / TICKETS ────────────────────────────────────────────────────
interface TicketFilter { clientId?: string; status?: string; assignedTo?: string; }

const TICKET_SELECT = '*, client:zo_clients(name), project:zo_projects(name), assignee:zo_profiles(full_name,avatar_url)';

export async function listTickets(filter: TicketFilter = {}): Promise<ZoTicket[]> {
  let q = db()
    .from('zo_tickets')
    .select(TICKET_SELECT)
    .order('created_at', { ascending: false });
  if (filter.clientId) q = q.eq('client_id', filter.clientId);
  if (filter.status) q = q.eq('status', filter.status);
  if (filter.assignedTo) q = q.eq('assigned_to', filter.assignedTo);
  const { data } = await q;
  return (data ?? []) as ZoTicket[];
}

export async function getTicket(id: string): Promise<ZoTicket | null> {
  const { data } = await db().from('zo_tickets').select(TICKET_SELECT).eq('id', id).single();
  return (data as ZoTicket) ?? null;
}

// ── COMENTARIOS / ACTIVIDAD ──────────────────────────────────────────────────
export async function listComments(ticketId: string): Promise<ZoComment[]> {
  const { data } = await db()
    .from('zo_ticket_comments')
    .select('*, author:zo_profiles(full_name,avatar_url)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  return (data ?? []) as ZoComment[];
}

export async function addComment(input: {
  ticket_id: string; author_id?: string | null; body: string; is_internal?: boolean; is_system?: boolean;
}): Promise<void> {
  await db().from('zo_ticket_comments').insert(input);
}

// ── ADJUNTOS ─────────────────────────────────────────────────────────────────
export async function listAttachments(ticketId: string): Promise<ZoAttachment[]> {
  const { data } = await db()
    .from('zo_attachments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });
  return (data ?? []) as ZoAttachment[];
}

export async function addAttachment(input: {
  ticket_id: string; file_url: string; file_name?: string | null; file_type?: string | null;
}): Promise<void> {
  await db().from('zo_attachments').insert(input);
}

export async function deleteAttachment(id: string): Promise<void> {
  await db().from('zo_attachments').delete().eq('id', id);
}

// Sube un archivo de incidencia al bucket público zo-files.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

export async function uploadTicketFile(ticketId: string, file: File): Promise<{ url: string; name: string; type: string } | null> {
  if (!file || file.size === 0 || file.size > MAX_UPLOAD_BYTES) return null;
  const admin = db();
  const safe = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${ticketId}/${Date.now()}-${safe}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from('zo-files').upload(path, buffer, {
    contentType: file.type || 'application/octet-stream', upsert: false,
  });
  if (error) return null;
  const { data } = admin.storage.from('zo-files').getPublicUrl(path);
  return { url: data.publicUrl, name: file.name, type: file.type || '' };
}

// Nombre de perfil (para logs de actividad).
export async function profileName(id: string | null): Promise<string> {
  if (!id) return 'nadie';
  const { data } = await db().from('zo_profiles').select('full_name').eq('id', id).single();
  return (data?.full_name as string) ?? 'usuario';
}

async function nextTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const start = `${year}-01-01`;
  const { count } = await db()
    .from('zo_tickets')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start);
  const seq = (count ?? 0) + 1;
  return `INC-${year}-${String(seq).padStart(4, '0')}`;
}

export async function createTicket(input: Partial<ZoTicket>): Promise<ZoTicket> {
  const ticket_number = await nextTicketNumber();
  const { data, error } = await db()
    .from('zo_tickets')
    .insert({ ...input, ticket_number })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ZoTicket;
}

export async function updateTicket(id: string, input: Partial<ZoTicket>): Promise<void> {
  const patch: Partial<ZoTicket> = { ...input };
  // Setear closed_at automáticamente al cerrar/resolver.
  if (input.status === 'cerrada' || input.status === 'resuelta') {
    patch.closed_at = new Date().toISOString();
  }
  const { error } = await db().from('zo_tickets').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

// ── REGISTRO DE HORAS ────────────────────────────────────────────────────────
interface TimeFilter { clientId?: string; ticketId?: string; from?: string; to?: string; }

export async function listTimeEntries(filter: TimeFilter = {}): Promise<ZoTimeEntry[]> {
  let q = db()
    .from('zo_time_entries')
    .select('*, client:zo_clients(name), ticket:zo_tickets(ticket_number,title)')
    .order('entry_date', { ascending: false });
  if (filter.clientId) q = q.eq('client_id', filter.clientId);
  if (filter.ticketId) q = q.eq('ticket_id', filter.ticketId);
  if (filter.from) q = q.gte('entry_date', filter.from);
  if (filter.to) q = q.lte('entry_date', filter.to);
  const { data } = await q;
  return (data ?? []) as ZoTimeEntry[];
}

export async function createTimeEntry(input: Partial<ZoTimeEntry>): Promise<void> {
  const { error } = await db().from('zo_time_entries').insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await db().from('zo_time_entries').delete().eq('id', id);
}

// ── KPIs del dashboard ───────────────────────────────────────────────────────
function monthRange(d = new Date()) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export async function getDashboardStats() {
  const supabase = db();
  const { from, to } = monthRange();

  const [clients, projects, openTickets, monthEntries, recentTickets] = await Promise.all([
    supabase.from('zo_clients').select('id', { count: 'exact', head: true }).eq('status', 'activo'),
    supabase.from('zo_projects').select('id', { count: 'exact', head: true }).eq('status', 'activo'),
    supabase.from('zo_tickets').select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES),
    supabase.from('zo_time_entries').select('minutes').gte('entry_date', from).lte('entry_date', to),
    supabase
      .from('zo_tickets')
      .select('*, client:zo_clients(name)')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const minutesThisMonth = (monthEntries.data ?? []).reduce((s, e) => s + (e.minutes ?? 0), 0);

  return {
    activeClients: clients.count ?? 0,
    activeProjects: projects.count ?? 0,
    openTickets: openTickets.count ?? 0,
    minutesThisMonth,
    recentTickets: (recentTickets.data ?? []) as ZoTicket[],
  };
}

// ── REPORTE MENSUAL POR CLIENTE ──────────────────────────────────────────────
export async function getMonthlyReport(clientId: string, year: number, month: number) {
  const from = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const to = new Date(year, month, 0).toISOString().slice(0, 10);
  const supabase = db();

  const client = await getClient(clientId);
  const [tickets, entries] = await Promise.all([
    supabase
      .from('zo_tickets')
      .select('*')
      .eq('client_id', clientId)
      .gte('created_at', from)
      .lte('created_at', `${to}T23:59:59`),
    listTimeEntries({ clientId, from, to }),
  ]);

  const allTickets = (tickets.data ?? []) as ZoTicket[];
  const minutes = entries.reduce((s, e) => s + (e.minutes ?? 0), 0);

  return {
    client,
    from,
    to,
    received: allTickets.length,
    resolved: allTickets.filter(t => t.status === 'resuelta' || t.status === 'cerrada').length,
    inProgress: allTickets.filter(t => OPEN_STATUSES.includes(t.status)).length,
    tickets: allTickets,
    minutes,
    includedMinutes: (client?.monthly_support_hours ?? 0) * 60,
    entries,
  };
}
