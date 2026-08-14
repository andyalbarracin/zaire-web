// File: ai-usage.ts
// Métricas de uso de IA (tabla zo_ai_usage): conteo de llamadas por proveedor y día.
// Server-only. Resiliente: si falla, no rompe el flujo (las métricas son best-effort).

import { createSupabaseAdmin } from './supabase-admin';

/** Suma 1 al contador del día por cada proveedor que respondió. */
export async function recordUsage(providers: string[]): Promise<void> {
  const uniq = Array.from(new Set(providers.filter(Boolean)));
  if (!uniq.length) return;
  const day = new Date().toISOString().slice(0, 10);
  const admin = createSupabaseAdmin();
  try {
    await Promise.all(uniq.map((p) => admin.rpc('zo_ai_usage_incr', { p_day: day, p_provider: p })));
  } catch {
    /* best-effort */
  }
}

export interface UsageRow { day: string; provider: string; calls: number; }

/** Filas de uso de los últimos N días (desc por día). */
export async function getUsageSummary(days = 14): Promise<UsageRow[]> {
  try {
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const { data } = await createSupabaseAdmin()
      .from('zo_ai_usage').select('*').gte('day', since).order('day', { ascending: false });
    return (data ?? []) as UsageRow[];
  } catch {
    return [];
  }
}

/** Totales por proveedor (para chips de resumen). */
export function totalsByProvider(rows: UsageRow[]): { provider: string; calls: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.provider, (map.get(r.provider) ?? 0) + r.calls);
  return Array.from(map.entries()).map(([provider, calls]) => ({ provider, calls })).sort((a, b) => b.calls - a.calls);
}
