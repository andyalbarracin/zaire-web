'use client';
// item-modal.tsx — alta/edición de un contenido (título, texto, estado, media).

import { useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import type { ContentStage, ContentItem, ContentMedia, ContentItemInput } from '@/lib/zaire-ops/content';
import { createItemA, updateItemA, uploadMediaA } from './actions';

export default function ItemModal({
  item, stages, defaultStageId, onClose, onSaved,
}: {
  item: ContentItem | null;
  stages: ContentStage[];
  defaultStageId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(item?.title ?? '');
  const [body, setBody] = useState(item?.body ?? '');
  const [statusId, setStatusId] = useState(item?.status_id ?? defaultStageId ?? '');
  const [media, setMedia] = useState<ContentMedia[]>(item?.media ?? []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setErr(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      const m = await uploadMediaA(fd);
      if (m) setMedia(prev => [...prev, m]);
      else setErr('No se pudo subir un archivo.');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const input: ContentItemInput = { title: title.trim(), body: body.trim() || null, status_id: statusId || null, media };
    try {
      if (item) await updateItemA(item.id, input);
      else await createItemA(input);
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Error al guardar'); setBusy(false); }
  }

  const isImg = (m: ContentMedia) => m.type.startsWith('image/');

  return (
    <div className="zo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zo-modal" style={{ maxWidth: 620 }}>
        <h3>{item ? 'Editar contenido' : 'Nuevo contenido'}</h3>
        <form onSubmit={submit} className="zo-form zo-form-wide" style={{ gap: 14 }}>
          <div className="zo-field"><label className="zo-flabel">Título</label><input className="zo-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del contenido" autoFocus /></div>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Estado</label>
              <select className="zo-select" value={statusId} onChange={e => setStatusId(e.target.value)}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="zo-field"><label className="zo-flabel">Texto</label><textarea className="zo-textarea" value={body} onChange={e => setBody(e.target.value)} placeholder="Cuerpo, copies, títulos…" style={{ minHeight: 130 }} /></div>

          <div className="zo-field">
            <label className="zo-flabel">Media</label>
            <div className={`zo-drop${uploading ? ' over' : ''}`} onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
              {uploading ? 'Subiendo…' : <><Paperclip size={13} style={{ verticalAlign: 'middle' }} /> Arrastrá archivos o <span style={{ color: '#FF6A00' }}>elegí</span> (imágenes, videos, docs)</>}
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
