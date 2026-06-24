// File: route.ts
// Path: zaire-web/app/dashboard/auth/callback/route.ts
// Description: Callback de auth de Zaire Ops. Intercambia el código del email
//              (recuperación de contraseña / magic link) por una sesión y redirige.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';
  const response = NextResponse.redirect(new URL(next, origin));

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll(toSet) { toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
