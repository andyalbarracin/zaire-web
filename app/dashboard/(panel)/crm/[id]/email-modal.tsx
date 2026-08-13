'use client';
// email-modal.tsx — enviar un email al lead (Resend): destinatario, asunto, cuerpo,
// generar texto con IA, adjuntar archivos del lead y firma automática.

import { useState } from 'react';
import { Sparkles, Send, Paperclip } from 'lucide-react';
import type { CrmAttachment } from '@/lib/zaire-ops/crm';
import { emailDraftA, sendLeadEmailA } from '../actions';

export default function EmailModal({
  leadId, defaultTo, leadName, attachments, onClose, onSent,
}: {
  leadId: string;
  defaultTo: string;
  leadName?: string;
  company?: string;
  attachments: CrmAttachment[];
  onClose: () => void;
  onSent: (summary: string) => void;
}) {
  const [to, setTo] = useState(defaultTo ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setGenerating(true); setErr(null);
    const r = await emailDraftA(leadId);
    setGenerating(false);
    if ('error' in r) { setErr(r.error); return; }
    setSubject(r.subject); setBody(r.body);
  }

  const toggle = (i: number) => setSel(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  async function send() {
    if (!to.trim()) { setErr('Falta el destinatario.'); return; }
    setSending(true); setErr(null);
    const atts = attachments.filter((_, i) => sel.has(i)).map(a => ({ name: a.name, url: a.url }));
    const r = await sendLeadEmailA(leadId, { to: to.trim(), subject, body }, atts);
    if ('error' in r) { setErr(r.error); setSending(false); return; }
    onSent(`Email enviado a ${to.trim()} — "${subject.trim() || 'Zaire'}"`);
  }

  return (
    <div className="zo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zo-modal" style={{ maxWidth: 620 }}>
        <h3>Enviar email</h3>
        <p className="zo-modal-sub">Se envía desde Zaire, con tu firma al pie. Las respuestas te llegan a tu casilla.</p>

        <div className="zo-form zo-form-wide" style={{ gap: 12 }}>
          <div className="zo-field"><label className="zo-flabel">Para</label><input className="zo-input" type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="destinatario@empresa.com" /></div>
          <div className="zo-field"><label className="zo-flabel">Asunto</label><input className="zo-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder={leadName ? `Zaire — ${leadName}` : 'Asunto'} /></div>

          <div>
            <button className="zo-btn zo-btn-sm" type="button" onClick={generate} disabled={generating}><Sparkles size={14} /> {generating ? 'Generando…' : 'Generar texto'}</button>
          </div>
          <div className="zo-field"><label className="zo-flabel">Mensaje</label><textarea className="zo-textarea" value={body} onChange={e => setBody(e.target.value)} style={{ minHeight: 150 }} placeholder="Escribí el mensaje o generalo con IA. Tu firma se agrega automáticamente." /></div>

          {attachments.length > 0 && (
            <div className="zo-field">
              <label className="zo-flabel">Adjuntar archivos del lead</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {attachments.map((a, i) => (
                  <label key={i} className="zo-checkbox" style={{ fontSize: 12.5 }}>
                    <input type="checkbox" checked={sel.has(i)} onChange={() => toggle(i)} />
                    <Paperclip size={12} /> {a.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11.5, color: '#666', lineHeight: 1.5, borderTop: '1px solid #1e1e1e', paddingTop: 10 }}>
            Firma automática: <span style={{ color: '#999' }}>tu nombre · Director General · Zaire Technologies · zairetech.com · hola@zairetech.com</span>
          </div>

          {err && <div className="zo-form-error">{err}</div>}
        </div>

        <div className="zo-modal-actions">
          <button type="button" className="zo-btn zo-btn-sm" onClick={onClose}>Cancelar</button>
          <button type="button" className="zo-btn zo-btn-primary zo-btn-sm" onClick={send} disabled={sending || !to.trim() || !body.trim()}><Send size={14} /> {sending ? 'Enviando…' : 'Enviar'}</button>
        </div>
      </div>
    </div>
  );
}
