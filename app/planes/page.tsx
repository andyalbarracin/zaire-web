// File: page.tsx
// Path: zaire-web/app/planes/page.tsx
// Last modified: 2026-04-27
// Description: Página de planes — 3 niveles con tabla comparativa.

'use client';

import { useState } from 'react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import Reveal from '@/components/reveal';

const plans = [
  {
    tier: 'Automatiza tu primer flujo',
    name: 'ZAIRE\nFLOW',
    price: '$997', period: '/mes',
    promise: 'Para equipos que quieren dejar de hacer tareas manuales repetitivas y empezar a operar con estructura.',
    who: 'Ideal para: negocios en crecimiento, equipos de 3–15 personas',
    feats: ['1 workflow principal automatizado', 'Integración CRM + Email', 'Dashboard básico de seguimiento', 'Documentación del sistema', 'Soporte mensual dedicado'],
    dark: false, accent: false,
  },
  {
    tier: 'Opera sin fricción',
    name: 'ZAIRE\nPERFORMANCE',
    price: '$2,497', period: '/mes',
    promise: 'Para operaciones que necesitan inteligencia real integrada en su día a día, no solo automatizaciones básicas.',
    who: 'Ideal para: equipos de 10–50 personas, operaciones medianas',
    feats: ['Hasta 5 workflows conectados', 'Agente IA integrado a tu CRM', 'Knowledge base de marca propia', 'Reporting avanzado en tiempo real', 'Soporte semanal + optimización continua', 'Revisión mensual de arquitectura'],
    dark: true, accent: false,
  },
  {
    tier: 'Arquitectura total',
    name: 'ZAIRE\nINTELLIGENCE',
    price: 'A medida', period: '',
    promise: 'Para empresas que quieren construir infraestructura operativa real con agentes autónomos, sistemas multi-capa y software operativo.',
    who: 'Ideal para: empresas +50 personas, escala avanzada',
    feats: ['Workflows y agentes ilimitados', 'Arquitectura agentic completa', 'Infraestructura dedicada', 'Team de ingeniería ZAIRE', 'SLA + soporte prioritario 24/7', 'Evolución trimestral del sistema'],
    dark: false, accent: true,
  },
];

const compare = [
  { feat: 'Workflows', flow: '1', perf: 'Hasta 5', intel: 'Ilimitados' },
  { feat: 'Agente IA', flow: '—', perf: '✓', intel: '✓ Multi-agente' },
  { feat: 'Knowledge Base / RAG', flow: '—', perf: '✓', intel: '✓ Avanzada' },
  { feat: 'Integraciones CRM', flow: 'Básica', perf: 'Completa', intel: 'Custom' },
  { feat: 'Reporting', flow: 'Dashboard básico', perf: 'Avanzado', intel: 'A medida' },
  { feat: 'Soporte', flow: 'Mensual', perf: 'Semanal', intel: 'Prioritario 24/7' },
  { feat: 'Revisión de arquitectura', flow: '—', perf: 'Mensual', intel: 'Trimestral' },
  { feat: 'Documentación', flow: '✓', perf: '✓', intel: '✓ Completa' },
];

