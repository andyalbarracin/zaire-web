'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';

export interface UpdatePwState { error?: string }

export async function updatePassword(_prev: UpdatePwState, fd: FormData): Promise<UpdatePwState> {
  const password = String(fd.get('password') || '');
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'El link expiró o no es válido. Pedí uno nuevo desde "Recuperar contraseña".' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect('/dashboard');
}
