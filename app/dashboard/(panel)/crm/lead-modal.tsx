'use client';
// lead-modal.tsx — alta/edición de un lead del CRM.

import { useState } from 'react';
import type { CrmStage, CrmLead, CrmLeadInput } from '@/lib/zaire-ops/crm';
import { createLeadA, updateLeadA } from './actions';

export default function LeadModal({
  lead, stages, defaultStageId, onClose, onSaved,
}: {
  lead: CrmLead | null;
  stages: CrmStage[];
  defaultStageId: string | null;
  onClose: () => void;
  onSaved: (newId?: string) => void;
}) {
  const [form, setForm] = useState({
    name: lead?.name ?? '', phone: lead?.phone ?? '', company: lead?.company ?? '',
    contact_person: lead?.contact_person ?? '', email: lead?.email ?? '', notes: lead?.notes ?? '',
    stage_id: lead?.stage_id ?? defaultStageId ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const input: CrmLeadInput = {
      name: form.name, phone: form.phone, company: form.company, contact_person: form.contact_person,
      email: form.email, notes: form.notes, stage_id: form.stage_id || null,
    };
    try {
      if (lead) { await updateLeadA(lead.id, input); onSaved(); }
      else { const { id } = await createLeadA(input); onSaved(id); }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error al guardar'); setBusy(false); }
  }

  return (
    <div className="zo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zo-modal" style={{ maxWidth: 520 }}>
        <h3>{lead ? 'Editar lead' : 'Nuevo lead'}</h3>
        <p className="zo-modal-sub">Datos del prospecto para llamar.</p>
        <form onSubmit={submit} className="zo-form zo-form-wide" style={{ gap: 14 }}>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Nombre</label><input className="zo-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre del lead" autoFocus /></div>
            <div className="zo-field"><label className="zo-flabel">Teléfono</label><input className="zo-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+54…" /></div>
            <div className="zo-field"><label className="zo-flabel">Empresa</label><input className="zo-input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div className="zo-field"><label className="zo-flabel">Contacto (persona)</label><input className="zo-input" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Con quién se habló" /></div>
            <div className="zo-field"><label className="zo-flabel">Email</label><input className="zo-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="zo-field"><label className="zo-flabel">Etapa</label>
              <select className="zo-select" value={form.stage_id} onChange={e => set('stage_id', e.target.value)}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="zo-field"><label className="zo-flabel">Notas</label><textarea className="zo-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} style={{ minHeight: 70 }} /></div>
          {err && <div className="zo-form-error">{err}</div>}
          <div className="zo-modal-actions">
            <button type="button" className="zo-btn zo-btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="zo-btn zo-btn-primary zo-btn-sm" disabled={busy}>{busy ? 'Guardando…' : (lead ? 'Guardar' : 'Crear lead')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
