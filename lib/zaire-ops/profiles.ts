// File: profiles.ts
// Path: zaire-web/lib/zaire-ops/profiles.ts
// Description: Usuarios, perfiles y roles de Zaire Ops. Server-only (service role).
//              Crea usuarios sin confirmación por email (instantáneos).

import { redirect } from 'next/navigation';
import { createSupabaseAdmin } from './supabase-admin';
import { createSupabaseServer } from './supabase-server';

export type Role = 'owner' | 'admin' | 'member';

export interface ZoProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner', admin: 'Admin', member: 'Miembro',
};
export const ROLES: Role[] = ['owner', 'admin', 'member'];

// ── Perfil del usuario logueado ──────────────────────────────────────────────
export async function getMyProfile(): Promise<ZoProfile | null> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdmin();
  const { data } = await admin.from('zo_profiles').select('*').eq('id', user.id).single();
  if (!data) {
    return { id: user.id, full_name: user.email?.split('@')[0] ?? null, avatar_url: null, role: 'member', email: user.email };
  }
  return { ...(data as ZoProfile), email: user.email };
}

// requireRole: usar en páginas server. Redirige si no tiene permiso.
export async function requireRole(roles: Role[]): Promise<ZoProfile> {
  const profile = await getMyProfile();
  if (!profile) redirect('/dashboard/login');
  if (!roles.includes(profile.role)) redirect('/dashboard');
  return profile;
}

// ── Equipo ───────────────────────────────────────────────────────────────────
export async function listProfiles(): Promise<ZoProfile[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from('zo_profiles').select('*').order('created_at');
  const profiles = (data ?? []) as ZoProfile[];

  const { data: list } = await admin.auth.admin.listUsers();
  const emailById = new Map((list?.users ?? []).map(u => [u.id, u.email]));
  return profiles.map(p => ({ ...p, email: emailById.get(p.id) }));
}

export async function countUsers(): Promise<number> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.auth.admin.listUsers();
  return data?.users?.length ?? 0;
}

export async function createTeamUser(input: { email: string; password: string; full_name: string; role: Role }) {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true, // instantáneo, sin confirmación por email
    user_metadata: { full_name: input.full_name, role: input.role },
  });
  if (error) throw new Error(error.message);
  // El trigger crea el perfil; reforzamos nombre y rol.
  await admin.from('zo_profiles').upsert({ id: data.user.id, full_name: input.full_name, role: input.role });
  return data.user;
}

export async function setRole(userId: string, role: Role) {
  const admin = createSupabaseAdmin();
  await admin.from('zo_profiles').update({ role }).eq('id', userId);
  await admin.auth.admin.updateUserById(userId, { user_metadata: { role } });
}

export async function deleteUser(userId: string) {
  const admin = createSupabaseAdmin();
  await admin.auth.admin.deleteUser(userId);
}

export async function updateProfile(userId: string, input: { full_name?: string; avatar_url?: string }) {
  const admin = createSupabaseAdmin();
  await admin.from('zo_profiles').update(input).eq('id', userId);
}

// Sube avatar a Storage (bucket público) y devuelve la URL pública.
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  if (!file || file.size === 0 || file.size > 50 * 1024 * 1024) return null;
  const admin = createSupabaseAdmin();
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from('zo-avatars').upload(path, buffer, {
    contentType: file.type || 'image/png',
    upsert: true,
  });
  if (error) return null;
  const { data } = admin.storage.from('zo-avatars').getPublicUrl(path);
  return data.publicUrl;
}

export const initials = (name?: string | null, email?: string | null) => {
  const base = (name || email || '?').trim();
  const parts = base.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || base[0]?.toUpperCase() || '?';
};
