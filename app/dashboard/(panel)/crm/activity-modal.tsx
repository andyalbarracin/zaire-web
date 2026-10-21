'use client';
// activity-modal.tsx — alta/edición de una actividad del CRM (desde la ficha del lead o el "＋" del calendario).

import { useMemo, useState } from 'react';
import { Check, RotateCcw, Trash2 } from 'lucide-react';
import type { CrmActivity, CrmLead } from '@/lib/zaire-ops/crm';
import { CRM_ACTIVITY_KINDS, CRM_ACTIVITY_LABEL, type CrmActivityKind } from '@/lib/zaire-ops/crm-constants';
import { todayLocal } from '@/lib/zaire-ops/dates';
import { createActivityA, updateActivityA, setActivityDoneA, deleteActivityA } from './actions';
import { KindIcon, leadLabel } from './activity-kit';

type Person = { id: string; name: string };

export default function ActivityModal({
  activity, leadId, leadName, leads, defaultDate, people, meId, onClose, onSaved, onDeleted,
}: {
  activity?: CrmActivity | null;
  leadId?: string;            // fijo (ficha del lead)
  leadName?: string;
  leads?: CrmLead[];          // sin leadId: selector de lead (calendario)
  defaultDate?: string;
  people: Person[];
  meId?: string;
  onClose: () => void;
  onSaved: (a: CrmActivity) => void;
  onDeleted?: (id: string) => void;
}) {
  const [kind, setKind] = useState<CrmActivityKind>(activity?.kind ?? 'llamar');
  const [title, setTitle] = useState(activity?.title ?? '');
  const [date, setDate] = useState(activity?.due_date ?? defaultDate ?? todayLocal());
  const [time, setTime] = useState(activity?.due_time ?? '');
  const [assignee, setAssignee] = useState(activity ? (activity.assignee_id ?? '') : (meId ?? ''));
  const [description, setDescription] = useState(activity?.description ?? '');
  const [pickedId, setPickedId] = useState(activity?.lead_id ?? leadId ?? '');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const picked = leads?.find(l => l.id === pickedId);
  const targetName = leadName ?? (picked ? leadLabel(picked.name, picked.company) : '');
  const placeholder = `${CRM_ACTIVITY_LABEL[kind]}${targetName ? ` a ${targetName}` : ''}`;
  const needsPicker = !leadId && !activity && !!leads;

  const matches = useMemo(() => {
    if (!leads) return [];
    const t = query.trim().toLowerCase();
    return leads
      .filter(l => !t || `${l.name ?? ''} ${l.company ?? ''} ${l.contact_person ?? ''} ${l.phone ?? ''}`.toLowerCase().includes(t))
      .slice(0, 50);
  }, [leads, query]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickedId) { setErr('Elegí el lead.'); return; }
    if (!date) { setErr('Elegí la fecha.'); return; }
    setBusy(true); setErr(null);
    const input = {
      kind, title: title.trim() || placeholder, description: description.trim() || null,
      due_date: date, due_time: time || null, assignee_id: assignee || null,
    };
    try {
      const saved = activity ? await updateActivityA(activity.id, input) : await createActivityA({ ...input, lead_id: pickedId });
      onSaved(saved);
    } catch (e) { setErr(e instanceof Error ? e.message : 'No se pudo guardar'); setBusy(false); }
  }

  async function toggleDone() {
    if (!activity) return;
    setBusy(true); setErr(null);
    try { onSaved(await setActivityDoneA(activity.id, !activity.done_at)); }
    catch (e) { setErr(e instanceof Error ? e.message : 'No se pudo actualizar'); setBusy(false); }
  }

  async function remove() {
    if (!activity || !confirm(`¿Eliminar la actividad "${activity.title}"?`)) return;
    setBusy(true); setErr(null);
    try { await deleteActivityA(activity.id); onDeleted?.(activity.id); }
    catch (e) { setErr(e instanceof Error ? e.message : 'No se pudo eliminar'); setBusy(false); }
  }

  return (
    <div className="zo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zo-modal" style={{ maxWidth: 520 }}>
        <h3>{activity ? 'Editar actividad' : 'Nueva actividad'}</h3>
        <p className="zo-modal-sub">
          {targetName ? <>Para <strong style={{ color: '#ddd' }}>{targetName}</strong>{activity?.done_at ? ' · hecha' : ''}</> : 'Agendá una tarea con fecha para un lead.'}
        </p>
        <form onSubmit={submit} className="zo-form zo-form-wide" style={{ gap: 14 }}>
          {needsPicker && (
            <div className="zo-field">
              <label className="zo-flabel">Lead *</label>
              {picked ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="zo-chip">{leadLabel(picked.name, picked.company)}{picked.company && picked.name ? ` · ${picked.company}` : ''}</span>
                  <button type="button" className="zo-btn zo-btn-sm zo-btn-ghost" onClick={() => setPickedId('')}>Cambiar</button>
                </div>
              ) : (
                <>
                  <input
                    className="zo-input" value={query} onChange={e => setQuery(e.target.value)} autoFocus
                    placeholder="Buscar por nombre, empresa, contacto o teléfono…"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (matches[0]) setPickedId(matches[0].id); } }}
                  />
                  <div className="zo-lead-pick">
                    {matches.length === 0
                      ? <div style={{ padding: '8px 11px', fontSize: 12.5, color: '#666' }}>Sin resultados.</div>
                      : matches.map(l => (
                        <button type="button" key={l.id} onClick={() => setPickedId(l.id)}>
                          {leadLabel(l.name, l.company)}{l.company && l.name ? <span style={{ color: '#777' }}> · {l.company}</span> : null}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="zo-field">
            <label className="zo-flabel">Tipo</label>
            <div className="zo-kind-chips">
              {CRM_ACTIVITY_KINDS.map(k => (
                <button type="button" key={k} className={`zo-chip zo-kind-chip${k === kind ? ' on' : ''}`} onClick={() => setKind(k)} aria-pressed={k === kind}>
                  <KindIcon kind={k} size={12} /> {CRM_ACTIVITY_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          <div className="zo-field"><label className="zo-flabel">Título</label>
            <input className="zo-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={placeholder} maxLength={200} autoFocus={!needsPicker} />
          </div>

          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Fecha *</label>
              <input className="zo-input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="zo-field"><label className="zo-flabel">Hora (opcional)</label>
              <input className="zo-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div className="zo-field"><label className="zo-flabel">Responsable</label>
            <select className="zo-select" value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Sin asignar (le llega a quien la creó)</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}{p.id === meId ? ' (yo)' : ''}</option>)}
            </select>
          </div>

          <div className="zo-field"><label className="zo-flabel">Descripción</label>
            <textarea className="zo-textarea" value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} style={{ minHeight: 70 }} placeholder="Qué hay que hacer o decir, contexto…" />
          </div>

          {err && <div className="zo-form-error">{err}</div>}
          <div className="zo-modal-actions" style={{ flexWrap: 'wrap' }}>
            {activity && (
              <>
                <button type="button" className="zo-btn zo-btn-sm zo-btn-ghost" style={{ color: '#ff6b5b' }} onClick={remove} disabled={busy}><Trash2 size={13} /> Eliminar</button>
                <button type="button" className="zo-btn zo-btn-sm" onClick={toggleDone} disabled={busy} style={{ marginRight: 'auto' }}>
                  {activity.done_at ? <><RotateCcw size={13} /> Reabrir</> : <><Check size={13} /> Marcar hecha</>}
                </button>
              </>
            )}
            <button type="button" className="zo-btn zo-btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="zo-btn zo-btn-primary zo-btn-sm" disabled={busy}>{busy ? 'Guardando…' : (activity ? 'Guardar' : 'Agendar')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
