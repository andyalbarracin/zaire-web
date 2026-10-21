// Fechas en hora Argentina, independientes de la TZ del server (Vercel = UTC).
import { describe, it, expect } from 'vitest';
import { todayLocal, nowTimeLocal, addDays, shiftMonth, monthBounds, fmtDateOnly, fmtDayShort, fmtTime, isDateOnly, fmtDateTimeLocal } from '../lib/zaire-ops/dates';

describe('dates (hora Argentina)', () => {
  it('después de las 21:00 ART sigue siendo hoy (en UTC ya es mañana)', () => {
    const t = new Date('2026-10-22T01:30:00Z'); // 21/10 22:30 en Argentina
    expect(todayLocal(t)).toBe('2026-10-21');
    expect(nowTimeLocal(t)).toBe('22:30');
    expect(fmtDateTimeLocal('2026-10-22T01:30:00Z')).toBe('21/10 22:30');
  });

  it('suma días y meses cruzando fin de mes/año', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(monthBounds('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('formatea fechas sin hora sin correrse un día', () => {
    expect(fmtDateOnly('2026-10-01')).toBe('01/10/2026');
    expect(fmtDateOnly(null)).toBe('—');
    expect(fmtDayShort('2026-10-21')).toBe('Mié 21/10');
    expect(fmtTime('10:30:00')).toBe('10:30');
  });

  it('valida fechas reales', () => {
    expect(isDateOnly('2026-02-28')).toBe(true);
    expect(isDateOnly('2026-02-30')).toBe(false);
    expect(isDateOnly('21/10/2026')).toBe(false);
  });
});
