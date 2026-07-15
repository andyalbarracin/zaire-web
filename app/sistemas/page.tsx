// File: page.tsx
// Path: zaire-web/app/sistemas/page.tsx
// Last modified: 2026-07-14
// Description: Página de Software / Productos ZAIRE. Muestra la suite industrial
//              (Zaire Trace, Zaire Field), el roadmap de la suite y NIMO.
//              La explicación de las 3 capas se mudó a /servicios.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import Reveal from '@/components/reveal';

/* Dolores industriales — patrón de tarjetas numeradas (num + título + una oración) */
const pains = [
  { n: '01', title: 'Campo a Ciegas', body: 'La visita a planta se confirma con la palabra del técnico, no con un dato.' },
  { n: '02', title: 'Reportes Perdidos', body: 'El relevamiento del sello llega por WhatsApp, o llega tarde, o no llega.' },
  { n: '03', title: 'Viáticos sin Control', body: 'Combustible, peajes y hoteles se aprueban de memoria y se cierran a fin de mes.' },
  { n: '04', title: 'Vencimientos Ocultos', body: 'Licencias, VTV y seguros aparecen cuando ya son una multa.' },
  { n: '05', title: 'Doble Carga', body: 'Lo que el técnico anota en la planta, alguien lo vuelve a tipear en la oficina.' },
  { n: '06', title: 'Auditoría a Último Momento', body: 'La trazabilidad se arma la semana previa a la auditoría, no todos los días.' },
];

/* Productos de la suite industrial */
const products = [
  {
    name: 'Zaire Trace',
    body: 'Trazabilidad de órdenes de trabajo y de servicio, de punta a punta. Cada orden con su numeración correlativa por sucursal, sus ítems, sus estados y el historial completo de quién hizo qué y cuándo. Construido para operar bajo ISO 9001 y llegar a una auditoría sin preparar nada.',
    capabilities: [
      'Órdenes de trabajo (OT) y de servicio (OTS) con numeración correlativa por sucursal',
      'Ítems con datos técnicos: medida, marca, modelo, materiales, número de serie y TAG',
      'Estados con transiciones validadas e historial de cada cambio',
      'Semáforos de remitido, entregado y facturado calculados desde los ítems',
      'PDFs de orden y planilla de reparación con los datos y el logo de la empresa',
      'Log de auditoría completo y verificación de secuencia correlativa',
      'Reportes operativos y financieros con export a Excel',
      'Precio dual USD / ARS por ítem',
    ],
    tools: ['Next.js', 'Supabase', 'PostgreSQL', 'TypeScript', 'Vercel'],
  },
  {
    name: 'Zaire Field',
    body: 'El trabajo de campo, registrado como corresponde. Visitas agendadas, arribo confirmado por geocerca, reporte técnico con fotos y gastos controlados por técnico y por sucursal. Lo que pasa en la planta llega a la administración sin que nadie recargue un dato.',
    capabilities: [
      'Agenda y ciclo de vida de visitas con numeración correlativa por sucursal',
      'Arribo y salida de planta detectados automáticamente por geocerca',
      'Mapa con la traza del recorrido y timeline de eventos de cada visita',
      'Reporte técnico con medidas, marca, materiales y fotos',
      'Viáticos y gastos con aprobación y log de auditoría por gasto',
      'Documentos con vencimiento — licencias, VTV, seguros, aptos médicos — con alertas',
      'Fichas de técnicos, unidades y plantas con archivos y mantenimiento',
      'Solicitud de orden de trabajo desde el reporte de la visita',
    ],
    tools: ['Next.js', 'Supabase', 'PostgreSQL', 'Leaflet', 'TypeScript', 'Vercel'],
  },
];

/* Módulos del roadmap — todavía no disponibles */
const roadmap = [
  { name: 'Assets', body: 'Ficha por equipo con el historial completo de sus servicios.' },
  { name: 'Maintenance', body: 'Planes preventivos por equipo y sitio, que generan las visitas solos.' },
  { name: 'Stock', body: 'Repuestos, depósitos y series, descontados al usarse en una orden.' },
  { name: 'Fiscal', body: 'Comprobantes electrónicos ARCA desde órdenes y visitas facturables.' },
  { name: 'Contracts', body: 'Contratos de servicio, recurrencias y cumplimiento de SLA.' },
  { name: 'Analytics', body: 'MTTR, MTBF, backlog y costo por activo, cruzados entre módulos.' },
];

const nimoCapabilities = [
  'Administrador de propiedades con imágenes y estados',
  'Gestión de consultas con seguimiento',
  'Frontend público personalizable',
  'Panel autoadministrable, sin dependencia técnica',
];

