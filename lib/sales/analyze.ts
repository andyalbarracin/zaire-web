// File: lib/sales/analyze.ts
// Orquestador del MOTOR DE CALIFICACIÓN DE LEADS.
//   Paso A (CLASIFICAR, barato) → selector (contexto reducido) → Paso B (GENERAR) → validar.
// Regla dura: el LLM adapta/selecciona sobre la KB, NO inventa. Lo que no está → datos_faltantes.
// Nunca lanza sin controlar: ante fallo total devuelve un LeadAnalysis parcial (confianza "baja").

import { z } from 'zod';
import {
  LeadInputSchema,
  ClasificacionSchema,
  LeadAnalysisSchema,
  type LeadInput,
  type Clasificacion,
  type LeadAnalysis,
} from './types';
import { getKB, getIndustry } from './kb';
import { buildClassificationContext, buildReducedContext } from './selector';
import { createProvider, type LLMProvider, type ProviderSettings, type ProviderReport } from './providers';

/* ─────────────────────────  Prompts  ───────────────────────── */

const SYSTEM = [
  'Sos analista comercial de Zaire Industrial (Argentina, voseo rioplatense).',
  'Trabajás SOLO con la base de conocimiento (KB) que te paso en el CONTEXTO.',
  'NO inventes capacidades, módulos, precios, diferenciales ni objeciones que no estén en la KB.',
  'Si un dato necesario no está en la KB o en el LEAD, NO lo inventes: agregalo a "datos_faltantes".',
  'Podés seleccionar, priorizar y redactar (speech, ángulo) reusando el material de la KB.',
  'Devolvé EXCLUSIVAMENTE un JSON válido que cumpla el ESQUEMA. Sin markdown, sin explicaciones, sin ```.',
].join('\n');

function leadToText(input: LeadInput): string {
  return [
    ['nombre', input.nombre],
    ['rubro', input.rubro],
    ['descripcion', input.descripcion],
    ['web', input.web],
    ['empleados', input.empleados != null ? String(input.empleados) : undefined],
    ['notas', input.notas],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n') || '- (solo el nombre)';
}

/* ─────────────────────────  Parse robusto + validación  ───────────────────────── */

/** Extrae el primer objeto JSON: saca fences ``` y toma desde el primer { hasta el último }. */
export function extractJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
  return s;
}

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string; raw: string };

async function callAndValidate<T>(
  provider: LLMProvider,
  schema: z.ZodType<T>,
  system: string,
  user: string,
  opts: { temperature: number; maxTokens: number },
): Promise<ValidateResult<T>> {
  let raw = '';
  try {
    raw = await provider.complete({ system, user, json: true, ...opts });
  } catch (e) {
    return { ok: false, error: `LLM sin respuesta: ${(e as Error).message}`, raw: '' };
  }
  let obj: unknown;
  try {
    obj = JSON.parse(extractJson(raw));
  } catch {
    return { ok: false, error: 'La respuesta no es JSON parseable.', raw };
  }
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    return { ok: false, error: 'JSON no cumple el esquema: ' + parsed.error.message, raw };
  }
  return { ok: true, data: parsed.data };
}

/* ─────────────────────────  Paso A — CLASIFICAR  ───────────────────────── */

const CLASIFICACION_ESQUEMA = `{
  "industria_detectada": "<id de industria de la lista, o \\"\\" si no se puede>",
  "tamano_estimado": "<id de segmento (micro|pyme|mid|grande) o rango, o \\"\\">",
  "modulos_recomendados": [{ "modulo": "<id de módulo>", "por_que": "<breve>", "prioridad": "alta|media|baja" }],
  "confianza": "alta|media|baja",
  "datos_faltantes": ["<qué faltó para clasificar mejor>"]
}`;

