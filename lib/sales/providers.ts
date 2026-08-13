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
  complete(opts: CompleteOptions): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Falta GROQ_API_KEY');
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    return openAICompatComplete({ name: 'groq', endpoint: this.endpoint, apiKey, model }, opts);
  }
}

export class OpenAIChatProvider implements LLMProvider {
  readonly name = 'openai';
  private endpoint = 'https://api.openai.com/v1/chat/completions';
  complete(opts: CompleteOptions): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Falta OPENAI_API_KEY');
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    return openAICompatComplete({ name: 'openai', endpoint: this.endpoint, apiKey, model }, opts);
  }
}

/** OpenRouter es OpenAI-compatible: un solo endpoint para muchos modelos. */
export class OpenRouterProvider implements LLMProvider {
  readonly name = 'openrouter';
  private endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  complete(opts: CompleteOptions): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('Falta OPENROUTER_API_KEY');
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    return openAICompatComplete({ name: 'openrouter', endpoint: this.endpoint, apiKey, model }, opts);
  }
}

/* ─────────────────────────  Gemini (API nativa, tiene free tier)  ───────────────────────── */

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  async complete(opts: CompleteOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Falta GEMINI_API_KEY');
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
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

/** Instancia un provider por nombre. `null` si le falta la API key (se saltea en la cadena). */
export function providerByName(name: ProviderName): LLMProvider | null {
  switch (name) {
    case 'openai':      return process.env.OPENAI_API_KEY ? new OpenAIChatProvider() : null;
    case 'openrouter':  return process.env.OPENROUTER_API_KEY ? new OpenRouterProvider() : null;
    case 'gemini':      return process.env.GEMINI_API_KEY ? new GeminiProvider() : null;
    case 'groq':
    default:            return process.env.GROQ_API_KEY ? new GroqProvider() : null;
  }
}

export interface ChainStep { provider: LLMProvider; maxCalls: number; }

/**
 * Cadena de proveedores con tope por paso. Cada `complete()` prueba en orden:
 * primaria → secundaria → fallback. Si una agota su cap o lanza, pasa a la siguiente.
 * La última (fallback = Groq) va con cap Infinity: es la red de seguridad.
 * Contadores por instancia → el tope es POR análisis (una instancia por analizarLead()).
 */
export function chainProviders(steps: ChainStep[]): LLMProvider {
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
          return await usable[i].provider.complete(opts);
        } catch (e) {
          lastErr = e;
        }
      }
      throw new Error(`Todos los proveedores fallaron: ${(lastErr as Error)?.message ?? 'sin proveedor disponible'}`);
    },
  };
}

/**
 * Provider por defecto del motor: cadena PRIMARIA → SECUNDARIA → FALLBACK, configurable por env.
 *   LLM_PRIMARY / LLM_SECONDARY / LLM_FALLBACK = groq | openai | openrouter | gemini
 *   LLM_MAX_PRIMARY_CALLS / LLM_MAX_SECONDARY_CALLS = topes duros por análisis (default 3)
 * Sin config → solo Groq. El fallback (default groq) siempre va con cap Infinity.
 * Ej. pedido: LLM_PRIMARY=openai  LLM_SECONDARY=gemini  LLM_FALLBACK=groq
 */
export function createProvider(): LLMProvider {
  const primary = (process.env.LLM_PRIMARY || 'groq').toLowerCase() as ProviderName;
  const secondary = (process.env.LLM_SECONDARY || '').toLowerCase() as ProviderName | '';
  const fallback = (process.env.LLM_FALLBACK || 'groq').toLowerCase() as ProviderName;
  const capP = Math.max(1, Number(process.env.LLM_MAX_PRIMARY_CALLS) || 3);
  const capS = Math.max(1, Number(process.env.LLM_MAX_SECONDARY_CALLS) || 3);

  const steps: ChainStep[] = [];
  const add = (name: ProviderName | '', cap: number) => {
    if (!name) return;
    const p = providerByName(name as ProviderName);
    if (p && !steps.some((s) => s.provider.name === p.name)) steps.push({ provider: p, maxCalls: cap });
  };
  add(primary, capP);
  add(secondary, capS);
  add(fallback, Number.POSITIVE_INFINITY);

  // Red de seguridad: si nada quedó (o faltan keys), garantizamos Groq.
  if (steps.length === 0) {
    const groq = providerByName('groq');
    if (groq) steps.push({ provider: groq, maxCalls: Number.POSITIVE_INFINITY });
  }
  return chainProviders(steps);
}
