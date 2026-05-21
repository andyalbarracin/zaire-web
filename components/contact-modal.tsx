// File: contact-modal.tsx
// Path: zaire-web/components/contact-modal.tsx
// Last modified: 2026-04-27
// Description: Modal de contacto con formulario. Cierra al hacer click en overlay.
//              Envío preparado para conectar a webhook (n8n u otro).

'use client';

import { useState } from 'react';

interface ContactModalProps {
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  message: string;
}

export default function ContactModal({ onClose }: ContactModalProps) {
  const [form, setForm] = useState<FormState>({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      // Conectar webhook aquí — reemplazar URL con endpoint de n8n/make/etc.
      // await fetch(process.env.NEXT_PUBLIC_CONTACT_WEBHOOK_URL!, {
      //   method: 'POST', headers: {'Content-Type':'application/json'},
      //   body: JSON.stringify(form),
      // });
      await new Promise(r => setTimeout(r, 800)); // simulación
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="m-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="m-box">
        <button className="m-close" onClick={onClose} aria-label="Cerrar">×</button>

        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <div className="m-h" style={{ fontSize: 28 }}>Recibido</div>
            <p className="m-sub" style={{ marginBottom: 0 }}>
              Te contactamos en las próximas 24 horas hábiles para coordinar el diagnóstico.
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="m-h">HABLA CON <em>ZAIRE</em></div>
            <p className="m-sub">
              Cuéntanos sobre tu operación. Identificamos en 30 minutos dónde conviene empezar.
            </p>

            <div className="fg">
              <label className="fl" htmlFor="c-name">Nombre *</label>
              <input id="c-name" className="fi" required value={form.name}
                onChange={e => set('name', e.target.value)} placeholder="Tu nombre" />
            </div>

            <div className="fg">
              <label className="fl" htmlFor="c-email">Email *</label>
              <input id="c-email" className="fi" type="email" required value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="tu@empresa.com" />
            </div>

            <div className="fg">
              <label className="fl" htmlFor="c-company">Empresa</label>
              <input id="c-company" className="fi" value={form.company}
                onChange={e => set('company', e.target.value)} placeholder="Nombre de tu empresa" />
            </div>

            <div className="fg">
              <label className="fl" htmlFor="c-msg">¿En qué quieres empezar?</label>
              <textarea id="c-msg" className="fta" value={form.message}
                onChange={e => set('message', e.target.value)}
                placeholder="Descríbenos brevemente tu operación o el problema principal..." />
            </div>

            {status === 'error' && (
              <p style={{ color: '#E71D0A', fontSize: 13, marginBottom: 12 }}>
                Hubo un error al enviar. Intenta nuevamente o escríbenos a hola@zairetech.com
              </p>
            )}

            <button className="fsub" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'ENVIANDO...' : 'SOLICITAR DIAGNÓSTICO →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
