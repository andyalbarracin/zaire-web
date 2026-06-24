// File: middleware.ts
// Path: zaire-web/middleware.ts
// Description: Protege Zaire Ops. SOLO corre en /dashboard/* (ver matcher) — el
//              sitio público no se ve afectado. Refresca la sesión de Supabase y
//              redirige al login si no hay usuario.

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

  // Rutas del panel accesibles sin sesión (setup inicial, recuperación, callback).
  const PUBLIC = ['/dashboard/login', '/dashboard/setup', '/dashboard/recuperar', '/dashboard/auth'];
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some(p => path.startsWith(p));

  // Sin sesión y ruta protegida → al login.
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/dashboard/login', request.url));
  }
  // Con sesión y entra al login → al inicio del panel.
  if (user && path.startsWith('/dashboard/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
