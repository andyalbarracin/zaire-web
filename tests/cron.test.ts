// Autorización de rutas de Vercel Cron (keep-alive / resumen diario).
import { describe, it, expect, afterEach } from 'vitest';
import { checkCron } from '../lib/cron';

const req = (auth?: string) => new Request('http://x/api/keepalive', { headers: auth ? { authorization: auth } : {} });

describe('checkCron', () => {
  afterEach(() => { delete process.env.CRON_SECRET; });

  it('sin CRON_SECRET: abierta si no es obligatoria, 503 si lo es', () => {
    expect(checkCron(req(), false)).toBeNull();
    expect(checkCron(req(), true)?.status).toBe(503);
  });

  it('con CRON_SECRET: exige el Bearer exacto', () => {
    process.env.CRON_SECRET = 's3cret';
    expect(checkCron(req(), false)?.status).toBe(401);
    expect(checkCron(req('Bearer otro'), true)?.status).toBe(401);
    expect(checkCron(req('Bearer s3cret'), true)).toBeNull();
  });
});
