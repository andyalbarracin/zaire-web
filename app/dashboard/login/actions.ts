// File: actions.ts
// Path: zaire-web/app/dashboard/login/actions.ts
// Description: Server action de login (Supabase Auth, email+password).

'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';
import { rateLimit } from '@/lib/zaire-ops/rate-limit';

export interface LoginState { error?: string }

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) return { error: 'Completá email y contraseña.' };

  // Anti-fuerza bruta: máx 10 intentos por email cada 15 minutos.
  const allowed = await rateLimit(`login:${email.toLowerCase()}`, 10, 900);
  if (!allowed) return { error: 'Demasiados intentos. Esperá unos minutos y volvé a probar.' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: 'Credenciales inválidas. Revisá email y contraseña.' };

  redirect('/dashboard');
}
