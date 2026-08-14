'use client';
// lead-detail.tsx — ficha detallada de un lead: datos, ubicación, archivos, investigar (IA) y log.

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Sparkles, Phone, Mail, MapPin, Paperclip, X, Send, Trash2, Globe, MessageCircle,
} from 'lucide-react';
import type { CrmStage, CrmLead, CrmLeadEvent, CrmAttachment, CrmLeadInput } from '@/lib/zaire-ops/crm';
import { CRM_INDUSTRIES, CRM_EMPLOYEES, CRM_PREFERRED } from '@/lib/zaire-ops/crm-constants';
import { updateLeadA, deleteLeadA, moveLeadA, addEventA, uploadLeadFileA, researchLeadA } from '../actions';
import type { LeadAnalysis } from '@/lib/sales/types';
import CallModal from './call-modal';
import EmailModal from './email-modal';

type Person = { id: string; name: string };
type FieldKey = 'website' | 'industry' | 'city' | 'employees' | 'modules_interest' | 'market_notes' | 'phone' | 'email' | 'address';

const initialsOf = (name: string) => name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
const fmt = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

// Guión de venta (motor KB) renderizado dentro del panel de INVESTIGAR.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><div className="zo-flabel" style={{ marginBottom: 4 }}>{title}</div>{children}</div>;
}
function Playbook({ a }: { a: LeadAnalysis }) {
  const prColor = (p: string) => (p === 'alta' ? '#FF6A00' : p === 'media' ? '#eab308' : '#888');
  return (
    <div className="zo-research" style={{ maxHeight: 460, fontSize: 12.5, lineHeight: 1.55 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <span className="zo-chip">{a.industria_detectada}</span>
        <span className="zo-chip">{a.tamano_estimado}</span>
        <span className="zo-chip">confianza: {a.confianza}</span>
      </div>
      <p style={{ marginBottom: 12, color: '#ccc' }}>{a.lectura_rapida}</p>

      <Section title="Módulos que encajan">
        {a.modulos_recomendados.map((m, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <strong style={{ color: '#ddd' }}>{m.nombre}</strong>{' '}
            <span style={{ color: prColor(m.prioridad), fontSize: 11 }}>({m.prioridad})</span>
            <div style={{ color: '#999' }}>{m.por_que}</div>
          </div>
        ))}
      </Section>

      <Section title="Ángulo de entrada"><p style={{ color: '#ccc' }}>{a.angulo_entrada}</p></Section>

      <Section title="Speech">
        <p style={{ marginBottom: 4 }}><strong style={{ color: '#bbb' }}>Apertura.</strong> {a.speech.apertura}</p>
        <p style={{ marginBottom: 4 }}><strong style={{ color: '#bbb' }}>Cuerpo.</strong> {a.speech.cuerpo}</p>
        <p><strong style={{ color: '#bbb' }}>Cierre.</strong> {a.speech.cierre}</p>
      </Section>

      <Section title="Preguntas para calificar">
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {a.preguntas_calificacion.map((q, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{q.pregunta}{q.oro && <span style={{ color: '#FF6A00' }}> ⭐</span>}</li>
          ))}
        </ul>
      </Section>

      <Section title="Objeciones probables">
        {a.objeciones_probables.map((o, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ color: '#ddd' }}>“{o.objecion}”</div>
            <div style={{ color: '#999' }}>→ {o.respuesta}</div>
          </div>
        ))}
      </Section>

      {a.datos_faltantes.length > 0 && (
        <Section title="Datos faltantes"><div style={{ color: '#999' }}>{a.datos_faltantes.join(' · ')}</div></Section>
      )}
      <Section title="Próximo paso"><p style={{ color: '#ccc' }}>{a.proximo_paso}</p></Section>
    </div>
  );
}

