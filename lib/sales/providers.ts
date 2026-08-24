// File: lib/sales/providers.ts
// Abstracción de proveedor LLM. El motor habla contra `LLMProvider`, no contra un vendor.
// - GroqProvider  → default (gratis, rápido). Es también el FALLBACK.
// - OpenAIChatProvider / GeminiProvider → opcionales, se activan por env.
// - budgetedWithFallback → cap DURO de llamadas al primario por invocación; agotado o ante
//   cualquier error, cae a Groq. Así una key personal (OpenAI) no se puede vaciar en un loop.

export interface CompleteOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean; // pide response_format json_object / responseMimeType json
}

export interface LLMProvider {
  readonly name: string;
  /** Devuelve el texto de la respuesta. LANZA si falla (para que el fallback actúe). */
  complete(opts: CompleteOptions): Promise<string>;
}

/* ─────────────────────────  OpenAI-compatible (Groq, OpenAI, OpenRouter)  ───────────────────────── */

interface OpenAICompatConfig {
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

async function openAICompatComplete(cfg: OpenAICompatConfig, opts: CompleteOptions): Promise<string> {
  const res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 1600,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${cfg.name} HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${cfg.name}: respuesta vacía`);
  return text;
}

export class GroqProvider implements LLMProvider {
  readonly name = 'groq';
  private endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  constructor(private modelOverride?: string) {}
  complete(opts: CompleteOptions): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Falta GROQ_API_KEY');
    const model = this.modelOverride || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    return openAICompatComplete({ name: 'groq', endpoint: this.endpoint, apiKey, model }, opts);
  }
}

export class OpenAIChatProvider implements LLMProvider {
  readonly name = 'openai';
  private endpoint = 'https://api.openai.com/v1/chat/completions';
  constructor(private modelOverride?: string) {}
  complete(opts: CompleteOptions): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Falta OPENAI_API_KEY');
    const model = this.modelOverride || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    return openAICompatComplete({ name: 'openai', endpoint: this.endpoint, apiKey, model }, opts);
  }
}

/** OpenRouter es OpenAI-compatible: un solo endpoint para muchos modelos. */
export class OpenRouterProvider implements LLMProvider {
  readonly name = 'openrouter';
  private endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  constructor(private modelOverride?: string) {}
  complete(opts: CompleteOptions): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('Falta OPENROUTER_API_KEY');
    const model = this.modelOverride || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    return openAICompatComplete({ name: 'openrouter', endpoint: this.endpoint, apiKey, model }, opts);
  }
}

/* ─────────────────────────  Gemini (API nativa, tiene free tier)  ───────────────────────── */

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  constructor(private modelOverride?: string) {}
  async complete(opts: CompleteOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Falta GEMINI_API_KEY');
    const model = this.modelOverride || process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: 'user', parts: [{ text: opts.user }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.3,
          maxOutputTokens: opts.maxTokens ?? 1600,
          ...(opts.json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`gemini HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('').trim();
    if (!text) throw new Error('gemini: respuesta vacía');
    return text;
  }
}

/* ─────────────────────────  Gemini + Google Search (grounding, tiempo real)  ───────────────────────── */

