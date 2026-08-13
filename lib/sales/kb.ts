// File: lib/sales/kb.ts
// Carga + valida (zod) la base de conocimiento de ventas UNA sola vez (cache en memoria)
// y expone helpers de consulta. Ampliar la KB = editar el JSON; esta lógica no se toca.

import rawKb from './zaire-sales-kb.json';
import {
  SalesKBSchema,
  type SalesKB,
  type Module,
  type Industry,
  type Segment,
  type EntryAngle,
  type QualifyingQuestion,
  type Objection,
} from './types';

let _kb: SalesKB | null = null;

/** KB validada y cacheada. Falla ruidosamente si el JSON no cumple el esquema. */
export function getKB(): SalesKB {
  if (_kb) return _kb;
  const parsed = SalesKBSchema.safeParse(rawKb);
  if (!parsed.success) {
    throw new Error('KB inválida (zaire-sales-kb.json no cumple el esquema): ' + parsed.error.message);
  }
  _kb = parsed.data;
  return _kb;
}

/* ─────────────────────────  Helpers  ───────────────────────── */

export function getModule(id: string): Module | undefined {
  return getKB().modules.find((m) => m.id === id);
}

export function getIndustry(id: string): Industry | undefined {
  return getKB().industries.find((i) => i.id === id);
}

/** Segmento por cantidad de empleados. Parsea el rango textual de cada segmento. */
export function getSegmentBySize(nEmpleados: number): Segment | undefined {
  const segs = getKB().segments;
  for (const s of segs) {
    // rango_empleados: "1-5", "6-20", "21-100", "100+"
    const m = s.rango_empleados.match(/^(\d+)\s*(?:-\s*(\d+)|(\+))?$/);
    if (!m) continue;
    const min = Number(m[1]);
    const max = m[2] ? Number(m[2]) : m[3] ? Infinity : min;
    if (nEmpleados >= min && nEmpleados <= max) return s;
  }
  return undefined;
}

/** Módulos por ids, en el orden pedido (útil para respetar el orden de fit). */
export function getModulesByIds(ids: string[]): Module[] {
  return ids.map((id) => getModule(id)).filter((m): m is Module => Boolean(m));
}

/** Ángulos de entrada de los módulos dados (incluye 'suite' si se pide). */
export function getAnglesForModules(ids: string[]): EntryAngle[] {
  const set = new Set(ids);
  return getKB().entry_angles.filter((a) => set.has(a.modulo));
}

/**
 * Preguntas de calificación de los módulos dados + las genéricas "de oro".
 * soloOro=true deja únicamente las marcadas oro (para leads muy calientes).
 */
export function getQuestionsForModules(ids: string[], soloOro = false): QualifyingQuestion[] {
  const set = new Set(ids);
  const qs = getKB().qualifying_questions.filter(
    (q) => set.has(q.modulo) || q.modulo === 'generico',
  );
  return soloOro ? qs.filter((q) => q.oro) : qs;
}

/** Objeciones de los módulos dados (cada módulo trae ~5). */
export function getObjectionsForModules(ids: string[]): Array<Objection & { modulo: string }> {
  const out: Array<Objection & { modulo: string }> = [];
  for (const id of ids) {
    const mod = getModule(id);
    if (!mod) continue;
    for (const o of mod.objeciones) out.push({ ...o, modulo: id });
  }
  return out;
}
