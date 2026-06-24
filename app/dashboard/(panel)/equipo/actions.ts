'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole, createTeamUser, setRole, deleteUser, type Role } from '@/lib/zaire-ops/profiles';

export async function createUserAction(fd: FormData) {
  await requireRole(['owner', 'admin']);
  const email = String(fd.get('email') || '').trim();
  const full_name = String(fd.get('full_name') || '').trim();
  const password = String(fd.get('password') || '');
  const role = (String(fd.get('role') || 'member')) as Role;

  if (!email || password.length < 8) {
    redirect('/dashboard/equipo?error=' + encodeURIComponent('Email y contraseña (mín. 8) requeridos.'));
  }
  try {
    await createTeamUser({ email, password, full_name: full_name || email.split('@')[0], role });
  } catch (e) {
    redirect('/dashboard/equipo?error=' + encodeURIComponent(e instanceof Error ? e.message : 'Error al crear usuario.'));
  }
  redirect('/dashboard/equipo?ok=1');
}

export async function setRoleAction(userId: string, fd: FormData) {
  await requireRole(['owner', 'admin']);
  await setRole(userId, (String(fd.get('role') || 'member')) as Role);
  revalidatePath('/dashboard/equipo');
}

export async function deleteUserAction(userId: string) {
  const me = await requireRole(['owner']);
  if (me.id === userId) {
    redirect('/dashboard/equipo?error=' + encodeURIComponent('No podés borrarte a vos mismo.'));
  }
  await deleteUser(userId);
  revalidatePath('/dashboard/equipo');
}
