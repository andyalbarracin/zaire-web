'use client';
// board.tsx — Tablero del CRM (kanban con drag-and-drop nativo, buscador, import/export).
// Estado local optimista; las mutaciones llaman server actions y refrescan el RSC.

import { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { Plus, Upload, Download, Pencil, Trash2, Search, SlidersHorizontal, Phone, Building2, User } from 'lucide-react';
import type { CrmStage, CrmLead } from '@/lib/zaire-ops/crm';
import { moveLeadA, deleteLeadA } from './actions';
import ImportModal from './import-modal';
import LeadModal from './lead-modal';
import StageManager from './stage-manager';

export default function CrmBoard({ initialStages, initialLeads }: { initialStages: CrmStage[]; initialLeads: CrmLead[] }) {
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [leadModal, setLeadModal] = useState<{ lead: CrmLead | null } | null>(null);
  const [stageMgr, setStageMgr] = useState(false);
  const [, startTransition] = useTransition();

  // Reconcilia con datos frescos del servidor (tras revalidate/refresh).
  useEffect(() => { setStages(initialStages); }, [initialStages]);
  useEffect(() => { setLeads(initialLeads); }, [initialLeads]);

  const firstStageId = stages[0]?.id ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(l => `${l.name ?? ''} ${l.phone ?? ''} ${l.company ?? ''} ${l.contact_person ?? ''} ${l.email ?? ''}`.toLowerCase().includes(q));
  }, [leads, search]);

  // Agrupa por etapa; los leads sin etapa (o etapa borrada) caen en la primera.
  const byStage = useMemo(() => {
    const valid = new Set(stages.map(s => s.id));
    const map = new Map<string, CrmLead[]>();
    for (const s of stages) map.set(s.id, []);
    for (const l of filtered) {
      const key = l.stage_id && valid.has(l.stage_id) ? l.stage_id : firstStageId;
      if (key) map.get(key)!.push(l);
    }
    return map;
  }, [filtered, stages, firstStageId]);

  function onDrop(stageId: string) {
    const id = dragId;
    setOverStage(null);
    setDragId(null);
    if (!id) return;
    const lead = leads.find(l => l.id === id);
    if (!lead || lead.stage_id === stageId) return;
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, stage_id: stageId } : l)));  // optimista
    const name = stages.find(s => s.id === stageId)?.name;
    startTransition(async () => { await moveLeadA(id, stageId, name); });
  }

  function removeLead(l: CrmLead) {
    if (!confirm(`¿Eliminar el lead "${l.name || l.company || l.phone || 'sin nombre'}"?`)) return;
    setLeads(prev => prev.filter(x => x.id !== l.id));  // optimista
    startTransition(async () => { await deleteLeadA(l.id); });
  }

  function exportRows() {
    const stageName = new Map(stages.map(s => [s.id, s.name]));
    return filtered.map(l => ({
      Nombre: l.name ?? '', Teléfono: l.phone ?? '', Empresa: l.company ?? '',
      Contacto: l.contact_person ?? '', Email: l.email ?? '', Etapa: stageName.get(l.stage_id ?? '') ?? '',
      Origen: l.source ?? '', Notas: l.notes ?? '',
    }));
  }
  function exportXLS() {
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CRM');
    XLSX.writeFile(wb, `Zaire_CRM_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  function exportCSV() {
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Zaire_CRM_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const refresh = () => startTransition(() => router.refresh());

  return (
    <>
      {/* Toolbar */}
      <div className="zo-crm-toolbar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="zo-btn zo-btn-primary zo-btn-sm" onClick={() => setLeadModal({ lead: null })}><Plus size={14} /> Nuevo lead</button>
          <button className="zo-btn zo-btn-sm" onClick={() => setImportOpen(true)}><Upload size={14} /> Importar</button>
          <div style={{ display: 'inline-flex' }}>
            <button className="zo-btn zo-btn-sm" style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} onClick={exportXLS}><Download size={14} /> XLS</button>
            <button className="zo-btn zo-btn-sm" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }} onClick={exportCSV}><Download size={14} /> CSV</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="zo-btn zo-btn-sm" onClick={() => setStageMgr(true)}><SlidersHorizontal size={14} /> Etapas</button>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input className="zo-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" style={{ padding: '8px 12px 8px 30px', fontSize: 12, minWidth: 200 }} />
          </div>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">No hay etapas todavía. Corré la migración <span className="zo-mono">0011_crm.sql</span> en Supabase y recargá.</div></div>
      ) : (
        <div className="zo-kanban">
          {stages.map(col => {
            const list = byStage.get(col.id) ?? [];
            const isOver = overStage === col.id && dragId != null;
            return (
              <div
                key={col.id}
                className={`zo-kan-col${isOver ? ' over' : ''}`}
                onDragOver={e => { if (dragId) { e.preventDefault(); setOverStage(col.id); } }}
                onDragLeave={() => setOverStage(s => (s === col.id ? null : s))}
                onDrop={e => { e.preventDefault(); onDrop(col.id); }}
              >
                <div className="zo-kan-head">
                  <span className="zo-dot" style={{ background: col.color }} />
                  <span className="zo-kan-name">{col.name}</span>
                  <span className="zo-kan-count">{list.length}</span>
                </div>
                <div className="zo-kan-body">
                  {list.length === 0 ? (
                    <div className="zo-kan-empty">—</div>
                  ) : list.map(l => (
                    <div
                      key={l.id}
                      className={`zo-kan-card${dragId === l.id ? ' dragging' : ''}`}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    >
                      <div className="zo-kan-card-top">
                        <Link href={`/dashboard/crm/${l.id}`} className="zo-kan-card-title" title="Abrir ficha">{l.name || l.company || '(sin nombre)'}</Link>
                        <div className="zo-kan-card-acts">
                          <Link href={`/dashboard/crm/${l.id}`} title="Abrir ficha"><Pencil size={13} /></Link>
                          <button onClick={() => removeLead(l)} title="Eliminar"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      {l.company && <div className="zo-kan-card-line"><Building2 size={12} /> {l.company}</div>}
                      {l.contact_person && <div className="zo-kan-card-line"><User size={12} /> {l.contact_person}</div>}
                      {l.phone && <a className="zo-kan-card-line zo-kan-phone" href={`tel:${l.phone}`}><Phone size={12} /> {l.phone}</a>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {importOpen && (
        <ImportModal
          stages={stages}
          defaultStageId={firstStageId}
          onClose={() => setImportOpen(false)}
          onImported={() => { setImportOpen(false); refresh(); }}
        />
      )}
      {leadModal && (
        <LeadModal
          lead={leadModal.lead}
          stages={stages}
          defaultStageId={firstStageId}
          onClose={() => setLeadModal(null)}
          onSaved={(id) => { setLeadModal(null); if (id) router.push(`/dashboard/crm/${id}`); else refresh(); }}
        />
      )}
      {stageMgr && (
        <StageManager
          stages={stages}
          onClose={() => setStageMgr(false)}
          onChanged={() => { setStageMgr(false); refresh(); }}
        />
      )}
    </>
  );
}
