// Tests unitarios de lógica pura (sin DB ni red): parseo, cadena de proveedores,
// validación de uploads, KBs y selector. Correr con `npm test`.
import { describe, it, expect } from 'vitest';
import { extractJson } from '../lib/sales/analyze';
import { chainProviders, type LLMProvider } from '../lib/sales/providers';
import { validateUpload } from '../lib/zaire-ops/upload-guard';
import { getContentKB, buildContentContext, getPlatform } from '../lib/sales/content-kb';
import { getSegmentBySize } from '../lib/sales/kb';

describe('extractJson', () => {
  it('saca fences ``` y toma el objeto', () => {
    expect(JSON.parse(extractJson('```json\n{"a":1}\n```'))).toEqual({ a: 1 });
    expect(JSON.parse(extractJson('basura {"a":2} más basura'))).toEqual({ a: 2 });
  });
});

describe('validateUpload', () => {
  const f = (name: string, type: string, size = 1000) => ({ name, type, size } as unknown as File);
  it('permite png', () => expect(validateUpload(f('a.png', 'image/png')).ok).toBe(true));
  it('bloquea svg', () => expect(validateUpload(f('a.svg', 'image/svg+xml')).ok).toBe(false));
  it('bloquea .html por extensión', () => expect(validateUpload(f('a.html', 'text/plain')).ok).toBe(false));
  it('limita el tamaño', () => expect(validateUpload(f('a.png', 'image/png', 60 * 1024 * 1024)).ok).toBe(false));
  it('fuerza octet-stream si el mime viene vacío', () => {
    const r = validateUpload(f('a.bin', ''));
    expect(r.ok && r.contentType).toBe('application/octet-stream');
  });
});

describe('chainProviders (cadena + cap + reporte)', () => {
  const mk = (name: string, fail = false): LLMProvider => ({ name, async complete() { if (fail) throw new Error('x'); return name; } });

  it('cae al siguiente ante error y reporta quién respondió', async () => {
    const report = { used: [] as string[] };
    const p = chainProviders([{ provider: mk('a', true), maxCalls: 1 }, { provider: mk('b'), maxCalls: Infinity }], report);
    expect(await p.complete({ system: '', user: '' })).toBe('b');
    expect(report.used).toEqual(['b']);
  });

  it('respeta el cap del primario y pasa al siguiente', async () => {
    const p = chainProviders([{ provider: mk('a'), maxCalls: 1 }, { provider: mk('b'), maxCalls: Infinity }]);
    expect(await p.complete({ system: '', user: '' })).toBe('a');
    expect(await p.complete({ system: '', user: '' })).toBe('b'); // 'a' agotó su cap
  });
});

describe('content KB', () => {
  it('valida y arma contexto reducido', () => {
    const kb = getContentKB();
    expect(kb.modulos.length).toBeGreaterThan(0);
    expect(getPlatform('LinkedIn')?.id).toBe('linkedin');
    const ctx = buildContentContext({ prompt: 'trazabilidad ISO 9001 y ordenes de trabajo', platformLabel: 'LinkedIn' });
    expect(ctx.plataforma?.id).toBe('linkedin');
    expect(ctx.modulos.some(m => m.id === 'trace')).toBe(true);
  });
});

describe('getSegmentBySize', () => {
  it('mapea empleados a segmento', () => {
    expect(getSegmentBySize(3)?.id).toBe('micro');
    expect(getSegmentBySize(50)?.id).toBe('mid');
    expect(getSegmentBySize(500)?.id).toBe('grande');
  });
});
