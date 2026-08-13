'use client';
// import-modal.tsx — importar contenidos desde CSV / XLS / XLSX (título + texto).

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import type { ContentStage } from '@/lib/zaire-ops/content';
import { importItemsA } from './actions';

type Field = 'title' | 'body';
const FIELDS: { key: Field; label: string; syn: string[] }[] = [
  { key: 'title', label: 'Título', syn: ['titulo', 'título', 'title', 'nombre', 'name', 'asunto'] },
  { key: 'body', label: 'Texto', syn: ['texto', 'body', 'contenido', 'copy', 'descripcion', 'descripción', 'cuerpo', 'nota', 'notas'] },
];
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

export default function ContentImportModal({
  stages, defaultStageId, onClose, onImported,
}: {
  stages: ContentStage[];
  defaultStageId: string | null;
  onClose: () => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<Field, number>>({ title: -1, body: -1 });
  const [statusId, setStatusId] = useState<string>(defaultStageId ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErr(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '', raw: false, blankrows: false });
      if (!matrix.length) { setErr('El archivo no tiene filas.'); return; }
      const hdr = (matrix[0] as unknown[]).map((h, i) => String(h ?? '').trim() || `Columna ${i + 1}`);
      const body = (matrix.slice(1) as unknown[][]).map(r => hdr.map((_, i) => String(r[i] ?? '').trim()));
      const auto: Record<Field, number> = { title: -1, body: -1 };
      for (const f of FIELDS) auto[f.key] = hdr.findIndex(h => f.syn.some(s => norm(h) === s || norm(h).includes(s)));
      setFileName(file.name); setHeaders(hdr); setRows(body); setMapping(auto);
    } catch { setErr('No se pudo leer el archivo. Probá con CSV, XLS o XLSX.'); }
  }

  function downloadTemplate(kind: 'csv' | 'xlsx') {
    const ws = XLSX.utils.aoa_to_sheet([FIELDS.map(f => f.label)]);
    if (kind === 'xlsx') {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
      XLSX.writeFile(wb, 'Zaire_Contenidos_plantilla.xlsx');
    } else {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Zaire_Contenidos_plantilla.csv'; a.click(); URL.revokeObjectURL(a.href);
    }
  }

  const mappedCount = Object.values(mapping).filter(i => i >= 0).length;

  async function doImport() {
    if (mappedCount === 0) { setErr('Mapeá al menos una columna (por ejemplo, Título).'); return; }
    setBusy(true); setErr(null);
    const payload = rows.map(r => ({
      title: mapping.title >= 0 ? r[mapping.title] : '',
      body: mapping.body >= 0 ? r[mapping.body] : '',
    }));
    try {
      const { inserted } = await importItemsA(payload, statusId || null);
      alert(`${inserted} contenido(s) importados.`);
      onImported();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error al importar'); setBusy(false); }
  }

  return (
    <div className="zo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zo-modal" style={{ maxWidth: 600 }}>
        <h3>Importar contenidos</h3>
        <p className="zo-modal-sub">Subí un CSV, XLS o XLSX con tus contenidos.</p>
        <div className="zo-tpl-line">
          ¿No tenés el formato? Descargá la plantilla vacía:
          <button type="button" onClick={() => downloadTemplate('csv')}>CSV</button>
          <button type="button" onClick={() => downloadTemplate('xlsx')}>XLS</button>
        </div>

        {!fileName ? (
          <div className={`zo-drop${over ? ' over' : ''}`} style={{ padding: 28 }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}>
            Arrastrá el archivo o <span style={{ color: '#FF6A00' }}>hacé clic para elegir</span>
            <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>.csv · .xls · .xlsx</div>
          </div>
        ) : (
          <>
            <div className="zo-drop-file" style={{ marginBottom: 14 }}>
              <span>📄 {fileName} · {rows.length} fila(s)</span>
              <button type="button" onClick={() => { setFileName(null); setHeaders([]); setRows([]); }}>Cambiar</button>
            </div>
            <div className="zo-flabel" style={{ marginBottom: 8 }}>Mapeo de columnas</div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {FIELDS.map(f => (
                <div key={f.key} className="zo-map-row">
                  <span className="zo-map-field">{f.label}</span>
                  <select className="zo-select" value={mapping[f.key]} onChange={e => setMapping(m => ({ ...m, [f.key]: Number(e.target.value) }))} style={{ fontSize: 12 }}>
                    <option value={-1}>— ignorar —</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="zo-field" style={{ marginBottom: 14 }}>
              <label className="zo-flabel">Estado destino</label>
              <select className="zo-select" value={statusId} onChange={e => setStatusId(e.target.value)}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </>
        )}

        {err && <div className="zo-form-error" style={{ marginBottom: 12 }}>{err}</div>}
        <div className="zo-modal-actions">
          <button type="button" className="zo-btn zo-btn-sm" onClick={onClose}>Cancelar</button>
          {fileName && <button type="button" className="zo-btn zo-btn-primary zo-btn-sm" onClick={doImport} disabled={busy}>{busy ? 'Importando…' : `Importar ${rows.length}`}</button>}
        </div>
        <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx,text/csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    </div>
  );
}
