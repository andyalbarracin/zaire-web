// File: demo-form.tsx
// Path: zaire-web/components/demo-form.tsx
// Last modified: 2026-08-12
// Description: Formulario compacto de captación (reusa las clases .fg/.fl/.fi/.fta/.fsub
//              del sistema de formularios). Envía a /api/lead con un asunto prefijado
//              (ej. demo de software). Usado en el CTA de la página Software.

'use client';

import { useState } from 'react';

interface DemoFormProps {
  subject?: string;   // se envía como `challenge` al lead
  source?: string;    // origen del lead
  submitLabel?: string;
}

interface FormState { name: string; email: string; company: string; message: string; }

export default function DemoForm({
  subject = 'Demo de software (Zaire)',
  source = 'sistemas_cta',
  submitLabel = 'Pedir una demo →',
}: DemoFormProps) {
  const [form, setForm] = useState<FormState>({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, challenge: subject, source }),
      });
      if (!res.ok) throw new Error('error');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--fd)', fontSize: 48, fontWeight: 900, color: '#FF6A00', lineHeight: 1, marginBottom: 12 }}>✓</div>
        <h3 style={{ fontFamily: 'var(--fd)', fontSize: 26, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12, color: '#111' }}>Recibido</h3>
        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7 }}>
          Te contactamos en las próximas 24 horas hábiles para coordinar la demo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="fg">
        <label className="fl" htmlFor="d-name">Nombre *</label>
        <input id="d-name" className="fi" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Tu nombre" maxLength={100} />
      </div>
      <div className="fg">
        <label className="fl" htmlFor="d-email">Email *</label>
        <input id="d-email" className="fi" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@empresa.com" maxLength={200} />
      </div>
      <div className="fg">
        <label className="fl" htmlFor="d-company">Empresa</label>
        <input id="d-company" className="fi" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Nombre de tu empresa" maxLength={200} />
      </div>
      <div className="fg">
        <label className="fl" htmlFor="d-msg">Contanos tu operación</label>
        <textarea id="d-msg" className="fta" style={{ height: 90 }} value={form.message}
          onChange={e => set('message', e.target.value)}
          placeholder="¿Qué operás? Activos, técnicos en campo, órdenes, stock..." maxLength={1000} />
      </div>

      {status === 'error' && (
        <p style={{ color: '#E71D0A', fontSize: 13, marginBottom: 12 }}>
          Error al enviar. Intentá de nuevo o escribinos a hola@zairetech.com
        </p>
      )}

      <button className="fsub" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'ENVIANDO...' : submitLabel}
      </button>
      <p style={{ fontSize: 11, color: '#aaa', marginTop: 10, lineHeight: 1.6 }}>
        Pedís una demo de Zaire Industrial. Al enviar aceptás nuestra{' '}
        <a href="/politica-de-privacidad" style={{ color: '#888', textDecoration: 'underline' }}>política de privacidad</a>.
      </p>
    </form>
  );
}
