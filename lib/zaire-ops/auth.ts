// File: auth.ts
// Path: zaire-web/lib/zaire-ops/auth.ts
// Description: Helpers de sesión para Zaire Ops. requireUser() redirige al login
//              si no hay sesión (defensa en profundidad, además del middleware).

import { redirect } from 'next/navigation';
import { createSupabaseServer } from './supabase-server';

export async function getUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/dashboard/login');
  return user;
}
