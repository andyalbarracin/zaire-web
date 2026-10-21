// Resumen diario de actividades: a quién le llega cada una y contenido del email.
import { describe, it, expect } from 'vitest';
import { groupByRecipient, buildDigestEmail } from '../lib/zaire-ops/crm-digest';
import type { CrmActivityWithLead } from '../lib/zaire-ops/crm';

const act = (p: Partial<CrmActivityWithLead>): CrmActivityWithLead => ({
  id: Math.random().toString(), lead_id: 'L1', kind: 'llamar', title: 'Llamar', description: null,
  due_date: '2026-10-21', due_time: null, done_at: null, assignee_id: null, author_id: null,
  created_at: '', updated_at: '', lead_name: 'Frío SRL', lead_company: null, ...p,
});

describe('resumen diario del CRM', () => {
  it('responsable → si no, autor → si no, owners', () => {
    const g = groupByRecipient([
      act({ id: 'a', assignee_id: 'u2', author_id: 'u1' }),
      act({ id: 'b', author_id: 'u1' }),
      act({ id: 'c' }),
    ], ['owner1']);
    expect(g.get('u2')?.map(a => a.id)).toEqual(['a']);
    expect(g.get('u1')?.map(a => a.id)).toEqual(['b']);
    expect(g.get('owner1')?.map(a => a.id)).toEqual(['c']);
  });

  it('el email cuenta vencidas/hoy y escapa el texto del usuario', () => {
    const { subject, html } = buildDigestEmail('Andrés', [act({ due_date: '2026-10-20', title: '<b>x</b>' })], [act({}), act({})]);
    expect(subject).toBe('CRM · 2 para hoy · 1 vencida · ZAIRE Ops');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('/dashboard/crm?view=calendar');
  });
});
