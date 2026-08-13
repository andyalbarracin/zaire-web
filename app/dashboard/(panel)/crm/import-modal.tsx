'use client';
// import-modal.tsx — importar leads desde CSV / XLS / XLSX con mapeo de columnas.

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import type { CrmStage, CrmLeadInput } from '@/lib/zaire-ops/crm';
import { importLeadsA } from './actions';

type Field = 'name' | 'phone' | 'company' | 'contact_person' | 'email' | 'notes';
const FIELDS: { key: Field; label: string; syn: string[] }[] = [
  { key: 'name', label: 'Nombre', syn: ['nombre', 'name', 'lead', 'nombre y apellido', 'apellido y nombre', 'razon social', 'razón social'] },
  { key: 'phone', label: 'Teléfono', syn: ['telefono', 'teléfono', 'phone', 'celular', 'tel', 'whatsapp', 'movil', 'móvil', 'cel'] },
  { key: 'company', label: 'Empresa', syn: ['empresa', 'company', 'compania', 'compañia', 'compañía', 'organizacion', 'organización'] },
  { key: 'contact_person', label: 'Contacto', syn: ['contacto', 'contact', 'persona', 'referente', 'con quien', 'con quién'] },
  { key: 'email', label: 'Email', syn: ['email', 'correo', 'mail', 'e-mail', 'e mail'] },
  { key: 'notes', label: 'Notas', syn: ['notas', 'notes', 'observaciones', 'observacion', 'comentarios', 'detalle'] },
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

export default function ImportModal({
  stages, defaultStageId, onClose, onImported,
}: {
  stages: CrmStage[];
  defaultStageId: string | null;
  onClose: () => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<Field, number>>({ name: -1, phone: -1, company: -1, contact_person: -1, email: -1, notes: -1 });
  const [stageId, setStageId] = useState<string>(defaultStageId ?? '');
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
      // Auto-detección de columnas por nombre de encabezado.
      const auto: Record<Field, number> = { name: -1, phone: -1, company: -1, contact_person: -1, email: -1, notes: -1 };
      for (const f of FIELDS) {
        const idx = hdr.findIndex(h => f.syn.some(s => norm(h) === s || norm(h).includes(s)));
        auto[f.key] = idx;
      }
      setFileName(file.name); setHeaders(hdr); setRows(body); setMapping(auto);
    } catch { setErr('No se pudo leer el archivo. Probá con CSV, XLS o XLSX.'); }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  const mappedCount = Object.values(mapping).filter(i => i >= 0).length;

  async function doImport() {
    if (mappedCount === 0) { setErr('Mapeá al menos una columna (por ejemplo, Nombre o Teléfono).'); return; }
    setBusy(true); setErr(null);
    const payload: CrmLeadInput[] = rows.map(r => {
      const o: CrmLeadInput = {};
      for (const f of FIELDS) { const idx = mapping[f.key]; if (idx >= 0) (o as Record<string, string>)[f.key] = r[idx] ?? ''; }
      return o;
    });
    try {
      const { inserted } = await importLeadsA(payload, stageId || null, fileName ? `Import: ${fileName}` : 'Import');
      alert(`${inserted} lead(s) importados.`);
      onImported();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error al importar'); setBusy(false); }
  }

  return (
    <div className="zo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zo-modal" style={{ maxWidth: 640 }}>
        <h3>Importar leads</h3>
        <p className="zo-modal-sub">Subí un CSV, XLS o XLSX. Después mapeás qué columna es cada dato.</p>

        {!fileName ? (
          <div
            className={`zo-drop${over ? ' over' : ''}`}
            style={{ padding: 28 }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
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
              <label className="zo-flabel">Etapa destino</label>
              <select className="zo-select" value={stageId} onChange={e => setStageId(e.target.value)}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {rows.length > 0 && mappedCount > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="zo-flabel" style={{ marginBottom: 6 }}>Vista previa (primeras 3)</div>
                <div className="zo-table-wrap"><table className="zo-table"><thead><tr>
                  {FIELDS.filter(f => mapping[f.key] >= 0).map(f => <th key={f.key}>{f.label}</th>)}
                </tr></thead><tbody>
                  {rows.slice(0, 3).map((r, ri) => (
                    <tr key={ri}>{FIELDS.filter(f => mapping[f.key] >= 0).map(f => <td key={f.key}>{r[mapping[f.key]] || '—'}</td>)}</tr>
                  ))}
                </tbody></table></div>
              </div>
            )}
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
