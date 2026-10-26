// Importador de la investigación externa (JSON pegado desde ChatGPT/Claude) a la ficha del lead.
import { describe, it, expect } from 'vitest';
import { parseResearchImport, matchOption, tidyResearch, IMPORT_KEYS, type ImportResult } from '../lib/zaire-ops/research-import';
import { CRM_EMPLOYEES, CRM_INDUSTRIES } from '../lib/zaire-ops/crm-constants';

const ok = (raw: string) => {
  const r = parseResearchImport(raw);
  if (!r.ok) throw new Error(`${r.error.kind}: ${r.error.message}`);
  return r;
};
const err = (raw: string) => {
  const r: ImportResult = parseResearchImport(raw);
  if (r.ok) throw new Error('se esperaba error');
  return r.error;
};
const full = (o: Record<string, unknown>) => JSON.stringify({ ...Object.fromEntries(IMPORT_KEYS.map(k => [k, ''])), ...o });

describe('parseResearchImport — JSON válido', () => {
  it('1. corto, sin reparaciones', () => {
    const r = ok(full({ website: 'https://acme.com', employees: '21-50', research: '1) Lectura rápida' }));
    expect(r.notes.repairs).toEqual([]);
    expect(r.data).toEqual({ website: 'https://acme.com', employees: '21–50', research: '1) Lectura rápida' });
  });

  it.each([1_000, 5_000, 10_000, 20_000, 50_000])('2. research de %i caracteres se importa completo', (len) => {
    const research = ('1) Análisis comercial con "comillas" y ñ. '.repeat(Math.ceil(len / 40))).slice(0, len);
    const r = ok(full({ research }));
    expect(r.data.research?.length).toBe(research.trim().length);
  });

  it('3. caracteres especiales (acentos, ñ, emoji, <, &, \\u)', () => {
    const r = ok('{"city":"Neuquén ñ 🛢️ <b>&","market_notes":"\\u00e1rea"}');
    expect(r.data).toEqual({ city: 'Neuquén ñ 🛢️ <b>&', market_notes: 'área' });
  });

  it('4. strings con \\n escapado', () => {
    expect(ok('{"research":"1) A\\n2) B"}').data.research).toBe('1) A\n2) B');
  });

  it('5. bloque markdown, con y sin lenguaje', () => {
    expect(ok('```json\n{"phone":"+54 299 444"}\n```').data.phone).toBe('+54 299 444');
    expect(ok('```\n{"phone":"+54 299 444"}\n```').data.phone).toBe('+54 299 444');
  });

  it('6. envoltorio <escape>', () => {
    expect(ok('<escape>{"email":"info@acme.com"}</escape>').data.email).toBe('info@acme.com');
  });

  it('7. comillas internas bien escapadas', () => {
    expect(ok('{"research":"Speech: \\"Hola\\" y sigue"}').data.research).toBe('Speech: "Hola" y sigue');
  });

  it('12/13. employees vacío y todos vacíos: válido, sin datos que aplicar', () => {
    const r = ok(full({}));
    expect(r.data).toEqual({});
    expect(r.notes.invalid).toEqual([]);
  });

  it('10. claves faltantes: importa las presentes e informa las ausentes', () => {
    const r = ok('{"website":"https://acme.com"}');
    expect(r.data).toEqual({ website: 'https://acme.com' });
    expect(r.notes.missing).toContain('research');
  });

  it('11. valores fuera de las opciones: no se cargan y se informan', () => {
    const r = ok(full({ employees: 'entre 30 y 40', industry: 'Software' }));
    expect(r.data.employees).toBeUndefined();
    expect(r.notes.invalid).toEqual([{ key: 'industry', value: 'Software' }, { key: 'employees', value: 'entre 30 y 40' }]);
  });

  it('tipos: null → vacío, número → texto, lista → separada por comas, objeto → se ignora', () => {
    const r = ok('{"phone":null,"employees":500,"modules_interest":["Trace","Field"],"city":{"x":1},"otra":"x"}');
    expect(r.data.phone).toBeUndefined();
    expect(r.data.modules_interest).toBe('Trace, Field');
    expect(r.data.city).toBeUndefined();
    expect(r.notes.types.length).toBe(3);
    expect(r.notes.extra).toEqual(['otra']);
  });

  it('texto antes/después del JSON: se ignora y se informa', () => {
    const r = ok('Acá va la investigación:\n{"city":"Añelo"}\n¿Querés que profundice?');
    expect(r.notes.outsideText).toBe(true);
    expect(r.data.city).toBe('Añelo');
  });
});

