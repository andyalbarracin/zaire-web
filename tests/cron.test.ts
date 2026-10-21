// Autorización: rutas de Vercel Cron (keep-alive / resumen diario) y acceso al panel (equipo).
import { describe, it, expect, afterEach } from 'vitest';
import { checkCron } from '../lib/cron';
import { isStaff } from '../lib/zaire-ops/staff';

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

describe('isStaff (acceso al panel)', () => {
  it('solo con app_metadata.zo_staff === true', () => {
    expect(isStaff({ app_metadata: { zo_staff: true } })).toBe(true);
    expect(isStaff({ app_metadata: { zo_portal: true } })).toBe(false); // cliente del portal
    expect(isStaff({ app_metadata: { zo_staff: 'true' } })).toBe(false);
    expect(isStaff({ app_metadata: {} })).toBe(false);
    expect(isStaff(null)).toBe(false);
  });
});
