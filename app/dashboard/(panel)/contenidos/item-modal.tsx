'use client';
// item-modal.tsx — alta/edición de un contenido (título, subtítulo, plataforma, fecha,
// url, estado, responsable, texto, media) + revisión.

import { useRef, useState, useEffect } from 'react';
import { Paperclip, X, Check, Sparkles, ImagePlus, RefreshCw } from 'lucide-react';
import type { ContentStage, ContentItem, ContentMedia, ContentItemInput } from '@/lib/zaire-ops/content';
import { createItemA, updateItemA, uploadMediaA, setReviewedA, generateTextA, generateImageA, contentKbListsA } from './actions';

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
  const [aiPrompt, setAiPrompt] = useState('');
  const [genTextBusy, setGenTextBusy] = useState(false);
  const [genImgBusy, setGenImgBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [tematicaId, setTematicaId] = useState('');
  const [moduloId, setModuloId] = useState('');
  const [kb, setKb] = useState<{ tematicas: { id: string; titulo: string }[]; modulos: { id: string; nombre: string }[] }>({ tematicas: [], modulos: [] });
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [mejoraInput, setMejoraInput] = useState('');
  const [fieldBusy, setFieldBusy] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => { contentKbListsA().then(setKb).catch(() => {}); }, []);

  const seed = () => aiPrompt.trim() || f.body.trim() || f.title.trim();
  const aiExtras = () => ({ platform: f.platform || undefined, tematicaId: tematicaId || undefined, moduloId: moduloId || undefined });

  async function genText() {
    if (!seed()) { setAiErr('Escribí una idea o tema.'); return; }
    setGenTextBusy(true); setAiErr(null);
    const r = await generateTextA({ prompt: aiPrompt, title: f.title || undefined, ...aiExtras() });
    setGenTextBusy(false);
    if ('error' in r) { setAiErr(r.error); return; }
    setAiProvider(r.provider ?? null);
    setF(p => ({ ...p, title: p.title || r.title, subtitle: p.subtitle || r.subtitle, body: p.body ? `${p.body}\n\n${r.body}` : r.body }));
  }

  async function regenField(field: 'title' | 'subtitle') {
    if (!seed()) { setAiErr('Necesito una idea, título o texto para regenerar.'); return; }
    setFieldBusy(field); setAiErr(null);
    const r = await generateTextA({ prompt: seed(), title: f.title || undefined, ...aiExtras() });
    setFieldBusy(null);
    if ('error' in r) { setAiErr(r.error); return; }
    setAiProvider(r.provider ?? null);
    setF(p => ({ ...p, [field]: field === 'title' ? r.title : r.subtitle }));
  }

  async function improveBody() {
    if (!f.body.trim()) { setAiErr('No hay texto para mejorar.'); return; }
    if (!mejoraInput.trim()) { setAiErr('Escribí qué querés mejorar o cambiar.'); return; }
    setFieldBusy('body'); setAiErr(null);
    const r = await generateTextA({ prompt: seed() || f.title || 'contenido', mejora: mejoraInput, contextoActual: { title: f.title, body: f.body }, ...aiExtras() });
    setFieldBusy(null);
    if ('error' in r) { setAiErr(r.error); return; }
    setAiProvider(r.provider ?? null);
    setF(p => ({ ...p, body: r.body || p.body }));
    setMejoraInput('');
  }

  async function genImage() {
    if (!aiPrompt.trim()) { setAiErr('Escribí un prompt para la imagen.'); return; }
    setGenImgBusy(true); setAiErr(null);
    const r = await generateImageA(aiPrompt);
    setGenImgBusy(false);
    if ('error' in r) { setAiErr(r.error); return; }
    const { provider, ...m } = r;
    setAiProvider(provider ?? null);
    setMedia(prev => [...prev, m]);
  }

  const RegenBtn = ({ field }: { field: 'title' | 'subtitle' }) => (
    <button type="button" onClick={() => regenField(field)} disabled={fieldBusy === field || genTextBusy}
      title={`Regenerar ${field === 'title' ? 'título' : 'subtítulo'} con IA`}
      style={{ background: 'transparent', border: 'none', color: fieldBusy === field ? '#FF6A00' : '#888', cursor: 'pointer', padding: 0, display: 'inline-flex', opacity: fieldBusy === field ? 0.6 : 1 }}>
      <RefreshCw size={12} />
    </button>
  );

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
          <div style={{ border: '1px solid #262626', borderRadius: 10, padding: 12, background: '#0d0d0d' }}>
            <div className="zo-flabel" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={13} /> Generar con IA</div>
            <textarea className="zo-textarea" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Idea o tema (ej: post sobre trazabilidad ISO 9001 para talleres metalúrgicos)" style={{ minHeight: 54 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <select className="zo-select" value={tematicaId} onChange={e => setTematicaId(e.target.value)} style={{ flex: 1, minWidth: 150 }}>
                <option value="">Temática (auto)</option>
                {kb.tematicas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
              </select>
              <select className="zo-select" value={moduloId} onChange={e => setModuloId(e.target.value)} style={{ flex: 1, minWidth: 150 }}>
                <option value="">Módulo (auto)</option>
                {kb.modulos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button type="button" className="zo-btn zo-btn-sm" onClick={genText} disabled={genTextBusy || genImgBusy}><Sparkles size={13} /> {genTextBusy ? 'Generando…' : 'Generar texto'}</button>
              <button type="button" className="zo-btn zo-btn-sm" onClick={genImage} disabled={genImgBusy || genTextBusy}><ImagePlus size={13} /> {genImgBusy ? 'Generando imagen…' : 'Generar imagen'}</button>
            </div>
            {aiErr && <div className="zo-form-error" style={{ marginTop: 8 }}>{aiErr}</div>}
            {aiProvider && <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>Generado con <strong style={{ color: '#bbb' }}>{aiProvider}</strong></div>}
            <div style={{ fontSize: 11, color: '#666', marginTop: 8, lineHeight: 1.5 }}>El texto completa Título/Subtítulo si están vacíos y suma al cuerpo. La imagen se agrega a los visuales. Usa la cadena de <strong style={{ color: '#888' }}>Mi cuenta</strong>; la imagen requiere OpenAI o Gemini.</div>
          </div>

          <div className="zo-field">
            <label className="zo-flabel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>Título <RegenBtn field="title" /></label>
            <input className="zo-input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="Título del contenido" autoFocus />
          </div>
          <div className="zo-field">
            <label className="zo-flabel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>Subtítulo (opcional) <RegenBtn field="subtitle" /></label>
            <input className="zo-input" value={f.subtitle} onChange={e => set('subtitle', e.target.value)} />
          </div>

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
          <div className="zo-field">
            <label className="zo-flabel">Texto</label>
            <textarea className="zo-textarea" value={f.body} onChange={e => set('body', e.target.value)} placeholder="Cuerpo, copies, títulos…" style={{ minHeight: 130 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <input className="zo-input" value={mejoraInput} onChange={e => setMejoraInput(e.target.value)} placeholder="Qué mejorar/cambiar del texto (ej: más corto, tono más técnico, sumá un dato)" style={{ flex: 1, minWidth: 180 }} />
              <button type="button" className="zo-btn zo-btn-sm" onClick={improveBody} disabled={fieldBusy === 'body' || !f.body.trim()}><RefreshCw size={13} /> {fieldBusy === 'body' ? 'Mejorando…' : 'Mejorar texto'}</button>
            </div>
          </div>

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
