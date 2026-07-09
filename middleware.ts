// File: middleware.ts
// Path: zaire-web/middleware.ts
// Description: Protege Zaire Ops (/dashboard/*) y el Portal de Clientes (/portal/*).
//              Refresca la sesión de Supabase y redirige al login correspondiente
//              si no hay usuario. El sitio público no se ve afectado (ver matcher).

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // ── Portal de Clientes ─────────────────────────────────────────────────────
  // Gate grueso: sin sesión → login del portal. El gate fino por cliente lo hace
  // requirePortalClient() en el layout autenticado.
  if (path.startsWith('/portal')) {
    const PORTAL_PUBLIC = ['/portal/login', '/portal/auth'];
    const isPortalPublic = PORTAL_PUBLIC.some(p => path.startsWith(p));
    if (!user && !isPortalPublic) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
    return response;
  }

  // ── Zaire Ops (dashboard) ──────────────────────────────────────────────────
  const PUBLIC = ['/dashboard/login', '/dashboard/setup', '/dashboard/recuperar', '/dashboard/auth'];
  const isPublic = PUBLIC.some(p => path.startsWith(p));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/dashboard/login', request.url));
  }
  if (user && path.startsWith('/dashboard/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*'],
};
