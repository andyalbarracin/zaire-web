// File: page.tsx
// Path: zaire-web/app/sistemas/page.tsx
// Last modified: 2026-04-27
// Description: Página de sistemas — 3 capas de arquitectura ZAIRE en detalle.

'use client';

import { useState } from 'react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import Reveal from '@/components/reveal';

const layers = [
  {
    num: 'Capa 1', title: 'Workflows Determinísticos',
    color: '#FF6A00',
    bg: '#fff', textColor: '#111', bodyColor: '#888',
    body: 'El primer nivel de cualquier sistema ZAIRE. Automatizaciones predecibles y auditables donde cada paso está definido, documentado y fácil de mantener. Sin IA, sin magia — solo lógica limpia y confiable.',
    capabilities: ['Integración entre herramientas (CRM, email, WhatsApp, APIs)', 'Triggers automáticos por eventos o tiempo', 'Transformación y limpieza de datos', 'Notificaciones y alertas estructuradas', 'Documentación automática de cada ejecución'],
    tools: ['n8n', 'Make', 'Zapier', 'Webhooks', 'APIs REST', 'Zapier'],
    chipBg: '#f0efe9', chipColor: '#888',
  },
  {
    num: 'Capa 2', title: 'Sistemas Híbridos con IA',
    color: '#FF6A00',
    bg: '#111', textColor: '#fff', bodyColor: '#888',
    body: 'Workflows que incorporan inteligencia: clasifican, deciden y responden con contexto real. La IA no reemplaza la lógica — la amplifica en los puntos donde el juicio suma valor real.',
    capabilities: ['Clasificación y enrutamiento inteligente de inputs', 'Generación de respuestas con contexto de empresa', 'Extracción y estructuración de datos no estructurados', 'Scoring y priorización automática', 'Knowledge base consultable en tiempo real'],
    tools: ['Claude', 'GPT-4o', 'RAG', 'Supabase', 'pgvector', 'LangChain'],
    chipBg: '#222', chipColor: '#aaa',
  },
  {
    num: 'Capa 3', title: 'Arquitectura Agentic',
    color: '#111',
    bg: '#FF6A00', textColor: '#111', bodyColor: 'rgba(0,0,0,.65)',
    body: 'El nivel más avanzado. Agentes especializados que operan de forma autónoma, coordinados por un sistema que les da contexto, herramientas y límites claros. Software operativo propio de tu empresa.',
    capabilities: ['Agentes con memoria y contexto persistente', 'Multi-agente: especialistas coordinados por orquestador', 'MCP para herramientas externas en tiempo real', 'Autonomía con supervisión configurable', 'Evolución continua con datos propios'],
    tools: ['MCP', 'Claude', 'Agentes', 'PostgreSQL', 'Software a medida'],
    chipBg: 'rgba(0,0,0,.15)', chipColor: 'rgba(0,0,0,.55)',
  },
];

