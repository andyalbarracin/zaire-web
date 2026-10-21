// File: page.tsx — Chat del sitio: log de conversaciones del chat de diagnóstico de la home (zo_chat_logs).
// Sirve para ver dónde se corta el embudo (errores, sesiones que no cierran) y quién respondió.
import Link from 'next/link';
import { requireUser } from '@/lib/zaire-ops/auth';
import { listChatLogs, groupSessions, type ChatSession } from '@/lib/zaire-ops/chat-logs';
import { fmtDateTimeLocal } from '@/lib/zaire-ops/dates';

export const dynamic = 'force-dynamic';

const MAX_SESSIONS = 100;
const RANGES: [string, string][] = [['1', '24 h'], ['7', '7 días'], ['30', '30 días']];
const FILTERS: [string, string][] = [['', 'Todas'], ['convertidas', 'Convertidas'], ['sin-datos', 'Cerró sin datos'], ['errores', 'Con errores']];

function hrefWith(p: { days?: string; f?: string }): string {
  const sp = new URLSearchParams();
  if (p.days && p.days !== '7') sp.set('days', p.days);
  if (p.f) sp.set('f', p.f);
  const qs = sp.toString();
  return `/dashboard/chat-logs${qs ? `?${qs}` : ''}`;
}

function matches(s: ChatSession, f?: string): boolean {
  if (f === 'convertidas') return s.converted;
  if (f === 'sin-datos') return s.leadEmitted && !s.converted;
  if (f === 'errores') return s.errors > 0;
  return true;
}

function median(ns: number[]): number {
  if (!ns.length) return 0;
  const s = [...ns].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export default async function ChatLogsPage({ searchParams }: { searchParams: Promise<{ days?: string; f?: string }> }) {
  await requireUser();
  const { days: d, f } = await searchParams;
  const days = RANGES.some(([v]) => v === d) ? d! : '7';
  const rows = await listChatLogs(Number(days));

  const head = (
    <div className="zo-pagehead">
      <div>
        <div className="zo-lbl">// COMERCIAL · CHAT DEL SITIO</div>
        <h1 className="zo-h1">Chat del sitio</h1>
        <div className="zo-sub">Conversaciones del chat de diagnóstico de la home, turno por turno.</div>
      </div>
    </div>
  );

  if (rows === null) {
    return (
      <>
        {head}
        <div className="zo-table-wrap"><div className="zo-empty">
          Todavía no existe el log. Corré la migración <span className="zo-mono">0018_chat_logs.sql</span> en Supabase y recargá.
        </div></div>
      </>
    );
  }

  const sessions = groupSessions(rows).filter(s => s.turns.length > 0);
  const filtered = sessions.filter(s => matches(s, f));
  const converted = sessions.filter(s => s.converted).length;
  const errorTurns = sessions.reduce((n, s) => n + s.errors, 0);
  const latency = median(rows.filter(r => r.finish === 'ok' && r.latency_ms != null).map(r => r.latency_ms!));

  return (
    <>
      {head}

      <div className="zo-kpis">
        <div className="zo-kpi accent"><div className="zo-kpi-n">{sessions.length}</div><div className="zo-kpi-l">Conversaciones</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n" style={{ color: converted ? '#22c55e' : undefined }}>{converted}</div><div className="zo-kpi-l">Dejaron sus datos{sessions.length ? ` · ${Math.round((converted / sessions.length) * 100)}%` : ''}</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n" style={{ color: errorTurns ? '#ff8a7d' : undefined }}>{errorTurns}</div><div className="zo-kpi-l">Turnos sin respuesta</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n">{latency ? `${(latency / 1000).toFixed(1)}s` : '—'}</div><div className="zo-kpi-l">Latencia mediana</div></div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(([v, label]) => (
            <Link key={v || 'all'} href={hrefWith({ days, f: v || undefined })}>
              <span className="zo-chip" style={(f ?? '') === v ? { background: '#FF6A00', color: '#111' } : {}}>{label}</span>
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RANGES.map(([v, label]) => (
            <Link key={v} href={hrefWith({ days: v, f })}>
              <span className="zo-chip" style={days === v ? { background: '#2a2a2a', color: '#fff' } : {}}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">{f ? 'Sin conversaciones para ese filtro.' : 'Sin conversaciones en este período.'}</div></div>
      ) : (
        <div className="zo-chat-sessions">
          {filtered.slice(0, MAX_SESSIONS).map(s => (
            <details key={s.session_id} className="zo-card zo-chat-sess">
              <summary>
                <span className="zo-mono">{fmtDateTimeLocal(s.started_at)}</span>
                <span className="zo-chat-first">{s.turns[0]?.user_text ?? '—'}</span>
                <span className="zo-chat-chips">
                  <span className="zo-chip">{s.turns.length} turno{s.turns.length === 1 ? '' : 's'}</span>
                  {s.converted && <span className="zo-chip" style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,.4)' }}>Convirtió</span>}
                  {!s.converted && s.leadEmitted && <span className="zo-chip" style={{ color: '#FFC107' }}>Cerró sin datos</span>}
                  {s.errors > 0 && <span className="zo-chip" style={{ color: '#ff8a7d', borderColor: 'rgba(231,29,10,.5)' }}>{s.errors} error{s.errors === 1 ? '' : 'es'}</span>}
                  {s.recovered > 0 && <span className="zo-chip" title="Un proveedor falló y respondió otro">{s.recovered} con respaldo</span>}
                </span>
              </summary>
              <div className="zo-timeline" style={{ marginTop: 14 }}>
                {s.turns.map(t => (
                  <div key={t.id} className="zo-chat-turn">
                    <div className="zo-comment-body">
                      <div className="zo-comment-head"><span className="zo-comment-author">Visitante · turno {t.turn}</span><span className="zo-comment-time">{fmtDateTimeLocal(t.created_at)}</span></div>
                      <div className="zo-comment-text">{t.user_text ?? '—'}</div>
                    </div>
                    {t.finish === 'ok' ? (
                      <div className="zo-comment-body zo-chat-bot">
                        <div className="zo-comment-head">
                          <span className="zo-comment-author">ZAIRE{t.lead_emitted ? ' · cerró con formulario' : ''}</span>
                          <span className="zo-comment-time">{t.provider ?? '—'} · {t.latency_ms != null ? `${(t.latency_ms / 1000).toFixed(1)}s` : '—'}</span>
                        </div>
                        <div className="zo-comment-text">{t.bot_text ?? '—'}</div>
                      </div>
                    ) : (
                      <div className="zo-form-error">Sin respuesta: el visitante vio el mensaje de respaldo y el formulario.</div>
                    )}
                    {t.error && <div className="zo-mono zo-chat-err">{t.error}</div>}
                  </div>
                ))}
              </div>
            </details>
          ))}
          {filtered.length > MAX_SESSIONS && <div className="zo-mono" style={{ textAlign: 'center', marginTop: 12 }}>Mostrando {MAX_SESSIONS} de {filtered.length}. Acotá el período.</div>}
        </div>
      )}
    </>
  );
}
