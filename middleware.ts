// File: middleware.ts
// Path: zaire-web/middleware.ts
// Description: Protege Zaire Ops (/dashboard/*) y el Portal (/portal/*): refresca la
//   sesión de Supabase, redirige al login si no hay usuario, y aplica una CSP con
//   NONCE (script-src bloqueado salvo scripts firmados por Next) en las áreas privadas.
//   El sitio público no se ve afectado (ver matcher).

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function buildCsp(nonce: string): string {
  const dev = process.env.NODE_ENV !== 'production';
  return [
    `default-src 'self'`,
    // 'strict-dynamic' + nonce: los scripts los firma Next; en dev se permite eval (HMR/React refresh).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,           // el dashboard usa muchos estilos inline (atributos style)
    `img-src 'self' data: blob: https:`,          // avatares / media de Supabase (buckets públicos)
    `font-src 'self' data:`,
    `connect-src 'self' https: wss:`,             // Supabase (REST + realtime)
    `frame-ancestors 'none'`,                     // anti-clickjacking
    `base-uri 'self'`,
    `object-src 'none'`,
    `form-action 'self'`,
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPrivate = path.startsWith('/dashboard') || path.startsWith('/portal');

  // Nonce + CSP solo para áreas privadas. Se setea en los headers del request para que
  // Next firme sus <script> con el nonce, y en la respuesta para que el browser la aplique.
  const requestHeaders = new Headers(request.headers);
  let csp = '';
  if (isPrivate) {
    const nonce = crypto.randomUUID().replace(/-/g, '');
    csp = buildCsp(nonce);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('content-security-policy', csp);
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

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
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ── Portal de Clientes ─────────────────────────────────────────────────────
  if (path.startsWith('/portal')) {
    const PORTAL_PUBLIC = ['/portal/login', '/portal/auth'];
    const isPortalPublic = PORTAL_PUBLIC.some(p => path.startsWith(p));
    if (!user && !isPortalPublic) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
    if (csp) response.headers.set('Content-Security-Policy', csp);
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

  if (csp) response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*'],
};
