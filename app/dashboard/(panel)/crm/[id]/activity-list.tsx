'use client';
// activity-list.tsx — card "Actividades" de la ficha del lead: próximas tareas con fecha
// (llamar, WhatsApp, email, reunión, tarea), completar con un click, editar y agendar nuevas.

import { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import type { CrmActivity } from '@/lib/zaire-ops/crm';
import { cmpActivity } from '@/lib/zaire-ops/crm-constants';
import { todayLocal } from '@/lib/zaire-ops/dates';
import { setActivityDoneA } from '../actions';
import { ActivityRow } from '../activity-kit';
import ActivityModal from '../activity-modal';

type Person = { id: string; name: string };

export default function ActivityList({
  leadId, leadName, activities, people, meId,
}: {
  leadId: string;
  leadName: string;
  activities: CrmActivity[] | null; // null = migración 0017 sin correr
  people: Person[];
  meId?: string;
}) {
  const [items, setItems] = useState(activities);
  useEffect(() => { setItems(activities); }, [activities]); // datos frescos tras revalidar
  const [modal, setModal] = useState<{ activity: CrmActivity | null } | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const today = todayLocal();
  const nameOf = (id: string | null) => (id ? people.find(p => p.id === id)?.name ?? null : null);

  if (items === null) {
    return (
      <div className="zo-card">
        <div className="zo-card-title">// ACTIVIDADES</div>
        <div style={{ fontSize: 12.5, color: '#888', lineHeight: 1.6 }}>
          Para agendar actividades con fecha corré la migración <span className="zo-mono">0017_crm_activities.sql</span> en Supabase y recargá.
        </div>
      </div>
    );
  }

  const pending = items.filter(a => !a.done_at).sort(cmpActivity);
  const done = items.filter(a => a.done_at).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''));

  const upsert = (a: CrmActivity) => setItems(prev => {
    const list = prev ?? [];
    return list.some(x => x.id === a.id) ? list.map(x => (x.id === a.id ? a : x)) : [...list, a];
  });

  async function toggle(a: CrmActivity) {
    setBusyId(a.id); setErr(null);
    upsert({ ...a, done_at: a.done_at ? null : new Date().toISOString() }); // optimista
    try { upsert(await setActivityDoneA(a.id, !a.done_at)); }
    catch { upsert(a); setErr('No se pudo actualizar la actividad.'); }
    finally { setBusyId(null); }
  }

  return (
    <div className="zo-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div className="zo-card-title" style={{ margin: 0 }}>// ACTIVIDADES{pending.length ? ` · ${pending.length}` : ''}</div>
        <button type="button" className="zo-btn zo-btn-sm" onClick={() => setModal({ activity: null })}><Plus size={13} /> Agendar</button>
      </div>

      {pending.length === 0 && (
        <div style={{ fontSize: 12.5, color: '#666', padding: '4px 0 2px' }}>Sin tareas pendientes. Agendá la próxima: llamar, mandar un WhatsApp, una reunión…</div>
      )}
      {pending.map(a => (
        <ActivityRow
          key={a.id} a={a} today={today} assignee={nameOf(a.assignee_id)} busy={busyId === a.id} showDescription
          onToggle={toggle} onOpen={x => setModal({ activity: x })}
        />
      ))}

      {done.length > 0 && (
        <>
          <button type="button" className="zo-act-donebtn" onClick={() => setShowDone(v => !v)} aria-expanded={showDone}>
            {showDone ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Hechas ({done.length})
          </button>
          {showDone && done.map(a => (
            <ActivityRow key={a.id} a={a} today={today} busy={busyId === a.id} onToggle={toggle} onOpen={x => setModal({ activity: x })} />
          ))}
        </>
      )}
      {err && <div className="zo-form-error" style={{ marginTop: 10 }}>{err}</div>}

      {modal && (
        <ActivityModal
          activity={modal.activity}
          leadId={leadId}
          leadName={leadName}
          people={people}
          meId={meId}
          onClose={() => setModal(null)}
          onSaved={a => { upsert(a); setModal(null); }}
          onDeleted={id => { setItems(prev => (prev ?? []).filter(x => x.id !== id)); setModal(null); }}
        />
      )}
    </div>
  );
}
