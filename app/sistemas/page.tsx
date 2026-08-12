// File: page.tsx
// Path: zaire-web/app/sistemas/page.tsx
// Last modified: 2026-08-12
// Description: Página de producto — Zaire Industrial (suite modular): Trace, Field,
//              Assets, Stock, CRM disponibles; app móvil; roadmap; círculo virtuoso;
//              caso. NIMO queda como producto secundario. La explicación de las 3
//              capas vive en /servicios.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import Reveal from '@/components/reveal';

const MOCK = '/zaire-industrial-mockups';

/* Estado de la app móvil — cambiá esta línea a "Disponible en las tiendas" cuando salga. */
const MOBILE_STATUS = 'En camino a las tiendas';

/* Dolores industriales — tarjetas numeradas (num + título + una oración) */
const pains = [
  { n: '01', title: 'Campo a Ciegas', body: 'La visita a planta se confirma con la palabra del técnico, no con un dato.' },
  { n: '02', title: 'Reportes Perdidos', body: 'El relevamiento del sello llega por WhatsApp, o llega tarde, o no llega.' },
  { n: '03', title: 'Viáticos sin Control', body: 'Combustible, peajes y hoteles se aprueban de memoria y se cierran a fin de mes.' },
  { n: '04', title: 'Vencimientos Ocultos', body: 'Licencias, VTV y seguros aparecen cuando ya son una multa.' },
  { n: '05', title: 'Doble Carga', body: 'Lo que el técnico anota en la planta, alguien lo vuelve a tipear en la oficina.' },
  { n: '06', title: 'Auditoría a Último Momento', body: 'La trazabilidad se arma la semana previa a la auditoría, no todos los días.' },
];

/* Módulos DISPONIBLES de la suite */
const products = [
  {
    name: 'Zaire Trace',
    tag: 'Órdenes de trabajo y de servicio',
    pitch: 'Cada orden con su número, su estado, su historial y su PDF — sin planillas, sin duplicados, con registro imborrable.',
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
    differential: 'Es el corazón de la suite: los demás módulos se conectan acá.',
    tools: ['Next.js', 'Supabase', 'PostgreSQL', 'TypeScript', 'Vercel'],
    img: `${MOCK}/zaire-industrial-trace-mockup-1.png`,
    imgAlt: 'Pantalla de Zaire Trace en el celular mostrando una orden de trabajo con su estado e ítems',
  },
  {
    name: 'Zaire Field',
    tag: 'Trabajo de campo',
    pitch: 'Lo que pasa en la planta llega a la administración sin que nadie recargue un dato.',
    body: 'El trabajo de campo, registrado como corresponde. Visitas agendadas, arribo confirmado por geocerca, reporte técnico con fotos y gastos controlados por técnico y por sucursal.',
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
    differential: 'Del campo a la administración con trazabilidad, respetando la numeración de órdenes.',
    tools: ['Next.js', 'Supabase', 'PostgreSQL', 'Leaflet', 'TypeScript', 'Vercel'],
    img: `${MOCK}/zaire-industrial-field-mockup-1.png`,
    imgAlt: 'Pantalla de Zaire Field en el celular con una visita a planta y su reporte técnico',
  },
  {
    name: 'Zaire Assets',
    tag: 'La ficha viva de cada equipo',
    pitch: 'Qué es, dónde está, qué le pasó, cuánto costó y qué tan sano está — para decidir qué reparar, qué reemplazar y qué garantía reclamar antes de que el equipo pare la planta.',
    body: 'Un gemelo digital por equipo. Toda la historia de un activo —cada service, cada falla, cada inspección— con quién, cuándo y cuánto, y su salud calculada al día.',
    capabilities: [
      'Ficha por equipo (gemelo digital) con ubicación y datos técnicos',
      'Salud del equipo (0-100) calculada desde su historial',
      'Costo real acumulado (TCO) por activo',
      'Confiabilidad (MTBF) y hoja de vida completa de service, fallas e inspecciones',
      'Alertas de garantía por vencer',
      'QR en la planta: el técnico escanea y abre la ficha',
      'Reportes y export',
    ],
    differential: 'El trabajo hecho sobre un equipo (desde una OT o una visita) cae en su hoja de vida con su costo — el historial se arma solo.',
    tools: ['Next.js', 'Supabase', 'PostgreSQL', 'QR', 'TypeScript', 'Vercel'],
    img: `${MOCK}/zaire-industrial-assets-mockup-1.png`,
    imgAlt: 'Pantalla de Zaire Assets en el celular con la ficha de un equipo, su salud e historial',
  },
  {
    name: 'Zaire Stock',
    tag: 'Existencias, valuadas a costo real',
    pitch: 'Existencias en tiempo real, valuadas a costo real, y el material se descuenta solo cuando lo usás en un trabajo.',
    body: 'Cuánto tenés, dónde y cuánto vale. El inventario y el costo siempre cuadrados, porque el consumo nace del trabajo, no de una carga aparte.',
    capabilities: [
      'Existencias por producto y depósito en tiempo real',
      'Valor del inventario con costo promedio',
      'Multi-depósito — incluye el stock que viaja en la camioneta',
      'Alertas de reposición',
      'Series y lotes con trazabilidad de cada movimiento',
      'Reservas para no comprometer material dos veces',
      'Reportes y export',
    ],
    differential: 'Desde una orden o una visita, “Consumir de stock” descuenta el material con su costo — inventario y costo siempre cuadrados.',
    tools: ['Next.js', 'Supabase', 'PostgreSQL', 'TypeScript', 'Vercel'],
    img: `${MOCK}/zaire-industrial-stock-mockup-1.png`,
    imgAlt: 'Pantalla de Zaire Stock en el celular con existencias por depósito y su valor',
  },
  {
    name: 'Zaire CRM',
    tag: 'El módulo comercial',
    pitch: 'Ves tu embudo, cotizás con el margen a la vista (sin mostrarle el costo al cliente), sabés qué cuenta está caliente — y cuando ganás, la orden de trabajo se genera sola.',
    body: 'No es un CRM de contactos genérico. Cotiza con rentabilidad y se conecta a la operación: la cotización ganada crea la orden en Trace.',
    capabilities: [
      'Leads y conversión a cliente',
      'Pipeline Kanban con etapas propias',
      'Cotizaciones con margen en vivo — costo y margen internos, no salen en el PDF',
      'Score de salud de cuentas (0-100)',
      'Actividades y alertas: tareas vencidas, cierres próximos, oportunidades estancadas',
      'Genera la OT en Trace desde la cotización aceptada',
      'Reusa los clientes de la suite, sin duplicar master data',
    ],
    differential: 'Cotiza con rentabilidad a la vista y cierra el círculo: de la venta ganada a la orden de trabajo.',
    tools: ['Next.js', 'Supabase', 'PostgreSQL', 'TypeScript', 'Vercel'],
    img: null,
    imgAlt: '',
  },
];

