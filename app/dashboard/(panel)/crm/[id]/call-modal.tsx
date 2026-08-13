'use client';
// call-modal.tsx — preparar la llamada: datos clave, última interacción y guión sugerido (IA).

import { useState } from 'react';
import { Phone, MessageCircle, Sparkles } from 'lucide-react';
import { callScriptA } from '../actions';

export default function CallModal({
  leadId, data, stageName, lastNote, research, onClose,
}: {
  leadId: string;
  data: { name: string; phone: string; contact_person: string; industry: string; modules_interest: string; market_notes: string };
  stageName?: string;
  lastNote?: string | null;
  research?: string;
  onClose: () => void;
}) {
  const [script, setScript] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const wa = data.phone ? `https://wa.me/${data.phone.replace(/\D/g, '')}` : null;

  async function generate() {
    setBusy(true); setErr(null);
    const r = await callScriptA(leadId, stageName, lastNote ?? null);
    setBusy(false);
    if ('text' in r) setScript(r.text); else setErr(r.error);
  }

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => children ? (
    <div className="zo-modal-row"><span>{label}</span><span style={{ color: '#ddd', textAlign: 'right' }}>{children}</span></div>
  ) : null;

  return (
    <div className="zo-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zo-modal" style={{ maxWidth: 560 }}>
        <h3>Preparar llamada</h3>
        <p className="zo-modal-sub">{data.name || 'Lead'}{data.contact_person ? ` · ${data.contact_person}` : ''}</p>

        <div className="zo-modal-box">
          <Row label="Teléfono">{data.phone || '—'}</Row>
          <Row label="Contacto">{data.contact_person}</Row>
          <Row label="Industria">{data.industry}</Row>
          <Row label="Etapa">{stageName}</Row>
          <Row label="Interés">{data.modules_interest}</Row>
          <Row label="Mercado">{data.market_notes}</Row>
        </div>

        {lastNote && (
          <div style={{ marginBottom: 14 }}>
            <div className="zo-flabel" style={{ marginBottom: 6 }}>Última interacción</div>
            <div style={{ fontSize: 13, color: '#ccc', background: '#101010', border: '1px solid #222', borderRadius: 8, padding: '10px 12px', lineHeight: 1.55 }}>{lastNote}</div>
          </div>
        )}

        {data.phone && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <a href={`tel:${data.phone.replace(/\s/g, '')}`} style={{ flex: 1 }}><button className="zo-btn zo-btn-sm" type="button" style={{ width: '100%', justifyContent: 'center' }}><Phone size={13} /> Marcar</button></a>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}><button className="zo-btn zo-btn-sm" type="button" style={{ width: '100%', justifyContent: 'center' }}><MessageCircle size={13} /> WhatsApp</button></a>}
          </div>
        )}

        <div className="zo-flabel" style={{ marginBottom: 6 }}>Guión sugerido</div>
        <button className="zo-btn zo-btn-sm" type="button" onClick={generate} disabled={busy}><Sparkles size={14} /> {busy ? 'Generando…' : (script || research ? 'Regenerar guión' : 'Generar guión')}</button>
        {err && <div className="zo-form-error" style={{ marginTop: 10 }}>{err}</div>}
        {(script || research) && <div className="zo-research" style={{ maxHeight: 280 }}>{script || research}</div>}

        <div className="zo-modal-actions">
          <button type="button" className="zo-btn zo-btn-sm" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
