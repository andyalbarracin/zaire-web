// File: rate-limit.ts
// Path: zaire-web/lib/rate-limit.ts
// Description: Rate limiting persistente con Upstash Redis (sliding window),
//   compartido entre instancias serverless de Vercel. Si NO hay credenciales
//   de Upstash, cae automáticamente a un límite in-memory por instancia
//   (mismo comportamiento que antes) — así nunca rompe en local ni sin config.

import { Ratelimit, type Duration } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateConfig {
  name: string;      // namespace del límite (ej: 'chat', 'lead')
  tokens: number;    // cantidad de requests permitidos
  ms: number;        // ventana en ms (para el fallback in-memory)
  window: Duration;  // ventana para Upstash (ej: '1 m', '1 h')
}

export const RL_CHAT: RateConfig = { name: 'chat', tokens: 20, ms: 60_000, window: '1 m' };
export const RL_LEAD: RateConfig = { name: 'lead', tokens: 10, ms: 60 * 60_000, window: '1 h' };

/* ── Upstash (persistente, compartido) ─────────────────────────── */
const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasUpstash ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();

function upstashLimiter(cfg: RateConfig): Ratelimit {
  let l = limiters.get(cfg.name);
  if (!l) {
    l = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
      prefix: `zaire:rl:${cfg.name}`,
      analytics: false,
    });
    limiters.set(cfg.name, l);
  }
  return l;
}

/* ── Fallback in-memory (por instancia) ────────────────────────── */
const mem = new Map<string, { count: number; reset: number }>();
function memAllow(cfg: RateConfig, id: string): boolean {
  const key = `${cfg.name}:${id}`;
  const now = Date.now();
  const e = mem.get(key);
  if (!e || now > e.reset) { mem.set(key, { count: 1, reset: now + cfg.ms }); return true; }
  if (e.count >= cfg.tokens) return false;
  e.count++;
  return true;
}

/** Devuelve true si la request está permitida, false si superó el límite. */
export async function rateLimit(cfg: RateConfig, id: string): Promise<boolean> {
  if (redis) {
    try {
      const { success } = await upstashLimiter(cfg).limit(id);
      return success;
    } catch {
      // Si Upstash falla (red/credenciales), no bloqueamos al usuario: caemos al in-memory.
      return memAllow(cfg, id);
    }
  }
  return memAllow(cfg, id);
}

/** Extrae la IP del cliente de los headers (Vercel / proxies). */
export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';
}
