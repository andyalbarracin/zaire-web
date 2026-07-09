'use server';

import { headers } from 'next/headers';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';
import { rateLimit, RL_LEAD } from '@/lib/rate-limit';

export async function requestMagicLinkAction(
  _prev: { error?: string; sent?: boolean },
  fd: FormData
): Promise<{ error?: string; sent?: boolean }> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Ingresá un email válido.' };

  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim();
  if (!(await rateLimit(RL_LEAD, `portal-login:${ip}`))) return { error: 'Demasiados intentos. Probá en un rato.' };

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com';
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${site}/portal/auth/callback`, shouldCreateUser: true },
  });
  if (error) return { error: 'No pudimos enviar el link. Intentá de nuevo.' };
  return { sent: true };
}
