// File: ai-cache.ts
// Caché de respuestas de IA (tabla zo_ai_cache). Server-only. Resiliente: si la tabla no
// existe o falla, se comporta como "sin caché" (miss) y no rompe el flujo.

import { createHash } from 'crypto';
import { createSupabaseAdmin } from './supabase-admin';

/** Hash estable del input (para usar como clave de caché). */
export function hashInput(kind: string, payload: unknown): string {
  return createHash('sha256').update(`${kind}:${JSON.stringify(payload)}`).digest('hex');
}

export async function getCached<T>(hash: string): Promise<T | null> {
  try {
    const { data } = await createSupabaseAdmin().from('zo_ai_cache').select('result').eq('hash', hash).maybeSingle();
    return (data?.result as T) ?? null;
  } catch {
    return null;
  }
}

export async function setCached(hash: string, kind: string, result: unknown): Promise<void> {
  try {
    await createSupabaseAdmin().from('zo_ai_cache').upsert({ hash, kind, result });
  } catch {
    /* sin caché: no rompe */
  }
}