export default function SistemasPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} dark activePage="/sistemas" />

      {/* ── HERO ── */}
      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// SOFTWARE PROPIO · PRODUCTOS ZAIRE</div>
            <h1 className="pg-hero-h1">EL SOFTWARE QUE <em>CONSTRUIMOS</em></h1>
            <p className="pg-hero-sub">
              Productos propios, en producción. Cada uno nació resolviendo la operación real
              de un cliente real, y después se volvió producto.
            </p>
          </div>
          <div className="pg-hero-visual">
            <svg viewBox="0 0 320 220" fill="none" width="100%" height="220">
              {[
                { y: 20, stroke: '#FF6A00', label: 'ZAIRE TRACE', sub: 'DISPONIBLE' },
                { y: 84, stroke: '#FF6A00', label: 'ZAIRE FIELD', sub: 'DISPONIBLE' },
                { y: 148, stroke: '#444', label: 'ASSETS · MAINTENANCE · STOCK …', sub: 'ROADMAP' },
              ].map(({ y, stroke, label, sub }) => (
                <g key={sub}>
                  <rect x="20" y={y} width="280" height="52" rx="2" stroke={stroke} strokeWidth={stroke === '#FF6A00' ? 2 : 1.5} strokeDasharray={sub === 'ROADMAP' ? '4 4' : undefined} />
                  <text x="40" y={y + 22} fontFamily="monospace" fontSize="7" fill="#666">{sub}</text>
                  <text x="160" y={y + 32} fontFamily="monospace" fontSize="8" fill={stroke} textAnchor="middle">{label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      <Stripe />

      {/* ── ZAIRE · SUITE INDUSTRIAL ── */}
      <Reveal>
        <section className="section">
          <div className="s-lbl">// ZAIRE · SUITE INDUSTRIAL</div>
          <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 24 }}>Zaire</h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#555', lineHeight: 1.75, maxWidth: 720, marginBottom: 40 }}>
            Software para empresas que mantienen, reparan y operan activos físicos. Órdenes de
            trabajo, trabajo de campo, activos y mantenimiento sobre un mismo backend: el dato
            se carga una vez y viaja solo.
          </p>

          <div className="prob-grid">
            {pains.map(p => (
              <div key={p.n} className="prob-card">
                <div className="prob-num">{p.n}</div>
                <div className="prob-title">{p.title}</div>
                <div className="prob-body">{p.body}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Productos: Zaire Trace, Zaire Field (alternando dark/light) ── */}
      {products.map((prod, i) => (
        <Reveal key={prod.name}>
          <section className={`section${i % 2 === 0 ? ' s-dk' : ''}`}>
            <div style={{ maxWidth: 900 }}>
              <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, textTransform: 'uppercase', color: i % 2 === 0 ? '#fff' : '#111', lineHeight: .92, marginBottom: 24 }}>
                {prod.name}
              </h2>
              <p style={{ fontSize: 16, fontWeight: 300, color: '#888', lineHeight: 1.75, maxWidth: 640, marginBottom: 32 }}>
                {prod.body}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 16 }}>
                    Capacidades
                  </div>
                  {prod.capabilities.map(c => (
                    <div key={c} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 14, color: i % 2 === 0 ? '#aaa' : '#666', lineHeight: 1.5 }}>
                      <span style={{ color: '#FF6A00', flexShrink: 0 }}>→</span>{c}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 16 }}>
                    Stack
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {prod.tools.map(t => (
                      <span key={t} style={{ fontFamily: 'var(--fm)', fontSize: 9, padding: '6px 12px', background: i % 2 === 0 ? '#222' : '#f0efe9', color: i % 2 === 0 ? '#aaa' : '#888', letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>
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

      {/* ── ROADMAP DE LA SUITE ── */}
      <Reveal>
        <section className="section s-wh">
          <div className="s-lbl">// ROADMAP DE LA SUITE</div>
          <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 24 }}>Hacia dónde va</h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#555', lineHeight: 1.75, maxWidth: 720, marginBottom: 32 }}>
            Los módulos de abajo todavía no están disponibles. Los listamos porque la
            arquitectura ya está preparada para recibirlos: mismo backend, mismos datos
            maestros, sin migración para el cliente.
          </p>
          <div style={{ maxWidth: 760 }}>
            {roadmap.map(m => (
              <div key={m.name} style={{ display: 'flex', gap: 12, marginBottom: 14, fontSize: 15, color: '#555', lineHeight: 1.6 }}>
                <span style={{ color: '#FF6A00', flexShrink: 0 }}>→</span>
                <span><strong style={{ color: '#111', fontWeight: 600 }}>{m.name}</strong> — {m.body}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── NIMO ── */}
      <Reveal>
        <section className="section s-dk">
          <div className="s-lbl s-lbl-dk">// NIMO · POR ZAIRE</div>
          <h2 className="s-h2" style={{ color: '#fff', marginTop: 12, marginBottom: 24 }}>NIMO</h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#888', lineHeight: 1.75, maxWidth: 640, marginBottom: 32 }}>
            CRM inmobiliario con frontend público autoadministrable. La inmobiliaria carga sus
            propiedades, gestiona las consultas y los estados, y su web se actualiza sola.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
            <div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 16 }}>
                Capacidades
              </div>
              {nimoCapabilities.map(c => (
                <div key={c} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 14, color: '#aaa', lineHeight: 1.5 }}>
                  <span style={{ color: '#FF6A00', flexShrink: 0 }}>→</span>{c}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 16 }}>
                Stack
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Next.js', 'Supabase', 'PostgreSQL', 'Vercel'].map(t => (
                  <span key={t} style={{ fontFamily: 'var(--fm)', fontSize: 9, padding: '6px 12px', background: '#222', color: '#aaa', letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── CTA FINAL ── */}
      <Reveal>
        <section className="cta-sec">
          <div>
            <div className="s-lbl">// SIGUIENTE PASO</div>
            <div className="cta-h">
              VEAMOS SI<br /><em>ENCAJA</em><br />EN TU<br />OPERACIÓN
            </div>
          </div>
          <div className="cta-right">
            <p>
              Una demo de 30 minutos alcanza para saber si Zaire resuelve tu caso o si te conviene
              otra cosa.
            </p>
            <p style={{ fontSize: 14, color: '#aaa' }}>
              Sin compromisos. Sin propuestas genéricas. Con criterio.
            </p>
            <div className="cta-btns">
              <Link href="/contacto">
                <button className="btn btn-primary">Ver demo →</button>
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Footer />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