export default function SistemasPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} dark activePage="/sistemas" />

      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// SISTEMA EN CAPAS · ARQUITECTURA ZAIRE</div>
            <h1 className="pg-hero-h1">TRES NIVELES.<br />UN <em>SISTEMA</em>.</h1>
            <p className="pg-hero-sub">
              No vendemos herramientas sueltas. Diseñamos arquitecturas que evolucionan desde la automatización básica hasta sistemas agentic completos.
            </p>
          </div>
          <div className="pg-hero-visual">
            <svg viewBox="0 0 320 220" fill="none" width="100%" height="220">
              {[
                { y: 20, stroke: '#444', label: 'WORKFLOWS DETERMINÍSTICOS', sub: 'CAPA 1' },
                { y: 84, stroke: '#FF6A00', label: 'SISTEMAS HÍBRIDOS IA', sub: 'CAPA 2' },
                { y: 148, stroke: '#FFC107', label: 'ARQUITECTURA AGENTIC', sub: 'CAPA 3' },
              ].map(({ y, stroke, label, sub }) => (
                <g key={sub}>
                  <rect x="20" y={y} width="280" height="52" rx="2" stroke={stroke} strokeWidth={stroke === '#FF6A00' ? 2 : 1.5} />
                  <text x="40" y={y + 22} fontFamily="monospace" fontSize="7" fill="#666">{sub}</text>
                  <text x="160" y={y + 32} fontFamily="monospace" fontSize="8" fill={stroke} textAnchor="middle">{label}</text>
                </g>
              ))}
              <line x1="160" y1="72" x2="160" y2="84" stroke="#444" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="160" y1="136" x2="160" y2="148" stroke="#444" strokeWidth="1" strokeDasharray="3 3" />
            </svg>
          </div>
        </div>
      </section>

      <Stripe />

      {layers.map((layer, i) => (
        <Reveal key={layer.num}>
          <section className="section" style={{ background: layer.bg }}>
            <div style={{ maxWidth: 900 }}>
              <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: layer.color, marginBottom: 12 }}>
                {layer.num}
              </div>
              <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, textTransform: 'uppercase', color: layer.textColor, lineHeight: .92, marginBottom: 24 }}>
                {layer.title}
              </h2>
              <p style={{ fontSize: 16, fontWeight: 300, color: layer.bodyColor, lineHeight: 1.75, maxWidth: 560, marginBottom: 32 }}>
                {layer.body}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: layer.color, marginBottom: 16 }}>
                    Capacidades
                  </div>
                  {layer.capabilities.map(c => (
                    <div key={c} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 14, color: layer.bodyColor, lineHeight: 1.5 }}>
                      <span style={{ color: layer.color, flexShrink: 0 }}>→</span>{c}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: layer.color, marginBottom: 16 }}>
                    Stack
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {layer.tools.map(t => (
                      <span key={t} style={{ fontFamily: 'var(--fm)', fontSize: 9, padding: '6px 12px', background: layer.chipBg, color: layer.chipColor, letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      ))}

      {/* ── SOFTWARE PROPIO · base operativa transversal (no es una Capa 4) ── */}
      <Reveal>
        <section className="section s-dk">
          <div style={{ maxWidth: 900 }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 12 }}>
              // SOFTWARE PROPIO
            </div>
            <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(28px,3.4vw,46px)', fontWeight: 800, textTransform: 'uppercase', color: '#fff', lineHeight: 0.95, marginBottom: 24, maxWidth: 760 }}>
              Cuando el sistema necesita una base a medida
            </h2>
            <p style={{ fontSize: 16, fontWeight: 300, color: '#888', lineHeight: 1.75, maxWidth: 620, marginBottom: 28 }}>
              Algunas operaciones no necesitan otra herramienta conectada: necesitan una plataforma propia. En esos casos diseñamos aplicaciones web, CRMs, dashboards y sistemas internos donde las automatizaciones, agentes y bases de conocimiento pueden operar sobre datos propios.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Apps', 'CRMs', 'Dashboards', 'Portales', 'APIs', 'Agentes'].map(t => (
                <span key={t} style={{ fontFamily: 'var(--fm)', fontSize: 9, padding: '6px 12px', background: '#222', color: '#aaa', letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <section className="cta-sec">
          <div>
            <div className="s-lbl">// EXPLOREMOS JUNTOS</div>
            <div className="cta-h" style={{ fontSize: 'clamp(28px, 4.5vw, 54px)', fontWeight: 700, lineHeight: 1.2 }}>¿EN QUÉ<br /><em>CAPA</em><br />ESTÁS?</div>
          </div>
          <div className="cta-right">
            <p>Identificamos en cuál de las tres capas tiene sentido empezar según tu operación actual y tus objetivos de escala.</p>
            <div className="cta-btns">
              <button className="btn btn-primary" onClick={() => setShowContact(true)}>Solicitar diagnóstico →</button>
            </div>
          </div>
        </section>
      </Reveal>

      <Footer />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