/* Cómo se hablan los módulos — el círculo virtuoso */
const virtuous = [
  { from: 'Field', to: 'Trace', body: 'La visita en planta genera la solicitud de orden.' },
  { from: 'Trace', to: 'Stock', body: 'La orden consume material, con su costo.' },
  { from: 'Trace', to: 'Assets', body: 'El trabajo cae en la hoja de vida del equipo.' },
  { from: 'CRM', to: 'Trace', body: 'La cotización ganada crea la orden.' },
];

/* App móvil — bullets */
const mobileBullets = [
  { title: 'App nativa modular', body: 'La misma suite en el teléfono: Field, Assets, Stock y Trace.' },
  { title: 'Campo offline', body: 'Trabajo de campo con geocerca, reporte y fotos, aunque no haya señal.' },
  { title: 'Escaneo de QR', body: 'El técnico escanea el activo y abre su ficha en el momento.' },
  { title: 'Sincroniza al volver', body: 'Todo lo cargado en la planta sube solo cuando vuelve la conexión.' },
];

/* Módulos en el roadmap — todavía no disponibles */
const roadmap = [
  { name: 'Maintenance (Prevent)', body: 'Planes preventivos por equipo y sitio, que generan las visitas solos.' },
  { name: 'Fiscal (ARCA)', body: 'Comprobantes electrónicos ARCA desde órdenes y visitas facturables.' },
  { name: 'Contracts', body: 'Contratos de servicio, recurrencias y cumplimiento de SLA.' },
  { name: 'Analytics', body: 'MTTR, MTBF, backlog y costo por activo, cruzados entre módulos.' },
];

const nimoCapabilities = [
  'Administrador de propiedades con imágenes y estados',
  'Gestión de consultas con seguimiento',
  'Frontend público personalizable',
  'Panel autoadministrable, sin dependencia técnica',
];

/* ── Helpers de presentación (reutilizan tokens; no son componentes de diseño) ── */
function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', background: 'radial-gradient(circle at 50% 42%, rgba(255,106,0,0.16), transparent 66%)' }}>
      <Image src={src} alt={alt} width={1122} height={1402} sizes="(max-width: 860px) 66vw, 320px"
        style={{ width: '100%', maxWidth: 300, height: 'auto', display: 'block' }} />
    </div>
  );
}