async function clasificar(provider: LLMProvider, input: LeadInput): Promise<Clasificacion> {
  const ctx = buildClassificationContext();
  const user = [
    'CONTEXTO (catálogo de la KB — elegí IDs SOLO de acá):',
    JSON.stringify(ctx),
    '',
    'LEAD:',
    leadToText(input),
    '',
    'ESQUEMA (devolvé exactamente esta forma):',
    CLASIFICACION_ESQUEMA,
    '',
    'INSTRUCCIÓN: Detectá industria y tamaño y recomendá 2-3 módulos por fit. Usá IDs del catálogo. Si algo no se puede inferir, dejalo vacío y anotalo en datos_faltantes. Solo el JSON.',
  ].join('\n');

  const r = await callAndValidate(provider, ClasificacionSchema, SYSTEM, user, { temperature: 0.2, maxTokens: 600 });
  if (r.ok) return r.data;
  return heuristicClasificacion(input, r.error);
}

/** Fallback sin LLM: matchea industria por vocabulario/nombre y usa sus modulos_fit. */
function heuristicClasificacion(input: LeadInput, motivo: string): Clasificacion {
  const kb = getKB();
  const hay = `${input.rubro ?? ''} ${input.descripcion ?? ''} ${input.notas ?? ''} ${input.nombre}`.toLowerCase();
  let mejor: { id: string; score: number } | null = null;
  for (const ind of kb.industries) {
    const terms = [ind.nombre, ...ind.vocabulario, ...ind.dolores];
    const score = terms.reduce((n, t) => (hay.includes(t.toLowerCase()) ? n + 1 : n), 0);
    if (score > 0 && (!mejor || score > mejor.score)) mejor = { id: ind.id, score };
  }
  const ind = mejor ? getIndustry(mejor.id) : undefined;
  const mods = (ind?.modulos_fit ?? ['trace']).slice(0, 3);
  return {
    industria_detectada: ind?.id ?? '',
    tamano_estimado: input.empleados != null ? '' : '',
    modulos_recomendados: mods.map((m, i) => ({
      modulo: m,
      por_que: ind ? `Fit de la industria ${ind.nombre}` : 'Módulo base de la suite',
      prioridad: i === 0 ? 'alta' : i === 1 ? 'media' : 'baja',
    })),
    confianza: mejor ? 'media' : 'baja',
    datos_faltantes: [`Clasificación por heurística (LLM no disponible): ${motivo}`],
  };
}

/* ─────────────────────────  Paso B — GENERAR  ───────────────────────── */

const ANALYSIS_ESQUEMA = `{
  "lectura_rapida": "<1-2 frases>",
  "industria_detectada": "<nombre o id>",
  "tamano_estimado": "<segmento o rango>",
  "modulos_recomendados": [{ "modulo": "<id>", "nombre": "<nombre KB>", "por_que": "<breve>", "prioridad": "alta|media|baja" }],
  "angulo_entrada": "<un ángulo de la KB, adaptado>",
  "speech": { "apertura": "<...>", "cuerpo": "<...>", "cierre": "<...>" },
  "preguntas_calificacion": [{ "pregunta": "<de la KB>", "grupo": "<grupo>", "oro": true }],
  "objeciones_probables": [{ "tipo": "<familia KB>", "objecion": "<de la KB>", "respuesta": "<de la KB, adaptada>" }],
  "confianza": "alta|media|baja",
  "datos_faltantes": ["<lo que no estaba en la KB/lead>"],
  "proximo_paso": "<acción concreta>"
}`;

