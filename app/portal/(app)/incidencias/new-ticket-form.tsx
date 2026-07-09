'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPortalTicketAction } from './actions';

const MAX_FILE = 50 * 1024 * 1024;
const okMedia = (t: string) => t.startsWith('image/') || t.startsWith('video/');
const fmtSize = (b: number) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`;

function Submit() {
  const { pending } = useFormStatus();
  return <button className="zp-btn zp-btn-primary" type="submit" disabled={pending}>{pending ? 'Enviando…' : 'Crear incidencia'}</button>;
}

export default function NewTicketForm() {
  const [state, action] = useActionState(createPortalTicketAction, {});
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Mantiene el <input type=file> en sync con la lista (para que viaje en el submit).
  function commit(list: File[]) {
    const dt = new DataTransfer();
    list.forEach(f => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
    setFiles(list);
  }

  function addFiles(incoming: FileList | File[]) {
    const rejected: string[] = [];
    const valid: File[] = [];
    Array.from(incoming).forEach(f => {
      if (!okMedia(f.type)) rejected.push(`${f.name} (solo imágenes/videos)`);
      else if (f.size > MAX_FILE) rejected.push(`${f.name} (supera 50MB)`);
      else valid.push(f);
    });
    setFileError(rejected.length ? `No se agregaron: ${rejected.join(', ')}.` : null);
    if (valid.length) {
      const merged = [...files];
      valid.forEach(f => { if (!merged.some(m => m.name === f.name && m.size === f.size)) merged.push(f); });
      commit(merged);
    }
  }

  function remove(idx: number) { commit(files.filter((_, i) => i !== idx)); }

  return (
    <div className="zp-card">
      <form action={action}>
        <div className="zp-field"><label className="zp-flabel">Título</label><input className="zp-input" name="title" required placeholder="Resumen corto del problema" /></div>
        <div className="zp-field"><label className="zp-flabel">Descripción</label><textarea className="zp-textarea" name="description" required rows={4} placeholder="Contanos qué pasa, con el mayor detalle posible" /></div>
        <div className="zp-field" style={{ maxWidth: 220 }}><label className="zp-flabel">Prioridad</label>
          <select className="zp-select" name="priority" defaultValue="media"><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Crítica</option></select>
        </div>

        <div className="zp-field">
          <label className="zp-flabel">Adjuntos (imágenes o videos)</label>
          <div
            className={`zp-drop${over ? ' over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
          >
            Arrastrá archivos acá o <span style={{ color: '#FF6A00' }}>hacé clic para elegir</span>
            <div className="zp-drop-hint">Imágenes y videos · hasta 50&nbsp;MB cada uno</div>
          </div>
          <input
            ref={inputRef}
            name="files"
            type="file"
            multiple
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files) addFiles(e.target.files); }}
          />
          {files.length > 0 && (
            <div className="zp-files">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="zp-file">
                  <span>{f.type.startsWith('video/') ? '🎬' : '🖼️'} {f.name} · {fmtSize(f.size)}</span>
                  <button type="button" onClick={() => remove(i)}>Quitar</button>
                </div>
              ))}
            </div>
          )}
          {fileError && <div style={{ fontSize: 12, color: '#ff8a7d', marginTop: 8 }}>{fileError}</div>}
        </div>

        {state.error && <div className="zp-alert zp-alert-warn">{state.error}</div>}
        <Submit />
      </form>
    </div>
  );
}
