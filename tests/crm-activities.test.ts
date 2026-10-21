// Lógica pura de actividades del CRM: estado (vencida/hoy/próxima/hecha), orden y próxima por lead.
import { describe, it, expect } from 'vitest';
import { activityStatus, cmpActivity, nextByLead } from '../lib/zaire-ops/crm-constants';

const act = (p: Partial<{ id: string; lead_id: string; due_date: string; due_time: string | null; done_at: string | null }>) => ({
  id: 'x', lead_id: 'L1', due_date: '2026-10-21', due_time: null, done_at: null, ...p,
});

describe('actividades del CRM', () => {
  const today = '2026-10-21';

  it('estado según el día (vencida = día pasado, no la hora)', () => {
    expect(activityStatus(act({ due_date: '2026-10-20' }), today)).toBe('overdue');
    expect(activityStatus(act({ due_date: today, due_time: '08:00' }), today)).toBe('today');
    expect(activityStatus(act({ due_date: '2026-10-22' }), today)).toBe('upcoming');
    expect(activityStatus(act({ due_date: '2026-10-01', done_at: '2026-10-02T10:00:00Z' }), today)).toBe('done');
  });

  it('ordena por fecha y hora (sin hora primero)', () => {
    const list = [act({ id: 'c', due_time: '15:00' }), act({ id: 'a', due_date: '2026-10-20' }), act({ id: 'b' })];
    expect(list.sort(cmpActivity).map(a => a.id)).toEqual(['a', 'b', 'c']);
  });

  it('próxima pendiente por lead + cantidad (ignora hechas)', () => {
    const m = nextByLead([
      act({ id: '1', lead_id: 'L1', due_date: '2026-10-25' }),
      act({ id: '2', lead_id: 'L1', due_date: '2026-10-19' }),
      act({ id: '3', lead_id: 'L2', due_date: '2026-10-30' }),
      act({ id: '4', lead_id: 'L2', due_date: '2026-10-01', done_at: '2026-10-01T12:00:00Z' }),
    ]);
    expect(m.get('L1')).toMatchObject({ count: 2, next: { id: '2' } });
    expect(m.get('L2')).toMatchObject({ count: 1, next: { id: '3' } });
  });
});
