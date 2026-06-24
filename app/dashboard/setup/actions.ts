'use server';

import { redirect } from 'next/navigation';
import { countUsers, createTeamUser } from '@/lib/zaire-ops/profiles';

export interface SetupState { error?: string }

export async function createFirstOwner(_prev: SetupState, fd: FormData): Promise<SetupState> {
  if ((await countUsers()) > 0) {
    return { error: 'Ya existe un usuario. Ingresá o usá "Recuperar contraseña".' };
  }
  const full_name = String(fd.get('full_name') || '').trim();
  const email = String(fd.get('email') || '').trim();
  const password = String(fd.get('password') || '');

  if (!email || !password) return { error: 'Completá email y contraseña.' };
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };

  try {
    await createTeamUser({ email, password, full_name: full_name || email.split('@')[0], role: 'owner' });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo crear el usuario.' };
  }
  redirect('/dashboard/login?welcome=1');
}
