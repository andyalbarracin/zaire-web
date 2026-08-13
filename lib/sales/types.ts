// File: lib/sales/types.ts
// Motor de calificación de leads — esquemas zod + tipos de la base de conocimiento (KB)
// y del análisis de salida. La KB manda: los tipos reflejan zaire-sales-kb.json 1:1.
// El código valida al cargar (KB) y al recibir respuestas del LLM (LeadAnalysis / Clasificacion).

import { z } from 'zod';

/* ─────────────────────────  KB — Base de conocimiento  ───────────────────────── */

export const ObjectionSchema = z.object({
  tipo: z.string(),
  objecion: z.string(),
  respuesta: z.string(),
});

export const ModuleSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  estado: z.enum(['disponible', 'roadmap']),
  pitch: z.string(),
  capacidades: z.array(z.string()),
  diferencial: z.string(),
  icp: z.string(),
  senales_fit: z.array(z.string()),
  objeciones: z.array(ObjectionSchema),
});

export const RoadmapModuleSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  que: z.string(),
});

export const IndustrySchema = z.object({
  id: z.string(),
  nombre: z.string(),
  dolores: z.array(z.string()),
  modulos_fit: z.array(z.string()),
  vocabulario: z.array(z.string()),
});

export const SegmentSchema = z.object({
  id: z.string(),
  rango_empleados: z.string(),
  les_importa: z.array(z.string()),
  modulos_arranque: z.array(z.string()),
  tono_speech: z.string(),
});

export const PitchTemplatesSchema = z.object({
  apertura_por_industria: z.string(),
  cuerpo_por_modulo: z.string(),
  cierre_por_segmento: z.record(z.string(), z.string()),
});

export const EntryAngleSchema = z.object({
  modulo: z.string(),
  angulo: z.string(),
});

export const QualifyingQuestionSchema = z.object({
  grupo: z.string(),
  modulo: z.string(),
  pregunta: z.string(),
  oro: z.boolean(),
});

export const SalesKBSchema = z.object({
  meta: z.object({}).loose(),
  modules: z.array(ModuleSchema),
  roadmap_modulos: z.array(RoadmapModuleSchema),
  industries: z.array(IndustrySchema),
  segments: z.array(SegmentSchema),
  pitch_templates: PitchTemplatesSchema,
  entry_angles: z.array(EntryAngleSchema),
  qualifying_questions: z.array(QualifyingQuestionSchema),
  objection_families: z.array(z.string()),
});

export type Objection = z.infer<typeof ObjectionSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type RoadmapModule = z.infer<typeof RoadmapModuleSchema>;
export type Industry = z.infer<typeof IndustrySchema>;
export type Segment = z.infer<typeof SegmentSchema>;
export type PitchTemplates = z.infer<typeof PitchTemplatesSchema>;
export type EntryAngle = z.infer<typeof EntryAngleSchema>;
export type QualifyingQuestion = z.infer<typeof QualifyingQuestionSchema>;
export type SalesKB = z.infer<typeof SalesKBSchema>;

/* ─────────────────────────  Entrada del lead  ───────────────────────── */

export const LeadInputSchema = z.object({
  nombre: z.string().min(1),
  rubro: z.string().optional(),
  descripcion: z.string().optional(),
  web: z.string().optional(),
  empleados: z.number().int().positive().optional(),
  notas: z.string().optional(),
});
export type LeadInput = z.infer<typeof LeadInputSchema>;

/* ─────────────────────────  Paso A — Clasificación (barata)  ───────────────────────── */

export const PrioridadSchema = z.enum(['alta', 'media', 'baja']);
export const ConfianzaSchema = z.enum(['alta', 'media', 'baja']);

export const ClasificacionSchema = z.object({
  industria_detectada: z.string(),
  tamano_estimado: z.string(),
  modulos_recomendados: z.array(
    z.object({
      modulo: z.string(),
      por_que: z.string(),
      prioridad: PrioridadSchema,
    }),
  ),
  confianza: ConfianzaSchema,
  datos_faltantes: z.array(z.string()),
});
export type Clasificacion = z.infer<typeof ClasificacionSchema>;

/* ─────────────────────────  Paso B — Análisis completo (salida)  ───────────────────────── */

export const ModuloRecomendadoSchema = z.object({
  modulo: z.string(),
  nombre: z.string(),
  por_que: z.string(),
  prioridad: PrioridadSchema,
});

export const PreguntaCalificacionSchema = z.object({
  pregunta: z.string(),
  grupo: z.string(),
  oro: z.boolean(),
});

export const ObjecionProbableSchema = z.object({
  tipo: z.string(),
  objecion: z.string(),
  respuesta: z.string(),
});

export const SpeechSchema = z.object({
  apertura: z.string(),
  cuerpo: z.string(),
  cierre: z.string(),
});

// Nota: contamos con "5-7 preguntas" y "4-5 objeciones" a nivel de prompt.
// El validador exige estructura, no cuenta exacta (min 1), para no reintentar de más.
export const LeadAnalysisSchema = z.object({
  lectura_rapida: z.string(),
  industria_detectada: z.string(),
  tamano_estimado: z.string(),
  modulos_recomendados: z.array(ModuloRecomendadoSchema).min(1),
  angulo_entrada: z.string(),
  speech: SpeechSchema,
  preguntas_calificacion: z.array(PreguntaCalificacionSchema).min(1),
  objeciones_probables: z.array(ObjecionProbableSchema).min(1),
  confianza: ConfianzaSchema,
  datos_faltantes: z.array(z.string()),
  proximo_paso: z.string(),
});
export type LeadAnalysis = z.infer<typeof LeadAnalysisSchema>;
export type ModuloRecomendado = z.infer<typeof ModuloRecomendadoSchema>;
