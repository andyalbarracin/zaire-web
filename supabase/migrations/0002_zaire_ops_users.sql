-- ============================================================================
-- Zaire Ops — Migración 0002: usuarios, perfiles, roles y asignación.
-- Idempotente. Correr en Supabase → SQL Editor (después de 0001).
-- ============================================================================

create extension if not exists pgcrypto;

-- ── PERFILES (1:1 con auth.users) ───────────────────────────────────────────
create table if not exists zo_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'member'
                check (role in ('owner', 'admin', 'member')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_zo_profiles_updated on zo_profiles;
create trigger trg_zo_profiles_updated before update on zo_profiles
  for each row execute function zo_set_updated_at();

-- ── Auto-crear perfil cuando se crea un usuario en auth.users ────────────────
create or replace function zo_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.zo_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_zo_on_auth_user_created on auth.users;
create trigger trg_zo_on_auth_user_created
  after insert on auth.users
  for each row execute function zo_handle_new_user();

-- Backfill: perfiles para usuarios ya existentes (si los hubiera).
insert into public.zo_profiles (id, full_name, role)
select u.id,
       coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
       coalesce(u.raw_user_meta_data->>'role', 'member')
from auth.users u
on conflict (id) do nothing;

-- ── RLS perfiles ─────────────────────────────────────────────────────────────
-- authenticated lee todos (para equipo / asignaciones); cada uno edita el suyo.
-- El admin server-side usa service role (bypassa RLS).
alter table zo_profiles enable row level security;

drop policy if exists zo_profiles_select on zo_profiles;
create policy zo_profiles_select on zo_profiles
  for select to authenticated using (true);

drop policy if exists zo_profiles_update_own on zo_profiles;
create policy zo_profiles_update_own on zo_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ── Asignación de incidencias (estructura para "mis tickets" / colaboradores) ─
-- Referencia a zo_profiles (= auth.users 1:1) para poder embeber el asignado.
alter table zo_tickets add column if not exists assigned_to uuid references zo_profiles(id) on delete set null;
create index if not exists idx_zo_tickets_assigned on zo_tickets(assigned_to);

-- ── Bucket público para avatares de perfil ───────────────────────────────────
insert into storage.buckets (id, name, public)
values ('zo-avatars', 'zo-avatars', true)
on conflict (id) do nothing;
