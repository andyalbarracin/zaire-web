'use client';
// calendar.tsx — vista Calendario del CRM: actividades de los leads ubicadas por fecha (mes) +
// agenda lateral (día elegido / vencidas / hoy / próximos 7 días) con check rápido.
// El mes se pide al server al navegar; las pendientes llegan por props (se refrescan al revalidar).

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { CrmActivity, CrmActivityWithLead, CrmLead } from '@/lib/zaire-ops/crm';
import { activityStatus, cmpActivity } from '@/lib/zaire-ops/crm-constants';
import { addDays, fmtDayShort, monthBounds, todayLocal } from '@/lib/zaire-ops/dates';
import MonthCalendar from '@/app/dashboard/_components/month-calendar';
import { listActivitiesRangeA, setActivityDoneA } from './actions';
import { ActivityRow, KindIcon, leadLabel } from './activity-kit';
import ActivityModal from './activity-modal';

type Person = { id: string; name: string };
const SECTION_LIMIT = 6;

export default function CrmCalendar({
  leads, people, meId, pending: pendingProp, month, onMonthChange, search, reloadKey = 0,
}: {
  leads: CrmLead[];
  people: Person[];
  meId?: string;
  pending: CrmActivityWithLead[];
  month: string;
  onMonthChange: (ym: string) => void;
  search: string;
  reloadKey?: number; // el padre lo incrementa para releer el mes (ej. alta desde la barra)
}) {
  const today = todayLocal();
  const [pending, setPending] = useState(pendingProp);
  useEffect(() => { setPending(pendingProp); }, [pendingProp]);
  const [range, setRange] = useState<CrmActivityWithLead[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeErr, setRangeErr] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [modal, setModal] = useState<{ activity: CrmActivity | null; date?: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const reqId = useRef(0);
  const agendaRef = useRef<HTMLDivElement>(null);

  const leadById = useMemo(() => new Map(leads.map(l => [l.id, l])), [leads]);
  const back = encodeURIComponent(`/dashboard/crm?view=calendar&m=${month}`);
  const hrefOf = (a: CrmActivity) => `/dashboard/crm/${a.lead_id}?back=${back}`;
  const labelOf = (a: CrmActivityWithLead) => leadLabel(a.lead_name, a.lead_company);
  const nameOf = (id: string | null) => (id ? people.find(p => p.id === id)?.name ?? null : null);

  async function loadRange(ym: string) {
    const id = ++reqId.current;
    setLoading(true);
    const { from, to } = monthBounds(ym);
    try {
      const r = await listActivitiesRangeA(from, to);
      if (id !== reqId.current) return; // llegó tarde: ya se pidió otro mes
      setRange(r ?? []);
      setRangeErr(r === null);
    } catch {
      if (id === reqId.current) setRangeErr(true);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }
  useEffect(() => { loadRange(month); }, [month, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = search.trim().toLowerCase();
  const matches = (a: CrmActivityWithLead) => !q || `${a.lead_name ?? ''} ${a.lead_company ?? ''} ${a.title}`.toLowerCase().includes(q);

  const monthItems = (range ?? []).filter(matches);
  const pend = pending.filter(matches);
  const overdue = pend.filter(a => a.due_date < today);
  const todays = pend.filter(a => a.due_date === today);
  const week = pend.filter(a => a.due_date > today && a.due_date <= addDays(today, 7));
  const dayItems = selected ? monthItems.filter(a => a.due_date === selected).sort(cmpActivity) : [];
  const modalLead = modal?.activity ? leadById.get(modal.activity.lead_id) : undefined;

  function patchLocal(a: CrmActivity, done_at: string | null) {
    setRange(prev => prev?.map(x => (x.id === a.id ? { ...x, done_at } : x)) ?? prev);
    setPending(prev => (done_at ? prev.filter(x => x.id !== a.id) : prev));
  }

  async function toggle(a: CrmActivity) {
    setBusyId(a.id);
    const nextDone = a.done_at ? null : new Date().toISOString();
    patchLocal(a, nextDone); // optimista
    try {
      await setActivityDoneA(a.id, !a.done_at);
      if (!nextDone) loadRange(month); // reabierta: vuelve a pendientes al revalidar
    } catch {
      patchLocal(a, a.done_at);
      loadRange(month);
    } finally { setBusyId(null); }
  }

  function selectDay(date: string) {
    setSelected(s => (s === date ? null : date));
    if (typeof window !== 'undefined' && window.innerWidth <= 720) {
      setTimeout(() => agendaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }

  // Función de render (no componente): así las filas no se remontan en cada render.
  const section = ({ id, title, list, tone, onAdd, empty }: {
    id: string; title: string; list: CrmActivityWithLead[]; tone?: string; onAdd?: () => void; empty?: string;
  }) => {
    const open = expanded.has(id);
    const shown = open ? list : list.slice(0, SECTION_LIMIT);
    return (
      <div key={id} className={`zo-agenda-sec${tone ? ` ${tone}` : ''}`}>
        <div className="zo-agenda-head">
          <span>{title} ({list.length})</span>
          {onAdd && <button className="zo-cal-add" onClick={onAdd} title="Agregar actividad" aria-label="Agregar actividad"><Plus size={13} /></button>}
        </div>
        {list.length === 0
          ? <div className="zo-agenda-empty">{empty ?? 'Nada por acá.'}</div>
          : shown.map(a => (
            <ActivityRow
              key={a.id} a={a} today={today} lead={labelOf(a)} href={hrefOf(a)} assignee={nameOf(a.assignee_id)}
              busy={busyId === a.id} onToggle={toggle} onOpen={x => setModal({ activity: x })}
            />
          ))}
        {list.length > SECTION_LIMIT && (
          <button className="zo-act-donebtn" onClick={() => setExpanded(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}>
            {open ? 'Ver menos' : `Ver ${list.length - SECTION_LIMIT} más`}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="zo-crmcal">
      <div className="zo-crmcal-main">
        {rangeErr && (
          <div className="zo-form-error" style={{ marginBottom: 10 }}>
            No se pudieron leer las actividades. Si todavía no corriste la migración <span className="zo-mono">0017_crm_activities.sql</span>, correla en Supabase y recargá.
          </div>
        )}
        <MonthCalendar
          month={month}
          onMonthChange={m => { setSelected(null); onMonthChange(m); }}
          items={monthItems}
          getDate={a => a.due_date}
          getKey={a => a.id}
          loading={loading}
          maxPerCell={3}
          selected={selected}
          onDayClick={selectDay}
          onNew={date => setModal({ activity: null, date })}
          newTitle="Nueva actividad este día"
          renderItem={a => {
            const st = activityStatus(a, today);
            return (
              <Link
                href={hrefOf(a)} onClick={e => e.stopPropagation()}
                className={`zo-cal-item zo-act-chip ${st}`}
                title={`${a.due_time ? `${a.due_time} · ` : ''}${labelOf(a)} — ${a.title}`}
              >
                <KindIcon kind={a.kind} size={11} />
                <span className="zo-cal-item-title">{a.due_time ? `${a.due_time} ` : ''}{labelOf(a)} · {a.title}</span>
              </Link>
            );
          }}
        />
      </div>

      <div className="zo-agenda" ref={agendaRef}>
        {selected && section({
          id: 'day', tone: 'day', title: selected === today ? 'Hoy' : fmtDayShort(selected), list: dayItems,
          onAdd: () => setModal({ activity: null, date: selected }), empty: 'Sin actividades este día.',
        })}
        {section({ id: 'overdue', tone: 'overdue', title: 'Vencidas', list: overdue, empty: 'Nada vencido.' })}
        {section({ id: 'today', tone: 'today', title: 'Hoy', list: todays, onAdd: () => setModal({ activity: null, date: today }), empty: 'Nada para hoy.' })}
        {section({ id: 'week', title: 'Próximos 7 días', list: week, empty: 'Nada agendado.' })}
      </div>

      {modal && (
        <ActivityModal
          activity={modal.activity}
          leadId={modal.activity?.lead_id}
          leadName={modalLead ? leadLabel(modalLead.name, modalLead.company) : undefined}
          leads={leads}
          defaultDate={modal.date}
          people={people}
          meId={meId}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadRange(month); }}
          onDeleted={() => { setModal(null); loadRange(month); }}
        />
      )}
    </div>
  );
}
