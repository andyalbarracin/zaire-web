// File: page.tsx
// Path: zaire-web/app/servicios/page.tsx
// Last modified: 2026-04-27
// Description: Página de servicios — arquitectura operativa en 3 capas.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import Reveal from '@/components/reveal';
import SoftwareCard from '@/components/software-card';
import { IWorkflow, IAgent, IKnowledge, IRevenue, IGrowth, IInfra } from '@/components/icons';

const servicesData = [
  {
    layer: '// AUTOMATIZACIÓN · CAPA 1',
    blurb: 'Automatizaciones predecibles y auditables: cada paso definido, documentado y fácil de mantener. Lógica limpia, sin IA de por medio.',
    items: [
      { icon: <IWorkflow s="#FF6A00" size={48} />, title: 'Automatización de Flujos', tag: 'n8n · Make · Zapier · Webhooks · APIs REST', body: 'Procesos automáticos bien definidos que conectan tus herramientas sin vueltas. Todo queda ordenado, documentado y fácil de mantener.' },
      { icon: <IAgent s="#FF6A00" size={48} />, title: 'Agentes IA', tag: 'Claude · GPT-4o · LangChain · MCP · Ollama', body: 'Agentes especializados que clasifican, deciden y ejecutan. Integrados a tu operación real, no como demos sino como infraestructura.' },
    ],
  },
  {
    layer: '// KNOWLEDGE INFRASTRUCTURE · CAPA 2–3',
    blurb: 'Workflows que incorporan inteligencia. Clasifican, deciden y responden con contexto real, sobre una base de conocimiento propia consultable en tiempo real.',
    items: [
      { icon: <IKnowledge s="#FF6A00" size={48} />, title: 'Knowledge Infrastructure', tag: 'Supabase · PostgreSQL · pgvector · RAG · MCP', body: 'Base de conocimiento propia sobre tus documentos, procesos y marca. Los agentes la consultan, los equipos la actualizan.' },
      { icon: <IRevenue s="#FF6A00" size={48} />, title: 'Revenue Systems', tag: 'HubSpot · Pipedrive · n8n · WhatsApp API · Email', body: 'Sistemas de ventas que trabajan de forma automática: priorizan oportunidades, hacen seguimiento y generan propuestas con mejor contexto.' },
    ],
  },
  {
    layer: '// ARQUITECTURA · CÓMO SE ORGANIZA TODO',
    blurb: 'Agentes especializados que operan de forma autónoma, coordinados por un sistema que les da contexto, herramientas y límites claros. Software operativo propio.',
    items: [
      { icon: <IGrowth s="#FF6A00" size={48} />, title: 'Growth y Performance', tag: 'Analytics · contenido · SEO automatizado · A/B', body: 'Sistemas que escalan tu presencia digital sin escalar tu equipo. Contenido a escala con brand voice preservado.' },
      { icon: <IInfra s="#FF6A00" size={48} />, title: 'Infraestructura Híbrida', tag: 'Supabase · PostgreSQL · APIs · webhooks · auth', body: 'La base técnica que conecta todo lo demás. Base de datos, autenticación, APIs internas y seguridad operativa.' },
    ],
  },
];

/* Preview de casos (linkea a /casos) */
const casosPreview = [
  { sector: 'VENTAS B2B', title: 'Pipeline Inteligente', body: 'Lead scoring por agente IA, seguimiento automático y propuestas con contexto real.' },
  { sector: 'MARKETING', title: 'Contenido Operativo', body: 'Generación a escala con brand voice propio; el equipo revisa y aprueba.' },
  { sector: 'SOPORTE', title: 'Agente 24/7', body: 'Agente entrenado con tu conocimiento que resuelve y deriva lo complejo.' },
];

/* Preview de planes (linkea a /planes) */
const planesPreview = [
  { name: 'FLOW', tier: 'Automatizá tu primer flujo', hint: 'Setup desde USD 249 · Mant. desde USD 99/mes', feat: false },
  { name: 'PERFORMANCE', tier: 'Operá sin fricción', hint: 'Setup desde USD 399 · Mant. desde USD 250/mes', feat: true },
  { name: 'INTELLIGENCE', tier: 'Arquitectura total', hint: 'A medida', feat: false },
];

