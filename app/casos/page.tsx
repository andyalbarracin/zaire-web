// File: page.tsx
// Path: zaire-web/app/casos/page.tsx
// Last modified: 2026-04-27
// Description: Página de casos de uso y escenarios de implementación por industria.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import Reveal from '@/components/reveal';

const casos = [
  {
    sector: 'INDUSTRIA · OIL & GAS',
    title: 'De un Access de 15 años a Zaire Industrial',
    challenge: 'Un proveedor de sellos mecánicos y bombas para operadoras de oil & gas de primera línea, certificado ISO 9001, manejaba sus órdenes de trabajo en un Access de quince años: monousuario, sin auditoría, con técnicos visitando plantas en varias provincias y relevamientos que llegaban por WhatsApp.',
    solution: 'Zaire Trace para la trazabilidad de órdenes con numeración correlativa por sucursal y auditoría ISO 9001. Zaire Field para las visitas: geocercas que confirman el arribo, reporte técnico con fotos y control de viáticos por región. Un mismo backend, el dato cargado una vez.',
    results: ['Órdenes numeradas, trazables y auditables — registro imborrable', 'Arribo a planta verificado por dato, no por palabra', 'El reporte de campo alimenta la orden sin recarga manual', 'Lista para la auditoría ISO todos los días, no la semana previa'],
    chips: ['Zaire Trace', 'Zaire Field', 'ISO 9001', 'Multi-sucursal'],
    hl: true,
  },
  {
    sector: 'VENTAS B2B',
    title: 'Pipeline Inteligente',
    challenge: 'Un equipo de ventas B2B gestionando leads en hojas de cálculo. Seguimientos manuales, propuestas genéricas y sin visibilidad del estado real del pipeline.',
    solution: 'Pipeline automatizado con lead scoring por agente IA, secuencias de seguimiento según comportamiento y propuestas generadas con contexto real del cliente.',
    results: ['80% reducción en tiempo de calificación', 'Seguimiento 100% automatizado hasta la reunión', 'Propuestas personalizadas en minutos'],
    chips: ['n8n', 'Claude', 'HubSpot', 'Email'],
    hl: false,
  },
  {
    sector: 'MARKETING',
    title: 'Contenido Operativo',
    challenge: 'Una empresa de servicios publicando contenido de forma irregular, con 3 personas dedicadas parcialmente y sin consistencia de brand voice.',
    solution: 'Sistema de generación de contenido a escala con knowledge base de marca propia. Los agentes crean, el equipo revisa y aprueba. Publicación automatizada multi-plataforma.',
    results: ['3× más contenido con el mismo equipo', 'Brand voice consistente en todos los canales', 'Ciclo editorial de días → horas'],
    chips: ['OpenAI', 'Supabase', 'RAG', 'n8n'],
    hl: false,
  },
  {
    sector: 'OPERACIONES INTERNAS',
    title: 'Onboarding Automatizado',
    challenge: 'Una empresa de tecnología con onboarding de clientes que tomaba 2 semanas y requería coordinación manual entre 5 equipos.',
    solution: 'Sistema de onboarding orquestado: contratos digitales, acceso a plataformas, comunicaciones secuenciales y tareas de equipo — todo disparado por un solo trigger.',
    results: ['Onboarding de 2 semanas → 48 horas', 'Cero coordinación manual entre equipos', 'NPS de onboarding +40 puntos'],
    chips: ['Webhooks', 'n8n', 'Notion', 'Email', 'Slack'],
    hl: false,
  },
  {
    sector: 'SOPORTE AL CLIENTE',
    title: 'Agente 24/7',
    challenge: 'Un SaaS B2B con soporte limitado a horario de oficina y tiempo promedio de respuesta de 4 horas para consultas frecuentes.',
    solution: 'Agente IA entrenado con knowledge base propia que resuelve el 70% de los tickets automáticamente, escala casos complejos y aprende de cada interacción.',
    results: ['70% de tickets resueltos sin humano', 'Tiempo de respuesta: 4h → 2 minutos', 'Equipo de soporte enfocado en casos reales'],
    chips: ['Claude', 'RAG', 'Supabase', 'Intercom'],
    hl: false,
  },
  {
    sector: 'INMOBILIARIA',
    title: 'Leads en WhatsApp',
    challenge: 'Una inmobiliaria perdiendo leads por respuesta lenta en WhatsApp y sin seguimiento estructurado de los prospectos.',
    solution: 'Agente en WhatsApp que responde al instante, califica el lead, agenda visitas y registra todo en el CRM. El broker humano solo entra cuando el lead está listo.',
    results: ['Respuesta instantánea 24/7 en WhatsApp', '3× más visitas agendadas', 'Pipeline siempre actualizado sin carga manual'],
    chips: ['WhatsApp API', 'n8n', 'Claude', 'CRM'],
    link: { href: '/sistemas', label: 'Conocé NIMO →' },
    hl: false,
  },
];

