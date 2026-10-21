// File: chat-logs.ts
// Path: zaire-web/lib/zaire-ops/chat-logs.ts
// Description: Log persistente del chat de diagnóstico del sitio (tabla zo_chat_logs, migración 0018).
//              Un registro por turno (proveedor, latencia, error, si cerró con [[LEAD]], textos)
//              + un evento 'lead_submitted' cuando el visitante deja sus datos.
//              El insert NUNCA lanza: si la tabla no existe o falla, el chat sigue igual.

import { createHash } from 'node:crypto';
import { createSupabaseAdmin } from './supabase-admin';

export type ChatFinish = 'ok' | 'error' | 'lead_submitted';

export interface ChatLogRow {
  id: string;
  session_id: string;
  turn: number;               // nº de mensaje del visitante (0 = evento, ej. lead enviado)
  provider: string | null;
  latency_ms: number | null;
  finish: ChatFinish;
  error: string | null;
  lead_emitted: boolean;
  user_text: string | null;
  bot_text: string | null;
  ip_hash: string | null;
  created_at: string;
}

export interface ChatLogInput {
  session_id: string;
  turn: number;
  provider?: string | null;
  latency_ms?: number | null;
  finish: ChatFinish;
  error?: string | null;
  lead_emitted?: boolean;
  user_text?: string | null;
  bot_text?: string | null;
  ip?: string | null;
}

/** IP → hash corto (para detectar abuso sin guardar la IP). */
export function hashIp(ip?: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(`${process.env.CHAT_LOG_SALT || 'zaire-chat'}:${ip}`).digest('hex').slice(0, 16);
}

export async function logChatTurn(row: ChatLogInput): Promise<void> {
  try {
    const { error } = await createSupabaseAdmin().from('zo_chat_logs').insert({
      session_id:   row.session_id.slice(0, 64),
      turn:         row.turn,
      provider:     row.provider ?? null,
      latency_ms:   row.latency_ms ?? null,
      finish:       row.finish,
      error:        row.error?.slice(0, 500) ?? null,
      lead_emitted: row.lead_emitted ?? false,
      user_text:    row.user_text?.slice(0, 1000) ?? null,
      bot_text:     row.bot_text?.slice(0, 2000) ?? null,
      ip_hash:      hashIp(row.ip),
    });
    if (error) console.warn('[chat-log] insert:', error.code, error.message);
  } catch (e) {
    console.warn('[chat-log] insert:', (e as Error)?.message);
  }
}

/** Últimos `days` días. `null` si la tabla no existe (migración 0018 sin correr). */
export async function listChatLogs(days: number, limit = 1000): Promise<ChatLogRow[] | null> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await createSupabaseAdmin()
    .from('zo_chat_logs')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.warn('[chat-log] list:', error.code, error.message); return null; }
  return (data ?? []) as ChatLogRow[];
}

export interface ChatSession {
  session_id: string;
  started_at: string;
  last_at: string;
  turns: ChatLogRow[];        // turnos de conversación (sin eventos), en orden
  providers: string[];
  errors: number;             // turnos sin respuesta
  recovered: number;          // turnos que respondieron tras fallar un proveedor
  leadEmitted: boolean;       // el bot cerró con [[LEAD]]
  converted: boolean;         // el visitante dejó sus datos
}

/** Agrupa filas por sesión, la más reciente primero. Puro (testeable). */
export function groupSessions(rows: ChatLogRow[]): ChatSession[] {
  const map = new Map<string, ChatSession>();
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const r of sorted) {
    let s = map.get(r.session_id);
    if (!s) {
      s = { session_id: r.session_id, started_at: r.created_at, last_at: r.created_at, turns: [], providers: [], errors: 0, recovered: 0, leadEmitted: false, converted: false };
      map.set(r.session_id, s);
    }
    s.last_at = r.created_at;
    if (r.finish === 'lead_submitted') { s.converted = true; continue; }
    s.turns.push(r);
    if (r.provider && !s.providers.includes(r.provider)) s.providers.push(r.provider);
    if (r.finish === 'error') s.errors += 1;
    else if (r.error) s.recovered += 1;
    if (r.lead_emitted) s.leadEmitted = true;
  }
  return [...map.values()].sort((a, b) => b.last_at.localeCompare(a.last_at));
}
