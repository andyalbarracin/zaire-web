// File: supabase-admin.ts
// Path: zaire-web/lib/zaire-ops/supabase-admin.ts
// Description: Cliente Supabase con SERVICE ROLE — solo server-side. Bypassa RLS
//              para operaciones de admin. NUNCA importar en código de cliente.

import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}