export default function PlanesPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} dark activePage="/planes" />

      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// PLANES · ELIGE TU NIVEL</div>
            <h1 className="pg-hero-h1">SISTEMAS<br /><em>COMPLETOS</em></h1>
            <p className="pg-hero-sub">
              Cada plan es un sistema completo, no una lista de funciones. Elegí el nivel de profundidad según donde está tu operación hoy.
            </p>
          </div>
          <div className="pg-hero-visual">
            <svg viewBox="0 0 320 220" fill="none" width="100%" height="220">
              <rect x="14" y="20" width="86" height="170" rx="2" stroke="#333" strokeWidth="1.5" />
              <text x="57" y="48" fontFamily="monospace" fontSize="8" fill="#555" textAnchor="middle">FLOW</text>
              <rect x="117" y="20" width="86" height="170" rx="2" stroke="#FF6A00" strokeWidth="2" />
              <text x="160" y="48" fontFamily="monospace" fontSize="8" fill="#FF6A00" textAnchor="middle">PERFORMANCE</text>
              <rect x="220" y="60" width="86" height="110" rx="2" stroke="#333" strokeWidth="1.5" />
              <text x="263" y="88" fontFamily="monospace" fontSize="8" fill="#555" textAnchor="middle">INTELLIGENCE</text>
              <text x="57" y="138" fontFamily="monospace" fontSize="18" fill="#555" textAnchor="middle" fontWeight="bold">$997</text>
              <text x="160" y="138" fontFamily="monospace" fontSize="18" fill="#FF6A00" textAnchor="middle" fontWeight="bold">$2.4k</text>
              <text x="263" y="138" fontFamily="monospace" fontSize="14" fill="#555" textAnchor="middle" fontWeight="bold">Custom</text>
            </svg>
          </div>
        </div>
      </section>

      <Stripe />

      {/* Cards de planes */}
      <Reveal>
        <section className="section">
          <div className="plans-grid">
            {plans.map(p => (
              <div key={p.name} className={`plan-card${p.dark ? ' feat' : ''}`}
                style={p.accent ? { background: 'var(--crm)', border: '2px solid #FF6A00' } : {}}>
                <div className="plan-tier" style={p.accent ? { color: '#FF6A00' } : {}}>{p.tier}</div>
                <div className="plan-name" style={{ whiteSpace: 'pre-line', color: p.dark ? '#fff' : '#111' }}>{p.name}</div>
                <div className="plan-price" style={{ color: p.dark ? '#fff' : '#111', fontSize: p.price === 'A medida' ? 38 : undefined }}>
                  {p.price}{p.period && <span>{p.period}</span>}
                </div>
                <p style={{ fontSize: 14, fontWeight: 300, color: p.dark ? '#555' : '#888', lineHeight: 1.7, borderTop: `1px solid ${p.dark ? '#1d1d1d' : '#eee'}`, paddingTop: 16 }}>
                  {p.promise}
                </p>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: p.dark ? '#444' : '#aaa' }}>
                  {p.who}
                </div>
                <div style={{ height: 1, background: p.dark ? '#1d1d1d' : '#eee' }} />
                <div className="plan-feats">
                  {p.feats.map(f => <div key={f} className="plan-feat" style={p.dark ? { color: '#aaa' } : {}}>{f}</div>)}
                </div>
                <button
                  className={`btn ${p.dark ? 'btn-primary' : 'btn-dark'}`}
                  style={{ justifyContent: 'center', width: '100%' }}
                  onClick={() => setShowContact(true)}
                >
                  EMPEZAR →
                </button>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Tabla comparativa */}
      <Reveal>
        <section className="section s-wh">
          <div className="s-lbl">// COMPARATIVA</div>
          <h2 className="s-h2" style={{ marginBottom: 40 }}>TODO DE<br /><em>UN VISTAZO</em></h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Funcionalidad', 'FLOW', 'PERFORMANCE', 'INTELLIGENCE'].map((h, i) => (
                    <th key={h} style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', padding: '16px 20px', textAlign: 'left', borderBottom: '2px solid #111', color: i === 2 ? '#FF6A00' : '#111' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compare.map((row, i) => (
                  <tr key={row.feat} style={{ background: i % 2 === 0 ? '#fff' : 'var(--crm)' }}>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: '1px solid #e5e3dd' }}>{row.feat}</td>
                    {[row.flow, row.perf, row.intel].map((v, j) => (
                      <td key={j} style={{ padding: '14px 20px', fontSize: 13, color: v === '—' ? '#ccc' : '#555', borderBottom: '1px solid #e5e3dd' }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <section className="section s-dk" style={{ textAlign: 'center' }}>
          <div className="s-lbl s-lbl-dk" style={{ textAlign: 'center' }}>// ¿DUDAS SOBRE CUÁL ELEGIR?</div>
          <h2 className="s-h2" style={{ color: '#fff', marginBottom: 24, textAlign: 'center' }}>HABLEMOS<br /><em>30 MINUTOS</em></h2>
          <p style={{ fontSize: 15, color: '#888', marginBottom: 32, fontWeight: 300, maxWidth: 480, margin: '0 auto 32px' }}>
            Te ayudamos a identificar cuál conviene según donde está tu operación hoy.
          </p>
          <button className="btn btn-primary" onClick={() => setShowContact(true)}>
            Solicitar diagnóstico gratuito →
          </button>
        </section>
      </Reveal>

      <Footer />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
