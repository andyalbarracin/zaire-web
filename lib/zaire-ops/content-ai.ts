// File: content-ai.ts
// Generación de contenido con IA para la sección Contenidos. Server-only.
//   - Texto: cadena de proveedores (openai→gemini→groq) según config de /dashboard/cuenta.
//   - Imagen: ImageProvider (OpenAI/Gemini) → sube a Storage zo-content → ContentMedia.

import { createProvider, type ProviderSettings } from '@/lib/sales/providers';
import { createImageProvider } from '@/lib/sales/image-providers';
import { extractJson } from '@/lib/sales/analyze';
import { uploadContentMediaBuffer, type ContentMedia } from './content';

export interface GeneratedText { title: string; subtitle: string; body: string; }

export async function generateContentText(
  input: { prompt: string; platform?: string; title?: string },
  settings?: ProviderSettings,
): Promise<GeneratedText | { error: string }> {
  const system = `Sos redactor de marketing de Zaire Technologies (Argentina, voseo rioplatense). Escribís contenido para redes o blog: claro, con criterio, sin humo ni clichés. Devolvés EXCLUSIVAMENTE un JSON válido con esta forma: {"title": "...", "subtitle": "...", "body": "..."}. Sin markdown, sin \`\`\`.`;
  const user = [
    `Generá un contenido para ${input.platform || 'redes sociales'}.`,
    input.title ? `Título tentativo: ${input.title}` : '',
    `Idea / tema: ${input.prompt}`,
    'Adaptá tono y largo a la plataforma. El "body" en texto plano con saltos de línea (podés incluir hashtags al final si aplica). Solo el JSON.',
  ].filter(Boolean).join('\n');

  try {
    const provider = createProvider(settings);
    const raw = await provider.complete({ system, user, json: true, temperature: 0.7, maxTokens: 1000 });
    const obj = JSON.parse(extractJson(raw)) as Partial<GeneratedText>;
    const out: GeneratedText = {
      title: (obj.title ?? '').trim(),
      subtitle: (obj.subtitle ?? '').trim(),
      body: (obj.body ?? '').trim(),
    };
    if (!out.title && !out.body) return { error: 'La IA no devolvió contenido útil.' };
    return out;
  } catch (e) {
    return { error: 'No se pudo generar el texto: ' + (e as Error).message };
  }
}

export async function generateContentImage(
  prompt: string,
  settings?: ProviderSettings,
): Promise<ContentMedia | { error: string }> {
  try {
    const provider = createImageProvider(settings);
    const img = await provider.generate(prompt);
    const buffer = Buffer.from(img.base64, 'base64');
    const ext = img.mimeType.includes('jpeg') ? 'jpg' : img.mimeType.includes('webp') ? 'webp' : 'png';
    const media = await uploadContentMediaBuffer(buffer, img.mimeType, `ia-${Date.now()}.${ext}`);
    return media ?? { error: 'La imagen se generó pero no se pudo guardar en Storage.' };
  } catch (e) {
    return { error: 'No se pudo generar la imagen: ' + (e as Error).message };
  }
}
