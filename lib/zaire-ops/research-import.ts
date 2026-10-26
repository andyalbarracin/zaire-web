// File: research-import.ts
// Path: zaire-web/lib/zaire-ops/research-import.ts
// Description: Importador de la investigación hecha afuera (JSON de ChatGPT/Claude) a la ficha del lead.
//   Etapas separadas, cada una con su propio error (nunca un "JSON inválido" genérico):
//   1) Normalización: solo quita envoltorios externos reconocibles (bloque ```, <escape>, BOM).
//   2) Ubicación: un único objeto; detecta respuesta cortada y contenido ambiguo (claves repetidas).
//   3) Parseo: JSON.parse estricto. Si falla, reparación CONSERVADORA y DECLARADA de los errores
//      típicos de los chats — saltos de línea reales y comillas sin escapar dentro de los textos,
//      comillas tipográficas como delimitadores, espacios no estándar y comas finales — y se vuelve
//      a parsear. Si aun así falla: error de sintaxis con línea, columna y contexto. No se adivina.
//   4) Validación: tipos, claves faltantes/desconocidas y opciones de los selects (industry/employees).
//   No escribe nada: la ficha muestra una vista previa y recién al aplicar llena los campos
//   (se persiste con "Guardar cambios"). Sin límite de largo propio: `research` es `text` en la DB.
//   Sin dependencias: corre en el navegador.

import { CRM_EMPLOYEES, CRM_INDUSTRIES } from './crm-constants';

export const IMPORT_KEYS = [
  'website', 'phone', 'email', 'address', 'city', 'industry', 'employees', 'modules_interest', 'market_notes', 'research',
] as const;
export type ImportKey = typeof IMPORT_KEYS[number];

export type ImportErrorKind = 'vacio' | 'sin_objeto' | 'ambiguo' | 'truncado' | 'sintaxis' | 'no_objeto' | 'sin_claves';
export interface ImportError { kind: ImportErrorKind; message: string; line?: number; column?: number }

export interface ImportNotes {
  repairs: string[];                                            // reparaciones aplicadas (declaradas)
  outsideText: boolean;                                         // había texto fuera del JSON (se ignoró)
  missing: ImportKey[];                                         // claves esperadas ausentes
  extra: string[];                                              // claves desconocidas (se ignoran)
  types: string[];                                              // valores no-string convertidos o ignorados
  invalid: { key: 'industry' | 'employees'; value: string }[];  // no coinciden con las opciones
}

export type ImportResult =
  | { ok: true; data: Partial<Record<ImportKey, string>>; notes: ImportNotes }
  | { ok: false; error: ImportError };

const fail = (kind: ImportErrorKind, message: string, pos?: { line: number; column: number }): ImportResult =>
  ({ ok: false, error: { kind, message, ...pos } });

/* ── 1) Normalización: solo envoltorios externos ─────────────────────────────── */
function unwrap(raw: string): { text: string; outside: boolean } | ImportResult {
  let t = raw.replace(/^﻿/, '').replace(/<\/?escape>/gi, '').trim();
  let outside = false;
  const fences = [...t.matchAll(/```[\w-]*[ \t]*\n?([\s\S]*?)```/g)];
  const withObject = fences.filter(f => f[1].includes('{'));
  if (withObject.length > 1) return fail('ambiguo', 'Hay más de un bloque de código con JSON. Pegá una sola respuesta.');
  if (withObject.length === 1) {
    outside = t.replace(withObject[0][0], '').trim().length > 0;
    t = withObject[0][1].trim();
  } else if (/^```/.test(t)) {
    t = t.replace(/^```[\w-]*[ \t]*\n?/, '').trim(); // bloque abierto sin cerrar (respuesta cortada)
  }
  return { text: t, outside };
}

/* ── 3) Reparación conservadora (solo dentro de lo que ya es un objeto) ─────────── */
// Comilla de cierre: la siguen `}` `]` `:`, el fin del texto, o `,` + el próximo valor/clave entre comillas.
function closesString(src: string, i: number): boolean {
  const rest = src.slice(i + 1);
  if (/^\s*([}\]:]|$)/.test(rest)) return true;
  return /^\s*,\s*([}\]]|["“”][^"“”\n]*["“”]\s*[:,}\]])/.test(rest);
}

