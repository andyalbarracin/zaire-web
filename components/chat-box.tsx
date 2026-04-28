// File: chat-box.tsx
// Path: zaire-web/components/chat-box.tsx
// Last modified: 2026-04-28

'use client';

import { useState, useRef, useEffect } from 'react';

type Role = 'bot' | 'user';
interface Message { role: Role; text: string; }
interface LeadForm {
  name: string; company: string; email: string; whatsapp: string; ai_knowledge: string;
}

const TOPIC_BTNS = [
  'Automatización de procesos',
  'Agentes IA',
  'Marketing / Ventas',
  'Atención al Cliente',
  'Knowledge Ops',
  'Otros...',
];

/* Team size — aparece después del exchange 1, junto con input libre */
const TEAM_BTNS = [
  'Solo / 1–2 personas',
  '3–10 personas',
  '10–50 personas',
  '50+ personas',
];

const AI_OPTIONS = ['Sí, ya uso herramientas', 'Algo escuché, no mucho', 'Es nuevo para mí'];

export default function ChatBox() {
  const [msgs, setMsgs]               = useState<Message[]>([{ role: 'bot', text: '¿Qué parte de tu operación querés optimizar?' }]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [count, setCount]             = useState(0);
  const [showLead, setShowLead]       = useState(false);
  const [lead, setLead]               = useState<LeadForm>({ name: '', company: '', email: '', whatsapp: '', ai_knowledge: '' });
  const [leadSending, setLeadSending] = useState(false);
  const [leadDone, setLeadDone]       = useState(false);
  const [hasGroq, setHasGroq]         = useState(true);
  const msgsRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * FASES — 100% derivadas del estado, sin timers cruzados:
   *
   * count=0, !typing → topic buttons (sin input)
   * count=1, !typing → team size buttons + input libre  ← la IA preguntó team size
   * count>=2         → lead form aparece tras respuesta de IA
   *
   * Los buttons de team size refuerzan visualmente la pregunta que la IA ya hizo.
   * El usuario puede responder con un botón O escribir libremente.
   */
  const showTopicBtns = count === 0 && !typing;
  const showTeamBtns  = count === 1 && !typing && !showLead && !leadDone;
  const showInput     = count > 0 && !showLead && !leadDone && !typing;

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, typing, showLead, showTeamBtns]);

  const toApi = (h: Message[]) =>
    h.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));

  const send = async (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: Message = { role: 'user', text: text.trim() };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setTyping(true);
    const newCount = count + 1;
    setCount(newCount);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toApi(newMsgs) }),
      });
      if (!res.ok) throw new Error('api');
      const { text: botText } = await res.json();
      setMsgs(p => [...p, { role: 'bot', text: botText }]);
      if (newCount >= 2) setTimeout(() => setShowLead(true), 300);
    } catch {
      setHasGroq(false);
      setMsgs(p => [...p, { role: 'bot', text: 'Para ayudarte mejor, dejame tus datos y te contactamos hoy.' }]);
      setShowLead(true);
    } finally {
      setTyping(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const submitLead = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!lead.email) return;
    setLeadSending(true);
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         lead.name     || null,
          company:      lead.company  || null,
          email:        lead.email,
          whatsapp:     lead.whatsapp || null,
          ai_knowledge: lead.ai_knowledge || null,
          conversation: msgs.map(m => `${m.role === 'bot' ? 'ZAIRE' : 'Visitante'}: ${m.text}`).join('\n'),
          source:       'chat_hero',
        }),
      });
      setLeadDone(true);
      setMsgs(p => [...p, {
        role: 'bot',
        text: `Perfecto${lead.name ? `, ${lead.name.split(' ')[0]}` : ''}! Te contactamos hoy. Mientras tanto podés explorar nuestros planes.`,
      }]);
      setShowLead(false);
    } catch {
      setLeadSending(false);
    }
  };

  const setF = (k: keyof LeadForm, v: string) => setLead(p => ({ ...p, [k]: v }));

  return (
    <div className="ai-box">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-l">
          <span className="ai-dot" aria-hidden />
          <div>
            <div className="ai-title">ZAIRE · Diagnóstico</div>
            <div className="ai-sub">{hasGroq ? 'IA activa' : 'Sistema activo'}</div>
          </div>
        </div>
        <span className="ai-badge">IA</span>
      </div>

      {/* Mensajes */}
      <div className="ai-msgs" ref={msgsRef} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            <div className="ai-bubble" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="ai-msg bot">
            <div className="ai-typing"><span /><span /><span /></div>
          </div>
        )}
      </div>

      {/* Exchange 0: tema — solo botones, sin input */}
      {showTopicBtns && (
        <div className="ai-quick">
          {TOPIC_BTNS.map(b => <button key={b} className="ai-qbtn" onClick={() => send(b)}>{b}</button>)}
        </div>
      )}

      {/* Exchange 1: tamaño de equipo — botones + input libre */}
      {showTeamBtns && (
        <div className="ai-quick">
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#555', marginBottom: 6, width: '100%' }}>
            ¿Cuántas personas trabajan en tu empresa?
          </div>
          {TEAM_BTNS.map(b => <button key={b} className="ai-qbtn" onClick={() => send(b)}>{b}</button>)}
        </div>
      )}

      {/* Formulario de lead */}
      {showLead && !leadDone && (
        <form className="ai-lead" onSubmit={submitLead}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>
            → Dejá tus datos y te contactamos hoy
          </div>
          <input className="ai-linput" placeholder="Tu nombre (opcional)"
            value={lead.name} onChange={e => setF('name', e.target.value)} />
          <input className="ai-linput" placeholder="Empresa y rubro (ej: tienda de ropa, estudio contable...)"
            value={lead.company} onChange={e => setF('company', e.target.value)} />
          <input className="ai-linput" type="email" required placeholder="tu@empresa.com *"
            value={lead.email} onChange={e => setF('email', e.target.value)} />
          <input className="ai-linput" type="tel" placeholder="¿Tenés WhatsApp? Ingresalo sin el 0 y sin el 15"
            value={lead.whatsapp} onChange={e => setF('whatsapp', e.target.value)} />

          <div style={{ marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>
              ¿Conocés herramientas de IA o automatización?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AI_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setF('ai_knowledge', opt)}
                  style={{
                    fontFamily: 'var(--fm)', fontSize: 8, letterSpacing: '.06em', textTransform: 'uppercase',
                    padding: '5px 10px', borderRadius: 2, cursor: 'pointer', border: '1px solid',
                    borderColor: lead.ai_knowledge === opt ? '#FF6A00' : '#333',
                    background:  lead.ai_knowledge === opt ? '#FF6A00' : 'transparent',
                    color:       lead.ai_knowledge === opt ? '#111' : '#666',
                    transition: 'all .15s',
                  }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button className="ai-lsubmit" type="submit" disabled={leadSending}>
            {leadSending ? 'ENVIANDO...' : 'HABLAR CON ZAIRE →'}
          </button>
        </form>
      )}

      {/* Input libre — exchange 1+ cuando no hay form */}
      {showInput && (
        <div className="ai-input-row">
          <input ref={inputRef} className="ai-input"
            placeholder={showTeamBtns ? 'O escribí el tamaño de tu equipo...' : 'Escribí tu consulta...'}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            disabled={typing} />
          <button className="ai-send" onClick={() => send(input)} disabled={typing || !input.trim()}>→</button>
        </div>
      )}
    </div>
  );
}
