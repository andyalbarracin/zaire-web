// File: lib/sales/content-kb.ts
// Base de conocimiento de CONTENIDO (tono, plataformas, módulos, temáticas, ganchos, CTAs).
// Carga + valida (zod) una vez y expone un selector que arma un contexto reducido para el
// generador: nunca se manda la KB entera, solo lo relevante a la plataforma + el tema.

import { z } from 'zod';
import rawKb from './zaire-content-kb.json';

const ContentModuleSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  para_que: z.string(),
  dolores_que_resuelve: z.array(z.string()),
  beneficios: z.array(z.string()),
  keywords: z.array(z.string()),
  angulos_de_contenido: z.array(z.string()),
});
const PlatformSchema = z.object({
  id: z.string(),
  formato: z.string(),
  largo_ideal: z.string(),
  tono: z.string(),
  estructura: z.array(z.string()),
  hashtags_estrategia: z.string(),
  cta_tipico: z.string(),
  buenas_practicas: z.array(z.string()),
});
const TematicaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  modulos_relacionados: z.array(z.string()),
  angulo: z.string(),
});
const ContentKBSchema = z.object({
  meta: z.object({ marca: z.string(), producto: z.string(), tono_general: z.string(), principios: z.array(z.string()) }),
  tono_de_marca: z.object({ voz: z.string(), hacer: z.array(z.string()), evitar: z.array(z.string()) }),
  modulos: z.array(ContentModuleSchema),
  plataformas: z.array(PlatformSchema),
  tematicas: z.array(TematicaSchema),
  ganchos: z.array(z.string()),
  cta_biblioteca: z.array(z.string()),
  glosario: z.array(z.object({ termino: z.string(), definicion: z.string() })),
});

export type ContentKB = z.infer<typeof ContentKBSchema>;
export type ContentModule = z.infer<typeof ContentModuleSchema>;
export type Platform = z.infer<typeof PlatformSchema>;
export type Tematica = z.infer<typeof TematicaSchema>;

let _kb: ContentKB | null = null;
export function getContentKB(): ContentKB {
  if (_kb) return _kb;
  const parsed = ContentKBSchema.safeParse(rawKb);
  if (!parsed.success) throw new Error('Content KB inválida (zaire-content-kb.json): ' + parsed.error.message);
  _kb = parsed.data;
  return _kb;
}

/** Plataforma por etiqueta de la UI ('Instagram' → id 'instagram'). */
export function getPlatform(label?: string | null): Platform | undefined {
  if (!label) return undefined;
  const id = label.trim().toLowerCase();
  return getContentKB().plataformas.find((p) => p.id === id);
}

/** Módulos más relevantes al texto del prompt (por id/nombre/keywords). */
export function pickModulesForPrompt(prompt: string, max = 3): ContentModule[] {
  const hay = prompt.toLowerCase();
  const scored = getContentKB().modulos
    .map((m) => {
      const terms = [m.id, m.nombre, ...m.keywords];
      const score = terms.reduce((n, t) => (hay.includes(t.toLowerCase()) ? n + 1 : n), 0);
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.m);
}

/** Temáticas más relevantes al prompt (por título/descr/ángulo). */
export function pickTematicasForPrompt(prompt: string, max = 2): Tematica[] {
  const hay = prompt.toLowerCase();
  const scored = getContentKB().tematicas
    .map((t) => {
      const terms = [t.titulo, t.descripcion, t.angulo, t.id];
      const score = terms.reduce((n, s) => (hay.includes(s.toLowerCase()) ? n + 1 : n), 0);
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.t);
}

/**
 * Contexto reducido para el generador: tono de marca + plataforma + módulos/temáticas
 * relevantes + ganchos + CTAs. Si no matchea nada, manda un catálogo compacto para elegir.
 */
export function buildContentContext(input: { prompt: string; platformLabel?: string | null }) {
  const kb = getContentKB();
  const plataforma = getPlatform(input.platformLabel) ?? null;

  let modulos = pickModulesForPrompt(input.prompt, 3);
  const modulosCompacto = modulos.length
    ? null
    : kb.modulos.map((m) => ({ id: m.id, nombre: m.nombre, para_que: m.para_que }));

  let tematicas = pickTematicasForPrompt(input.prompt, 2);
  const tematicasCompacto = tematicas.length ? null : kb.tematicas.map((t) => ({ id: t.id, titulo: t.titulo, angulo: t.angulo }));

  // Recorte defensivo por si algún array es enorme.
  modulos = modulos.slice(0, 3);
  tematicas = tematicas.slice(0, 2);

  return {
    marca: { marca: kb.meta.marca, producto: kb.meta.producto, tono_general: kb.meta.tono_general },
    principios: kb.meta.principios,
    tono_de_marca: kb.tono_de_marca,
    plataforma,
    modulos: modulos.map((m) => ({
      id: m.id, nombre: m.nombre, para_que: m.para_que,
      dolores_que_resuelve: m.dolores_que_resuelve, beneficios: m.beneficios,
      keywords: m.keywords, angulos_de_contenido: m.angulos_de_contenido,
    })),
    modulos_catalogo: modulosCompacto,
    tematicas: tematicas.map((t) => ({ titulo: t.titulo, descripcion: t.descripcion, angulo: t.angulo, modulos_relacionados: t.modulos_relacionados })),
    tematicas_catalogo: tematicasCompacto,
    ganchos: kb.ganchos.slice(0, 6),
    cta_biblioteca: kb.cta_biblioteca.slice(0, 6),
  };
}
