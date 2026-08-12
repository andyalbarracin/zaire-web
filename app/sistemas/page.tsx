// File: page.tsx
// Path: zaire-web/app/sistemas/page.tsx
// Last modified: 2026-08-12
// Description: Página de producto — Zaire Industrial (suite modular): suite + módulos
//              (Trace, Field, Assets, Stock, CRM), app móvil, círculo virtuoso,
//              roadmap y NIMO (secundario). CTA con formulario de demo.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';
import Reveal from '@/components/reveal';
import DemoForm from '@/components/demo-form';

const T = '/zaire-industrial-mockups/transparent';
const IMG = {
  webLight: { src: `${T}/webapp-light-mode-transparent.png`, w: 1164, h: 1020 },
  webDark:  { src: `${T}/webapp-dark-mode-transparent.png`,  w: 1283, h: 1122 },
  trace:    { src: `${T}/zaire-industrial-trace-mockup-transparent.png`,    w: 738, h: 1277 },
  field:    { src: `${T}/zaire-industrial-field-mockup-transparent.png`,    w: 717, h: 1301 },
  assets:   { src: `${T}/zaire-industrial-assets-mockup-transparent.png`,   w: 702, h: 1209 },
  stock:    { src: `${T}/zaire-industrial-stock-mockup-transparent.png`,    w: 637, h: 1198 },
  homepage: { src: `${T}/zaire-industrial-homepage-mockup-transparent.png`, w: 736, h: 1290 },
  settings: { src: `${T}/zaire-industrial-settings-dark-mockup-transparent.png`, w: 707, h: 1229 },
};

/* Estado de la app móvil — cambiá esta línea a "Disponible en las tiendas" cuando salga. */
const MOBILE_STATUS = 'En camino a las tiendas';

/* Dolores industriales — presentación minimalista */
const pains = [
  { title: 'Campo a Ciegas', body: 'La visita a planta se confirma con la palabra del técnico, no con un dato.' },
  { title: 'Reportes Perdidos', body: 'El relevamiento del sello llega por WhatsApp, o llega tarde, o no llega.' },
  { title: 'Viáticos sin Control', body: 'Combustible, peajes y hoteles se aprueban de memoria y se cierran a fin de mes.' },
  { title: 'Vencimientos Ocultos', body: 'Licencias, VTV y seguros aparecen cuando ya son una multa.' },
  { title: 'Doble Carga', body: 'Lo que el técnico anota en la planta, alguien lo vuelve a tipear en la oficina.' },
  { title: 'Auditoría a Último Momento', body: 'La trazabilidad se arma la semana previa a la auditoría, no todos los días.' },
];

/* Módulos DISPONIBLES */
const products = [
  {
    name: 'Zaire Trace', tag: 'Órdenes de trabajo y de servicio',
    pitch: 'Cada orden con su número, su estado, su historial y su PDF — sin planillas, sin duplicados, con registro imborrable.',
    body: 'Trazabilidad de OT y OTS de punta a punta, con numeración correlativa por sucursal e ítems técnicos. Construido para operar bajo ISO 9001 y llegar a una auditoría sin preparar nada.',
    capabilities: ['Numeración correlativa por sucursal', 'Ítems con medida, marca, modelo, serie y TAG', 'Estados validados con historial', 'PDFs de orden y planilla con logo', 'Log de auditoría y verificación de secuencia'],
    differential: 'Es el corazón de la suite: los demás módulos se conectan acá.',
    img: IMG.trace,
  },
  {
    name: 'Zaire Field', tag: 'Trabajo de campo',
    pitch: 'Lo que pasa en la planta llega a la administración sin que nadie recargue un dato.',
    body: 'Visitas agendadas, arribo confirmado por geocerca, reporte técnico con fotos y gastos controlados por técnico y por sucursal.',
    capabilities: ['Arribo y salida por geocerca automática', 'Mapa con la traza y timeline de la visita', 'Reporte técnico con medidas, materiales y fotos', 'Viáticos con aprobación y auditoría', 'Documentos con vencimiento y alertas'],
    differential: 'Del campo a la administración con trazabilidad, respetando la numeración de órdenes.',
    img: IMG.field,
  },
  {
    name: 'Zaire Assets', tag: 'La ficha viva de cada equipo',
    pitch: 'Qué es, dónde está, qué le pasó, cuánto costó y qué tan sano está — para decidir antes de que el equipo pare la planta.',
    body: 'Un gemelo digital por equipo, con toda su hoja de vida: cada service, falla e inspección, con quién, cuándo y cuánto.',
    capabilities: ['Ficha por equipo con salud (0-100)', 'Costo real acumulado (TCO)', 'Confiabilidad (MTBF) e hoja de vida completa', 'Alertas de garantía por vencer', 'QR en la planta: escanear y abrir la ficha'],
    differential: 'El trabajo hecho sobre un equipo cae en su hoja de vida con su costo — el historial se arma solo.',
    img: IMG.assets,
  },
  {
    name: 'Zaire Stock', tag: 'Existencias, valuadas a costo real',
    pitch: 'Existencias en tiempo real, valuadas a costo real, y el material se descuenta solo cuando lo usás en un trabajo.',
    body: 'Cuánto tenés, dónde y cuánto vale. El inventario y el costo siempre cuadrados, porque el consumo nace del trabajo.',
    capabilities: ['Existencias por producto y depósito en tiempo real', 'Valor del inventario con costo promedio', 'Multi-depósito, incluye el de la camioneta', 'Series, lotes y trazabilidad de cada movimiento', 'Reservas para no comprometer material dos veces'],
    differential: '“Consumir de stock” desde una orden descuenta el material con su costo — todo cuadrado.',
    img: IMG.stock,
  },
  {
    name: 'Zaire CRM', tag: 'El módulo comercial',
    pitch: 'Ves tu embudo, cotizás con el margen a la vista (sin mostrarle el costo al cliente) y cuando ganás, la orden se genera sola.',
    body: 'No es un CRM de contactos genérico: cotiza con rentabilidad y se conecta a la operación.',
    capabilities: ['Pipeline Kanban con etapas propias', 'Cotizaciones con margen en vivo (no sale en el PDF)', 'Score de salud de cuentas (0-100)', 'Alertas de tareas, cierres y oportunidades', 'Genera la OT en Trace desde la cotización ganada'],
    differential: 'Cierra el círculo: de la venta ganada a la orden de trabajo, sin duplicar clientes.',
    img: null as null | { src: string; w: number; h: number },
  },
];

