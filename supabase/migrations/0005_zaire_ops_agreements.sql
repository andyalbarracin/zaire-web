-- ============================================================================
-- Zaire Ops — Migración 0005: acuerdos / contratos con aceptación electrónica.
-- Idempotente. Correr en Supabase → SQL Editor (después de 0001–0004).
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists zo_agreements (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references zo_clients(id) on delete cascade,
  project_name    text not null,
  plan            text,
  setup_fee       numeric,
  monthly_fee     numeric,
  currency        text not null default 'USD',
  terms           text not null,
  signer_name     text,
  signer_email    text,
  token           text not null unique,
  status          text not null default 'borrador'
                    check (status in ('borrador', 'enviado', 'firmado', 'anulado')),
  sent_at         timestamptz,
  signed_at       timestamptz,
  signed_name     text,
  accepted        boolean not null default false,
  signature_url   text,            -- dataURL PNG de la firma manuscrita
  sign_ip         text,            -- audit trail
  sign_user_agent text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_zo_agreements_client on zo_agreements(client_id);
create index if not exists idx_zo_agreements_token  on zo_agreements(token);

drop trigger if exists trg_zo_agreements_updated on zo_agreements;
create trigger trg_zo_agreements_updated before update on zo_agreements
  for each row execute function zo_set_updated_at();

-- RLS habilitado sin políticas: acceso solo vía service role (server-side).
-- La firma pública pasa por una server action que valida el token.
alter table zo_agreements enable row level security;
