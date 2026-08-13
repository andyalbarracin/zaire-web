// File: llm-config.ts
// Config de proveedores LLM (tabla zo_llm_config, fila 'default'). Server-only (service role).
// Resuelve ProviderSettings para el motor: DB → env → defaults. Resiliente: si la tabla no
// existe todavía, cae a la config de env (settingsFromEnv) sin romper.

import { createSupabaseAdmin } from './supabase-admin';
import { settingsFromEnv, type ProviderName, type ProviderSettings } from '@/lib/sales/providers';

export interface LlmConfigRow {
  primary_provider: string;
  secondary_provider: string | null;
  fallback_provider: string;
  model_openai: string | null;
  model_gemini: string | null;
  model_groq: string | null;
  model_openrouter: string | null;
  max_primary_calls: number;
  max_secondary_calls: number;
}

export const LLM_PROVIDERS: ProviderName[] = ['groq', 'openai', 'gemini', 'openrouter'];
const asName = (v: unknown, def: ProviderName): ProviderName =>
  LLM_PROVIDERS.includes(v as ProviderName) ? (v as ProviderName) : def;

/** Fila cruda de config. null si la tabla no existe o está vacía. */
export async function getLlmConfig(): Promise<LlmConfigRow | null> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin.from('zo_llm_config').select('*').eq('id', 'default').single();
    return (data as LlmConfigRow) ?? null;
  } catch {
    return null;
  }
}

/** ProviderSettings para pasarle al motor. DB → env fallback. */
export async function resolveProviderSettings(): Promise<ProviderSettings> {
  const row = await getLlmConfig();
  if (!row) return settingsFromEnv();

  const models: Partial<Record<ProviderName, string>> = {};
  if (row.model_openai) models.openai = row.model_openai;
  if (row.model_gemini) models.gemini = row.model_gemini;
  if (row.model_groq) models.groq = row.model_groq;
  if (row.model_openrouter) models.openrouter = row.model_openrouter;

  return {
    primary: asName(row.primary_provider, 'groq'),
    secondary: row.secondary_provider ? asName(row.secondary_provider, 'groq') : '',
    fallback: asName(row.fallback_provider, 'groq'),
    maxPrimaryCalls: row.max_primary_calls ?? 3,
    maxSecondaryCalls: row.max_secondary_calls ?? 3,
    models: Object.keys(models).length ? models : undefined,
  };
}

/** Guarda la config (upsert de la fila 'default'). */
export async function updateLlmConfig(patch: Partial<LlmConfigRow>): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin.from('zo_llm_config').upsert({ id: 'default', ...patch, updated_at: new Date().toISOString() });
}
