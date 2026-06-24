'use server';

import { headers } from 'next/headers';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';

export interface RecoverState { error?: string; ok?: boolean }

export async function requestReset(_prev: RecoverState, fd: FormData): Promise<RecoverState> {
  const email = String(fd.get('email') || '').trim();
  if (!email) return { error: 'Ingresá tu email.' };

  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
  const origin = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || '');
  const redirectTo = `${origin}/dashboard/auth/callback?next=/dashboard/actualizar-password`;

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: 'No se pudo enviar el email. Probá de nuevo en un momento.' };
  return { ok: true };
}
