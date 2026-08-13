'use client';
// item-modal.tsx — alta/edición de un contenido (título, subtítulo, plataforma, fecha,
// url, estado, responsable, texto, media) + revisión.

import { useRef, useState } from 'react';
import { Paperclip, X, Check } from 'lucide-react';
import type { ContentStage, ContentItem, ContentMedia, ContentItemInput } from '@/lib/zaire-ops/content';
import { createItemA, updateItemA, uploadMediaA, setReviewedA } from './actions';

type Person = { id: string; name: string };
const PLATFORMS = ['Instagram', 'LinkedIn', 'Facebook', 'X', 'TikTok', 'YouTube', 'Blog', 'Newsletter', 'Otro'];

export default function ItemModal({
  item, stages, people, defaultStageId, onClose, onSaved,
}: {
  item: ContentItem | null;
  stages: ContentStage[];
  people: Person[];
  defaultStageId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({
    title: item?.title ?? '', subtitle: item?.subtitle ?? '', platform: item?.platform ?? '',
    content_date: item?.content_date ?? '', url: item?.url ?? '',
    status_id: item?.status_id ?? defaultStageId ?? '', owner_id: item?.owner_id ?? '',
    body: item?.body ?? '',
  });
  const [media, setMedia] = useState<ContentMedia[]>(item?.media ?? []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  const reviewerName = item?.reviewed_by ? (people.find(p => p.id === item.reviewed_by)?.name ?? 'Sí') : null;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setErr(null);
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append('file', file);
      const m = await uploadMediaA(fd);
      if (m) setMedia(prev => [...prev, m]); else setErr('No se pudo subir un archivo.');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const input: ContentItemInput = {
      title: f.title.trim(), subtitle: f.subtitle.trim() || null, platform: f.platform || null,
      content_date: f.content_date || null, url: f.url.trim() || null,
      status_id: f.status_id || null, owner_id: f.owner_id || null, body: f.body.trim() || null, media,
    };
    try {
      if (item) await updateItemA(item.id, input); else await createItemA(input);
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error al guardar'); setBusy(false); }
  }

  async function toggleReviewed() {
    if (!item) return;
    setBusy(true);
    try { await setReviewedA(item.id, !item.reviewed_at); onSaved(); }
    catch { setErr('No se pudo actualizar la revisión.'); setBusy(false); }
  }

  const isImg = (m: ContentMedia) => m.type.startsWith('image/');

  return (
    <div className="zo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zo-modal" style={{ maxWidth: 660 }}>
        <h3>{item ? 'Editar contenido' : 'Nuevo contenido'}</h3>
        <form onSubmit={submit} className="zo-form zo-form-wide" style={{ gap: 14 }}>
          <div className="zo-field"><label className="zo-flabel">Título</label><input className="zo-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="Título del contenido" autoFocus /></div>
          <div className="zo-field"><label className="zo-flabel">Subtítulo (opcional)</label><input className="zo-input" value={f.subtitle} onChange={e => set('subtitle', e.target.value)} /></div>

          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Plataforma</label>
              <select className="zo-select" value={f.platform} onChange={e => set('platform', e.target.value)}>
                <option value="">— sin plataforma —</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="zo-field"><label className="zo-flabel">Fecha</label><input className="zo-input" type="date" value={f.content_date} onChange={e => set('content_date', e.target.value)} /></div>
            <div className="zo-field"><label className="zo-flabel">Estado</label>
              <select className="zo-select" value={f.status_id} onChange={e => set('status_id', e.target.value)}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="zo-field"><label className="zo-flabel">Responsable</label>
              <select className="zo-select" value={f.owner_id} onChange={e => set('owner_id', e.target.value)}>
                <option value="">— sin asignar —</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="zo-field"><label className="zo-flabel">URL (opcional)</label><input className="zo-input" value={f.url} onChange={e => set('url', e.target.value)} placeholder="https://…" /></div>
          <div className="zo-field"><label className="zo-flabel">Texto</label><textarea className="zo-textarea" value={f.body} onChange={e => set('body', e.target.value)} placeholder="Cuerpo, copies, títulos…" style={{ minHeight: 130 }} /></div>

          <div className="zo-field">
            <label className="zo-flabel">Visuales / media</label>
            <div className={`zo-drop${uploading ? ' over' : ''}`} onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
              {uploading ? 'Subiendo…' : <><Paperclip size={13} style={{ verticalAlign: 'middle' }} /> Arrastrá archivos o <span style={{ color: '#FF6A00' }}>elegí</span></>}
            </div>
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => onFiles(e.target.files)} />
            {media.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {media.map((m, i) => (
                  <div key={i} className="zo-media-thumb">
                    {isImg(m)
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={m.url} alt={m.name} />
                      : <span className="zo-media-file">📄 {m.name}</span>}
                    <button type="button" className="zo-media-x" title="Quitar" onClick={() => setMedia(prev => prev.filter((_, j) => j !== i))}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {item && (
            <div className="zo-review-row">
              {item.reviewed_at
                ? <span className="zo-chip" style={{ background: 'rgba(34,197,94,.15)', color: '#22c55e' }}><Check size={12} /> Revisado por {reviewerName}</span>
                : <span className="zo-chip">Sin revisar</span>}
              <button type="button" className="zo-btn zo-btn-sm" onClick={toggleReviewed} disabled={busy}>{item.reviewed_at ? 'Quitar revisión' : 'Marcar como revisado'}</button>
            </div>
          )}

          {err && <div className="zo-form-error">{err}</div>}
          <div className="zo-modal-actions">
            <button type="button" className="zo-btn zo-btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="zo-btn zo-btn-primary zo-btn-sm" disabled={busy || uploading}>{busy ? 'Guardando…' : (item ? 'Guardar' : 'Crear')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
