// File: chat-box.tsx
// Path: zaire-web/components/chat-box.tsx
// Last modified: 2026-04-28

'use client';

import { useState, useRef, useEffect } from 'react';

type Role = 'bot' | 'user';
interface Message { role: Role; text: string; }
interface LeadForm { name: string; company: string; email: string; whatsapp: string; }

const TOPIC_BTNS = [
  'Automatización de procesos',
  'Agentes IA',
  'Marketing / Ventas',
  'Atención al Cliente',
  'Knowledge Ops',
  'Otros...',
];

export default function ChatBox() {
  const [msgs, setMsgs]               = useState<Message[]>([{ role: 'bot', text: '¿Qué parte de tu operación querés optimizar?' }]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [count, setCount]             = useState(0);
  const [showLead, setShowLead]       = useState(false);
  const [lead, setLead]               = useState<LeadForm>({ name: '', company: '', email: '', whatsapp: '' });
  const [leadSending, setLeadSending] = useState(false);
  const [leadDone, setLeadDone]       = useState(false);
  const [hasGroq, setHasGroq]         = useState(true);
  const msgsRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * Flujo limpio:
   * 0 → topic buttons (sin input)
   * 1-2 → conversación libre con la IA (input habilitado)
   * 3+ → la IA hizo su recomendación → aparece el form de lead
   */
  const showTopicBtns = count === 0 && !typing;
  const showInput     = count > 0 && !showLead && !leadDone;

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, typing, showLead]);

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
      /* Después del 5to intercambio la IA ya tuvo suficiente conversación → form */
      if (newCount >= 5) setTimeout(() => setShowLead(true), 400);
    } catch {
      setHasGroq(false);
      setMsgs(p => [...p, { role: 'bot', text: 'Para ayudarte mejor, dejame tus datos y te contactamos hoy.' }]);
      setShowLead(true);
    } finally {
      setTyping(false);
      if (count < 2) setTimeout(() => inputRef.current?.focus(), 80);
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
          name:         lead.name    || null,
          company:      lead.company || null,
          email:        lead.email,
          whatsapp:     lead.whatsapp || null,
          conversation: msgs.map(m => `${m.role === 'bot' ? 'ZAIRE' : 'Visitante'}: ${m.text}`).join('\n'),
          source:       'chat_hero',
        }),
      });
      setLeadDone(true);
      setMsgs(p => [...p, {
        role: 'bot',
        text: `Perfecto${lead.name ? `, ${lead.name.split(' ')[0]}` : ''}! Te contactamos hoy. Podés explorar nuestros planes mientras tanto.`,
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

      {/* Exchange 0: topic buttons — acceso rápido, sin input */}
      {showTopicBtns && (
        <div className="ai-quick">
          {TOPIC_BTNS.map(b => (
            <button key={b} className="ai-qbtn" onClick={() => send(b)}>{b}</button>
          ))}
        </div>
      )}

      {/* Form de lead — aparece tras el 3er intercambio */}
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
          <button className="ai-lsubmit" type="submit" disabled={leadSending}>
            {leadSending ? 'ENVIANDO...' : 'HABLAR CON ZAIRE →'}
          </button>
        </form>
      )}

      {/* Input libre — exchanges 1 y 2 */}
      {showInput && (
        <div className="ai-input-row">
          <input ref={inputRef} className="ai-input"
            placeholder="Escribí tu respuesta..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            disabled={typing}
          />
          <button className="ai-send" onClick={() => send(input)} disabled={typing || !input.trim()}>→</button>
        </div>
      )}
    </div>
  );
}
