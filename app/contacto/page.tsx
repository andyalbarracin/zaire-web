// File: page.tsx
// Path: zaire-web/app/contacto/page.tsx
// Last modified: 2026-04-27
// Description: Página de contacto con formulario de diagnóstico.
//              Envío al webhook configurado en .env.local.

'use client';

import { useState } from 'react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import Reveal from '@/components/reveal';

interface FormState {
  name: string;
  email: string;
  company: string;
  employees: string;
  challenge: string;
  message: string;
}

const employees = ['1–5', '6–20', '21–50', '50+'];
const challenges = ['Automatización de procesos', 'Agentes IA y chatbots', 'Revenue y ventas', 'Knowledge management', 'Otro'];

export default function ContactoPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', company: '', employees: '', challenge: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'contacto_form' }),
      });
      if (!res.ok) throw new Error('error');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <Nav onContact={() => {}} dark activePage="/contacto" />

      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// CONTACTO · PRIMER PASO</div>
            <h1 className="pg-hero-h1">VEAMOS QUÉ<br /><em>CONSTRUIMOS</em><br />JUNTOS</h1>
            <p className="pg-hero-sub">
              Un diagnóstico de 30 minutos es suficiente para identificar el proceso de mayor impacto y definir si tiene sentido avanzar.
            </p>
          </div>
          <div className="pg-hero-visual">
            <svg viewBox="0 0 320 220" fill="none" width="100%" height="220">
              <rect x="40" y="20" width="240" height="180" rx="2" stroke="#333" strokeWidth="1.5" />
              <line x1="40" y1="52" x2="280" y2="52" stroke="#333" strokeWidth="1" />
              <rect x="60" y="68" width="200" height="20" rx="1" stroke="#444" strokeWidth="1" />
              <rect x="60" y="100" width="200" height="20" rx="1" stroke="#444" strokeWidth="1" />
              <rect x="60" y="132" width="200" height="40" rx="1" stroke="#444" strokeWidth="1" />
              <rect x="60" y="184" width="200" height="12" rx="1" fill="#FF6A00" />
              <text x="160" y="194" fontFamily="monospace" fontSize="7" fill="#111" textAnchor="middle">ENVIAR DIAGNÓSTICO</text>
              <text x="160" y="40" fontFamily="monospace" fontSize="8" fill="#555" textAnchor="middle">FORMULARIO DE CONTACTO</text>
            </svg>
          </div>
        </div>
      </section>

      <Stripe />

      <Reveal>
        <section className="section">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            {/* Info */}
            <div>
              <div className="s-lbl">// INFORMACIÓN</div>
              <h2 className="s-h2" style={{ marginBottom: 32 }}>CÓMO<br /><em>FUNCIONA</em></h2>

              {[
                { n: '01', title: 'Completás el formulario', body: 'Nos contás sobre tu empresa y el desafío principal. Lleva 3 minutos.' },
                { n: '02', title: 'Te contactamos en 24h', body: 'Coordinamos un diagnóstico de 30 minutos por video.' },
                { n: '03', title: 'Diagnóstico sin compromiso', body: 'Identificamos el proceso de mayor impacto y si tiene sentido avanzar juntos.' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', flexShrink: 0, paddingTop: 4 }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--fd)', fontSize: 18, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: 14, color: '#888', lineHeight: 1.65 }}>{s.body}</div>
                  </div>
                </div>
              ))}

              <div style={{ padding: 24, background: '#fff', borderRadius: 2, marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: 12 }}>
                  También podés escribirnos directo
                </div>
                <a href="mailto:hola@zaire.studio" style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 700, color: '#111', textTransform: 'uppercase' }}>
                  hola@zaire.studio
                </a>
              </div>
            </div>

            {/* Formulario */}
            <div>
              {status === 'done' ? (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--fd)', fontSize: 64, fontWeight: 900, color: '#FF6A00', lineHeight: 1, marginBottom: 16 }}>✓</div>
                  <h2 style={{ fontFamily: 'var(--fd)', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', marginBottom: 16 }}>Recibido</h2>
                  <p style={{ fontSize: 15, color: '#888', lineHeight: 1.75 }}>
                    Te contactamos en las próximas 24 horas hábiles para coordinar el diagnóstico.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className="fg">
                    <label className="fl" htmlFor="f-name">Nombre *</label>
                    <input id="f-name" className="fi" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Tu nombre" />
                  </div>
                  <div className="fg">
                    <label className="fl" htmlFor="f-email">Email *</label>
                    <input id="f-email" className="fi" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@empresa.com" />
                  </div>
                  <div className="fg">
                    <label className="fl" htmlFor="f-company">Empresa</label>
                    <input id="f-company" className="fi" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Nombre de tu empresa" />
                  </div>

                  <div className="fg">
                    <label className="fl">Tamaño del equipo</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {employees.map(e => (
                        <button key={e} type="button"
                          onClick={() => set('employees', e)}
                          style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: 2, cursor: 'pointer', border: `1.5px solid ${form.employees === e ? '#111' : '#e5e3dd'}`, background: form.employees === e ? '#111' : 'transparent', color: form.employees === e ? '#fff' : '#888', transition: 'all .15s' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fg">
                    <label className="fl">Principal desafío</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {challenges.map(c => (
                        <button key={c} type="button"
                          onClick={() => set('challenge', c)}
                          style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 14px', borderRadius: 2, cursor: 'pointer', border: `1.5px solid ${form.challenge === c ? '#FF6A00' : '#e5e3dd'}`, background: form.challenge === c ? '#FF6A00' : 'transparent', color: form.challenge === c ? '#111' : '#888', transition: 'all .15s' }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fg">
                    <label className="fl" htmlFor="f-msg">Descripción breve</label>
                    <textarea id="f-msg" className="fta" style={{ height: 120 }} value={form.message}
                      onChange={e => set('message', e.target.value)}
                      placeholder="Contanos brevemente tu operación o el problema principal que querés resolver..." />
                  </div>

                  {status === 'error' && (
                    <p style={{ color: '#E71D0A', fontSize: 13, marginBottom: 12 }}>
                      Error al enviar. Intentá nuevamente o escribinos a hola@zaire.studio
                    </p>
                  )}

                  <button className="fsub" type="submit" disabled={status === 'sending'}>
                    {status === 'sending' ? 'ENVIANDO...' : 'SOLICITAR DIAGNÓSTICO →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      <Footer />
    </>
  );
}
