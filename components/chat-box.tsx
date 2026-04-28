// File: chat-box.tsx
// Path: zaire-web/components/chat-box.tsx
// Last modified: 2026-04-28

'use client';

import { useState, useRef, useEffect } from 'react';

type Role = 'bot' | 'user';
interface Message { role: Role; text: string; }
interface LeadForm { name: string; company: string; email: string; whatsapp: string; }

const STORAGE_KEY  = 'zaire_chat_v2';
const RESET_KEY    = 'zaire_chat_resets';
const EXPIRY_MS    = 12 * 60 * 60 * 1000; // 12 horas
const RESET_LIMIT  = 3;
const RESET_WINDOW = 60 * 60_000; // 1 hora
const WELCOME_TEXT = '¿Qué parte de tu operación querés optimizar?';
const WELCOME_MSG: Message = { role: 'bot', text: WELCOME_TEXT };
const MAX_MSG_LEN  = 800;

const TOPIC_BTNS = [
  'Automatización de procesos',
  'Agentes IA',
  'Marketing / Ventas',
  'Atención al Cliente',
  'Operaciones internas',
  'Otros...',
];

/* ── Helpers de localStorage ──────────────────────────────── */
function loadSaved(): { msgs: Message[]; count: number; leadDone: boolean } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { msgs, count, leadDone, ts } = JSON.parse(raw);
    if (Date.now() - ts > EXPIRY_MS || !Array.isArray(msgs) || msgs.length <= 1) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { msgs, count: count ?? 0, leadDone: leadDone ?? false };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function checkResetAllowed(): { allowed: boolean; minutesLeft?: number } {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    if (!raw) return { allowed: true };
    const { count, resetAt } = JSON.parse(raw);
    if (Date.now() > resetAt) return { allowed: true };
    if (count >= RESET_LIMIT) {
      return { allowed: false, minutesLeft: Math.ceil((resetAt - Date.now()) / 60_000) };
    }
    return { allowed: true };
  } catch { return { allowed: true }; }
}

function incrementResetCount(): void {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    let count = 1, resetAt = Date.now() + RESET_WINDOW;
    if (raw) {
      const p = JSON.parse(raw);
      if (Date.now() < p.resetAt) { count = (p.count || 0) + 1; resetAt = p.resetAt; }
    }
    localStorage.setItem(RESET_KEY, JSON.stringify({ count, resetAt }));
  } catch { /* ignorar */ }
}

