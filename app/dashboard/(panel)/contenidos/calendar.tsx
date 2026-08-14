'use client';
// calendar.tsx — vista calendario del Content deck: contenidos ubicados por content_date,
// navegación por mes, alta en un día (＋) y generación de un lote de ideas por temática.

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import type { ContentItem, ContentStage } from '@/lib/zaire-ops/content';
import { contentKbListsA, generateIdeasA } from './actions';

const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function ContentCalendar({
  items, stages, firstStageId, onOpen, onNew, onChanged,
}: {
  items: ContentItem[];
  stages: ContentStage[];
  firstStageId: string | null;
  onOpen: (it: ContentItem) => void;
  onNew: (date: string) => void;
  onChanged: () => void;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [tematicas, setTematicas] = useState<{ id: string; titulo: string }[]>([]);
  const [tematicaId, setTematicaId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { contentKbListsA().then(r => setTematicas(r.tematicas)).catch(() => {}); }, []);

  const stageColor = new Map(stages.map(s => [s.id, s.color]));
  const today = new Date().toISOString().slice(0, 10);

  const startOffset = (new Date(cursor.y, cursor.m, 1).getDay() + 6) % 7; // Lun=0
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDate = new Map<string, ContentItem[]>();
  for (const it of items) {
    if (!it.content_date) continue;
    const k = it.content_date.slice(0, 10);
    if (!byDate.has(k)) byDate.set(k, []);
    byDate.get(k)!.push(it);
  }

  const prev = () => setCursor(c => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const next = () => setCursor(c => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));

  async function generateIdeas() {
    setBusy(true); setMsg(null);
    const r = await generateIdeasA({ tematicaId: tematicaId || undefined, count: 5, stageId: firstStageId });
    setBusy(false);
    if ('error' in r) { setMsg(r.error); return; }
    setMsg(`${r.created} idea(s) creada(s) sin fecha — asignales día desde la ficha o el calendario.`);
    onChanged();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="zo-btn zo-btn-sm" onClick={prev} title="Mes anterior"><ChevronLeft size={14} /></button>
          <strong style={{ minWidth: 150, textAlign: 'center' }}>{MONTHS[cursor.m]} {cursor.y}</strong>
          <button className="zo-btn zo-btn-sm" onClick={next} title="Mes siguiente"><ChevronRight size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="zo-select" value={tematicaId} onChange={e => setTematicaId(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">Temática (cualquiera)</option>
            {tematicas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
          </select>
          <button className="zo-btn zo-btn-sm" onClick={generateIdeas} disabled={busy}><Sparkles size={14} /> {busy ? 'Generando…' : 'Generar 5 ideas'}</button>
        </div>
      </div>

      {msg && <div className="zo-ai-note" style={{ marginBottom: 10 }}>{msg}</div>}

      <div className="zo-cal-grid">
        {DOW.map(d => <div key={d} className="zo-cal-dow">{d}</div>)}
        {cells.map((date, i) => (
          <div key={i} className={`zo-cal-cell${date === today ? ' today' : ''}${!date ? ' empty' : ''}`}>
            {date && (
              <>
                <div className="zo-cal-daynum">
                  <span>{Number(date.slice(8, 10))}</span>
                  <button className="zo-cal-add" title="Nuevo contenido este día" onClick={() => onNew(date)}><Plus size={12} /></button>
                </div>
                <div className="zo-cal-items">
                  {(byDate.get(date) ?? []).map(it => (
                    <button key={it.id} className="zo-cal-item" onClick={() => onOpen(it)} title={it.title || '(sin título)'}>
                      <span className="zo-dot" style={{ background: (it.status_id && stageColor.get(it.status_id)) || '#666' }} />
                      <span className="zo-cal-item-title">{it.title || '(sin título)'}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
