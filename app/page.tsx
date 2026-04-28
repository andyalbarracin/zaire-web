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
import {
  IWorkflow, IAgent, IKnowledge, IRevenue, IGrowth, IInfra,
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

const services = [
  { icon: <IWorkflow s="#fff" size={40} />, title: 'Automatización y Orquestación', tag: 'n8n · Make · Zapier · Webhooks · APIs REST', org: false },
  { icon: <IAgent s="#fff" size={40} />, title: 'Arquitectura IA y Agentes', tag: 'Claude · GPT-4o · LangChain · MCP · Ollama', org: false },
  { icon: <IKnowledge s="#111" size={40} />, title: 'Knowledge Ops', tag: 'Supabase · pgvector · RAG · embeddings · MCP', org: true },
  { icon: <IRevenue s="#fff" size={40} />, title: 'Funnels y Revenue Systems', tag: 'HubSpot · Pipedrive · n8n · WhatsApp API', org: false },
  { icon: <IGrowth s="#fff" size={40} />, title: 'Growth y Performance', tag: 'Analytics · A/B · automatización de contenido', org: false },
  { icon: <IInfra s="#fff" size={40} />, title: 'Infraestructura Híbrida', tag: 'Supabase · Postgres · APIs · webhooks · auth', org: false },
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
    body: 'Workflows que incorporan inteligencia: clasifican, deciden y responden con contexto real.',
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

const plans = [
  {
    tier: 'Automatiza tu primer flujo',
    name: 'ZAIRE\nFLOW',
    price: '$997',
    period: '/mes',
    feats: ['1 workflow principal automatizado', 'Integración CRM + Email', 'Dashboard básico de seguimiento', 'Documentación del sistema', 'Soporte mensual dedicado'],
    cta: 'EMPEZAR',
    feat: false,
  },
  {
    tier: 'Opera sin fricción',
    name: 'ZAIRE\nPERFORMANCE',
    price: '$2,497',
    period: '/mes',
    feats: ['Hasta 5 workflows conectados', 'Agente IA integrado a tu CRM', 'Knowledge base de marca propia', 'Reporting avanzado en tiempo real', 'Soporte semanal + optimización', 'Revisión mensual de arquitectura'],
    cta: 'EMPEZAR',
    feat: true,
  },
  {
    tier: 'Arquitectura total',
    name: 'ZAIRE\nINTELLIGENCE',
    price: 'A medida',
    period: '',
    feats: ['Workflows y agentes ilimitados', 'Arquitectura agentic completa', 'Infraestructura dedicada', 'Team de ingeniería ZAIRE', 'SLA + soporte prioritario 24/7', 'Evolución trimestral del sistema'],
    cta: 'HABLAR',
    feat: false,
  },
];

const process = [
  { n: '01', title: 'Discovery', body: 'Mapeamos tu operación actual, identificamos fricciones y definimos el punto de mayor impacto.' },
  { n: '02', title: 'Diseño', body: 'Arquitecturamos el sistema: flows, agentes, integraciones y knowledge base.' },
  { n: '03', title: 'Implementación', body: 'Construimos y conectamos todo. Cada pieza documentada y lista para operar.' },
  { n: '04', title: 'Estabilización', body: 'Monitoreamos, ajustamos y entrenamos al equipo. El sistema entra en producción real.' },
];

const cases = [
  {
    sector: 'VENTAS B2B',
    title: 'Pipeline Inteligente',
    body: 'Leads calificados automáticamente, seguimiento por agente IA y propuestas generadas con contexto real del cliente.',
    chips: ['n8n', 'Claude', 'HubSpot'],
    hl: false,
  },
  {
    sector: 'MARKETING',
    title: 'Contenido Operativo',
    body: 'Generación, revisión y publicación de contenido a escala. Brand voice preservado por knowledge base propia.',
    chips: ['OpenAI', 'Supabase', 'RAG'],
    hl: true,
  },
  {
    sector: 'OPERACIONES',
    title: 'Onboarding Automatizado',
    body: 'Contratos, accesos, comunicaciones y tareas de equipo ejecutados sin coordinación manual.',
    chips: ['Webhooks', 'n8n', 'Notion'],
    hl: false,
  },
  {
    sector: 'SOPORTE',
    title: 'Agente 24/7',
    body: 'Agente IA entrenado con tu knowledge base que resuelve tickets, escala casos y aprende de cada interacción.',
    chips: ['Claude', 'RAG', 'Supabase'],
    hl: false,
  },
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
            <div className="hero-label">// ZAIRE · INTELLIGENT OPERATIONS STUDIO</div>
            <h1 className="hero-h1">
              SISTEMAS<br />
              INTELI-<br /><em>GENTES</em>
            </h1>
            <p className="hero-sub">
              Diseñamos sistemas inteligentes — workflows, agentes IA y knowledge ops — para que tu empresa opere con estructura, velocidad y criterio.
            </p>
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

      {/* ── PROBLEMAS REALES ──────────────────────────────── */}
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
              <button className="btn btn-white">Ver todos los servicios →</button>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── CAPAS DEL SISTEMA ─────────────────────────────── */}
      <Reveal>
        <section className="section" id="layers">
          <div className="s-lbl">// SISTEMA EN CAPAS</div>
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
            <Link href="/sistemas">
              <button className="btn btn-dark">Explorar arquitectura →</button>
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

      {/* ── PLANES ───────────────────────────────────────── */}
      <Reveal>
        <section className="section" id="plans">
          <div className="s-lbl">// PLANES</div>
          <h2 className="s-h2" style={{ marginBottom: 8 }}>ELIGE TU NIVEL</h2>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 40, fontWeight: 300 }}>
            Cada plan es un sistema completo, no una lista de funciones.
          </p>

          <div className="plans-grid">
            {plans.map(p => (
              <div key={p.name} className={`plan-card${p.feat ? ' feat' : ''}`}>
                <div className="plan-tier">{p.tier}</div>
                <div className="plan-name" style={{ whiteSpace: 'pre-line' }}>{p.name}</div>
                <div className="plan-price">
                  {p.price}
                  {p.period && <span>{p.period}</span>}
                </div>
                <div className="plan-feats">
                  {p.feats.map(f => (
                    <div key={f} className="plan-feat">{f}</div>
                  ))}
                </div>
                <button
                  className={`btn ${p.feat ? 'btn-primary' : 'btn-dark'}`}
                  style={{ justifyContent: 'center', width: '100%' }}
                  onClick={() => setShowContact(true)}
                >
                  {p.cta} →
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Link href="/planes">
              <button className="btn btn-outline">Comparar planes en detalle →</button>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── CÓMO TRABAJAMOS ───────────────────────────────── */}
      <Reveal>
        <section className="section s-wh" id="process">
          <div className="s-lbl">// PROCESO</div>
          <h2 className="s-h2" style={{ marginBottom: 40 }}>
            CÓMO<br />TRABAJAMOS
          </h2>

          <div className="proc-grid">
            {process.map(p => (
              <div key={p.n} className="proc-card">
                <div className="proc-num">{p.n}</div>
                <div className="proc-title">{p.title}</div>
                <div className="proc-body">{p.body}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <Link href="/proceso">
              <button className="btn btn-dark">Ver proceso completo →</button>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── CASOS DE USO ──────────────────────────────────── */}
      <Reveal>
        <section className="section s-dk" id="cases">
          <div className="s-lbl s-lbl-dk">// CASOS DE USO</div>
          <h2 className="s-h2" style={{ color: '#fff', marginBottom: 40 }}>
            SISTEMAS EN<br /><em>OPERACIÓN</em>
          </h2>

          <div className="cases-grid">
            {cases.map(c => (
              <div key={c.title} className={`case-card${c.hl ? ' hl' : ''}`}>
                <div className="case-sector">{c.sector}</div>
                <div className="case-title">{c.title}</div>
                <div className="case-body">{c.body}</div>
                <div className="case-chips">
                  {c.chips.map(ch => (
                    <span key={ch} className="case-chip">{ch}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <Link href="/casos">
              <button className="btn btn-white">Ver todos los casos →</button>
            </Link>
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
