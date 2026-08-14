// File: content-ai.ts
// Generación de contenido con IA para la sección Contenidos. Server-only.
//   - Texto: cadena de proveedores (openai→gemini→groq) según config de /dashboard/cuenta.
//   - Imagen: ImageProvider (OpenAI/Gemini) → sube a Storage zo-content → ContentMedia.

import { createProvider, type ProviderSettings, type ProviderReport } from '@/lib/sales/providers';
import { createImageProvider } from '@/lib/sales/image-providers';
import { extractJson } from '@/lib/sales/analyze';
import { buildContentContext, getContentKB } from '@/lib/sales/content-kb';
import { uploadContentMediaBuffer, type ContentMedia } from './content';

export interface GeneratedText { title: string; subtitle: string; body: string; provider?: string; }

export interface GenerateTextInput {
  prompt: string;
  platform?: string;
  title?: string;
  tematicaId?: string;
  moduloId?: string;
  mejora?: string;                                   // instrucción para reescribir/mejorar
  contextoActual?: { title?: string; subtitle?: string; body?: string };
}

export async function generateContentText(
  input: GenerateTextInput,
  settings?: ProviderSettings,
): Promise<GeneratedText | { error: string }> {
  // Contexto reducido desde la KB de contenido (tono, plataforma, módulos, temáticas, ganchos).
  let ctx: unknown = null;
  try {
    ctx = buildContentContext({ prompt: input.prompt, platformLabel: input.platform, tematicaId: input.tematicaId, moduloId: input.moduloId });
  } catch { ctx = null; }

  const system = [
    'Sos redactor de marketing de Zaire Technologies (Argentina, voseo rioplatense).',
    'Trabajás apoyado en la BASE DE CONOCIMIENTO (KB) que te paso: tono, principios, la plataforma, los módulos y sus dolores/beneficios reales, temáticas, ganchos y CTAs.',
    'NO inventes capacidades, precios ni features fuera de la KB. Distinguí siempre lo DISPONIBLE de lo ROADMAP (no vendas roadmap como disponible).',
    'Respetá el tono de marca (qué hacer / qué evitar). Un solo mensaje y un solo CTA por pieza. Nada de "AI slop" ni clichés de marketing.',
    'Devolvés EXCLUSIVAMENTE un JSON válido: {"title": "...", "subtitle": "...", "body": "..."}. Sin markdown, sin ```.',
  ].join('\n');

  const user = [
    ctx ? `CONTEXTO (KB de contenido — usá SOLO esto para los datos duros):\n${JSON.stringify(ctx)}` : '',
    '',
    `PEDIDO: generá un contenido para ${input.platform || 'redes sociales'}.`,
    input.title ? `Título tentativo: ${input.title}` : '',
    `Idea / tema: ${input.prompt}`,
    input.mejora ? `\nMEJORA PEDIDA: reescribí el contenido siguiendo esta instrucción: "${input.mejora}".` : '',
    input.contextoActual?.body ? `Texto actual a mejorar:\n${input.contextoActual.body}` : '',
    '',
    'INSTRUCCIÓN: adaptá tono, largo y estructura a la plataforma del CONTEXTO. Empezá por el dolor real. El "body" en texto plano con saltos de línea; si la plataforma usa hashtags, sumalos al final según su estrategia. Cerrá con un único CTA. Solo el JSON.',
  ].filter(Boolean).join('\n');

  try {
    const report: ProviderReport = { used: [] };
    const provider = createProvider(settings, report);
    const raw = await provider.complete({ system, user, json: true, temperature: 0.7, maxTokens: 1100 });
    const obj = JSON.parse(extractJson(raw)) as Partial<GeneratedText>;
    const out: GeneratedText = {
      title: (obj.title ?? '').trim(),
      subtitle: (obj.subtitle ?? '').trim(),
      body: (obj.body ?? '').trim(),
      provider: report.used.join('+') || undefined,
    };
    if (!out.title && !out.body) return { error: 'La IA no devolvió contenido útil.' };
    return out;
  } catch (e) {
    return { error: 'No se pudo generar el texto: ' + (e as Error).message };
  }
}

// Estilo visual de marca para dar consistencia a las imágenes generadas.
const BRAND_IMAGE_STYLE =
  'Estilo visual profesional e industrial, limpio y moderno; acento naranja (#FF6A00) de Zaire; ' +
  'realista y creíble para el sector industrial (mantenimiento, oil & gas, plantas, talleres); ' +
  'sin texto superpuesto salvo que se pida explícitamente.';

export async function generateContentImage(
  prompt: string,
  settings?: ProviderSettings,
): Promise<(ContentMedia & { provider?: string }) | { error: string }> {
  try {
    let brand = '';
    try { brand = getContentKB().meta.tono_general; } catch { brand = ''; }
    const fullPrompt = `${prompt}\n\n${BRAND_IMAGE_STYLE}${brand ? ` Tono de marca: ${brand}` : ''}`;
    const provider = createImageProvider(settings);
    const img = await provider.generate(fullPrompt);
    const buffer = Buffer.from(img.base64, 'base64');
    const ext = img.mimeType.includes('jpeg') ? 'jpg' : img.mimeType.includes('webp') ? 'webp' : 'png';
    const media = await uploadContentMediaBuffer(buffer, img.mimeType, `ia-${Date.now()}.${ext}`);
    return media ? { ...media, provider: provider.name } : { error: 'La imagen se generó pero no se pudo guardar en Storage.' };
  } catch (e) {
    return { error: 'No se pudo generar la imagen: ' + (e as Error).message };
  }
}