async function generar(provider: LLMProvider, input: LeadInput, clas: Clasificacion): Promise<LeadAnalysis> {
  const ctx = buildReducedContext({
    industriaId: clas.industria_detectada || undefined,
    modulosRecomendados: clas.modulos_recomendados.map((m) => m.modulo),
    empleados: input.empleados,
    tamano: clas.tamano_estimado || undefined,
  });

  const baseUser = [
    'CONTEXTO (KB reducida — usá SOLO esto; no inventes fuera de acá):',
    JSON.stringify(ctx),
    '',
    'LEAD:',
    leadToText(input),
    '',
    'ESQUEMA (devolvé exactamente esta forma):',
    ANALYSIS_ESQUEMA,
    '',
    'INSTRUCCIÓN: Armá el análisis para calificar y encarar al lead.',
    '- 5 a 7 preguntas_calificacion (varias "oro"), tomadas del CONTEXTO.',
    '- 4 a 5 objeciones_probables, tomadas de las objeciones de los módulos del CONTEXTO.',
    '- angulo_entrada: partí de uno de "angulos" y adaptalo con criterio.',
    '- speech: redactá un guión natural, humano y de alto nivel, en el tono del segmento. Usá pitch_templates, el vocabulario y los dolores de la industria SOLO como guía; NO copies las plantillas al pie ni dejes placeholders tipo {industria}. Escribí la persuasión y las transiciones con libertad, pero TODO dato duro (capacidades, diferenciales, módulos, estados) sale de la KB: no inventes capacidades ni precios.',
    '- Si un módulo está en estado "roadmap", aclaralo; no lo vendas como disponible.',
    '- Lo que no esté en el CONTEXTO va a datos_faltantes. Solo el JSON.',
  ].join('\n');

  // Intento 1
  let r = await callAndValidate(provider, LeadAnalysisSchema, SYSTEM, baseUser, { temperature: 0.35, maxTokens: 1800 });
  if (r.ok) return r.data;

  // Reintento único: le devolvemos el error para que corrija.
  const retryUser = [
    baseUser,
    '',
    'CORRECCIÓN: tu respuesta anterior fue inválida.',
    `MOTIVO: ${r.error}`,
    'Devolvé de nuevo SOLO el JSON válido que cumpla el ESQUEMA. Sin texto extra, sin ```.',
  ].join('\n');
  r = await callAndValidate(provider, LeadAnalysisSchema, SYSTEM, retryUser, { temperature: 0.2, maxTokens: 1800 });
  if (r.ok) return r.data;

  // Fallback controlado: nunca lanzamos.
  return partialAnalysis(input, clas, r.error);
}

/** Análisis parcial armado desde la KB (sin LLM), para no romper nunca el flujo. */
function partialAnalysis(input: LeadInput, clas: Clasificacion, motivo: string): LeadAnalysis {
  const ctx = buildReducedContext({
    industriaId: clas.industria_detectada || undefined,
    modulosRecomendados: clas.modulos_recomendados.map((m) => m.modulo),
    empleados: input.empleados,
    tamano: clas.tamano_estimado || undefined,
  });
  const ind = clas.industria_detectada ? getIndustry(clas.industria_detectada) : undefined;

  return {
    lectura_rapida: `Lead "${input.nombre}"${ind ? ` — encaja con ${ind.nombre}` : ''}. Análisis parcial (generador no disponible).`,
    industria_detectada: ind?.nombre ?? clas.industria_detectada,
    tamano_estimado: clas.tamano_estimado || (input.empleados != null ? `${input.empleados} empleados` : 'sin dato'),
    modulos_recomendados: ctx.modulos.map((m, i) => ({
      modulo: m.id,
      nombre: m.nombre,
      por_que: m.diferencial,
      prioridad: i === 0 ? 'alta' : i === 1 ? 'media' : 'baja',
    })),
    angulo_entrada: ctx.angulos[0]?.angulo ?? '',
    speech: {
      apertura: ctx.modulos[0]?.pitch ?? '',
      cuerpo: ctx.modulos.map((m) => `${m.nombre}: ${m.pitch}`).join(' '),
      cierre: ctx.pitch_templates.cierre ?? '',
    },
    preguntas_calificacion: ctx.preguntas.slice(0, 7).map((q) => ({ pregunta: q.pregunta, grupo: q.grupo, oro: q.oro })),
    objeciones_probables: ctx.modulos.flatMap((m) => m.objeciones).slice(0, 5),
    confianza: 'baja',
    datos_faltantes: [`Generador LLM no disponible: ${motivo}`],
    proximo_paso: 'Revisar manualmente y reintentar la generación con IA.',
  };
}

/* ─────────────────────────  API pública  ───────────────────────── */

export async function analizarLead(input: LeadInput, settings?: ProviderSettings, report?: ProviderReport): Promise<LeadAnalysis> {
  const clean = LeadInputSchema.parse(input); // valida la entrada (esto sí puede lanzar: es error del que llama)
  const provider = createProvider(settings, report); // 1 instancia por análisis → el budget/cap es por invocación
  const clasificacion = await clasificar(provider, clean);
  return generar(provider, clean, clasificacion);
}
