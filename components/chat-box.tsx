// File: chat-box.tsx
// Path: zaire-web/components/chat-box.tsx
// Last modified: 2026-04-28

'use client';

import { useState, useRef, useEffect } from 'react';

type Role = 'bot' | 'user';

interface Message {
  role: Role;
  text: string;
}

interface LeadForm {
  name: string;
  email: string;
  whatsapp: string;
}

const WELCOME = '¿Qué parte de tu operación querés optimizar?';

const TOPIC_BTNS = [
  'Automatización de procesos',
  'Agentes IA',
  'Marketing / Ventas',
  'Atención al Cliente',
  'Knowledge Ops',
  'Otros...',
];

const QUALIFY_LABEL = '¿Cuántas personas hay en tu equipo?';
const QUALIFY_BTNS = ['Solo / 1–2 personas', '3–10 personas', '10–50 personas', '50+ personas'];

export default function ChatBox() {
  const [msgs, setMsgs] = useState<Message[]>([{ role: 'bot', text: WELCOME }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [showLead, setShowLead] = useState(false);
  const [lead, setLead] = useState<LeadForm>({ name: '', email: '', whatsapp: '' });
  const [leadSending, setLeadSending] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [hasGroq, setHasGroq] = useState(true);
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Derivado — sin estado extra, sin timers que se pisen */
  const showTopicBtns = exchangeCount === 0 && !typing;
  const showQualify   = exchangeCount === 2 && !typing && !showLead && !leadDone;

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [msgs, typing, showLead, showQualify]);

  const toApiMessages = (history: Message[]) =>
    history.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));

  const sendMessage = async (text: string) => {
    if (!text.trim() || typing) return;

    const userMsg: Message = { role: 'user', text: text.trim() };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setTyping(true);

    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toApiMessages(newMsgs) }),
      });

      if (!res.ok) throw new Error('API error');
      const { text: botText } = await res.json();

      setMsgs(p => [...p, { role: 'bot', text: botText }]);

      /* exchange 3+: mostrar formulario */
      if (newCount >= 3 && !showLead) {
        setTimeout(() => setShowLead(true), 400);
      }
    } catch {
      setHasGroq(false);
      setMsgs(p => [...p, {
        role: 'bot',
        text: 'Para ayudarte mejor, dejame tus datos y te contactamos hoy con un diagnóstico personalizado.',
      }]);
      setShowLead(true);
    } finally {
      setTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const submitLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lead.email) return;
    setLeadSending(true);

    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name || null,
          email: lead.email,
          whatsapp: lead.whatsapp || null,
          conversation: msgs.map(m => `${m.role === 'bot' ? 'ZAIRE' : 'Visitante'}: ${m.text}`).join('\n'),
          source: 'chat_hero',
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

  const showInput = !showTopicBtns && !showQualify && !showLead && !leadDone;

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
      <div className="ai-msgs" ref={msgsRef} aria-live="polite" aria-label="Conversación">
        {msgs.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            <div className="ai-bubble" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="ai-msg bot">
            <div className="ai-typing" aria-label="Escribiendo">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      {/* Botones de tema — solo al inicio */}
      {showTopicBtns && (
        <div className="ai-quick">
          {TOPIC_BTNS.map(btn => (
            <button key={btn} className="ai-qbtn" onClick={() => sendMessage(btn)}>{btn}</button>
          ))}
        </div>
      )}

      {/* Botones de calificación — tamaño de equipo, exchange 2 */}
      {showQualify && (
        <div className="ai-quick">
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6, width: '100%' }}>
            {QUALIFY_LABEL}
          </div>
          {QUALIFY_BTNS.map(btn => (
            <button key={btn} className="ai-qbtn" onClick={() => sendMessage(btn)}>{btn}</button>
          ))}
        </div>
      )}

      {/* Formulario de captura de lead */}
      {showLead && !leadDone && (
        <form className="ai-lead" onSubmit={submitLead}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 6 }}>
            → Dejá tus datos y te contactamos hoy
          </div>
          <input
            className="ai-linput"
            placeholder="Tu nombre (opcional)"
            value={lead.name}
            onChange={e => setLead(p => ({ ...p, name: e.target.value }))}
            aria-label="Nombre"
          />
          <input
            className="ai-linput"
            type="email"
            required
            placeholder="tu@empresa.com *"
            value={lead.email}
            onChange={e => setLead(p => ({ ...p, email: e.target.value }))}
            aria-label="Email"
          />
          <input
            className="ai-linput"
            type="tel"
            placeholder="¿Tenés WhatsApp? Ingresalo sin el 0 y sin el 15"
            value={lead.whatsapp}
            onChange={e => setLead(p => ({ ...p, whatsapp: e.target.value }))}
            aria-label="WhatsApp"
          />
          <button className="ai-lsubmit" type="submit" disabled={leadSending}>
            {leadSending ? 'ENVIANDO...' : 'HABLAR CON ZAIRE →'}
          </button>
        </form>
      )}

      {/* Input de texto libre */}
      {showInput && (
        <div className="ai-input-row">
          <input
            ref={inputRef}
            className="ai-input"
            placeholder="Escribí tu consulta..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={typing}
            aria-label="Mensaje"
          />
          <button
            className="ai-send"
            onClick={() => sendMessage(input)}
            disabled={typing || !input.trim()}
            aria-label="Enviar"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
