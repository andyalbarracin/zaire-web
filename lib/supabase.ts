// File: supabase.ts
// Path: zaire-web/lib/supabase.ts
// Last modified: 2026-04-27
// Description: Cliente de Supabase. persistSession:false evita que intente
//              acceder a localStorage durante el server-side rendering de Next.js.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,      // no usar localStorage en SSR
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
