-- ============================================================================
-- Zaire Ops — Migración 0004: hardening de seguridad + límites de archivos.
-- Resuelve los warnings del linter de Supabase SIN afectar la app (el panel
-- accede con service role, que bypassa RLS). Idempotente.
-- ============================================================================

-- ── 1. Fijar search_path en zo_set_updated_at (warning: search_path mutable) ──
create or replace function zo_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 2. Quitar políticas RLS permisivas (USING true / WITH CHECK true) ────────
-- La app usa service role (server-side), que ignora RLS. Sin estas políticas,
-- anon/authenticated NO pueden tocar estas tablas directamente vía API → más
-- seguro. Cuando armemos el portal de clientes, agregamos políticas SCOPEADAS
-- (cada cliente solo ve sus filas). RLS permanece habilitado.
drop policy if exists zo_clients_authenticated_all      on zo_clients;
drop policy if exists zo_projects_authenticated_all     on zo_projects;
drop policy if exists zo_tickets_authenticated_all       on zo_tickets;
drop policy if exists zo_time_entries_authenticated_all  on zo_time_entries;
drop policy if exists zo_attachments_authenticated_all   on zo_attachments;
drop policy if exists zo_comments_authenticated          on zo_ticket_comments;

-- ── 3. Revocar EXECUTE del trigger function (no debe ser llamable vía API) ───
revoke execute on function zo_handle_new_user() from anon, authenticated, public;

-- ── 4. Límite de 50MB por archivo en los buckets de Zaire Ops ────────────────
update storage.buckets set file_size_limit = 52428800 where id in ('zo-avatars', 'zo-files');

-- Nota: el warning "Leaked Password Protection Disabled" se resuelve en el
-- Dashboard → Authentication → Sign In/Up → Password → activar "Leaked password
-- protection" (no es SQL).