export default function ChatBox() {
  /* Inicialización lazy desde localStorage — sin flash de contenido */
  /* Siempre arranca con el estado inicial — localStorage se restaura en useEffect */
  const [msgs, setMsgs]       = useState<Message[]>([WELCOME_MSG]);
  const [count, setCount]     = useState(0);
  const [leadDone, setLeadDone] = useState(false);

  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [showLead, setShowLead]       = useState(false);
  const [lead, setLead]               = useState<LeadForm>({ name: '', company: '', email: '', whatsapp: '' });
  const [leadSending, setLeadSending] = useState(false);
  const [hasGroq, setHasGroq]         = useState(true);
  const [resetError, setResetError]   = useState<string | null>(null);
  const msgsRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    const { allowed, minutesLeft } = checkResetAllowed();
    if (!allowed) {
      setResetError(`Límite alcanzado. Podés reiniciar en ${minutesLeft} min.`);
      return;
    }
    incrementResetCount();
    localStorage.removeItem(STORAGE_KEY);
    setMsgs([WELCOME_MSG]);
    setCount(0);
    setLeadDone(false);
    setShowLead(false);
    setInput('');
    setResetError(null);
  };

  /* Restaurar conversación guardada — solo corre en cliente, tras mount */
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setMsgs(saved.msgs);
      setCount(saved.count);
      setLeadDone(saved.leadDone);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Persistir conversación en localStorage con cada cambio */
  useEffect(() => {
    if (msgs.length <= 1 && count === 0) return; // no guardar estado inicial
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ msgs, count, leadDone, ts: Date.now() }));
    } catch { /* quota exceeded — ignorar */ }
  }, [msgs, count, leadDone]);

  const showTopicBtns = count === 0 && !typing;
  const showInput     = count > 0 && !showLead && !leadDone;

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, typing, showLead]);

  const toApi = (h: Message[]) =>
    h.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));

  const send = async (text: string) => {
    if (!text.trim() || typing) return;
    /* Sanitización básica en cliente: recortar y limpiar HTML */
    const safe = text.trim().slice(0, MAX_MSG_LEN).replace(/[<>]/g, '');
    if (!safe) return;

    const userMsg: Message = { role: 'user', text: safe };
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

      if (res.status === 429) {
        setMsgs(p => [...p, { role: 'bot', text: 'Demasiadas consultas en poco tiempo. Esperá un momento y volvé a intentarlo.' }]);
        setTyping(false);
        return;
      }
      if (!res.ok) throw new Error('api');

      const raw = await res.json();
      const botText = raw.text ?? '';
      const aiReady = botText.includes('[[LEAD]]');
      const cleanText = botText.replace('[[LEAD]]', '').trim();
      setMsgs(p => [...p, { role: 'bot', text: cleanText }]);
      if ((aiReady && newCount >= 3) || newCount >= 5) setTimeout(() => setShowLead(true), 400);
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
          name:         lead.name    || null,
          company:      lead.company || null,
          email:        lead.email,
          whatsapp:     lead.whatsapp || null,
          conversation: msgs.map(m => `${m.role === 'bot' ? 'ZAIRE' : 'Visitante'}: ${m.text}`).join('\n'),
          source:       'chat_hero',
        }),
      });
      setLeadDone(true);
      localStorage.removeItem(STORAGE_KEY); // limpiar al convertir
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className="ai-badge">IA</span>
          {count > 0 && !leadDone && (
            <button
              onClick={handleReset}
              style={{ fontFamily: 'var(--fm)', fontSize: 7, letterSpacing: '.08em', textTransform: 'uppercase', color: '#444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              title="Empezar una nueva conversación"
            >
              ↺ nueva conv.
            </button>
          )}
        </div>
      </div>

      {/* Error de límite de reinicio */}
      {resetError && (
        <div style={{ fontFamily: 'var(--fm)', fontSize: 9, color: '#666', padding: '6px 16px', borderBottom: '1px solid #1a1a1a', letterSpacing: '.04em' }}>
          {resetError}
        </div>
      )}

      {/* Mensajes */}
      <div className="ai-msgs" ref={msgsRef} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            <div className="ai-bubble" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
          </div>
        ))}

        {/* Indicador de escritura mejorado */}
        {typing && (
          <div className="ai-msg bot">
            <div className="ai-thinking">
              <div className="ai-thinking-avatar">Z</div>
              <div className="ai-thinking-body">
                <span className="ai-thinking-name">ZAIRE · analizando</span>
                <div className="ai-typing"><span /><span /><span /></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Topic buttons (exchange 0) */}
      {showTopicBtns && (
        <div className="ai-quick">
          {TOPIC_BTNS.map(b => (
            <button key={b} className="ai-qbtn" onClick={() => send(b)}>{b}</button>
          ))}
        </div>
      )}

      {/* Lead form */}
      {showLead && !leadDone && (
        <form className="ai-lead" onSubmit={submitLead}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>
            → Dejá tus datos y te contactamos hoy
          </div>
          <input className="ai-linput" placeholder="Tu nombre (opcional)"
            value={lead.name} onChange={e => setF('name', e.target.value)} maxLength={100} />
          <input className="ai-linput" placeholder="Empresa y rubro (ej: tienda de ropa, estudio contable...)"
            value={lead.company} onChange={e => setF('company', e.target.value)} maxLength={200} />
          <input className="ai-linput" type="email" required placeholder="tu@empresa.com *"
            value={lead.email} onChange={e => setF('email', e.target.value)} maxLength={200} />
          <input className="ai-linput" type="tel" placeholder="¿Tenés WhatsApp? Ingresalo sin el 0 y sin el 15"
            value={lead.whatsapp} onChange={e => setF('whatsapp', e.target.value)} maxLength={20} />
          <button className="ai-lsubmit" type="submit" disabled={leadSending}>
            {leadSending ? 'ENVIANDO...' : 'HABLAR CON ZAIRE →'}
          </button>
        </form>
      )}

      {/* Input libre */}
      {showInput && (
        <div className="ai-input-row">
          <input ref={inputRef} className="ai-input"
            placeholder="Escribí tu respuesta..."
            value={input}
            onChange={e => setInput(e.target.value.slice(0, MAX_MSG_LEN))}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            disabled={typing}
            maxLength={MAX_MSG_LEN}
          />
          <button className="ai-send" onClick={() => send(input)} disabled={typing || !input.trim()}>→</button>
        </div>
      )}
    </div>
  );
}
