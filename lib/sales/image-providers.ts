// File: lib/sales/image-providers.ts
// Abstracción de generación de IMÁGENES (distinta a la de chat). Solo OpenAI y Gemini
// generan imágenes (Groq no). `createImageProvider` elige según la config: prefiere el
// orden de la cadena, pero solo entre proveedores capaces de imagen con su key presente.

import type { ProviderSettings } from './providers';

export interface ImageResult {
  base64: string;
  mimeType: string;
}

export interface ImageProvider {
  readonly name: string;
  generate(prompt: string, opts?: { size?: string }): Promise<ImageResult>;
}

/* ── OpenAI Images (gpt-image-1) — devuelve b64_json ── */
export class OpenAIImageProvider implements ImageProvider {
  readonly name = 'openai';
  async generate(prompt: string, opts?: { size?: string }): Promise<ImageResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Falta OPENAI_API_KEY');
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, size: opts?.size || '1024x1024', n: 1 }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`openai-image HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error('openai-image: respuesta sin imagen');
    return { base64: b64, mimeType: 'image/png' };
  }
}

/* ── Gemini (image generation) — inlineData base64 ── */
export class GeminiImageProvider implements ImageProvider {
  readonly name = 'gemini';
  async generate(prompt: string): Promise<ImageResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Falta GEMINI_API_KEY');
    const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`gemini-image HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    const parts: Array<{ inlineData?: { mimeType?: string; data?: string } }> =
      data?.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p) => p.inlineData?.data);
    if (!img?.inlineData?.data) throw new Error('gemini-image: respuesta sin imagen');
    return { base64: img.inlineData.data, mimeType: img.inlineData.mimeType || 'image/png' };
  }
}

/** Elige un proveedor de imágenes: primero el orden de la cadena, luego openai, luego gemini. */
export function createImageProvider(settings?: ProviderSettings): ImageProvider {
  const order = [settings?.primary, settings?.secondary, settings?.fallback].filter(Boolean) as string[];
  for (const name of [...order, 'openai', 'gemini']) {
    if (name === 'openai' && process.env.OPENAI_API_KEY) return new OpenAIImageProvider();
    if (name === 'gemini' && process.env.GEMINI_API_KEY) return new GeminiImageProvider();
  }
  throw new Error('No hay proveedor de imágenes configurado (necesitás OPENAI_API_KEY o GEMINI_API_KEY).');
}
