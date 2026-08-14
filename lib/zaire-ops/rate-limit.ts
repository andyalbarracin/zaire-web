// File: rate-limit.ts
// Rate-limit DB-backed (ventana fija). Server-only. Protege sobre todo las acciones de IA
// para que un loop o un uso descontrolado no vacíe la key personal de OpenAI.
// Fail-open: si el limiter falla (DB caída / tabla ausente), NO bloquea — es una guarda,
// no una frontera de seguridad (el acceso al dashboard ya está autenticado).

import { createSupabaseAdmin } from './supabase-admin';

/** Devuelve true si la llamada está permitida; false si superó el límite en la ventana. */
export async function rateLimit(bucket: string, limit: number, windowSec: number): Promise<boolean> {
  try {
    const ws = new Date(Math.floor(Date.now() / (windowSec * 1000)) * windowSec * 1000).toISOString();
    const { data, error } = await createSupabaseAdmin().rpc('zo_rate_hit', {
      p_bucket: bucket, p_window_start: ws, p_limit: limit,
    });
    if (error) return true; // fail-open
    return data === true;
  } catch {
    return true; // fail-open
  }
}

/** Tope de acciones de IA por usuario y por hora (configurable por env). */
export function aiHourlyLimit(): number {
  return Math.max(1, Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 60);
}

/** Chequea el cap de IA para un usuario. */
export async function checkAiRateLimit(userId: string): Promise<boolean> {
  return rateLimit(`ai:${userId}`, aiHourlyLimit(), 3600);
}
