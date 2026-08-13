// File: lib/sales/selector.ts
// Retriever "RAG-lite": filtra la KB y arma el CONTEXTO REDUCIDO que se le inyecta al LLM.
// Nunca se manda la KB entera: solo los 2-3 módulos de mejor fit, la industria y el segmento
// detectados, y los ángulos/preguntas/objeciones/plantillas que les corresponden.

import {
  getKB,
  getModule,
  getIndustry,
  getSegmentBySize,
  getAnglesForModules,
  getQuestionsForModules,
} from './kb';
import type { Module } from './types';

/* ── Contexto para el Paso A (CLASIFICAR): barato, solo catálogos mínimos ── */
export interface ClassificationContext {
  industrias: Array<{ id: string; nombre: string; vocabulario: string[] }>;
  modulos: Array<{ id: string; nombre: string; estado: string; icp: string }>;
  segmentos: Array<{ id: string; rango_empleados: string }>;
}

export function buildClassificationContext(): ClassificationContext {
  const kb = getKB();
  return {
    industrias: kb.industries.map((i) => ({ id: i.id, nombre: i.nombre, vocabulario: i.vocabulario })),
    modulos: kb.modules.map((m) => ({ id: m.id, nombre: m.nombre, estado: m.estado, icp: m.icp })),
    segmentos: kb.segments.map((s) => ({ id: s.id, rango_empleados: s.rango_empleados })),
  };
}

/* ── Contexto reducido para el Paso B (GENERAR) ── */
export interface ReducedContext {
  marca: { producto: string; tono: string };
  industria: { id: string; nombre: string; dolores: string[]; vocabulario: string[] } | null;
  segmento: {
    id: string;
    rango_empleados: string;
    tono_speech: string;
    les_importa: string[];
    modulos_arranque: string[];
  } | null;
  modulos: Array<{
    id: string;
    nombre: string;
    estado: string;
    pitch: string;
    capacidades: string[];
    diferencial: string;
    objeciones: Array<{ tipo: string; objecion: string; respuesta: string }>;
  }>;
  angulos: Array<{ modulo: string; angulo: string }>;
  preguntas: Array<{ grupo: string; modulo: string; pregunta: string; oro: boolean }>;
  pitch_templates: {
    apertura_por_industria: string;
    cuerpo_por_modulo: string;
    cierre: string | null;
  };
}

/**
 * Elige los mejores 2-3 módulos: primero los recomendados por la clasificación
 * (respetando su orden), y completa según el orden de fit de la industria. Cap = max.
 */
export function pickTopModules(industriaId: string | undefined, recomendados: string[], max = 3): Module[] {
  const order: string[] = [];
  const push = (id: string) => { if (id && !order.includes(id)) order.push(id); };

  recomendados.forEach(push);
  const ind = industriaId ? getIndustry(industriaId) : undefined;
  ind?.modulos_fit.forEach(push);

  const mods = order.map((id) => getModule(id)).filter((m): m is Module => Boolean(m));
  return mods.slice(0, max);
}

/**
 * Arma el contexto reducido. `tamano` puede venir como cantidad de empleados (número)
 * o como id de segmento (string). La industria y los módulos vienen de la clasificación.
 */
export function buildReducedContext(input: {
  industriaId?: string;
  modulosRecomendados: string[];
  empleados?: number;
  tamano?: string; // id de segmento, si no hay nº de empleados
}): ReducedContext {
  const kb = getKB();
  const marca = kb.meta.marca as { producto?: string; tono?: string } | undefined;

  const industria = input.industriaId ? getIndustry(input.industriaId) : undefined;

  const segmento =
    (input.empleados != null ? getSegmentBySize(input.empleados) : undefined) ??
    (input.tamano ? kb.segments.find((s) => s.id === input.tamano) : undefined);

  const topModules = pickTopModules(input.industriaId, input.modulosRecomendados, 3);
  const modIds = topModules.map((m) => m.id);

  const cierre = segmento ? kb.pitch_templates.cierre_por_segmento[segmento.id] ?? null : null;

  return {
    marca: { producto: marca?.producto ?? 'Zaire Industrial', tono: marca?.tono ?? '' },
    industria: industria
      ? { id: industria.id, nombre: industria.nombre, dolores: industria.dolores, vocabulario: industria.vocabulario }
      : null,
    segmento: segmento
      ? {
          id: segmento.id,
          rango_empleados: segmento.rango_empleados,
          tono_speech: segmento.tono_speech,
          les_importa: segmento.les_importa,
          modulos_arranque: segmento.modulos_arranque,
        }
      : null,
    modulos: topModules.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      estado: m.estado,
      pitch: m.pitch,
      capacidades: m.capacidades,
      diferencial: m.diferencial,
      objeciones: m.objeciones,
    })),
    angulos: getAnglesForModules([...modIds, 'suite']),
    preguntas: getQuestionsForModules(modIds, false),
    pitch_templates: {
      apertura_por_industria: kb.pitch_templates.apertura_por_industria,
      cuerpo_por_modulo: kb.pitch_templates.cuerpo_por_modulo,
      cierre,
    },
  };
}
