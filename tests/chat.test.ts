// Tests del chat del sitio: historial multi-turno por proveedor, limpieza de la respuesta
// ([[LEAD]] + markdown), cadena con 1 intento por proveedor y agrupado del log.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { toOpenAIMessages, toGeminiContents, chainProviders, GroqProvider, type LLMProvider } from '../lib/sales/providers';
import { cleanChatReply, stripMarkdown } from '../lib/sales/chat';
import { groupSessions, type ChatLogRow } from '../lib/zaire-ops/chat-logs';

const history = [
  { role: 'assistant' as const, content: '¿Qué parte de tu operación querés optimizar?' },
  { role: 'user' as const, content: 'Operación industrial' },
  { role: 'assistant' as const, content: '¿Qué tipo de empresa es?' },
];

describe('historial multi-turno', () => {
  it('OpenAI: system → historial → user actual', () => {
    const m = toOpenAIMessages({ system: 'S', history, user: 'Somos 40 técnicos' });
    expect(m.map(x => x.role)).toEqual(['system', 'assistant', 'user', 'assistant', 'user']);
    expect(m[m.length - 1].content).toBe('Somos 40 técnicos');
  });

  it('Gemini: descarta el saludo inicial del bot y mapea assistant → model', () => {
    const c = toGeminiContents({ system: 'S', history, user: 'Somos 40 técnicos' });
    expect(c.map(x => x.role)).toEqual(['user', 'model', 'user']);
    expect(c[0].parts[0].text).toBe('Operación industrial');
  });

  it('Gemini: une turnos consecutivos del mismo rol', () => {
    const c = toGeminiContents({ system: 'S', history: [{ role: 'user', content: 'a' }], user: 'b' });
    expect(c).toEqual([{ role: 'user', parts: [{ text: 'a\n\nb' }] }]);
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('Groq manda el historial y reasoning_effort low a gpt-oss', async () => {
    let sent: { messages: { role: string }[]; reasoning_effort?: string; max_tokens: number } | null = null;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => {
      sent = JSON.parse(init.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'hola' } }] }), { status: 200 });
    }));
    const text = await new GroqProvider('openai/gpt-oss-120b', 'test-key').complete({ system: 'S', history, user: 'u', maxTokens: 900 });
    expect(text).toBe('hola');
    expect(sent!.messages.length).toBe(5);
    expect(sent!.reasoning_effort).toBe('low');
    expect(sent!.max_tokens).toBe(900);
  });

  it('una respuesta vacía es error (para que la cadena caiga al siguiente)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: '' }, finish_reason: 'length' }] }), { status: 200 })));
    await expect(new GroqProvider(undefined, 'k').complete({ system: 'S', user: 'u' })).rejects.toThrow(/vacía/);
  });
});

describe('cleanChatReply', () => {
  it('detecta [[LEAD]] y lo quita', () => {
    expect(cleanChatReply('Lo vemos en una demo.[[LEAD]]')).toEqual({ text: 'Lo vemos en una demo.', lead: true });
    expect(cleanChatReply('Coordinamos? [[ lead ]]').lead).toBe(true);
    expect(cleanChatReply('¿Cuántos son en el equipo?').lead).toBe(false);
  });

  it('quita un token cortado al final', () => {
    expect(cleanChatReply('Te propongo una demo.[[LEA').text).toBe('Te propongo una demo.');
  });

  it('quita el markdown que el chat mostraría crudo', () => {
    expect(stripMarkdown('el plan **Performance** de *Zaire Studio*')).toBe('el plan Performance de Zaire Studio');
    expect(stripMarkdown('## Título\n- uno\n- dos')).toBe('Título\n• uno\n• dos');
    expect(stripMarkdown('ver [demo](https://zairetech.com)')).toBe('ver demo (https://zairetech.com)');
  });
});

describe('chainProviders con 1 intento por proveedor', () => {
  it('no reintenta, cae al siguiente y registra el error', async () => {
    const calls: string[] = [];
    const mk = (name: string, fail = false): LLMProvider => ({
      name, async complete() { calls.push(name); if (fail) throw new Error('groq HTTP 429: TPM'); return name; },
    });
    const report = { used: [] as string[], errors: [] as string[] };
    const p = chainProviders([{ provider: mk('groq', true), maxCalls: 1 }, { provider: mk('gemini'), maxCalls: 1 }], report, { attemptsPerProvider: 1 });
    expect(await p.complete({ system: '', user: '' })).toBe('gemini');
    expect(calls).toEqual(['groq', 'gemini']);
    expect(report.errors[0]).toMatch(/^groq: .*429/);
  });
});

describe('groupSessions', () => {
  const row = (p: Partial<ChatLogRow>): ChatLogRow => ({
    id: Math.random().toString(), session_id: 's1', turn: 1, provider: 'groq', latency_ms: 500, finish: 'ok',
    error: null, lead_emitted: false, user_text: 'u', bot_text: 'b', ip_hash: null, created_at: '2026-10-21T10:00:00Z', ...p,
  });
  it('agrupa por sesión, cuenta errores/recuperados y marca conversión', () => {
    const s = groupSessions([
      row({ turn: 1 }),
      row({ turn: 2, created_at: '2026-10-21T10:01:00Z', provider: 'gemini', error: 'groq: 429' }),
      row({ turn: 3, created_at: '2026-10-21T10:02:00Z', lead_emitted: true }),
      row({ turn: 0, created_at: '2026-10-21T10:03:00Z', finish: 'lead_submitted', provider: null }),
      row({ session_id: 's2', finish: 'error', provider: null, created_at: '2026-10-21T09:00:00Z' }),
    ]);
    expect(s.map(x => x.session_id)).toEqual(['s1', 's2']);
    expect(s[0]).toMatchObject({ errors: 0, recovered: 1, leadEmitted: true, converted: true, providers: ['groq', 'gemini'] });
    expect(s[0].turns.length).toBe(3);
    expect(s[1].errors).toBe(1);
  });
});