export default function CasosPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} dark activePage="/casos" />

      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// CASOS DE USO · ESCENARIOS REALES</div>
            <h1 className="pg-hero-h1">SISTEMAS EN<br /><em>OPERACIÓN</em></h1>
            <p className="pg-hero-sub">
              Escenarios concretos de implementación. Sin nombres de clientes, con arquitectura real y resultados medibles.
            </p>
          </div>
          <div className="pg-hero-visual">
            <svg viewBox="0 0 320 220" fill="none" width="100%" height="220">
              {[['B2B', 40, 20], ['MKTG', 180, 20], ['OPS', 40, 110], ['SOPORTE', 180, 110]].map(([label, x, y]) => (
                <g key={label}>
                  <rect x={Number(x)} y={Number(y)} width="120" height="72" rx="2" stroke="#333" strokeWidth="1.5" />
                  <text x={Number(x) + 60} y={Number(y) + 40} fontFamily="monospace" fontSize="9" fill="#555" textAnchor="middle">{label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      <Stripe />

      {/* Grid de casos */}
      <Reveal>
        <section className="section">
          <div className="cases-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {casos.map(c => (
              <div key={c.title} className={`case-card${c.hl ? ' hl' : ''}`} style={{ minHeight: 'auto', gap: 16 }}>
                <div className="case-sector">{c.sector}</div>
                <div className="case-title" style={{ fontSize: 26 }}>{c.title}</div>

                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: c.hl ? 'rgba(0,0,0,.4)' : '#555', marginBottom: 8 }}>
                    El problema
                  </div>
                  <div className="case-body" style={{ fontSize: 14 }}>{c.challenge}</div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: c.hl ? 'rgba(0,0,0,.4)' : '#FF6A00', marginBottom: 8 }}>
                    La solución
                  </div>
                  <div className="case-body" style={{ fontSize: 14 }}>{c.solution}</div>
                </div>

                <div>
                  {c.results.map(r => (
                    <div key={r} style={{ display: 'flex', gap: 10, fontSize: 13, color: c.hl ? 'rgba(0,0,0,.6)' : '#aaa', marginBottom: 8, lineHeight: 1.5 }}>
                      <span style={{ color: c.hl ? '#111' : '#FF6A00', flexShrink: 0 }}>✓</span>{r}
                    </div>
                  ))}
                </div>

                <div className="case-chips">
                  {c.chips.map(ch => (
                    <span key={ch} className="case-chip">{ch}</span>
                  ))}
                </div>

                {'link' in c && c.link && (
                  <Link
                    href={c.link.href}
                    style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: c.hl ? '#111' : '#FF6A00' }}
                  >
                    {c.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <section className="cta-sec">
          <div>
            <div className="s-lbl">// TU CASO</div>
            <div className="cta-h">¿EN QUÉ<br />INDUSTRIA<br /><em>ESTÁS?</em></div>
          </div>
          <div className="cta-right">
            <p>Contanos tu operación. En 30 minutos identificamos si tiene sentido y cómo sería el sistema para tu caso específico.</p>
            <div className="cta-btns">
              <button className="btn btn-primary" onClick={() => setShowContact(true)}>Hablar con ZAIRE →</button>
            </div>
          </div>
        </section>
      </Reveal>

      <Footer />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