function Screen({ src, alt, dark }: { src: string; alt: string; dark?: boolean }) {
  return (
    <Image src={src} alt={alt} width={1448} height={1086} sizes="(max-width: 860px) 92vw, 560px"
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4, border: `1px solid ${dark ? '#222' : '#e5e3dd'}` }} />
  );
}

const capColor = (dark: boolean) => (dark ? '#aaa' : '#666');

export default function SistemasPage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} dark activePage="/sistemas" />

      {/* ── HERO ── */}
      <section className="pg-hero">
        <div className="pg-hero-inner">
          <div>
            <div className="pg-hero-label">// ZAIRE INDUSTRIAL · SUITE MODULAR</div>
            <h1 className="pg-hero-h1">ZAIRE <em>INDUSTRIAL</em></h1>
            <p className="pg-hero-sub">
              Órdenes, campo, activos, stock y comercial sobre un mismo backend. Cada cliente en su
              propia base, el dato se carga una vez y viaja solo. Con cliente en producción en oil & gas.
            </p>
          </div>
          <div className="pg-hero-visual" style={{ opacity: 1 }}>
            <Screen src={`${MOCK}/webapp-dark-mode.png`} alt="Dashboard web de Zaire Industrial en modo oscuro, con la suite y el módulo Trace" dark />
          </div>
        </div>
      </section>

      <Stripe />

      {/* ── ZAIRE INDUSTRIAL · SUITE ── */}
      <Reveal>
        <section className="section s-wh">
          <div className="s-lbl">// ZAIRE INDUSTRIAL · SUITE INDUSTRIAL</div>
          <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 24 }}>Un backend,<br />módulos que <em>contratás de a uno</em></h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#555', lineHeight: 1.75, maxWidth: 720, marginBottom: 40 }}>
            La suite industrial modular para empresas que mantienen, reparan y operan activos físicos.
            Contratás los módulos que necesitás, cada cliente corre en su propia base, y todo comparte
            el mismo backend: el dato se carga una vez y viaja solo. En producción hoy con un proveedor
            industrial de oil & gas.
          </p>

          <Screen src={`${MOCK}/webapp-light-mode.png`} alt="Dashboard web de Zaire Industrial en modo claro, con el resumen de la suite y órdenes de Trace" />

          <div className="prob-grid" style={{ marginTop: 56 }}>
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

      {/* ── MÓDULOS DISPONIBLES (alternando dark/light) ── */}
      {products.map((prod, i) => {
        const dark = i % 2 === 0;
        return (
          <Reveal key={prod.name}>
            <section className={`section${dark ? ' s-dk' : ''}`}>
              <div style={{ maxWidth: prod.img ? 1100 : 900, margin: '0 auto' }}>
                <div className="s-lbl" style={dark ? { color: '#FF6A00' } : {}}>// MÓDULO · DISPONIBLE</div>
                <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(30px,3.6vw,48px)', fontWeight: 800, textTransform: 'uppercase', color: dark ? '#fff' : '#111', lineHeight: .95, margin: '12px 0 8px' }}>
                  {prod.name}
                </h2>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', marginBottom: 20 }}>{prod.tag}</div>
                <p style={{ fontSize: 17, fontWeight: 400, color: dark ? '#fff' : '#111', lineHeight: 1.6, maxWidth: 720, marginBottom: 16 }}>
                  {prod.pitch}
                </p>
                <p style={{ fontSize: 15, fontWeight: 300, color: '#888', lineHeight: 1.75, maxWidth: 680, marginBottom: 32 }}>
                  {prod.body}
                </p>

                {/* Fila capacidades | teléfono (responsive: apila en mobile) */}
                <div className="split2" style={{ alignItems: 'start', marginBottom: 0, gap: 40 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 16 }}>
                      Capacidades
                    </div>
                    {prod.capabilities.map(c => (
                      <div key={c} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 14, color: capColor(dark), lineHeight: 1.5 }}>
                        <span style={{ color: '#FF6A00', flexShrink: 0 }}>→</span>{c}
                      </div>
                    ))}
                    <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${dark ? '#222' : '#e5e3dd'}` }}>
                      <span style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00' }}>El diferencial · </span>
                      <span style={{ fontSize: 14, color: dark ? '#ccc' : '#555', lineHeight: 1.6 }}>{prod.differential}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
                      {prod.tools.map(t => (
                        <span key={t} style={{ fontFamily: 'var(--fm)', fontSize: 9, padding: '6px 12px', background: dark ? '#222' : '#f0efe9', color: dark ? '#aaa' : '#888', letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {prod.img && <Phone src={prod.img} alt={prod.imgAlt} />}
                </div>
              </div>
            </section>
          </Reveal>
        );
      })}

      {/* ── ZAIRE INDUSTRIAL EN EL CELULAR ── */}
      <Reveal>
        <section className="section s-dk">
          <div className="s-lbl" style={{ color: '#FF6A00' }}>// ZAIRE INDUSTRIAL · EN EL CELULAR</div>
          <h2 className="s-h2" style={{ color: '#fff', marginTop: 12, marginBottom: 8 }}>La suite en el <em>celular</em></h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#888', lineHeight: 1.75, maxWidth: 640, marginBottom: 8 }}>
            App nativa modular para el técnico en la planta. La misma suite, en el teléfono.
          </p>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 40 }}>
            {MOBILE_STATUS}
          </div>

          <div className="split2" style={{ alignItems: 'center', marginBottom: 0, gap: 48 }}>
            <div>
              {mobileBullets.map(b => (
                <div key={b.title} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ color: '#FF6A00', flexShrink: 0 }}>→</span>
                    <div>
                      <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 4 }}>{b.title}</div>
                      <div style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{b.body}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Phone src={`${MOCK}/zaire-industrial-homepage-mockup-1.png`} alt="App móvil de Zaire Industrial: pantalla de inicio Mi Jornada" />
              <Phone src={`${MOCK}/zaire-industrial-settings-dark-mockup-1.png`} alt="App móvil de Zaire Industrial en modo oscuro: ajustes y módulos" />
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── EL DIFERENCIAL DE SUITE · CÍRCULO VIRTUOSO ── */}
      <Reveal>
        <section className="section s-wh">
          <div className="s-lbl">// EL DIFERENCIAL DE SUITE</div>
          <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 24 }}>Los módulos <em>se hablan</em></h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#555', lineHeight: 1.75, maxWidth: 720, marginBottom: 40 }}>
            El dato se carga una vez y recorre la operación. Eso no lo da una herramienta suelta.
          </p>
          <div className="prob-grid">
            {virtuous.map(v => (
              <div key={`${v.from}-${v.to}`} className="prob-card">
                <div style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 800, textTransform: 'uppercase', color: '#111', marginBottom: 10 }}>
                  {v.from} <span style={{ color: '#FF6A00' }}>→</span> {v.to}
                </div>
                <div className="prob-body">{v.body}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── ROADMAP DE LA SUITE ── */}
      <Reveal>
        <section className="section">
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

      {/* ── PRUEBA · CASO (genérico, sin nombrar clientes) ── */}
      <Reveal>
        <section className="section s-dk">
          <div className="s-lbl" style={{ color: '#FF6A00' }}>// PRUEBA</div>
          <h2 className="s-h2" style={{ color: '#fff', marginTop: 12, marginBottom: 24 }}>De un Access de 15 años<br />a una <em>auditoría en dos clics</em></h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#aaa', lineHeight: 1.8, maxWidth: 780 }}>
            Un proveedor de sellos mecánicos y bombas para operadoras de oil & gas de primera línea,
            certificado ISO 9001, manejaba todo en un Access de 15 años: monousuario, sin auditoría,
            con los relevamientos llegando por WhatsApp. Hoy opera con Zaire Trace — órdenes numeradas,
            trazables y auditables — listo para la auditoría ISO todos los días, no la semana previa.
          </p>
        </section>
      </Reveal>

      {/* ── NIMO · OTRO PRODUCTO (secundario) ── */}
      <Reveal>
        <section className="section s-wh">
          <div className="s-lbl">// OTROS PRODUCTOS · NIMO</div>
          <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 24 }}>NIMO</h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#555', lineHeight: 1.75, maxWidth: 640, marginBottom: 32 }}>
            Vertical inmobiliario por Zaire. CRM con frontend público autoadministrable: la
            inmobiliaria carga sus propiedades, gestiona las consultas y los estados, y su web se
            actualiza sola.
          </p>
          <div className="split2" style={{ alignItems: 'start', marginBottom: 0 }}>
            <div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 16 }}>
                Capacidades
              </div>
              {nimoCapabilities.map(c => (
                <div key={c} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 14, color: '#666', lineHeight: 1.5 }}>
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
                  <span key={t} style={{ fontFamily: 'var(--fm)', fontSize: 9, padding: '6px 12px', background: '#f0efe9', color: '#888', letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 2 }}>
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
              Una demo de 30 minutos alcanza para saber si Zaire Industrial resuelve tu caso o si te
              conviene otra cosa.
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
