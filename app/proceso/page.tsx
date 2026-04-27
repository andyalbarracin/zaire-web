// File: page.tsx
// Path: zaire-web/app/proceso/page.tsx
// Last modified: 2026-04-27
// Description: Página del proceso de trabajo — 5 etapas metodológicas.

'use client';

import { useState } from 'react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import Reveal from '@/components/reveal';

const steps = [
  {
    n: '01', title: 'Discovery',
    body: 'Mapeamos tu operación actual: qué herramientas usás, dónde están las fricciones, qué procesos se repiten y qué datos tenés disponibles. Sin supuestos, sin propuestas genéricas.',
    detail: ['Entrevistas con el equipo operativo', 'Mapeo de herramientas y flujos actuales', 'Identificación del proceso de mayor impacto', 'Diagnóstico escrito con recomendación'],
    duration: '1 semana',
  },
  {
    n: '02', title: 'Diseño',
    body: 'Arquitecturamos el sistema antes de escribir una línea de código. Definimos los flujos, agentes, integraciones y estructuras de datos. El diseño es el contrato entre lo que prometemos y lo que entregamos.',
    detail: ['Diagrama de arquitectura del sistema', 'Definición de herramientas y stack', 'Especificación de flujos y agentes', 'Validación con el equipo antes de implementar'],
    duration: '1–2 semanas',
  },
  {
    n: '03', title: 'Implementación',
    body: 'Construimos y conectamos todo. Cada pieza documentada, cada decisión explicada. No entregamos cajas negras — entregamos sistemas que tu equipo puede entender y mantener.',
    detail: ['Desarrollo de workflows e integraciones', 'Configuración de agentes y knowledge base', 'Testing en ambiente de staging', 'Documentación técnica y operativa'],
    duration: '2–6 semanas',
  },
  {
    n: '04', title: 'Estabilización',
    body: 'El sistema entra en producción con supervisión activa. Monitoreamos, ajustamos y respondemos ante cualquier comportamiento inesperado. Es el período más crítico y más ignorado.',
    detail: ['Go-live con monitoreo activo', 'Ajustes post-lanzamiento', 'Entrenamiento del equipo', 'Definición de métricas de éxito'],
    duration: '2–4 semanas',
  },
  {
    n: '05', title: 'Evolución',
    body: 'Un sistema que no evoluciona se vuelve deuda técnica. Revisamos trimestralmente, incorporamos nuevas capacidades y escalamos lo que funciona. El sistema crece con tu empresa.',
    detail: ['Revisión trimestral de arquitectura', 'Incorporación de nuevas integraciones', 'Optimización basada en datos reales', 'Roadmap de evolución del sistema'],
    duration: 'Ongoing',
  },
];

export default function ProcesoPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} dark activePage="/proceso" />

      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// PROCESO · CÓMO TRABAJAMOS</div>
            <h1 className="pg-hero-h1">MÉTODO.<br /><em>RIGOR</em>.<br />SISTEMA.</h1>
            <p className="pg-hero-sub">
              Cada proyecto ZAIRE sigue cinco etapas. No hay atajos porque los atajos son la razón por la que la mayoría de las automatizaciones fallan.
            </p>
          </div>
          <div className="pg-hero-visual">
            <svg viewBox="0 0 320 220" fill="none" width="100%" height="220">
              {steps.slice(0, 5).map((s, i) => (
                <g key={s.n}>
                  <circle cx={40 + i * 60} cy="110" r="18" stroke={i === 0 ? '#FF6A00' : '#333'} strokeWidth={i === 0 ? 2 : 1.5} />
                  <text x={40 + i * 60} y="114" fontFamily="monospace" fontSize="9" fill={i === 0 ? '#FF6A00' : '#555'} textAnchor="middle">{s.n}</text>
                  {i < 4 && <line x1={58 + i * 60} y1="110" x2={82 + i * 60} y2="110" stroke="#333" strokeWidth="1" strokeDasharray="3 3" />}
                  <text x={40 + i * 60} y="140" fontFamily="monospace" fontSize="7" fill="#555" textAnchor="middle">{s.title.toUpperCase()}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      <Stripe />

      {/* Etapas */}
      {steps.map((step, i) => (
        <Reveal key={step.n}>
          <section className={`section${i % 2 === 1 ? ' s-wh' : ''}`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'start' }}>
              <div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 12 }}>
                  Etapa {step.n}
                </div>
                <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(36px,4vw,52px)', fontWeight: 800, textTransform: 'uppercase', lineHeight: .92, marginBottom: 16 }}>
                  {step.title}
                </h2>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#aaa', padding: '6px 12px', background: '#f0efe9', display: 'inline-block', borderRadius: 2 }}>
                  Duración: {step.duration}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 300, color: '#777', lineHeight: 1.8, marginBottom: 32 }}>
                  {step.body}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {step.detail.map(d => (
                    <div key={d} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#888', lineHeight: 1.5 }}>
                      <span style={{ color: '#FF6A00', flexShrink: 0 }}>→</span>{d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      ))}

      {/* CTA */}
      <Reveal>
        <section className="section s-dk" style={{ textAlign: 'center' }}>
          <div className="s-lbl s-lbl-dk" style={{ textAlign: 'center' }}>// EMPEZAR</div>
          <h2 className="s-h2" style={{ color: '#fff', marginBottom: 24, textAlign: 'center' }}>EL DISCOVERY<br /><em>ES GRATIS</em></h2>
          <p style={{ fontSize: 15, color: '#888', fontWeight: 300, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.75 }}>
            La primera etapa no cuesta nada. Mapeamos tu operación, identificamos el proceso de mayor impacto y te decimos si conviene avanzar.
          </p>
          <button className="btn btn-primary" onClick={() => setShowContact(true)}>
            Solicitar Discovery →
          </button>
        </section>
      </Reveal>

      <Footer />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
