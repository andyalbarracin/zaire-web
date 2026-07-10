// File: file-drop.tsx — Campo de archivo con drag & drop (un archivo). Participa del form nativo.
'use client';

import { useRef, useState } from 'react';

export default function FileDrop({ name, label, hint, accept }: { name: string; label?: string; hint?: string; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && ref.current) {
      const dt = new DataTransfer();
      dt.items.add(f);
      ref.current.files = dt.files;
      setFile(f.name);
    }
  }
  function clear() { if (ref.current) ref.current.value = ''; setFile(null); }

  return (
    <div>
      {label && <label className="zo-flabel" style={{ display: 'block', marginBottom: 7 }}>{label}</label>}
      <div
        className={`zo-drop${over ? ' over' : ''}`}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        Arrastrá un archivo o <span style={{ color: '#FF6A00' }}>hacé clic para elegir</span>
        {hint && <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{hint}</div>}
      </div>
      <input ref={ref} name={name} type="file" accept={accept} style={{ display: 'none' }} onChange={() => setFile(ref.current?.files?.[0]?.name ?? null)} />
      {file && <div className="zo-drop-file"><span>📎 {file}</span><button type="button" onClick={clear}>Quitar</button></div>}
    </div>
  );
}
