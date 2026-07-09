// File: portal.ts — Sesión, autorización y auditoría del Portal de Clientes.
// Server-only. El admin (service role) gestiona zo_client_users; el portal
// resuelve la sesión del cliente y filtra TODO por client_id.

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServer } from './supabase-server';
import { createSupabaseAdmin } from './supabase-admin';

const admin = () => createSupabaseAdmin();

export interface PortalSession { clientId: string; email: string; }

export interface ZoClientUser {
  id: string; client_id: string; email: string; auth_user_id: string | null; created_at: string;
}

// Resuelve el email autenticado → client_id vía zo_client_users (case-insensitive).
export async function resolveClientByEmail(email: string): Promise<string | null> {
  const { data } = await admin()
    .from('zo_client_users').select('client_id, id, auth_user_id')
    .ilike('email', email).limit(1).maybeSingle();
  return (data as { client_id: string } | null)?.client_id ?? null;
}

// Gate del layout autenticado del portal. Redirige a /portal/login si no hay
// sesión; muestra "no habilitado" si el email no está mapeado.
export async function requirePortalClient(): Promise<PortalSession> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/portal/login');

  const clientId = await resolveClientByEmail(user.email);
  if (!clientId) redirect('/portal/login?error=unauthorized');

  // Guarda auth_user_id en el primer login (best-effort, no bloqueante).
  await admin().from('zo_client_users').update({ auth_user_id: user.id })
    .ilike('email', user.email).is('auth_user_id', null);

  return { clientId, email: user.email };
}

// ── Auditoría ────────────────────────────────────────────────────────────────
export async function logPortalEvent(input: {
  clientId: string; email: string; event: string;
  entityType?: string; entityId?: string; metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const h = await headers();
    const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim() || null;
    const ua = h.get('user-agent') ?? null;
    await admin().from('zo_portal_events').insert({
      client_id: input.clientId, actor_email: input.email, event: input.event,
      entity_type: input.entityType ?? null, entity_id: input.entityId ?? null,
      metadata: input.metadata ?? null, ip, user_agent: ua,
    });
  } catch { /* auditoría no bloquea la UX */ }
}

// ── Admin: gestión de emails autorizados ──────────────────────────────────────
export async function listClientUsers(clientId: string): Promise<ZoClientUser[]> {
  const { data } = await admin().from('zo_client_users')
    .select('*').eq('client_id', clientId).order('created_at');
  return (data ?? []) as ZoClientUser[];
}

export async function addClientUser(clientId: string, email: string): Promise<void> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error('Email inválido.');
  const { error } = await admin().from('zo_client_users').insert({ client_id: clientId, email: clean });
  if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
}

export async function removeClientUser(id: string): Promise<void> {
  const { error } = await admin().from('zo_client_users').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Cuenta de accesos (para reportes futuros).
export async function countLogins(clientId: string): Promise<number> {
  const { count } = await admin().from('zo_portal_events')
    .select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('event', 'login');
  return count ?? 0;
}