export default function ServiciosPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} dark activePage="/servicios" />

      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// ZAIRE STUDIO · ARQUITECTURA OPERATIVA</div>
            <h1 className="pg-hero-h1">ZAIRE <em>STUDIO</em></h1>
            <p className="pg-hero-sub">
              Zaire Studio es nuestra rama de servicios: diseñamos e implementamos sistemas a medida.
              Si buscás software de producto, mirá{' '}
              <Link href="/sistemas" style={{ color: '#FF6A00', fontWeight: 500 }}>Zaire →</Link>
            </p>
          </div>
          <div className="pg-hero-visual">
            <svg viewBox="0 0 320 220" fill="none" width="100%" height="220">
              <rect x="20" y="20" width="280" height="52" rx="2" stroke="#333" strokeWidth="1.5" />
              <text x="160" y="42" fontFamily="monospace" fontSize="8" fill="#555" textAnchor="middle">CAPA 1 · WORKFLOWS</text>
              <rect x="20" y="84" width="280" height="52" rx="2" stroke="#FF6A00" strokeWidth="2" />
              <text x="160" y="106" fontFamily="monospace" fontSize="8" fill="#FF6A00" textAnchor="middle">CAPA 2 · KNOWLEDGE + AGENTES</text>
              <rect x="20" y="148" width="280" height="52" rx="2" stroke="#FFC107" strokeWidth="1.5" />
              <text x="160" y="170" fontFamily="monospace" fontSize="8" fill="#FFC107" textAnchor="middle">CAPA 3 · ARQUITECTURA AGENTIC</text>
            </svg>
          </div>
        </div>
      </section>

      <Stripe />

      {servicesData.map((layer, i) => (
        <Reveal key={layer.layer}>
          <section className={`section${i % 2 === 1 ? ' s-dk' : ''}`}>
            <div className="s-lbl" style={i % 2 === 1 ? { color: '#aaa' } : {}}>{layer.layer}</div>
            <p style={{ fontSize: 15, fontWeight: 300, color: i % 2 === 1 ? '#888' : '#777', lineHeight: 1.7, maxWidth: 620, marginTop: 16 }}>
              {layer.blurb}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 28 }}>
              {layer.items.map(item => (
                <div key={item.title} className={i % 2 === 1 ? 'svc-card' : 'prob-card'} style={{ minHeight: 300 }}>
                  <div className="svc-icon" style={{ width: 48, height: 48 }}>{item.icon}</div>
                  <div style={{ fontFamily: 'var(--fd)', fontSize: 28, fontWeight: 800, textTransform: 'uppercase', color: i % 2 === 1 ? '#fff' : '#111', lineHeight: 1 }}>
                    {item.title}
                  </div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: i % 2 === 1 ? '#888' : '#aaa' }}>
                    {item.tag}
                  </div>
                  <p style={{ fontSize: 14, color: i % 2 === 1 ? '#888' : '#777', lineHeight: 1.7, fontWeight: 300 }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      ))}

      {/* ── SOFTWARE OPERATIVO A MEDIDA · línea transversal (no es una Capa) ── */}
      {/* Padding 0 + márgenes negativos: comprime el doble gap de sección (mismo fondo cream) */}
      <Reveal>
        <section className="section" style={{ paddingTop: 0, paddingBottom: 0, marginTop: -32, marginBottom: -32 }}>
          <div className="s-lbl">// SOFTWARE OPERATIVO · SISTEMAS A MEDIDA</div>
          <div style={{ marginTop: 32 }}>
            <SoftwareCard />
          </div>
        </section>
      </Reveal>

      {/* ── CASOS DE USO (preview → /casos) ── */}
      <Reveal>
        <section className="section">
          <div className="s-lbl">// CASOS DE USO · SISTEMAS EN OPERACIÓN</div>
          <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 40 }}>SISTEMAS EN<br /><em>OPERACIÓN</em></h2>
          <div className="cases-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {casosPreview.map(c => (
              <div key={c.title} className="case-card">
                <div className="case-sector">{c.sector}</div>
                <div className="case-title">{c.title}</div>
                <div className="case-body">{c.body}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <Link href="/casos">
              <button className="btn btn-dark">Ver todos los casos →</button>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── PLANES (preview → /planes) ── */}
      <Reveal>
        <section className="section s-dk">
          <div className="s-lbl" style={{ color: '#FF6A00' }}>// PLANES DE ZAIRE STUDIO · ELEGÍ TU NIVEL</div>
          <h2 className="s-h2" style={{ color: '#fff', marginTop: 12, marginBottom: 8 }}>ELEGÍ TU <em>NIVEL</em></h2>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 40, fontWeight: 300 }}>
            Cada plan es un sistema completo, no una lista de funciones.
          </p>
          <div className="cases-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {planesPreview.map(p => (
              <div key={p.name} style={{ background: p.feat ? 'var(--org)' : '#1a1a1a', borderRadius: 2, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: p.feat ? 'rgba(0,0,0,.5)' : '#888' }}>{p.tier}</div>
                <div style={{ fontFamily: 'var(--fd)', fontSize: 30, fontWeight: 800, textTransform: 'uppercase', color: p.feat ? '#111' : '#fff', lineHeight: 1 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: p.feat ? 'rgba(0,0,0,.7)' : '#aaa', lineHeight: 1.5 }}>{p.hint}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <Link href="/planes">
              <button className="btn btn-white">Ver planes en detalle →</button>
            </Link>
          </div>
        </section>
      </Reveal>

      <Footer />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
