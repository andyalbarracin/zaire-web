'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/zaire-ops/auth';
import { updateProfile, uploadAvatar } from '@/lib/zaire-ops/profiles';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';

export async function updateAccountAction(fd: FormData) {
  const user = await requireUser();
  const full_name = String(fd.get('full_name') || '').trim();
  const file = fd.get('avatar') as File | null;

  let avatar_url: string | undefined;
  if (file && typeof file === 'object' && file.size > 0) {
    const url = await uploadAvatar(user.id, file);
    if (url) avatar_url = url;
  }
  await updateProfile(user.id, { full_name, ...(avatar_url ? { avatar_url } : {}) });
  redirect('/dashboard/cuenta?ok=1');
}

export async function changePasswordAction(fd: FormData) {
  await requireUser();
  const password = String(fd.get('password') || '');
  if (password.length < 8) {
    redirect('/dashboard/cuenta?error=' + encodeURIComponent('La contraseña debe tener al menos 8 caracteres.'));
  }
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect('/dashboard/cuenta?error=' + encodeURIComponent(error.message));
  redirect('/dashboard/cuenta?pw=1');
}