function repair(src: string): { text: string; repairs: string[]; unterminated: boolean } {
  const n = { saltos: 0, comillas: 0, tipograficas: 0, espacios: 0, comas: 0, control: 0, escapes: 0 };
  let out = '';
  let inStr = false;
  let smart = false; // el string abrió con comilla tipográfica
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (!inStr) {
      if (/[  ​-‍⁠]/.test(c)) { n.espacios++; out += ' '; continue; }
      if (c === ',' && /^\s*[}\]]/.test(src.slice(i + 1))) { n.comas++; continue; }
      if (c === '"' || c === '“' || c === '”') {
        if (c !== '"') n.tipograficas++;
        inStr = true; smart = c !== '"'; out += '"'; continue;
      }
      out += c; continue;
    }
    if (c === '\\') {
      const nx = src[i + 1];
      if (nx !== undefined && '"\\/bfnrtu'.includes(nx)) { out += c + nx; i++; }
      else { n.escapes++; out += '\\\\'; }
      continue;
    }
    if (c === '\n') { n.saltos++; out += '\\n'; continue; }
    if (c === '\r') continue;
    if (c === '\t') { n.control++; out += '\\t'; continue; }
    if (c < ' ') { n.control++; out += ' '; continue; }
    const isQuote = c === '"' || (smart && (c === '“' || c === '”'));
    if (isQuote) {
      if (closesString(src, i)) { if (c !== '"') n.tipograficas++; out += '"'; inStr = false; }
      else { n.comillas++; out += '\\"'; }
      continue;
    }
    out += c;
  }
  const repairs: string[] = [];
  if (n.saltos) repairs.push(`${n.saltos} salto(s) de línea sin escapar dentro de los textos`);
  if (n.comillas) repairs.push(`${n.comillas} comilla(s) internas sin escapar`);
  if (n.tipograficas) repairs.push('comillas tipográficas usadas como delimitadores');
  if (n.comas) repairs.push(`${n.comas} coma(s) sobrante(s) antes de cerrar`);
  if (n.espacios) repairs.push('espacios no estándar fuera de los textos');
  if (n.control) repairs.push('caracteres de control (tabulaciones) dentro de los textos');
  if (n.escapes) repairs.push('barras invertidas sueltas');
  return { text: out, repairs, unterminated: inStr };
}

function position(text: string, err: unknown): { line: number; column: number; context: string } | null {
  const m = String((err as Error)?.message ?? '').match(/position (\d+)/);
  if (!m) return null;
  const p = Number(m[1]);
  const before = text.slice(0, p);
  const line = before.split('\n').length;
  const column = p - before.lastIndexOf('\n');
  const context = text.slice(Math.max(0, p - 35), p + 35).replace(/\s+/g, ' ').trim();
  return { line, column, context };
}

/* ── 4) Validación ─────────────────────────────────────────────────────────── */
function validate(obj: unknown, base: Pick<ImportNotes, 'repairs' | 'outsideText'>): ImportResult {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return fail('no_objeto', 'El JSON no es un objeto con las claves esperadas (vino una lista u otro valor).');
  }
  const rec = obj as Record<string, unknown>;
  const notes: ImportNotes = { ...base, missing: [], extra: [], types: [], invalid: [] };
  notes.extra = Object.keys(rec).filter(k => !(IMPORT_KEYS as readonly string[]).includes(k));
  const data: Partial<Record<ImportKey, string>> = {};
  for (const k of IMPORT_KEYS) {
    if (!(k in rec)) { notes.missing.push(k); continue; }
    const v = rec[k];
    let s: string;
    if (typeof v === 'string') s = v.trim();
    else if (v === null || v === undefined) s = '';
    else if (typeof v === 'number' || typeof v === 'boolean') { s = String(v); notes.types.push(`${k}: venía como ${typeof v}, se tomó como texto`); }
    else if (Array.isArray(v) && v.every(x => typeof x === 'string')) {
      s = v.map(x => x.trim()).filter(Boolean).join(', ');
      notes.types.push(`${k}: venía como lista, se unió separada por comas`);
    } else { notes.types.push(`${k}: tipo no válido (${Array.isArray(v) ? 'lista' : typeof v}), se ignora`); continue; }
    if (!s) continue;
    if (k === 'industry' || k === 'employees') {
      const m = matchOption(s, k === 'industry' ? CRM_INDUSTRIES : CRM_EMPLOYEES);
      if (!m) { notes.invalid.push({ key: k, value: s }); continue; }
      s = m;
    }
    data[k] = s;
  }
  if (notes.missing.length === IMPORT_KEYS.length) {
    return fail('sin_claves', `El JSON es válido pero no tiene ninguna de las claves esperadas (${IMPORT_KEYS.join(', ')}).`);
  }
  return { ok: true, data, notes };
}