export default function LeadDetail({ lead, stages, events: initialEvents, people }: { lead: CrmLead; stages: CrmStage[]; events: CrmLeadEvent[]; people: Person[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const nameById = (id: string | null) => (id ? (people.find(p => p.id === id)?.name ?? 'Usuario') : 'Sistema');

  const [f, setF] = useState({
    name: lead.name ?? '', phone: lead.phone ?? '', preferred_contact: lead.preferred_contact ?? '',
    email: lead.email ?? '', contact_person: lead.contact_person ?? '', contact_person_2: lead.contact_person_2 ?? '', phone_2: lead.phone_2 ?? '',
    company: lead.company ?? '', website: lead.website ?? '', industry: lead.industry ?? '', employees: lead.employees ?? '',
    modules_interest: lead.modules_interest ?? '', market_notes: lead.market_notes ?? '', budget: lead.budget ?? '',
    city: lead.city ?? '', address: lead.address ?? '',
  });
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  const [stageId, setStageId] = useState(lead.stage_id ?? '');
  const [attachments, setAttachments] = useState<CrmAttachment[]>(lead.attachments ?? []);
  const [events, setEvents] = useState<CrmLeadEvent[]>(initialEvents);
  const [research, setResearch] = useState(lead.research ?? '');
  const [analysis, setAnalysis] = useState<LeadAnalysis | null>(null);
  const [aiProviders, setAiProviders] = useState<string[]>([]);
  const [aiCached, setAiCached] = useState(false);
  const [aiSources, setAiSources] = useState<{ title: string; uri: string }[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [researchErr, setResearchErr] = useState<string | null>(null);
  const [aiFilled, setAiFilled] = useState<Set<string>>(new Set());
  const aiStyle = (k: FieldKey): React.CSSProperties | undefined => aiFilled.has(k) ? { borderColor: '#FF6A00', boxShadow: '0 0 0 1px rgba(255,106,0,.35)' } : undefined;
  const [callOpen, setCallOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const stage = stages.find(s => s.id === stageId);
  const mapQuery = f.address || f.city;
  const mapHref = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;

  async function save() {
    setSaving(true); setSavedOk(false);
    const input: CrmLeadInput = { ...f, attachments };
    // strings vacíos → null los normaliza la data layer
    try { await updateLeadA(lead.id, input); setSavedOk(true); setTimeout(() => setSavedOk(false), 2500); }
    finally { setSaving(false); }
  }

  async function changeStage(next: string) {
    setStageId(next);
    const name = stages.find(s => s.id === next)?.name;
    await moveLeadA(lead.id, next || null, name);
    // refleja el evento de sistema en el log
    setEvents(prev => [{ id: `tmp-${Date.now()}`, lead_id: lead.id, author_id: null, kind: 'system', body: `Etapa → ${name ?? ''}`, created_at: new Date().toISOString() }, ...prev]);
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const added: CrmAttachment[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append('file', file);
      const a = await uploadLeadFileA(fd);
      if (a) added.push(a);
    }
    const next = [...attachments, ...added];
    setAttachments(next);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    // persistir los adjuntos al toque
    await updateLeadA(lead.id, { attachments: next });
  }
  async function removeFile(i: number) {
    const next = attachments.filter((_, j) => j !== i);
    setAttachments(next);
    await updateLeadA(lead.id, { attachments: next });
  }

  async function addNote() {
    const body = note.trim(); if (!body) return;
    setNote('');
    setEvents(prev => [{ id: `tmp-${Date.now()}`, lead_id: lead.id, author_id: null, kind: 'note', body, created_at: new Date().toISOString() }, ...prev]);
    await addEventA(lead.id, body);
    router.refresh();
  }

  async function investigate() {
    setResearching(true); setResearchErr(null);
    const r = await researchLeadA(lead.id);
    setResearching(false);
    if ('error' in r) { setResearchErr(r.error); return; }
    setResearch(r.brief);
    setAnalysis(r.analysis ?? null);
    setAiProviders(r.providers ?? []);
    setAiCached(!!r.cached);
    setAiSources(r.sources ?? []);
    // Completa SOLO los campos vacíos con las sugerencias de la IA (para revisar y guardar).
    const filled = new Set<string>();
    setF(prev => {
      const next = { ...prev };
      (Object.entries(r.fields) as [FieldKey, string][]).forEach(([k, v]) => {
        if (v && k in next && !next[k]) { next[k] = v; filled.add(k); }
      });
      return next;
    });
    setAiFilled(filled);
    setEvents(prev => [{ id: `tmp-${Date.now()}`, lead_id: lead.id, author_id: null, kind: 'system', body: 'Investigación con IA (research + motor KB).', created_at: new Date().toISOString() }, ...prev]);
  }

  async function remove() {
    if (!confirm(`¿Eliminar el lead "${f.name || f.company || 'sin nombre'}"? No se puede deshacer.`)) return;
    await deleteLeadA(lead.id);
    router.push('/dashboard/crm');
  }

  const isImg = (a: CrmAttachment) => a.type.startsWith('image/');
  const wa = (n: string) => `https://wa.me/${(n || '').replace(/\D/g, '')}`;

  return (
    <>
      <div className="zo-pagehead" style={{ marginBottom: 14 }}>
        <div>
          <div className="zo-lbl">// LEAD</div>
          <h1 className="zo-h1">{f.name || f.company || '(sin nombre)'}</h1>
          <div className="zo-sub" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            {stage && <span className="zo-chip"><span className="zo-dot" style={{ background: stage.color }} />{stage.name}</span>}
            {f.company && <span className="zo-chip">{f.company}</span>}
            {lead.source && <span className="zo-chip">{lead.source}</span>}
          </div>
        </div>
      </div>

      {/* Toolbar: Volver a la izquierda; Llamar/WhatsApp/Email/Guardar a la derecha (responsive) */}
      <div className="zo-detail-bar">
        <Link href="/dashboard/crm"><button className="zo-btn zo-back" type="button"><ArrowLeft size={14} /> Volver</button></Link>
        <div className="zo-detail-bar-actions">
          <button className="zo-btn zo-btn-sm" type="button" onClick={() => setCallOpen(true)}><Phone size={13} /> Llamar</button>
          <button className="zo-btn zo-btn-sm" type="button" onClick={() => window.open(wa(f.phone), '_blank')} disabled={!f.phone} title={f.phone ? 'Abrir WhatsApp Web' : 'Sin teléfono'}><MessageCircle size={13} /> WhatsApp</button>
          <button className="zo-btn zo-btn-sm" type="button" onClick={() => setEmailOpen(true)}><Mail size={13} /> Email</button>
          {savedOk && <span className="zo-chip" style={{ background: 'rgba(34,197,94,.15)', color: '#22c55e' }}>✓ Guardado</span>}
          <button className="zo-btn zo-btn-primary" onClick={save} disabled={saving}><Save size={14} /> {saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </div>

      <div className="zo-2col" style={{ alignItems: 'start' }}>
        {/* Columna principal: ficha */}
        <div>
          <div className="zo-card">
            <div className="zo-card-title">// CONTACTO</div>
            <div className="zo-grid2">
              <div className="zo-field"><label className="zo-flabel">Nombre</label><input className="zo-input" value={f.name} onChange={e => set('name', e.target.value)} /></div>
              <div className="zo-field"><label className="zo-flabel">Teléfono</label><input className="zo-input" value={f.phone} onChange={e => set('phone', e.target.value)} style={aiStyle('phone')} /></div>
              <div className="zo-field"><label className="zo-flabel">Medio de contacto preferido</label>
                <select className="zo-select" value={f.preferred_contact} onChange={e => set('preferred_contact', e.target.value)}>
                  <option value="">—</option>{CRM_PREFERRED.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="zo-field"><label className="zo-flabel">Email</label><input className="zo-input" type="email" value={f.email} onChange={e => set('email', e.target.value)} style={aiStyle('email')} /></div>
              <div className="zo-field"><label className="zo-flabel">Contacto principal (persona)</label><input className="zo-input" value={f.contact_person} onChange={e => set('contact_person', e.target.value)} /></div>
              <div className="zo-field" />
              <div className="zo-field"><label className="zo-flabel">Segunda persona</label><input className="zo-input" value={f.contact_person_2} onChange={e => set('contact_person_2', e.target.value)} placeholder="Otro contacto en la empresa" /></div>
              <div className="zo-field"><label className="zo-flabel">Teléfono de la 2ª persona</label><input className="zo-input" value={f.phone_2} onChange={e => set('phone_2', e.target.value)} /></div>
            </div>
          </div>

          <div className="zo-card zo-section-gap">
            <div className="zo-card-title">// EMPRESA Y MERCADO</div>
            <div className="zo-grid2">
              <div className="zo-field"><label className="zo-flabel">Empresa</label><input className="zo-input" value={f.company} onChange={e => set('company', e.target.value)} /></div>
              <div className="zo-field"><label className="zo-flabel">Sitio web</label><input className="zo-input" value={f.website} onChange={e => set('website', e.target.value)} placeholder="https://…" style={aiStyle('website')} /></div>
              <div className="zo-field"><label className="zo-flabel">Industria</label>
                <select className="zo-select" value={f.industry} onChange={e => set('industry', e.target.value)} style={aiStyle('industry')}>
                  <option value="">—</option>{CRM_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="zo-field"><label className="zo-flabel">Cantidad de empleados</label>
                <select className="zo-select" value={f.employees} onChange={e => set('employees', e.target.value)} style={aiStyle('employees')}>
                  <option value="">—</option>{CRM_EMPLOYEES.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
              <div className="zo-field zo-span2"><label className="zo-flabel">Módulos / interés</label><input className="zo-input" value={f.modules_interest} onChange={e => set('modules_interest', e.target.value)} placeholder="Ej: Trace, Field, trazabilidad, mantenimiento…" style={aiStyle('modules_interest')} /></div>
              <div className="zo-field zo-span2"><label className="zo-flabel">Observaciones del mercado</label><textarea className="zo-textarea" value={f.market_notes} onChange={e => set('market_notes', e.target.value)} style={{ minHeight: 70, ...aiStyle('market_notes') }} placeholder="Contexto del sector en el que se mueve" /></div>
            </div>
          </div>

          <div className="zo-card zo-section-gap">
            <div className="zo-card-title">// COMERCIAL Y UBICACIÓN</div>
            <div className="zo-grid2">
              <div className="zo-field"><label className="zo-flabel">Presupuesto base</label><input className="zo-input" value={f.budget} onChange={e => set('budget', e.target.value)} placeholder="Ej: USD 5.000 / a definir" /></div>
              <div className="zo-field"><label className="zo-flabel">Etapa</label>
                <select className="zo-select" value={stageId} onChange={e => changeStage(e.target.value)}>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="zo-field"><label className="zo-flabel">Ciudad</label><input className="zo-input" value={f.city} onChange={e => set('city', e.target.value)} style={aiStyle('city')} /></div>
              <div className="zo-field"><label className="zo-flabel">Dirección completa</label><input className="zo-input" value={f.address} onChange={e => set('address', e.target.value)} placeholder="Calle, número, localidad" style={aiStyle('address')} /></div>
              {mapHref && <div className="zo-span2"><a href={mapHref} target="_blank" rel="noopener noreferrer" className="zo-rowlink" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> Ver en el mapa</a></div>}
            </div>
          </div>

          <div className="zo-card zo-section-gap">
            <div className="zo-card-title">// ARCHIVOS</div>
            <div className={`zo-drop${uploading ? ' over' : ''}`} onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
              {uploading ? 'Subiendo…' : <><Paperclip size={13} style={{ verticalAlign: 'middle' }} /> Arrastrá archivos o <span style={{ color: '#FF6A00' }}>elegí</span> (fotos, PDF, Word, texto)</>}
            </div>
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => onFiles(e.target.files)} />
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {attachments.map((a, i) => (
                  <div key={i} className="zo-media-thumb">
                    {isImg(a)
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <a href={a.url} target="_blank" rel="noopener noreferrer"><img src={a.url} alt={a.name} /></a>
                      : <a href={a.url} target="_blank" rel="noopener noreferrer" className="zo-media-file">📄 {a.name}</a>}
                    <button type="button" className="zo-media-x" title="Quitar" onClick={() => removeFile(i)}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="zo-btn zo-btn-primary" onClick={save} disabled={saving}><Save size={14} /> {saving ? 'Guardando…' : 'Guardar cambios'}</button>
            {savedOk && <span className="zo-chip" style={{ background: 'rgba(34,197,94,.15)', color: '#22c55e' }}>✓ Guardado</span>}
            <button className="zo-btn zo-btn-ghost" style={{ marginLeft: 'auto', color: '#ff6b5b' }} onClick={remove}><Trash2 size={14} /> Eliminar lead</button>
          </div>
        </div>

        {/* Columna lateral: investigar (IA) + info rápida */}
        <div>
          <div className="zo-card">
            <div className="zo-card-title">// INVESTIGAR (IA)</div>
            <p style={{ fontSize: 12.5, color: '#888', lineHeight: 1.6, marginBottom: 12 }}>
              Un click hace todo: <strong style={{ color: '#bbb' }}>completa los campos vacíos</strong> (web, industria, empleados…) y arma el <strong style={{ color: '#bbb' }}>guión de venta con la KB de Zaire</strong> — módulos, speech, preguntas y objeciones. Usa OpenAI/Gemini y cae a Groq. No inventa: lo que falta lo marca.
            </p>
            <button className="zo-btn zo-btn-sm" onClick={investigate} disabled={researching}><Sparkles size={14} /> {researching ? 'Investigando…' : (research || analysis ? 'Volver a investigar' : 'Investigar')}</button>
            {aiFilled.size > 0 && <div className="zo-ai-note">La IA completó {aiFilled.size} campo(s) vacío(s), marcados en naranja. Revisalos y tocá <strong>Guardar cambios</strong>.</div>}
            {aiProviders.length > 0 && <div style={{ fontSize: 11.5, color: '#888', marginTop: 8 }}>Respondió: <strong style={{ color: '#bbb' }}>{aiProviders.join(' + ')}</strong>{aiCached && ' · desde caché'}</div>}
            {aiSources.length > 0 && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 6, lineHeight: 1.5 }}>
                Fuentes web: {aiSources.slice(0, 4).map((s, i) => (
                  <span key={i}>{i > 0 && ' · '}<a href={s.uri} target="_blank" rel="noopener noreferrer" style={{ color: '#8ab4f8' }}>{s.title || 'link'}</a></span>
                ))}
              </div>
            )}
            {researchErr && <div className="zo-form-error" style={{ marginTop: 12 }}>{researchErr}</div>}
            {analysis ? <Playbook a={analysis} /> : research && <div className="zo-research">{research}</div>}
          </div>

          {(f.website || f.city) && (
            <div className="zo-card zo-section-gap">
              <div className="zo-card-title">// ACCESOS</div>
              {f.website && <a href={f.website.startsWith('http') ? f.website : `https://${f.website}`} target="_blank" rel="noopener noreferrer" className="zo-rowlink" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Globe size={14} /> Sitio web</a>}
              {mapHref && <a href={mapHref} target="_blank" rel="noopener noreferrer" className="zo-rowlink" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> Ubicación en el mapa</a>}
            </div>
          )}
        </div>
      </div>

      {/* Log / chatter */}
      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// LOG</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <textarea className="zo-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Agregá una entrada: llamé, no atendió, quedó en llamar el martes…" style={{ minHeight: 54 }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addNote(); } }} />
          <button className="zo-btn zo-btn-primary zo-btn-sm" onClick={addNote} disabled={!note.trim()} style={{ alignSelf: 'flex-end' }}><Send size={14} /> Agregar</button>
        </div>

        <div className="zo-timeline">
          {events.length === 0 && !lead.notes && <div style={{ fontSize: 13, color: '#666' }}>Sin entradas todavía. Agregá la primera arriba.</div>}
          {events.map(ev => ev.kind === 'system' ? (
            <div key={ev.id} className="zo-tl-system"><span className="zo-dot" /> {ev.body} <span style={{ color: '#555' }}>· {fmt(ev.created_at)}</span></div>
          ) : (
            <div key={ev.id} className="zo-comment">
              <div className="zo-avatar zo-avatar-fallback" style={{ width: 32, height: 32, fontSize: 11 }}>{initialsOf(nameById(ev.author_id))}</div>
              <div className="zo-comment-body">
                <div className="zo-comment-head"><span className="zo-comment-author">{nameById(ev.author_id)}</span><span className="zo-comment-time">{fmt(ev.created_at)}</span></div>
                <div className="zo-comment-text">{ev.body}</div>
              </div>
            </div>
          ))}
          {lead.notes && (
            <div className="zo-comment">
              <div className="zo-avatar zo-avatar-fallback" style={{ width: 32, height: 32, fontSize: 11 }}>N</div>
              <div className="zo-comment-body">
                <div className="zo-comment-head"><span className="zo-comment-author">Nota inicial</span></div>
                <div className="zo-comment-text">{lead.notes}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {callOpen && (
        <CallModal
          leadId={lead.id}
          data={{ name: f.name, phone: f.phone, contact_person: f.contact_person, industry: f.industry, modules_interest: f.modules_interest, market_notes: f.market_notes }}
          stageName={stage?.name}
          lastNote={events.find(e => e.kind === 'note')?.body ?? null}
          research={research}
          onClose={() => setCallOpen(false)}
        />
      )}
      {emailOpen && (
        <EmailModal
          leadId={lead.id}
          defaultTo={f.email}
          leadName={f.name}
          company={f.company}
          attachments={attachments}
          onClose={() => setEmailOpen(false)}
          onSent={(summary) => {
            setEmailOpen(false);
            setEvents(prev => [{ id: `tmp-${Date.now()}`, lead_id: lead.id, author_id: null, kind: 'system', body: summary, created_at: new Date().toISOString() }, ...prev]);
          }}
        />
      )}
    </>
  );
}
