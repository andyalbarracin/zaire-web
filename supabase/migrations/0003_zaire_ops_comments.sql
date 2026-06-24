-- ============================================================================
-- Zaire Ops — Migración 0003: comentarios/actividad y archivos en incidencias.
-- Idempotente. Correr en Supabase → SQL Editor (después de 0001 y 0002).
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Comentarios / actividad de incidencias ──────────────────────────────────
-- is_system: evento generado automáticamente (cambio de estado/asignación).
-- is_internal: nota interna (no visible para el cliente en el futuro portal).
create table if not exists zo_ticket_comments (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references zo_tickets(id) on delete cascade,
  author_id   uuid references zo_profiles(id) on delete set null,
  body        text not null,
  is_system   boolean not null default false,
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_zo_comments_ticket on zo_ticket_comments(ticket_id);

alter table zo_ticket_comments enable row level security;
drop policy if exists zo_comments_authenticated on zo_ticket_comments;
create policy zo_comments_authenticated on zo_ticket_comments
  for all to authenticated using (true) with check (true);

-- ── Bucket de archivos de incidencias (adjuntos) ────────────────────────────
insert into storage.buckets (id, name, public)
values ('zo-files', 'zo-files', true)
on conflict (id) do nothing;
