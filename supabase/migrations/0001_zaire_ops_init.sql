-- ============================================================================
-- Zaire Ops — Migración inicial (v0.1)
-- Crea las tablas zo_* (clientes, proyectos, incidencias, horas, adjuntos).
-- Idempotente. NO toca tablas existentes (blog_posts, leads, etc.).
-- Correr en: Supabase → SQL Editor.
-- ============================================================================

-- Extensión para gen_random_uuid() (suele venir habilitada en Supabase)
create extension if not exists pgcrypto;

-- ── Trigger genérico: mantener updated_at ──────────────────────────────────
create or replace function zo_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── CLIENTES ────────────────────────────────────────────────────────────────
create table if not exists zo_clients (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  contact_name          text,
  email                 text,
  whatsapp              text,
  plan                  text,
  monthly_support_hours numeric not null default 0,
  monthly_fee           numeric,
  currency              text not null default 'USD',
  status                text not null default 'activo'
                          check (status in ('activo','pausado','cerrado')),
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_zo_clients_updated on zo_clients;
create trigger trg_zo_clients_updated before update on zo_clients
  for each row execute function zo_set_updated_at();

-- ── PROYECTOS ────────────────────────────────────────────────────────────────
create table if not exists zo_projects (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references zo_clients(id) on delete cascade,
  name            text not null,
  type            text not null default 'Custom App',
  status          text not null default 'activo'
                    check (status in ('activo','pausado','cerrado','archivado')),
  phase           text,
  production_url  text,
  staging_url     text,
  repository_url  text,
  stack           text,
  start_date      date,
  next_milestone  text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_zo_projects_updated on zo_projects;
create trigger trg_zo_projects_updated before update on zo_projects
  for each row execute function zo_set_updated_at();

create index if not exists idx_zo_projects_client on zo_projects(client_id);

-- ── INCIDENCIAS / TICKETS (el corazón) ──────────────────────────────────────
create table if not exists zo_tickets (
  id                  uuid primary key default gen_random_uuid(),
  ticket_number       text unique,
  client_id           uuid not null references zo_clients(id) on delete cascade,
  project_id          uuid references zo_projects(id) on delete set null,
  title               text not null,
  description         text,
  type                text not null default 'soporte',
  priority            text not null default 'media'
                        check (priority in ('baja','media','alta','critica')),
  status              text not null default 'nueva'
                        check (status in ('nueva','en_analisis','en_progreso',
                          'esperando_cliente','resuelta','cerrada','fuera_de_alcance')),
  source              text not null default 'manual',
  reported_by         text,
  estimated_minutes   integer,
  actual_minutes      integer,
  included_in_support boolean not null default true,
  billable_extra      boolean not null default false,
  resolution          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  closed_at           timestamptz
);

drop trigger if exists trg_zo_tickets_updated on zo_tickets;
create trigger trg_zo_tickets_updated before update on zo_tickets
  for each row execute function zo_set_updated_at();

create index if not exists idx_zo_tickets_client  on zo_tickets(client_id);
create index if not exists idx_zo_tickets_project on zo_tickets(project_id);
create index if not exists idx_zo_tickets_status  on zo_tickets(status);
create index if not exists idx_zo_tickets_created on zo_tickets(created_at);

-- ── REGISTRO DE HORAS ────────────────────────────────────────────────────────
create table if not exists zo_time_entries (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references zo_clients(id) on delete cascade,
  project_id       uuid references zo_projects(id) on delete set null,
  ticket_id        uuid references zo_tickets(id) on delete set null,
  entry_date       date not null default current_date,
  minutes          integer not null default 0,
  work_type        text not null default 'desarrollo',
  description      text,
  billable         boolean not null default false,
  included_in_plan boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_zo_time_client on zo_time_entries(client_id);
create index if not exists idx_zo_time_ticket on zo_time_entries(ticket_id);
create index if not exists idx_zo_time_date   on zo_time_entries(entry_date);

-- ── ADJUNTOS (estructura lista; storage se conecta luego) ────────────────────
create table if not exists zo_attachments (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid references zo_tickets(id) on delete cascade,
  file_url    text not null,
  file_name   text,
  file_type   text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_zo_attachments_ticket on zo_attachments(ticket_id);

-- ── RLS: anon bloqueado; authenticated full (listo para portal). ─────────────
-- El admin server-side usa service role (bypassa RLS). Anon (clave pública)
-- no puede leer/escribir estas tablas directamente.
do $$
declare t text;
begin
  foreach t in array array['zo_clients','zo_projects','zo_tickets','zo_time_entries','zo_attachments']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %I on %I;', t || '_authenticated_all', t);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true);',
      t || '_authenticated_all', t);
  end loop;
end $$;
