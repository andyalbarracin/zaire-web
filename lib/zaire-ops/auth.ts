// File: auth.ts
// Path: zaire-web/lib/zaire-ops/auth.ts
// Description: Helpers de sesión para Zaire Ops. requireUser() exige un usuario del EQUIPO
//              (no alcanza con tener sesión: los clientes del portal también la tienen) y
//              redirige al login si no (defensa en profundidad, además del middleware).

import { redirect } from 'next/navigation';
import { createSupabaseServer } from './supabase-server';
import { isStaff } from './staff';

export async function getUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/dashboard/login');
  if (!isStaff(user)) redirect('/dashboard/login?e=sin-acceso');
  return user;
}
