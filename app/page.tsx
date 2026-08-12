// File: page.tsx
// Path: zaire-web/app/page.tsx
// Last modified: 2026-04-27
// Description: Homepage de ZAIRE — layout bento multi-sección.
//              Secciones: Hero (con chat IA), Problemas, Servicios, Capas del Sistema,
//              Stack, Planes, Proceso, Casos de Uso, CTA Final.

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Stripe from '@/components/stripe';
import ContactModal from '@/components/contact-modal';

/* ssr: false evita hydration mismatch con localStorage */
const ChatBox = dynamic(() => import('@/components/chat-box'), {
  ssr: false,
  loading: () => <div className="ai-box" style={{ minHeight: 420 }} />,
});
import Reveal from '@/components/reveal';
import Image from 'next/image';
import {
  IWorkflow, IAgent, IKnowledge, IRevenue, IGrowth, IApps,
  IN8n, IClaude, IOpenAI, ISupabase, IMCP, IPostgres, IRAG, IOllama, IAPI, ICRM,
} from '@/components/icons';
import Link from 'next/link';

/* ── Datos estáticos ─────────────────────────────────────── */

const problems = [
  { n: '01', title: 'Seguimiento Flojo', body: 'Los leads se pierden porque nadie sabe quién hace el follow-up ni cuándo.' },
  { n: '02', title: 'Herramientas Sueltas', body: 'CRM, email, WhatsApp y hojas de cálculo que no se hablan entre sí.' },
  { n: '03', title: 'Respuestas Lentas', body: 'Clientes que esperan horas lo que un sistema inteligente resuelve en segundos.' },
  { n: '04', title: 'Tareas Repetitivas', body: 'Tu equipo pasa tiempo en tareas manuales que un workflow automatizado haría mejor.' },
  { n: '05', title: 'Falta de Visibilidad', body: 'No sabés en qué estado está tu operación hasta que algo ya falló.' },
  { n: '06', title: 'Procesos que No Escalan', body: 'Lo que funcionaba con 5 clientes colapsa con 50. Sin sistema, no hay escala.' },
];

/* Módulos disponibles de Zaire Industrial (chips del panel destacado) */
const industrialModules = ['Zaire Trace', 'Zaire Field', 'Zaire Assets', 'Zaire Stock', 'Zaire CRM'];

/* Productos secundarios */
const secondaryProducts = [
  {
    name: 'NIMO',
    label: 'CRM · Web inmobiliaria',
    body: 'Vertical inmobiliario por Zaire: administrador de propiedades, consultas, estados e imágenes, y frontend público autoadministrable.',
    chips: ['CRM', 'Propiedades', 'Consultas', 'Web'],
    href: '/sistemas',
  },
  {
    name: 'Software a medida',
    label: 'Zaire Studio · Sistemas propios',
    body: 'Cuando la operación necesita algo propio: CRMs, dashboards, portales y sistemas verticales, diseñados alrededor del proceso real.',
    chips: ['Next.js', 'Supabase', 'Dashboards', 'APIs'],
    href: '/servicios',
  },
];

const services = [
  { icon: <IWorkflow s="#fff" size={40} />, title: 'Automatización y Orquestación', tag: 'n8n · Make · Zapier · Webhooks · APIs REST', org: false },
  { icon: <IAgent s="#fff" size={40} />, title: 'Arquitectura IA y Agentes', tag: 'Claude · GPT-4o · LangChain · MCP · Ollama', org: false },
  { icon: <IKnowledge s="#111" size={40} />, title: 'Knowledge Ops', tag: 'Supabase · pgvector · RAG · embeddings · MCP', org: true },
  { icon: <IRevenue s="#fff" size={40} />, title: 'Funnels y Revenue Systems', tag: 'HubSpot · Pipedrive · n8n · WhatsApp API', org: false },
  { icon: <IGrowth s="#fff" size={40} />, title: 'Growth y Performance', tag: 'Analytics · A/B · automatización de contenido', org: false },
  { icon: <IApps s="#fff" size={40} />, title: 'Software Operativo a Medida', tag: 'Next.js · Supabase · PostgreSQL · APIs · Auth', org: false },
];