/* Círculo virtuoso — pipeline del dato */
const flow = [
  { tag: 'Campo', module: 'Field', body: 'La visita en planta genera la solicitud de orden.' },
  { tag: 'Órdenes', module: 'Trace', body: 'La orden se abre, numerada y trazable.' },
  { tag: 'Materiales', module: 'Stock', body: 'Consume material con su costo real.' },
  { tag: 'Equipos', module: 'Assets', body: 'El trabajo cae en la hoja de vida del equipo.' },
];

const mobileBullets = [
  { title: 'App nativa modular', body: 'La misma suite en el teléfono: Field, Assets, Stock y Trace.' },
  { title: 'Campo offline', body: 'Trabajo de campo con geocerca, reporte y fotos, aunque no haya señal.' },
  { title: 'Escaneo de QR', body: 'El técnico escanea el activo y abre su ficha en el momento.' },
  { title: 'Sincroniza al volver', body: 'Todo lo cargado en la planta sube solo cuando vuelve la conexión.' },
];

const roadmap = [
  { name: 'Maintenance (Prevent)', body: 'Planes preventivos que generan las visitas solos.' },
  { name: 'Fiscal (ARCA)', body: 'Comprobantes electrónicos desde órdenes y visitas.' },
  { name: 'Contracts', body: 'Contratos de servicio, recurrencias y SLA.' },
  { name: 'Analytics', body: 'MTTR, MTBF, backlog y costo por activo.' },
];

const nimoCapabilities = ['Administrador de propiedades con imágenes y estados', 'Gestión de consultas con seguimiento', 'Frontend público personalizable', 'Panel autoadministrable, sin dependencia técnica'];

/* ── Helpers de presentación (reutilizan tokens; no son componentes de diseño) ── */
function Monitor({ img, alt }: { img: { src: string; w: number; h: number }; alt: string }) {
  return (
    <Image src={img.src} alt={alt} width={img.w} height={img.h} sizes="(max-width: 860px) 92vw, 560px"
      style={{ width: '100%', height: 'auto', display: 'block' }} />
  );
}

