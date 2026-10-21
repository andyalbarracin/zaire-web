'use client';
// activity-kit.tsx — piezas compartidas de actividades del CRM: ícono por tipo y fila (ficha + agenda).

import Link from 'next/link';
import { Phone, MessageCircle, Mail, Users, CheckSquare, ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { CrmActivity } from '@/lib/zaire-ops/crm';
import { CRM_ACTIVITY_LABEL, activityStatus, type CrmActivityKind } from '@/lib/zaire-ops/crm-constants';
import { fmtDayShort } from '@/lib/zaire-ops/dates';

const KIND_ICON: Record<CrmActivityKind, LucideIcon> = {
  llamar: Phone, whatsapp: MessageCircle, email: Mail, reunion: Users, tarea: CheckSquare,
};

export function KindIcon({ kind, size = 13 }: { kind: CrmActivityKind; size?: number }) {
  const Icon = KIND_ICON[kind] ?? CheckSquare;
  return <Icon size={size} aria-label={CRM_ACTIVITY_LABEL[kind]} style={{ flexShrink: 0 }} />;
}

export const leadLabel = (name?: string | null, company?: string | null) => name || company || '(sin nombre)';

/** "Hoy 10:00" / "Vencida · Lun 20/10" / "Mié 22/10 15:30". */
export function activityWhen(a: CrmActivity, today: string): string {
  const st = activityStatus(a, today);
  const day = st === 'today' ? 'Hoy' : fmtDayShort(a.due_date);
  return `${st === 'overdue' ? 'Vencida · ' : ''}${day}${a.due_time ? ` ${a.due_time}` : ''}`;
}

export function ActivityRow({
  a, today, lead, href, assignee, busy, showDescription, onToggle, onOpen,
}: {
  a: CrmActivity;
  today: string;
  lead?: string;
  href?: string;
  assignee?: string | null;
  busy?: boolean;
  showDescription?: boolean;
  onToggle: (a: CrmActivity) => void;
  onOpen?: (a: CrmActivity) => void;
}) {
  const st = activityStatus(a, today);
  const meta = [activityWhen(a, today), lead, assignee].filter(Boolean).join(' · ');
  return (
    <div className={`zo-act-row ${st}`}>
      <input
        type="checkbox" className="zo-act-check" checked={!!a.done_at} disabled={busy}
        onChange={() => onToggle(a)} aria-label={a.done_at ? 'Reabrir actividad' : 'Marcar como hecha'}
      />
      <span className="zo-act-ico"><KindIcon kind={a.kind} /></span>
      <div
        className={`zo-act-main${onOpen ? ' clickable' : ''}`}
        onClick={onOpen ? () => onOpen(a) : undefined}
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onKeyDown={onOpen ? e => { if (e.key === 'Enter') onOpen(a); } : undefined}
      >
        <div className="zo-act-title">{a.title}</div>
        <div className="zo-act-meta">{meta}</div>
        {showDescription && a.description && <div className="zo-act-desc">{a.description}</div>}
      </div>
      {href && <Link href={href} className="zo-act-link" title="Abrir ficha del lead"><ArrowUpRight size={14} /></Link>}
    </div>
  );
}