const layers = [
  {
    bg: '#fff', numColor: '#FF6A00', titleColor: '#111', bodyColor: '#888', chipBg: '#f0efe9', chipColor: '#888',
    num: 'Capa 1', title: 'Workflows Determinísticos',
    body: 'Automatizaciones predecibles y auditables. Cada paso está definido, documentado y fácil de mantener.',
    chips: ['n8n', 'Make', 'Webhooks', 'APIs'],
  },
  {
    bg: '#111', numColor: '#FF6A00', titleColor: '#fff', bodyColor: '#888', chipBg: '#222', chipColor: '#aaa',
    num: 'Capa 2', title: 'Sistemas Híbridos con IA',
    body: 'Automatizaciones con inteligencia que clasifican, toman decisiones y responden según el contexto real de cada caso.',
    chips: ['Claude', 'GPT-4o', 'RAG', 'Supabase'],
  },
  {
    bg: '#FF6A00', numColor: '#111', titleColor: '#111', bodyColor: 'rgba(0,0,0,.6)', chipBg: 'rgba(0,0,0,.15)', chipColor: 'rgba(0,0,0,.5)',
    num: 'Capa 3', title: 'Arquitectura Agentic',
    body: 'Agentes especializados que operan de forma autónoma, coordinados por sistema. Software operativo propio.',
    chips: ['MCP', 'Agentes', 'Memoria', 'Software'],
  },
];

const stack = [
  { icon: <IN8n s="#FF6A00" size={32} />, name: 'n8n' },
  { icon: <IClaude s="#FF6A00" size={32} />, name: 'Claude' },
  { icon: <IOpenAI s="#FF6A00" size={32} />, name: 'OpenAI' },
  { icon: <IOllama s="#FF6A00" size={32} />, name: 'Ollama' },
  { icon: <ISupabase s="#FF6A00" size={32} />, name: 'Supabase' },
  { icon: <IMCP s="#FF6A00" size={32} />, name: 'MCP' },
  { icon: <IPostgres s="#FF6A00" size={32} />, name: 'PostgreSQL' },
  { icon: <IRAG s="#FF6A00" size={32} />, name: 'Vector / RAG' },
  { icon: <IAPI s="#FF6A00" size={32} />, name: 'APIs REST' },
  { icon: <ICRM s="#FF6A00" size={32} />, name: 'CRM' },
];

/* ── Componente principal ────────────────────────────────── */
export default function Home() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <Nav onContact={() => setShowContact(true)} activePage="/" />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-grid">
          {/* Columna izquierda: copy + CTAs */}
          <div>
            <div className="hero-label">// ZAIRE TECHNOLOGIES · SOFTWARE INDUSTRIAL Y SISTEMAS OPERATIVOS</div>
            <h1 className="hero-h1">
              SISTEMAS<br />
              INTELI-<br /><em>GENTES</em>
            </h1>
            <p className="hero-sub">
