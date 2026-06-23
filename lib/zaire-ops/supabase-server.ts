// File: supabase-server.ts
// Path: zaire-web/lib/zaire-ops/supabase-server.ts
// Description: Cliente Supabase ligado a cookies (sesión del usuario) para
//              Server Components / Server Actions de Zaire Ops. Usa @supabase/ssr.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll llamado desde un Server Component: ignorable, el
            // middleware refresca la sesión.
          }
        },
      },
    }
  );
}
