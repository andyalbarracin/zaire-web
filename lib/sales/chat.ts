// File: lib/sales/chat.ts
// Chat de diagnóstico del sitio (home): cadena de proveedores dedicada + limpieza de la respuesta.
// - Cadena: Groq (varios modelos) → Gemini → OpenRouter (1 intento c/u: el visitante está esperando).
//   El free tier de Groq limita tokens/minuto POR MODELO (8k c/u): rotar modelos multiplica el cupo.
//   GROQ_CHAT_MODELS="a,b,c" los cambia sin tocar código (Groq depreca modelos seguido).
//   GROQ_CHAT_API_KEY (opcional) separa el cupo del chat del de la IA del dashboard.
// - El LLM marca el cierre con [[LEAD]]; acá se detecta y se quita, junto con el markdown
//   (el chat muestra texto plano: los ** se verían crudos).

import { chainProviders, GroqProvider, providerByName, type ChainStep, type LLMProvider, type ProviderReport } from './providers';

const GROQ_CHAT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

/** Mismo provider con nombre propio (ej. 'groq:gpt-oss-20b') para el log de "quién respondió". */
function named(name: string, p: LLMProvider): LLMProvider {
  return { name, complete: (opts) => p.complete(opts) };
}

/** Proveedor del chat del sitio. Se saltean los que no tienen key. */
export function chatProvider(report: ProviderReport): LLMProvider {
  const steps: ChainStep[] = [];
  if (process.env.GROQ_CHAT_API_KEY || process.env.GROQ_API_KEY) {
    const models = process.env.GROQ_CHAT_MODELS?.split(',').map(m => m.trim()).filter(Boolean) || GROQ_CHAT_MODELS;
    for (const model of models) {
      const groq = new GroqProvider(model, process.env.GROQ_CHAT_API_KEY);
      steps.push({ provider: named(`groq:${model.split('/').pop()}`, groq), maxCalls: 1 });
    }
  }
  const gemini = providerByName('gemini', process.env.GEMINI_CHAT_MODEL);
  if (gemini) steps.push({ provider: gemini, maxCalls: 1 });
  const openrouter = providerByName('openrouter', process.env.OPENROUTER_CHAT_MODEL);
  if (openrouter) steps.push({ provider: openrouter, maxCalls: 1 });
  return chainProviders(steps, report, { attemptsPerProvider: 1 });
}

/** Markdown → texto plano (negritas, itálicas, títulos, código, links, viñetas). */
export function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    .replace(/__([\s\S]+?)__/g, '$1')
    .replace(/(^|[\s(¿¡"])\*(?!\s)([^*\n]+?)\*(?=[\s.,;:!?)"]|$)/g, '$1$2')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]\n]+)\]\((https?:[^)\s]+)\)/g, '$1 ($2)')
    .replace(/^[ \t]*[-*][ \t]+/gm, '• ')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Detecta el token de cierre [[LEAD]] (tolerante a espacios/mayúsculas) y limpia el texto. */
export function cleanChatReply(raw: string): { text: string; lead: boolean } {
  const lead = /\[\[\s*LEAD\s*\]\]/i.test(raw);
  const text = stripMarkdown(
    raw
      .replace(/<think>[\s\S]*?<\/think>/gi, '') // modelos de razonamiento que lo emiten en el texto
      .replace(/\[\[\s*LEAD\s*\]\]/gi, '')
      .replace(/\[\[[A-Z]*\]?\s*$/i, ''), // token cortado al final
  );
  return { text, lead };
}
