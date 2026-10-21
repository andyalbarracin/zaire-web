// File: dates.ts
// Path: zaire-web/lib/zaire-ops/dates.ts
// Description: Fechas "de calendario" en hora Argentina, iguales en server (Vercel corre en UTC)
//              y en el navegador. Las fechas sin hora ('YYYY-MM-DD') se manejan como strings:
//              nunca `new Date('YYYY-MM-DD')`, que se parsea como UTC y muestra el día anterior.

export const APP_TZ = 'America/Argentina/Buenos_Aires';
export const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const DOW_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']; // semana arranca el lunes
const DOW_FROM_SUNDAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function localParts(now: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour') === '24' ? '00' : get('hour'), min: get('minute') };
}

/** Hoy en Argentina como 'YYYY-MM-DD'. */
export function todayLocal(now = new Date(), tz = APP_TZ): string {
  const { y, m, d } = localParts(now, tz);
  return `${y}-${m}-${d}`;
}

/** Hora actual en Argentina como 'HH:MM'. */
export function nowTimeLocal(now = new Date(), tz = APP_TZ): string {
  const { h, min } = localParts(now, tz);
  return `${h}:${min}`;
}

export function isDateOnly(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** 'YYYY-MM' ± n meses. */
export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** Primer y último día de un mes 'YYYY-MM'. */
export function monthBounds(ym: string): { from: string; to: string } {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, '0')}` };
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS_ES[m - 1]} ${y}`;
}

/** 'YYYY-MM-DD' → 'DD/MM/AAAA' (sin pasar por Date). */
export function fmtDateOnly(iso?: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d ? `${d}/${m}/${y}` : iso;
}

/** 'YYYY-MM-DD' → 'Mié 21/10'. */
export function fmtDayShort(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DOW_FROM_SUNDAY[dow]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/** 'HH:MM:SS' | 'HH:MM' → 'HH:MM'. */
export function fmtTime(t?: string | null): string {
  return t ? t.slice(0, 5) : '';
}

/** Timestamp ISO → '21/10 13:05' en hora Argentina. */
export function fmtDateTimeLocal(ts: string, tz = APP_TZ): string {
  const { m, d, h, min } = localParts(new Date(ts), tz);
  return `${d}/${m} ${h}:${min}`;
}
