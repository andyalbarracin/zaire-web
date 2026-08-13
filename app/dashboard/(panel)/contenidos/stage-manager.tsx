'use client';
// stage-manager.tsx — administra los estados del content deck (editables).

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import type { ContentStage } from '@/lib/zaire-ops/content';
import { createStageA, updateStageA, reorderStagesA, deleteStageA } from './actions';

const PALETTE = ['#3b82f6', '#a855f7', '#FF6A00', '#FFC107', '#22c55e', '#ef4444', '#6b7280', '#14b8a6'];

export default function ContentStageManager({ stages, onClose, onChanged }: { stages: ContentStage[]; onClose: () => void; onChanged: () => void }) {
  const [list, setList] = useState(stages);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setList(stages); }, [stages]);

  const rename = (id: string, name: string) => setList(l => l.map(s => (s.id === id ? { ...s, name } : s)));
  async function commitName(id: string, name: string) { await updateStageA(id, { name: name.trim() || 'Estado' }); onChanged(); }
  async function setColor(id: string, color: string) { setList(l => l.map(s => (s.id === id ? { ...s, color } : s))); await updateStageA(id, { color }); onChanged(); }
  async function move(idx: number, dir: -1 | 1) {
    const j = idx + dir; if (j < 0 || j >= list.length) return;
    const next = [...list]; [next[idx], next[j]] = [next[j], next[idx]]; setList(next);
    await reorderStagesA(next.map(s => s.id)); onChanged();
  }
  async function add() {
    const name = newName.trim(); if (!name) return;
    setBusy(true); await createStageA(name, PALETTE[list.length % PALETTE.length]); setNewName(''); setBusy(false); onChanged();
  }
  async function remove(s: ContentStage) {
    const others = list.filter(x => x.id !== s.id);
    if (!confirm(`Eliminar el estado "${s.name}"?${others.length ? ` Sus contenidos pasan a "${others[0].name}".` : ''}`)) return;
    setList(others); await deleteStageA(s.id, others[0]?.id ?? null); onChanged();
  }

  return (
    <div className="zo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zo-modal" style={{ maxWidth: 520 }}>
        <h3>Estados del contenido</h3>
        <p className="zo-modal-sub">Editá los nombres, el color y el orden.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {list.map((s, i) => (
            <div key={s.id} className="zo-stage-row">
              <div className="zo-stage-colors">
                {PALETTE.map(c => <button key={c} type="button" onClick={() => setColor(s.id, c)} className={`zo-swatch${s.color === c ? ' on' : ''}`} style={{ background: c }} />)}
              </div>
              <input className="zo-input" value={s.name} onChange={e => rename(s.id, e.target.value)} onBlur={e => commitName(s.id, e.target.value)} style={{ fontSize: 13, padding: '8px 10px' }} />
              <div className="zo-stage-acts">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1}><ArrowDown size={14} /></button>
                <button type="button" onClick={() => remove(s)} disabled={list.length <= 1}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="zo-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nuevo estado…" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} style={{ fontSize: 13, padding: '8px 10px' }} />
          <button type="button" className="zo-btn zo-btn-sm" onClick={add} disabled={busy || !newName.trim()}><Plus size={14} /> Agregar</button>
        </div>
        <div className="zo-modal-actions" style={{ marginTop: 18 }}><button type="button" className="zo-btn zo-btn-sm" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>
  );
}