export interface GroundedResult {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * Llama a Gemini con la herramienta de búsqueda de Google (grounding): busca en la web
 * en vivo y responde con datos reales + las fuentes. Ideal para enriquecer un lead
 * (web/teléfono/email/dirección) sin depender de una base propia. Solo Gemini soporta esto.
 */
export async function geminiGroundedComplete(
  system: string,
  user: string,
  opts?: { temperature?: number; maxTokens?: number },
): Promise<GroundedResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta GEMINI_API_KEY');
  // No heredamos GEMINI_MODEL acá (puede estar pineado a un modelo viejo/muerto). Alias vigente.
  const model = process.env.GEMINI_SEARCH_MODEL || 'gemini-flash-latest';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: opts?.temperature ?? 0.2, maxOutputTokens: opts?.maxTokens ?? 1200 },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`gemini-search HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const cand = data?.candidates?.[0];
  const text: string = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text).filter(Boolean).join('').trim();
  const chunks: Array<{ web?: { uri?: string; title?: string } }> = cand?.groundingMetadata?.groundingChunks ?? [];
  const sources = chunks
    .map((c) => ({ uri: c.web?.uri ?? '', title: c.web?.title ?? '' }))
    .filter((s) => s.uri);
  if (!text) throw new Error('gemini-search: respuesta vacía');
  return { text, sources };
}

/* ─────────────────────────  Budget + fallback  ───────────────────────── */

/**
 * Envuelve un `primary` con un CAP DURO de `maxPrimaryCalls` intentos por instancia.
 * - Cada intento al primario (éxito o error) consume presupuesto.
 * - Ante error del primario, o presupuesto agotado, usa `fallback` (Groq).
 * Se crea UNA instancia por `analizarLead()`, así el tope es por invocación: no hay loops.
 */
export function budgetedWithFallback(
  primary: LLMProvider,
  fallback: LLMProvider,
  maxPrimaryCalls: number,
): LLMProvider {
  let used = 0;
  return {
    name: `${primary.name}->${fallback.name}`,
    async complete(opts: CompleteOptions): Promise<string> {
      if (used < maxPrimaryCalls) {
        used += 1;
        try {
          return await primary.complete(opts);
        } catch {
          // silencioso: caemos al fallback para esta llamada
        }
      }
      return fallback.complete(opts);
    },
  };
}

export type ProviderName = 'groq' | 'openai' | 'openrouter' | 'gemini';

/** Config de la cadena. La resuelve la app (DB → env → defaults) y se la pasa a createProvider. */
export interface ProviderSettings {
  primary: ProviderName;
  secondary?: ProviderName | '';
  fallback: ProviderName;
  maxPrimaryCalls?: number;
  maxSecondaryCalls?: number;
  models?: Partial<Record<ProviderName, string>>;
}

/** Instancia un provider por nombre. `null` si le falta la API key (se saltea en la cadena). */
export function providerByName(name: ProviderName, model?: string): LLMProvider | null {
  switch (name) {
    case 'openai':      return process.env.OPENAI_API_KEY ? new OpenAIChatProvider(model) : null;
    case 'openrouter':  return process.env.OPENROUTER_API_KEY ? new OpenRouterProvider(model) : null;
    case 'gemini':      return process.env.GEMINI_API_KEY ? new GeminiProvider(model) : null;
    case 'groq':
    default:            return process.env.GROQ_API_KEY ? new GroqProvider(model) : null;
  }
}

/** Indica si un proveedor tiene su API key configurada (para el panel de salud). */
export function providerHasKey(name: ProviderName): boolean {
  switch (name) {
    case 'openai':      return !!process.env.OPENAI_API_KEY;
    case 'openrouter':  return !!process.env.OPENROUTER_API_KEY;
    case 'gemini':      return !!process.env.GEMINI_API_KEY;
    case 'groq':
    default:            return !!process.env.GROQ_API_KEY;
  }
}

export interface ChainStep { provider: LLMProvider; maxCalls: number; }

/** Recolecta qué proveedores respondieron efectivamente (para mostrar "quién respondió"). */
export interface ProviderReport { used: string[]; }

/**
 * Cadena de proveedores con tope por paso. Cada `complete()` prueba en orden:
 * primaria → secundaria → fallback. Si una agota su cap o lanza, pasa a la siguiente.
 * La última (fallback = Groq) va con cap Infinity: es la red de seguridad.
 * Contadores por instancia → el tope es POR análisis (una instancia por analizarLead()).
 */
export function chainProviders(steps: ChainStep[], report?: ProviderReport): LLMProvider {
  const usable = steps.filter((s) => s.provider);
  const used = usable.map(() => 0);
  return {
    name: usable.map((s) => s.provider.name).join('->') || 'none',
    async complete(opts: CompleteOptions): Promise<string> {
      let lastErr: unknown;
      for (let i = 0; i < usable.length; i++) {
        if (used[i] >= usable[i].maxCalls) continue;
        used[i] += 1;
        try {
          const text = await usable[i].provider.complete(opts);
          if (report && !report.used.includes(usable[i].provider.name)) report.used.push(usable[i].provider.name);
          return text;
        } catch (e) {
          lastErr = e;
        }
      }
      throw new Error(`Todos los proveedores fallaron: ${(lastErr as Error)?.message ?? 'sin proveedor disponible'}`);
    },
  };
}

/** Lee la config de la cadena desde env (fallback cuando la app no pasa settings de DB). */
export function settingsFromEnv(): ProviderSettings {
  return {
    primary: (process.env.LLM_PRIMARY || 'groq').toLowerCase() as ProviderName,
    secondary: (process.env.LLM_SECONDARY || '').toLowerCase() as ProviderName | '',
    fallback: (process.env.LLM_FALLBACK || 'groq').toLowerCase() as ProviderName,
    maxPrimaryCalls: Math.max(1, Number(process.env.LLM_MAX_PRIMARY_CALLS) || 3),
    maxSecondaryCalls: Math.max(1, Number(process.env.LLM_MAX_SECONDARY_CALLS) || 3),
  };
}

/**
 * Provider del motor: cadena PRIMARIA → SECUNDARIA → FALLBACK.
 * `settings` viene de la DB (config en /dashboard/cuenta); si no se pasa, se lee de env.
 * Sin nada configurado → solo Groq. El fallback siempre va con cap Infinity (red de seguridad).
 * Ej. pedido: primary=openai, secondary=gemini, fallback=groq.
 */
export function createProvider(settings?: ProviderSettings, report?: ProviderReport): LLMProvider {
  const s = settings ?? settingsFromEnv();
  const capP = Math.max(1, s.maxPrimaryCalls ?? 3);
  const capS = Math.max(1, s.maxSecondaryCalls ?? 3);

  const steps: ChainStep[] = [];
  const add = (name: ProviderName | '' | undefined, cap: number) => {
    if (!name) return;
    const p = providerByName(name as ProviderName, s.models?.[name as ProviderName]);
    if (p && !steps.some((st) => st.provider.name === p.name)) steps.push({ provider: p, maxCalls: cap });
  };
  add(s.primary, capP);
  add(s.secondary, capS);
  add(s.fallback, Number.POSITIVE_INFINITY);

  // Red de seguridad: si nada quedó (o faltan keys), garantizamos Groq.
  if (steps.length === 0) {
    const groq = providerByName('groq');
    if (groq) steps.push({ provider: groq, maxCalls: Number.POSITIVE_INFINITY });
  }
  return chainProviders(steps, report);
}
