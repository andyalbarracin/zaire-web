'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/zaire-ops/auth';
import { updateProfile, uploadAvatar, requireRole } from '@/lib/zaire-ops/profiles';
import { updateLlmConfig, resolveProviderSettings } from '@/lib/zaire-ops/llm-config';
import { providerByName, type ProviderName } from '@/lib/sales/providers';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';

const TESTABLE: ProviderName[] = ['groq', 'openai', 'gemini', 'openrouter'];

// Prueba real (llamada mínima) a un proveedor con el modelo configurado. Sirve para detectar
// modelo muerto / sin crédito, que el chequeo de "key presente" no ve.
export async function testProviderA(name: string): Promise<{ ok: true; ms: number; model: string } | { ok: false; error: string }> {
  await requireUser();
  if (!TESTABLE.includes(name as ProviderName)) return { ok: false, error: 'Proveedor inválido.' };
  const settings = await resolveProviderSettings();
  const model = settings.models?.[name as ProviderName];
  const p = providerByName(name as ProviderName, model);
  if (!p) return { ok: false, error: 'Falta la API key de ese proveedor.' };
  const t0 = Date.now();
  try {
    await p.complete({ system: 'Respondé una sola palabra.', user: 'Decí: ok', maxTokens: 5, temperature: 0 });
    return { ok: true, ms: Date.now() - t0, model: model || '(default)' };
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 200) };
  }
}

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

export async function updateLlmConfigAction(fd: FormData) {
  await requireRole(['owner', 'admin']); // config sensible (afecta gasto de tokens): solo owner/admin
  const str = (k: string) => { const v = String(fd.get(k) || '').trim(); return v || null; };
  const num = (k: string, d: number) => { const n = Number(fd.get(k)); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d; };
  await updateLlmConfig({
    primary_provider: String(fd.get('primary_provider') || 'groq'),
    secondary_provider: str('secondary_provider'),
    fallback_provider: String(fd.get('fallback_provider') || 'groq'),
    model_openai: str('model_openai'),
    model_gemini: str('model_gemini'),
    model_groq: str('model_groq'),
    model_openrouter: str('model_openrouter'),
    max_primary_calls: num('max_primary_calls', 3),
    max_secondary_calls: num('max_secondary_calls', 3),
  });
  redirect('/dashboard/cuenta?llm=1');
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
