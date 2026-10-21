// File: crm-constants.ts
// Path: zaire-web/lib/zaire-ops/crm-constants.ts
// Description: Constantes compartidas del CRM (industrias, empleados, medio de contacto).
//   Sin directivas: se importa tanto en cliente (ficha) como en server (research/IA),
//   para que la IA sugiera valores que matcheen los selects.

export const CRM_INDUSTRIES = [
  'Oil & Gas — Upstream (perforación / extracción)',
  'Oil & Gas — Midstream (transporte / ductos)',
  'Oil & Gas — Downstream (refinación)',
  'Oil & Gas — Servicios de campo',
  'Energía — Generación eléctrica',
  'Energía — Renovables (solar / eólica)',
  'Minería',
  'Metalúrgica / Siderurgia',
  'Petroquímica / Química',
  'Manufactura / Industrial',
  'Alimentos y bebidas',
  'Agroindustria',
  'Construcción',
  'Automotriz / Autopartes',
  'Papel / Celulosa',
  'Cemento / Materiales',
  'Farmacéutica / Laboratorios',
  'Logística / Transporte',
  'Mantenimiento industrial / Servicios',
  'Agua / Saneamiento',
  'Otra',
];

export const CRM_EMPLOYEES = ['1–5', '6–20', '21–50', '51–200', '201–500', '500+'];

export const CRM_PREFERRED = ['Teléfono', 'WhatsApp', 'Email', 'LinkedIn', 'Presencial', 'Otro'];

/* ── Actividades (agenda por lead + calendario) ─────────────────────────────── */
export const CRM_ACTIVITY_KINDS = ['llamar', 'whatsapp', 'email', 'reunion', 'tarea'] as const;
export type CrmActivityKind = typeof CRM_ACTIVITY_KINDS[number];
export const CRM_ACTIVITY_LABEL: Record<CrmActivityKind, string> = {
  llamar: 'Llamar', whatsapp: 'WhatsApp', email: 'Email', reunion: 'Reunión', tarea: 'Tarea',
};

type ActivityLike = { lead_id: string; due_date: string; due_time: string | null; done_at: string | null };
export type ActivityStatus = 'done' | 'overdue' | 'today' | 'upcoming';

/** Estado de una actividad respecto de `today` ('YYYY-MM-DD', hora Argentina). Vencida = día pasado. */
export function activityStatus(a: { due_date: string; done_at: string | null }, today: string): ActivityStatus {
  if (a.done_at) return 'done';
  if (a.due_date < today) return 'overdue';
  if (a.due_date === today) return 'today';
  return 'upcoming';
}

/** Orden cronológico: fecha y después hora (las de "todo el día" primero). */
export function cmpActivity(a: Omit<ActivityLike, 'lead_id' | 'done_at'>, b: Omit<ActivityLike, 'lead_id' | 'done_at'>): number {
  return a.due_date.localeCompare(b.due_date) || (a.due_time ?? '').localeCompare(b.due_time ?? '');
}

/** Próxima actividad pendiente por lead (+ cuántas pendientes tiene), para el badge del kanban. */
export function nextByLead<T extends ActivityLike>(pending: T[]): Map<string, { next: T; count: number }> {
  const out = new Map<string, { next: T; count: number }>();
  for (const a of pending) {
    if (a.done_at) continue;
    const cur = out.get(a.lead_id);
    if (!cur) out.set(a.lead_id, { next: a, count: 1 });
    else { cur.count += 1; if (cmpActivity(a, cur.next) < 0) cur.next = a; }
  }
  return out;
}