function Phone({ img, alt, max = 260, glow = false }: { img: { src: string; w: number; h: number }; alt: string; max?: number; glow?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', ...(glow ? { background: 'radial-gradient(circle at 50% 42%, rgba(255,106,0,0.16), transparent 66%)' } : {}) }}>
      <Image src={img.src} alt={alt} width={img.w} height={img.h} sizes={`${max}px`}
        style={{ width: '100%', maxWidth: max, height: 'auto', display: 'block' }} />
    </div>
  );
}

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
            <Monitor img={IMG.webLight} alt="Dashboard web de Zaire Industrial en modo claro, con la suite y las órdenes de Trace" />
          </div>
        </div>
      </section>

      <Stripe />

      {/* ── SUITE · dos columnas (texto | monitor dark) ── */}
      <Reveal>
        <section className="section s-wh">
          <div className="split2" style={{ alignItems: 'center', marginBottom: 0, gap: 56 }}>
            <Monitor img={IMG.webDark} alt="Dashboard web de Zaire Industrial en modo oscuro, con el resumen de la suite" />
            <div>
              <div className="s-lbl">// ZAIRE INDUSTRIAL · SUITE INDUSTRIAL</div>
              <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 24 }}>Un backend,<br />módulos que <em>contratás de a uno</em></h2>
              <p style={{ fontSize: 16, fontWeight: 300, color: '#555', lineHeight: 1.75 }}>
                La suite industrial modular para empresas que mantienen, reparan y operan activos
                físicos. Contratás los módulos que necesitás, cada cliente corre en su propia base, y
                todo comparte el mismo backend: el dato se carga una vez y viaja solo. En producción
                hoy con un proveedor industrial de oil & gas.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── DOLORES INDUSTRIALES · minimalista ── */}
      <Reveal>
        <section className="section">
          <div className="split2">
            <h2 className="s-h2">SI OPERÁS<br />ACTIVOS Y <em>CAMPO</em></h2>
            <p>
              Sellos, bombas, equipos, técnicos en planta. Estos son los agujeros que Zaire Industrial
              cierra — donde hoy manda la planilla, el WhatsApp y la memoria.
            </p>
          </div>
          <div className="svc-grid" style={{ gap: 28 }}>
            {pains.map(p => (
              <div key={p.title} style={{ borderTop: '2px solid var(--org)', paddingTop: 16 }}>
                <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 800, textTransform: 'uppercase', color: '#111', marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 13.5, color: '#888', lineHeight: 1.6 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── MÓDULOS · una sección, grid de cards ── */}
      <Reveal>
        <section className="section s-wh">
          <div className="s-lbl">// MÓDULOS DISPONIBLES</div>
          <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 40 }}>Cinco módulos,<br />un <em>backend</em></h2>

          <div className="cases-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {['Zaire Stock', 'Zaire Trace', 'Zaire Assets', 'Zaire Field', 'Zaire CRM']
              .map(n => products.find(p => p.name === n)!)
              .map(prod => (
              <div key={prod.name} style={{ background: '#fff', border: '1px solid #ebe9e2', borderTop: '2px solid var(--org)', borderRadius: 2, padding: '32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {prod.img && <Phone img={prod.img} alt={`Pantalla de ${prod.name} en el celular`} max={230} />}
                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00', marginBottom: 8 }}>{prod.tag}</div>
                  <div style={{ fontFamily: 'var(--fd)', fontSize: 26, fontWeight: 800, textTransform: 'uppercase', color: '#111', lineHeight: 1 }}>{prod.name}</div>
                </div>
                <p style={{ fontSize: 15, fontWeight: 400, color: '#111', lineHeight: 1.6 }}>{prod.pitch}</p>
                <p style={{ fontSize: 14, fontWeight: 300, color: '#888', lineHeight: 1.7 }}>{prod.body}</p>
                <div>
                  {prod.capabilities.map(c => (
                    <div key={c} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13.5, color: '#666', lineHeight: 1.5 }}>
                      <span style={{ color: '#FF6A00', flexShrink: 0 }}>→</span>{c}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #eee' }}>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#FF6A00' }}>El diferencial · </span>
                  <span style={{ fontSize: 13.5, color: '#555', lineHeight: 1.6 }}>{prod.differential}</span>
                </div>
              </div>
            ))}

            {/* Card de roadmap (sexta celda, junto a CRM) */}
            <div style={{ background: '#fbfbf9', border: '1px dashed #d8d5cc', borderTop: '2px solid #ccc', borderRadius: 2, padding: '32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>Roadmap · todavía no disponibles</div>
                <div style={{ fontFamily: 'var(--fd)', fontSize: 26, fontWeight: 800, textTransform: 'uppercase', color: '#111', lineHeight: 1 }}>Hacia dónde va</div>
              </div>
              <p style={{ fontSize: 14, fontWeight: 300, color: '#888', lineHeight: 1.7 }}>
                La arquitectura ya está preparada para recibirlos: mismo backend, mismos datos
                maestros, sin migración para el cliente.
              </p>
              <div style={{ marginTop: 4 }}>
                {roadmap.map(m => (
                  <div key={m.name} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13.5, color: '#666', lineHeight: 1.5 }}>
                    <span style={{ color: '#bbb', flexShrink: 0 }}>○</span>
                    <span><strong style={{ color: '#111', fontWeight: 600 }}>{m.name}</strong> — {m.body}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── EL DIFERENCIAL DE SUITE · círculo virtuoso (fondo cream, cards dark) ── */}
      <Reveal>
        <section className="section">
          <div className="s-lbl" style={{ color: '#FF6A00' }}>// EL DIFERENCIAL DE SUITE</div>
          <h2 className="s-h2" style={{ color: '#111', marginTop: 12, marginBottom: 16 }}>Los módulos <em>se hablan</em></h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: '#888', lineHeight: 1.75, maxWidth: 720, marginBottom: 44 }}>
            El dato se carga una vez y recorre la operación. Eso no lo da una herramienta suelta.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 0 }}>
            {flow.map((s, i) => (
              <div key={s.module} style={{ display: 'contents' }}>
                <div style={{ flex: '1 1 190px', minWidth: 170, border: '1px solid #2a2a2a', borderTop: '2px solid #FF6A00', borderRadius: 2, background: '#161616', padding: '22px 20px' }}>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>{s.tag}</div>
                  <div style={{ fontFamily: 'var(--fd)', fontSize: 22, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 10 }}>{s.module}</div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.55 }}>{s.body}</div>
                </div>
                {i < flow.length - 1 && (
                  <div aria-hidden style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', color: '#FF6A00', fontSize: 22, fontWeight: 700 }}>→</div>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginTop: 28, maxWidth: 760 }}>
            <span style={{ color: '#FF6A00', fontFamily: 'var(--fm)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>Y desde el comercial · </span>
            la cotización ganada en <strong style={{ color: '#111', fontWeight: 600 }}>CRM</strong> crea la orden en <strong style={{ color: '#111', fontWeight: 600 }}>Trace</strong>, sin volver a cargar el cliente.
          </p>
        </section>
      </Reveal>

      <Stripe />

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
                <div key={b.title} style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 20 }}>
                  <span style={{ color: '#FF6A00', flexShrink: 0 }}>→</span>
                  <div>
                    <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 4 }}>{b.title}</div>
                    <div style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{b.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Phone img={IMG.homepage} alt="App móvil de Zaire Industrial: pantalla Mi Jornada" glow />
              <Phone img={IMG.settings} alt="App móvil de Zaire Industrial en modo oscuro: ajustes y módulos" glow />
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── NIMO · secundario, con screenshot ── */}
      <Reveal>
        <section className="section">
          <div className="split2" style={{ alignItems: 'center', marginBottom: 0, gap: 56 }}>
            <div>
              <div className="s-lbl">// OTROS PRODUCTOS · NIMO</div>
              <h2 className="s-h2" style={{ marginTop: 12, marginBottom: 20 }}>NIMO</h2>
              <p style={{ fontSize: 16, fontWeight: 300, color: '#555', lineHeight: 1.75, marginBottom: 20 }}>
                Vertical inmobiliario por Zaire. Cuatro herramientas en una —sitio web, CRM, WhatsApp y
                QR físico— para que la inmobiliaria las use sin depender de un programador.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {nimoCapabilities.map(c => (
                  <span key={c} style={{ fontFamily: 'var(--fm)', fontSize: 9, padding: '6px 12px', background: '#f0efe9', color: '#888', letterSpacing: '.04em', borderRadius: 2 }}>{c}</span>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 30px 60px -24px rgba(0,0,0,0.28)', border: '1px solid #e5e3dd' }}>
              <Image src="/assets/nimo-preview.png" alt="Vista previa del sitio de NIMO: plataforma todo-en-uno para inmobiliarias" width={1788} height={1520} sizes="(max-width: 860px) 92vw, 560px" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </div>
        </section>
      </Reveal>

      <Stripe />

      {/* ── CTA · dark theme, dos columnas (texto | formulario de demo) ── */}
      <Reveal>
        <section className="cta-sec" style={{ background: '#111' }}>
          <div>
            <div className="s-lbl">// SIGUIENTE PASO</div>
            <div className="cta-h" style={{ color: '#fff' }}>PEDÍ UNA<br /><em>DEMO</em></div>
            <p style={{ marginTop: 20, color: '#aaa' }}>
              Una demo de 30 minutos alcanza para saber si Zaire Industrial resuelve tu caso o si te
              conviene otra cosa.
            </p>
            <p style={{ fontSize: 14, color: '#888' }}>Sin compromisos. Sin propuestas genéricas. Con criterio.</p>
          </div>
          <div className="cta-right">
            <DemoForm subject="Demo de software (Zaire)" source="sistemas_cta" submitLabel="Pedir una demo →" dark />
          </div>
        </section>
      </Reveal>

      <Footer />
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