Construimos software para empresas que mantienen, reparan y operan activos. Y sistemas a medida para las que necesitan algo propio.            </p>
            <div className="hero-btns">
              <button className="btn btn-primary" onClick={() => setShowContact(true)}>
                Solicitar diagnóstico →
              </button>
              <Link href="/servicios">
                <button className="btn btn-outline">Ver servicios</button>
              </Link>
            </div>
          </div>

          {/* Columna derecha: Chat IA + aviso de privacidad */}
          <div>
            <ChatBox />
            <p style={{ fontSize: 10, color: '#555', marginTop: 10, textAlign: 'center', lineHeight: 1.6 }}>
              Al enviar tus datos aceptás nuestra{' '}
              <a href="/politica-de-privacidad" style={{ color: '#666', textDecoration: 'underline' }}>
                política de privacidad
              </a>
              .
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-n" style={{ color: '#FF6A00' }}>+40</div>
            <div className="stat-l">Sistemas implementados</div>
          </div>
          <div className="stat">
            <div className="stat-n">3</div>
            <div className="stat-l">Capas de arquitectura</div>
          </div>
          <div className="stat">
            <div className="stat-n">12</div>
            <div className="stat-l">Tecnologías integradas</div>
          </div>
          <div className="stat">
            <div className="stat-n" style={{ color: '#FF6A00' }}>24/7</div>
            <div className="stat-l">Agentes en producción</div>
          </div>
        </div>
      </section>

      <Stripe />

      {/* ── SOFTWARE PROPIO · PRODUCTOS ──────────────────── */}
      <Reveal>
        <section className="section" id="software">
          <div className="s-lbl">// SOFTWARE PROPIO</div>
          <h2 className="s-h2" style={{ marginBottom: 8 }}>
            EL SOFTWARE QUE<br /><em>CONSTRUIMOS</em>
          </h2>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 40, fontWeight: 300, maxWidth: 560 }}>
            Producto propio, en producción. Nace de la operación real, no de una demo.
          </p>

          {/* Destacado: Zaire Industrial (la suite) */}
          <div className="soft-card">
            <div className="split2" style={{ alignItems: 'center', marginBottom: 0, gap: 44 }}>
              <div>
                <div className="s-lbl">// ZAIRE INDUSTRIAL · SUITE INDUSTRIAL</div>
                <h3 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(28px,3vw,42px)', fontWeight: 800, textTransform: 'uppercase', color: '#111', lineHeight: .95, margin: '12px 0 16px' }}>
                  Zaire Industrial
                </h3>
                <p style={{ fontSize: 15, fontWeight: 300, color: '#555', lineHeight: 1.75, marginBottom: 20 }}>
                  Nuestra suite industrial modular: órdenes, campo, activos, stock y comercial sobre un
                  mismo backend. El dato se carga una vez y viaja solo. En producción hoy en oil & gas.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {industrialModules.map(m => (
                    <span key={m} className="case-chip" style={{ background: '#f0efe9', color: '#555' }}>{m}</span>
                  ))}
                </div>
                <Link href="/sistemas">
                  <button className="btn btn-primary">Ver la suite →</button>
                </Link>
              </div>
              <div>
                <Image
                  src="/zaire-industrial-mockups/transparent/webapp-dark-mode-transparent.png"
                  alt="Dashboard web de Zaire Industrial en modo oscuro, con la suite y las órdenes de Trace"
                  width={1283} height={1122}
                  sizes="(max-width: 860px) 92vw, 520px"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <Link href="/sistemas" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <Image
                    src="/zaire-industrial-mockups/transparent/zaire-industrial-homepage-mockup-transparent.png"
                    alt="App móvil de Zaire Industrial: pantalla Mi Jornada"
                    width={736} height={1290} sizes="60px"
                    style={{ width: 46, height: 'auto', display: 'block' }}
                  />
                  <span style={{ fontFamily: 'var(--fm)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#FF6A00' }}>
                    También en el celular →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Secundarios: NIMO + software a medida */}
          <div className="s-lbl" style={{ marginTop: 40, marginBottom: 20 }}>// OTROS PRODUCTOS</div>
          <div className="cases-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {secondaryProducts.map(p => (
              <Link key={p.name} href={p.href} className="case-card" style={{ textDecoration: 'none' }}>
                <div className="case-sector">{p.label}</div>
                <div className="case-title">{p.name}</div>
                <div className="case-body">{p.body}</div>
                <div className="case-chips">
                  {p.chips.map(ch => (
                    <span key={ch} className="case-chip">{ch}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── PROBLEMAS REALES (automatización · Studio) ─────── */}
      <Reveal>
        <section className="section" id="problems">
          <div className="split2">
            <h2 className="s-h2">
              TUS OPERACIONES<br />MERECEN <em>MÁS</em>
            </h2>
            <p>
              La mayoría de las empresas gestionan su operación con herramientas desconectadas.
              ZAIRE las unifica en un sistema inteligente que trabaja solo.
            </p>
          </div>

          <div className="prob-grid">
            {problems.map(p => (
              <div key={p.n} className="prob-card">
                <div className="prob-num">{p.n}</div>
                <div className="prob-title">{p.title}</div>
                <div className="prob-body">{p.body}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── QUÉ CONSTRUIMOS ───────────────────────────────── */}
      <Reveal>
        <section className="section s-dk" id="services">
          <div className="split2 split2-dk">
            <div>
              <div className="s-lbl s-lbl-dk">// SERVICIOS</div>
              <h2 className="s-h2" style={{ color: '#fff' }}>
                LO QUE<br />CONSTRUIMOS<br /><em>PARA TI</em>
              </h2>
            </div>
            <p>
              No hacemos solo automatizaciones. Construimos sistemas conectados que operan como infraestructura real de tu negocio.
            </p>
          </div>

          <div className="svc-grid">
            {services.map(s => (
              <div key={s.title} className={`svc-card${s.org ? ' org' : ''}`}>
                <div className="svc-icon">{s.icon}</div>
                <div className="svc-title">{s.title}</div>
                <div className="svc-tag">{s.tag}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <Link href="/servicios">
              <button className="btn btn-white">Conocé Zaire Studio →</button>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── CAPAS DEL SISTEMA (Zaire Studio) ──────────────── */}
      <Reveal>
        <section className="section" id="layers">
          <div className="s-lbl">// ZAIRE STUDIO · SISTEMA EN CAPAS</div>
          <h2 className="s-h2" style={{ marginBottom: 40 }}>
            TRES NIVELES.<br />UN <em>SISTEMA</em>.
          </h2>

          <div className="lay-grid">
            {layers.map(l => (
              <div key={l.num} className="lay-card" style={{ background: l.bg }}>
                <div className="lay-num" style={{ color: l.numColor }}>{l.num}</div>
                <div className="lay-title" style={{ color: l.titleColor }}>{l.title}</div>
                <div className="lay-body" style={{ color: l.bodyColor }}>{l.body}</div>
                <div className="lay-chips">
                  {l.chips.map(c => (
                    <span key={c} className="lay-chip" style={{ background: l.chipBg, color: l.chipColor }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <Link href="/servicios">
              <button className="btn btn-dark">Explorar Zaire Studio →</button>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── STACK TECNOLÓGICO ─────────────────────────────── */}
      <Reveal>
        <section className="section s-dk" id="stack">
          <div className="s-lbl s-lbl-dk">// TECNOLOGÍA</div>
          <h2 className="s-h2" style={{ color: '#fff', marginBottom: 28 }}>STACK</h2>

          <div className="stack-grid">
            {stack.map(s => (
              <div key={s.name} className="stack-item">
                {s.icon}
                <div className="stack-name">{s.name}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── CTA FINAL ─────────────────────────────────────── */}
      <Reveal>
        <section className="cta-sec" id="contact">
          <div>
            <div className="s-lbl">// SIGUIENTE PASO</div>
            <div className="cta-h">
              VEAMOS QUÉ<br />CONVIENE<br /><em>ORDENAR</em><br />PRIMERO
            </div>
          </div>
          <div className="cta-right">
            <p>
              Una conversación de 30 minutos es suficiente para identificar el proceso de mayor impacto y definir si tiene sentido avanzar juntos.
            </p>
            <p style={{ fontSize: 14, color: '#aaa' }}>
              Sin compromisos. Sin propuestas genéricas. Con criterio.
            </p>
            <div className="cta-btns">
              <button className="btn btn-primary" onClick={() => setShowContact(true)}>
                Solicitar diagnóstico →
              </button>
              <Link href="/planes">
                <button className="btn btn-outline">Ver planes →</button>
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Footer />

      {/* Modal de contacto */}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
}
