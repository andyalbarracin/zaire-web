// File: actions.ts
// Path: zaire-web/app/dashboard/login/actions.ts
// Description: Server action de login (Supabase Auth, email+password).

'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';

export interface LoginState { error?: string }

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) return { error: 'Completá email y contraseña.' };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: 'Credenciales inválidas. Revisá email y contraseña.' };

  redirect('/dashboard');
}
