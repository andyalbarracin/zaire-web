// File: chat-box.tsx
// Path: zaire-web/components/chat-box.tsx
// Last modified: 2026-04-27
// Description: Chat de diagnóstico IA del hero.
//              Usa Groq (Llama 3, gratuito) via /api/chat.
//              Flujo: conversación libre → al 3er intercambio muestra captura de lead.
//              Lead se envía al webhook configurado en NEXT_PUBLIC_LEAD_WEBHOOK_URL.

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
}

/* Mensaje inicial de bienvenida */
const WELCOME = '¿Qué parte de tu operación querés optimizar primero?';

export default function ChatBox() {
  const [msgs, setMsgs] = useState<Message[]>([
    { role: 'bot', text: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [showLead, setShowLead] = useState(false);
  const [lead, setLead] = useState<LeadForm>({ name: '', email: '' });
  const [leadSending, setLeadSending] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [hasGroq, setHasGroq] = useState(true);   // asume que funciona hasta que falle
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [msgs, typing, showLead]);

  /* Convierte el historial al formato que espera la API */
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

      /* Después del 3er intercambio, mostrar captura de lead */
      if (newCount >= 3 && !showLead) {
        setTimeout(() => setShowLead(true), 400);
      }
    } catch {
      setHasGroq(false);
      /* Fallback si Groq no está configurado */
      setMsgs(p => [...p, {
        role: 'bot',
        text: 'Para ayudarte mejor, déjame tus datos y te contactamos hoy con un diagnóstico personalizado.'
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

  /* Envío del lead al webhook */
  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead.email) return;
    setLeadSending(true);

    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          conversation: msgs.map(m => `${m.role === 'bot' ? 'ZAIRE' : 'Visitante'}: ${m.text}`).join('\n'),
          source: 'chat_hero',
        }),
      });
      setLeadDone(true);
      setMsgs(p => [...p, { role: 'bot', text: `¡Perfecto, ${lead.name.split(' ')[0]}! Te contactamos hoy. Mientras tanto podés explorar nuestros planes en detalle.` }]);
      setShowLead(false);
    } catch {
      setLeadSending(false);
    }
  };

  /* Botones rápidos de inicio */
  const quickBtns = exchangeCount === 0 ? [
    'Automatización de procesos',
    'Agentes IA',
    'Revenue / Ventas',
    'Knowledge Ops',
  ] : [];

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

      {/* Botones rápidos de inicio */}
      {quickBtns.length > 0 && !typing && (
        <div className="ai-quick">
          {quickBtns.map(btn => (
            <button key={btn} className="ai-qbtn" onClick={() => sendMessage(btn)}>
              {btn}
            </button>
          ))}
        </div>
      )}

      {/* Formulario de captura de lead */}
      {showLead && !leadDone && (
        <form className="ai-lead" onSubmit={submitLead}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>
            → Dejá tus datos y te contactamos hoy
          </div>
          <input
            className="ai-linput"
            placeholder="Tu nombre"
            value={lead.name}
            onChange={e => setLead(p => ({ ...p, name: e.target.value }))}
            aria-label="Nombre"
          />
          <input
            className="ai-linput"
            type="email"
            required
            placeholder="tu@empresa.com"
            value={lead.email}
            onChange={e => setLead(p => ({ ...p, email: e.target.value }))}
            aria-label="Email"
          />
          <button className="ai-lsubmit" type="submit" disabled={leadSending}>
            {leadSending ? 'ENVIANDO...' : 'HABLAR CON ZAIRE →'}
          </button>
        </form>
      )}

      {/* Input de texto — oculto si estamos en captura de lead o conversación terminó */}
      {!showLead && !leadDone && (
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