/* ── Entrada ───────────────────────────────────────────────────────────────── */
export function parseResearchImport(raw: string): ImportResult {
  if (!raw.trim()) return fail('vacio', 'Pegá primero el JSON.');
  const u = unwrap(raw);
  if ('ok' in u) return u;
  const t = u.text;

  // 2) Ubicación
  if (t.startsWith('[')) return fail('no_objeto', 'Vino una lista ([…]) en lugar de un objeto. Pegá solo el objeto { … } con las claves esperadas.');
  const start = t.indexOf('{');
  if (start === -1) return fail('sin_objeto', 'No encontré un objeto JSON (falta la llave de apertura "{"). Pegá la respuesta completa.');
  const end = t.lastIndexOf('}');
  if (end < start) {
    return fail('truncado', 'La respuesta está cortada: el JSON no termina (falta la llave final "}"). Pedile al chat que la reenvíe completa.');
  }
  for (const k of IMPORT_KEYS) {
    const hits = t.match(new RegExp(`["“”]\\s*${k}\\s*["“”]\\s*:`, 'g'))?.length ?? 0;
    if (hits > 1) return fail('ambiguo', `La clave "${k}" aparece ${hits} veces: parece que pegaste más de una respuesta. Pegá un solo JSON.`);
  }
  const outsideText = u.outside || t.slice(0, start).trim().length > 0 || t.slice(end + 1).trim().length > 0;
  const objText = t.slice(start, end + 1);

  // 3) Parseo estricto
  try { return validate(JSON.parse(objText), { repairs: [], outsideText }); }
  catch { /* sigue con la reparación conservadora */ }

  const r = repair(objText);
  if (r.unterminated) {
    return fail('truncado', 'La respuesta está cortada: un texto quedó sin cerrar (probablemente "research"). Pedile al chat que la reenvíe completa.');
  }
  try { return validate(JSON.parse(r.text), { repairs: r.repairs, outsideText }); }
  catch (e) {
    const p = position(r.text, e);
    const where = p ? ` en la línea ${p.line}, columna ${p.column}, cerca de: «${p.context}»` : '';
    return fail('sintaxis', `Error de sintaxis JSON${where}. Corregí ese punto o pedile al chat que devuelva el JSON en un bloque de código.`, p ?? undefined);
  }
}

/** El prompt pide secciones en una sola línea separadas por " | " (para no romper el JSON): al aplicar, párrafos. */
export function tidyResearch(s: string): string {
  return s.replace(/\s+\|\s+(?=\d{1,2}\))/g, '\n\n').trim();
}

// "21-50" ↔ "21–50", "Oil & Gas - Upstream" ↔ "Oil & Gas — Upstream (…)": sin tildes, guiones ni mayúsculas.
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[‐‑‒–—―]/g, '-').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();

/** Busca el valor en una lista de opciones (select); exacto normalizado, o una sola coincidencia parcial. */
export function matchOption(value: string, options: readonly string[]): string | null {
  const v = norm(value);
  if (!v) return null;
  const exact = options.find(o => norm(o) === v);
  if (exact) return exact;
  // Parcial con límite de palabra ("Mantenimiento industrial" → "… / Servicios"; sin el paréntesis
  // final de la opción), y solo si hay UNA coincidencia: "1-50" no debe caer en "1–5".
  const partial = options.filter(o => {
    const n = norm(o), base = n.split(' (')[0];
    return v === base || n.startsWith(`${v} `) || n.startsWith(`${v}-`) || v.startsWith(`${base} `);
  });
  return partial.length === 1 ? partial[0] : null;
}
