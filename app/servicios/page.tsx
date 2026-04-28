// File: page.tsx
// Path: zaire-web/app/servicios/page.tsx
// Last modified: 2026-04-27
// Description: Página de servicios — arquitectura operativa en 3 capas.

'use client';

import { useState } from 'react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import Reveal from '@/components/reveal';
import { IWorkflow, IAgent, IKnowledge, IRevenue, IGrowth, IInfra } from '@/components/icons';

const servicesData = [
  {
    layer: '// AUTOMATIZACIÓN · CAPA 1',
    items: [
      { icon: <IWorkflow s="#FF6A00" size={48} />, title: 'Automatización de Flujos', tag: 'n8n · Make · Zapier · Webhooks · APIs REST', body: 'Procesos automáticos bien definidos que conectan tus herramientas sin vueltas. Todo queda ordenado, documentado y fácil de mantener.' },
      { icon: <IAgent s="#FF6A00" size={48} />, title: 'Agentes IA', tag: 'Claude · GPT-4o · LangChain · MCP · Ollama', body: 'Agentes especializados que clasifican, deciden y ejecutan. Integrados a tu operación real, no como demos sino como infraestructura.' },
    ],
  },
  {
    layer: '// KNOWLEDGE INFRASTRUCTURE · CAPA 2–3',
    items: [
      { icon: <IKnowledge s="#FF6A00" size={48} />, title: 'Knowledge Infrastructure', tag: 'Supabase · PostgreSQL · pgvector · RAG · MCP', body: 'Base de conocimiento propia sobre tus documentos, procesos y marca. Los agentes la consultan, los equipos la actualizan.' },
      { icon: <IRevenue s="#FF6A00" size={48} />, title: 'Revenue Systems', tag: 'HubSpot · Pipedrive · n8n · WhatsApp API · Email', body: 'Sistemas de ventas que trabajan de forma automática: priorizan oportunidades, hacen seguimiento y generan propuestas con mejor contexto.' },
    ],
  },
  {
    layer: '// ARQUITECTURA · CÓMO SE ORGANIZA TODO',
    items: [
      { icon: <IGrowth s="#FF6A00" size={48} />, title: 'Growth y Performance', tag: 'Analytics · contenido · SEO automatizado · A/B', body: 'Sistemas que escalan tu presencia digital sin escalar tu equipo. Contenido a escala con brand voice preservado.' },
      { icon: <IInfra s="#FF6A00" size={48} />, title: 'Infraestructura Híbrida', tag: 'Supabase · PostgreSQL · APIs · webhooks · auth', body: 'La base técnica que conecta todo lo demás. Base de datos, autenticación, APIs internas y seguridad operativa.' },
    ],
  },
];

export default function ServiciosPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} dark activePage="/servicios" />

      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// SERVICIOS · ARQUITECTURA OPERATIVA</div>
            <h1 className="pg-hero-h1">LO QUE<br /><em>CONSTRUIMOS</em></h1>
            <p className="pg-hero-sub">
              No hacemos solo automatizaciones. Construimos sistemas conectados en tres capas que operan como infraestructura real de tu negocio.
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 32 }}>
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

      {/* CTA */}
      <Reveal>
        <section className="cta-sec">
          <div>
            <div className="s-lbl">// SIGUIENTE PASO</div>
            <div className="cta-h">DISEÑEMOS<br />TU <em>SISTEMA</em></div>
          </div>
          <div className="cta-right">
            <p>Identificamos en 30 minutos qué servicio tiene mayor impacto en tu operación actual.</p>
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
