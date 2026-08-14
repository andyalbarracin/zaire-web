'use client';
// board.tsx — Content deck: toggle Tabla / Kanban, dnd por estado, alta/edición.

import { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Plus, LayoutGrid, List, CalendarDays, SlidersHorizontal, Search, Pencil, Trash2, Paperclip, Upload, Download } from 'lucide-react';
import type { ContentStage, ContentItem } from '@/lib/zaire-ops/content';
import { moveItemA, deleteItemA } from './actions';
import ItemModal from './item-modal';
import ContentStageManager from './stage-manager';
import ContentImportModal from './import-modal';
import ContentCalendar from './calendar';

type Person = { id: string; name: string };

export default function ContentBoard({ initialStages, initialItems, people }: { initialStages: ContentStage[]; initialItems: ContentItem[]; people: Person[] }) {
  const nameById = useMemo(() => new Map(people.map(p => [p.id, p.name])), [people]);
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [items, setItems] = useState(initialItems);
  const [view, setView] = useState<'table' | 'board' | 'calendar'>('table');
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [itemModal, setItemModal] = useState<{ item: ContentItem | null; date?: string } | null>(null);
  const [stageMgr, setStageMgr] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => { setStages(initialStages); }, [initialStages]);
  useEffect(() => { setItems(initialItems); }, [initialItems]);

  const firstStageId = stages[0]?.id ?? null;
  const stageById = useMemo(() => new Map(stages.map(s => [s.id, s])), [stages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => `${i.title} ${i.body ?? ''}`.toLowerCase().includes(q));
  }, [items, search]);

  const byStage = useMemo(() => {
    const valid = new Set(stages.map(s => s.id));
    const map = new Map<string, ContentItem[]>();
    for (const s of stages) map.set(s.id, []);
    for (const it of filtered) {
      const key = it.status_id && valid.has(it.status_id) ? it.status_id : firstStageId;
      if (key) map.get(key)!.push(it);
    }
    return map;
  }, [filtered, stages, firstStageId]);

  function onDrop(stageId: string) {
    const id = dragId; setOverStage(null); setDragId(null);
    if (!id) return;
    const it = items.find(x => x.id === id);
    if (!it || it.status_id === stageId) return;
    setItems(prev => prev.map(x => (x.id === id ? { ...x, status_id: stageId } : x)));
    startTransition(async () => { await moveItemA(id, stageId); });
  }
  function removeItem(it: ContentItem) {
    if (!confirm(`¿Eliminar "${it.title || 'sin título'}"?`)) return;
    setItems(prev => prev.filter(x => x.id !== it.id));
    startTransition(async () => { await deleteItemA(it.id); });
  }
  const refresh = () => startTransition(() => router.refresh());
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });

  function exportRows() {
    const stageName = new Map(stages.map(s => [s.id, s.name]));
    return filtered.map(i => ({ Título: i.title, Texto: i.body ?? '', Estado: stageName.get(i.status_id ?? '') ?? '', Media: i.media.length, Actualizado: i.updated_at.slice(0, 10) }));
  }
  function exportXLS() {
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contenidos');
    XLSX.writeFile(wb, `Zaire_Contenidos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  function exportCSV() {
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const blob = new Blob(['﻿' + XLSX.utils.sheet_to_csv(ws)], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Zaire_Contenidos_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <div className="zo-crm-toolbar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="zo-btn zo-btn-primary zo-btn-sm" onClick={() => setItemModal({ item: null })}><Plus size={14} /> Nuevo contenido</button>
          <button className="zo-btn zo-btn-sm" onClick={() => setImportOpen(true)}><Upload size={14} /> Importar</button>
          <div style={{ display: 'inline-flex' }}>
            <button className="zo-btn zo-btn-sm" style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} onClick={exportXLS}><Download size={14} /> XLS</button>
            <button className="zo-btn zo-btn-sm" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }} onClick={exportCSV}><Download size={14} /> CSV</button>
          </div>
          <button className="zo-btn zo-btn-sm" onClick={() => setStageMgr(true)}><SlidersHorizontal size={14} /> Estados</button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex' }}>
            <button className={`zo-btn zo-btn-sm${view === 'table' ? ' zo-btn-primary' : ''}`} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }} onClick={() => setView('table')}><List size={14} /> Tabla</button>
            <button className={`zo-btn zo-btn-sm${view === 'board' ? ' zo-btn-primary' : ''}`} style={{ borderRadius: 0, borderLeft: 'none' }} onClick={() => setView('board')}><LayoutGrid size={14} /> Kanban</button>
            <button className={`zo-btn zo-btn-sm${view === 'calendar' ? ' zo-btn-primary' : ''}`} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }} onClick={() => setView('calendar')}><CalendarDays size={14} /> Calendario</button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input className="zo-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" style={{ padding: '8px 12px 8px 30px', fontSize: 12, minWidth: 200 }} />
          </div>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">No hay estados. Corré la migración <span className="zo-mono">0012_content.sql</span> en Supabase y recargá.</div></div>
      ) : view === 'table' ? (
        <div className="zo-table-wrap"><table className="zo-table">
          <thead><tr><th>Título</th><th>Plataforma</th><th>Estado</th><th>Fecha</th><th>Responsable</th><th>Revisado</th><th>Media</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}><div className="zo-empty">Todavía no hay contenidos.</div></td></tr>
            ) : filtered.map(it => {
              const st = it.status_id ? stageById.get(it.status_id) : null;
              return (
                <tr key={it.id} className="zo-rowclick" style={{ cursor: 'pointer' }} onClick={() => setItemModal({ item: it })}>
                  <td className="zo-rowlink">{it.title || '(sin título)'}{it.subtitle ? <div style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>{it.subtitle}</div> : null}</td>
                  <td>{it.platform ? <span className="zo-chip">{it.platform}</span> : '—'}</td>
                  <td>{st ? <span className="zo-chip"><span className="zo-dot" style={{ background: st.color }} />{st.name}</span> : '—'}</td>
                  <td className="zo-mono">{it.content_date ? fmt(it.content_date) : '—'}</td>
                  <td style={{ fontSize: 12 }}>{it.owner_id ? (nameById.get(it.owner_id) ?? '—') : '—'}</td>
                  <td>{it.reviewed_at ? <span className="zo-chip" style={{ background: 'rgba(34,197,94,.15)', color: '#22c55e' }}>✓ {it.reviewed_by ? (nameById.get(it.reviewed_by) ?? 'Sí') : 'Sí'}</span> : '—'}</td>
                  <td>{it.media.length ? <span className="zo-chip">{it.media.length} 📎</span> : '—'}</td>
                  <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <button className="zo-btn zo-btn-ghost zo-btn-sm" onClick={() => setItemModal({ item: it })} title="Editar"><Pencil size={13} /></button>
                    <button className="zo-btn zo-btn-ghost zo-btn-sm" onClick={() => removeItem(it)} title="Eliminar"><Trash2 size={13} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      ) : view === 'board' ? (
        <div className="zo-kanban">
          {stages.map(col => {
            const list = byStage.get(col.id) ?? [];
            const isOver = overStage === col.id && dragId != null;
            return (
              <div key={col.id} className={`zo-kan-col${isOver ? ' over' : ''}`}
                onDragOver={e => { if (dragId) { e.preventDefault(); setOverStage(col.id); } }}
                onDragLeave={() => setOverStage(s => (s === col.id ? null : s))}
                onDrop={e => { e.preventDefault(); onDrop(col.id); }}>
                <div className="zo-kan-head"><span className="zo-dot" style={{ background: col.color }} /><span className="zo-kan-name">{col.name}</span><span className="zo-kan-count">{list.length}</span></div>
                <div className="zo-kan-body">
                  {list.length === 0 ? <div className="zo-kan-empty">—</div> : list.map(it => (
                    <div key={it.id} className={`zo-kan-card${dragId === it.id ? ' dragging' : ''}`} draggable
                      onDragStart={() => setDragId(it.id)} onDragEnd={() => { setDragId(null); setOverStage(null); }}>
                      <div className="zo-kan-card-top">
                        <button className="zo-kan-card-title" onClick={() => setItemModal({ item: it })}>{it.title || '(sin título)'}</button>
                        <div className="zo-kan-card-acts">
                          <button onClick={() => setItemModal({ item: it })} title="Editar"><Pencil size={13} /></button>
                          <button onClick={() => removeItem(it)} title="Eliminar"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      {(it.platform || it.content_date) && (
                        <div className="zo-kan-card-line" style={{ gap: 8 }}>
                          {it.platform && <span style={{ color: '#aaa' }}>{it.platform}</span>}
                          {it.content_date && <span className="zo-mono" style={{ fontSize: 11 }}>{fmt(it.content_date)}</span>}
                          {it.reviewed_at && <span style={{ color: '#22c55e' }}>✓</span>}
                        </div>
                      )}
                      {it.body && <div className="zo-kan-card-line" style={{ color: '#888' }}>{it.body.slice(0, 80)}{it.body.length > 80 ? '…' : ''}</div>}
                      {it.media.length > 0 && <div className="zo-kan-card-line"><Paperclip size={12} /> {it.media.length} archivo(s)</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <ContentCalendar
          items={filtered}
          stages={stages}
          firstStageId={firstStageId}
          onOpen={(it) => setItemModal({ item: it })}
          onNew={(date) => setItemModal({ item: null, date })}
          onChanged={refresh}
        />
      )}

      {itemModal && <ItemModal item={itemModal.item} stages={stages} people={people} defaultStageId={firstStageId} defaultDate={itemModal.date} onClose={() => setItemModal(null)} onSaved={() => { setItemModal(null); refresh(); }} />}
      {stageMgr && <ContentStageManager stages={stages} onClose={() => setStageMgr(false)} onChanged={refresh} />}
      {importOpen && <ContentImportModal stages={stages} defaultStageId={firstStageId} onClose={() => setImportOpen(false)} onImported={() => { setImportOpen(false); refresh(); }} />}
    </>
  );
}