describe('parseResearchImport — reparación conservadora y declarada', () => {
  it('saltos de línea reales dentro de research', () => {
    const r = ok('{"website":"https://acme.com","research":"1) Lectura rápida.\n2) Módulos: Trace."}');
    expect(r.data.research).toBe('1) Lectura rápida.\n2) Módulos: Trace.');
    expect(r.notes.repairs.join()).toMatch(/salto/);
  });

  it('8. comillas internas sin escapar (también seguidas de coma)', () => {
    const r = ok('{"research":"Apertura: "Hola Juan, ¿cómo estás?", después "el cuerpo" y cierre.","city":"Añelo"}');
    expect(r.data.research).toBe('Apertura: "Hola Juan, ¿cómo estás?", después "el cuerpo" y cierre.');
    expect(r.data.city).toBe('Añelo');
    expect(r.notes.repairs.join()).toMatch(/comilla/);
  });

  it('comillas tipográficas como delimitadores, coma final y espacio no separable', () => {
    const r = ok('{\u00a0“website”: “https://acme.com”, "city": "Añelo",}');
    expect(r.data).toEqual({ website: 'https://acme.com', city: 'Añelo' });
    expect(r.notes.repairs.length).toBeGreaterThanOrEqual(3);
  });

  it('comillas tipográficas DENTRO de un texto no se tocan', () => {
    expect(ok('{"market_notes":"sector con “alta rotación”"}').data.market_notes).toBe('sector con “alta rotación”');
  });
});

describe('parseResearchImport — errores específicos (sin adivinar)', () => {
  it('vacío', () => expect(err('   ').kind).toBe('vacio'));
  it('sin objeto', () => expect(err('No encontré información sobre esa empresa.').kind).toBe('sin_objeto'));

  it('9. truncado sin llave final', () => {
    expect(err('{"website":"https://acme.com","research":"1) Lectura rápida: empresa').kind).toBe('truncado');
  });

  it('15. contenido ambiguo: dos respuestas pegadas', () => {
    const e = err('{"website":"https://a.com"}\n{"website":"https://b.com"}');
    expect(e.kind).toBe('ambiguo');
    expect(e.message).toContain('website');
  });

  it('15. dos bloques de código con JSON', () => {
    expect(err('```json\n{"city":"A"}\n```\ny otro:\n```json\n{"city":"B"}\n```').kind).toBe('ambiguo');
  });

  it('cita de ChatGPT pegada entre campos: error de sintaxis con ubicación, no se adivina', () => {
    const e = err('{"website":"https://acme.com" ([acme.com](https://acme.com)),"city":"Neuquén"}');
    expect(e.kind).toBe('sintaxis');
    expect(e.line).toBe(1);
    expect(e.message).toContain('acme.com');
  });

  it('JSON que no es objeto / sin claves conocidas', () => {
    expect(err('[{"website":"x"}]').kind).toBe('no_objeto');
    expect(err('{"nombre":"Acme"}').kind).toBe('sin_claves');
  });
});

describe('tidyResearch', () => {
  it('secciones " | N)" → párrafos; otros "|" quedan', () => {
    expect(tidyResearch('1) Lectura | 2) Módulos: Trace | Field | 10) Fuentes')).toBe('1) Lectura\n\n2) Módulos: Trace | Field\n\n10) Fuentes');
  });
});

describe('matchOption (selects de la ficha)', () => {
  it('empleados con guion común o largo', () => {
    expect(matchOption('21-50', CRM_EMPLOYEES)).toBe('21–50');
    expect(matchOption('500+', CRM_EMPLOYEES)).toBe('500+');
    expect(matchOption('1-50', CRM_EMPLOYEES)).toBeNull(); // no confundir con 1–5
    expect(matchOption('', CRM_EMPLOYEES)).toBeNull();
  });

  it('industria con guiones/tildes distintos o sin el paréntesis', () => {
    expect(matchOption('Oil & Gas - Upstream (perforacion / extraccion)', CRM_INDUSTRIES)).toBe('Oil & Gas — Upstream (perforación / extracción)');
    expect(matchOption('Oil & Gas — Servicios de campo', CRM_INDUSTRIES)).toBe('Oil & Gas — Servicios de campo');
    expect(matchOption('mineria', CRM_INDUSTRIES)).toBe('Minería');
    expect(matchOption('Energía', CRM_INDUSTRIES)).toBeNull(); // ambiguo: generación vs renovables
  });
});
