// File: actions.ts
// Path: zaire-web/app/dashboard/login/actions.ts
// Description: Server action de login (Supabase Auth, email+password).

'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';
import { rateLimit } from '@/lib/zaire-ops/rate-limit';

export interface LoginState { error?: string }

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) return { error: 'Completá email y contraseña.' };

  // Anti-fuerza bruta: por email (una cuenta) y por IP (credential spraying entre cuentas).
  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim();
  const okEmail = await rateLimit(`login:${email.toLowerCase()}`, 10, 900); // 10 / 15min por email
  const okIp = await rateLimit(`login-ip:${ip}`, 30, 900);                   // 30 / 15min por IP
  if (!okEmail || !okIp) return { error: 'Demasiados intentos. Esperá unos minutos y volvé a probar.' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: 'Credenciales inválidas. Revisá email y contraseña.' };

  redirect('/dashboard');
}
