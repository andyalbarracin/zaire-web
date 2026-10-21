'use client';
// month-calendar.tsx — grilla mensual genérica (semana desde el lunes) para vistas calendario del panel.
// El mes lo controla el padre ('YYYY-MM'); "hoy" se calcula en hora Argentina.

import { Fragment, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DOW_ES, monthLabel, shiftMonth, todayLocal } from '@/lib/zaire-ops/dates';

export default function MonthCalendar<T>({
  month, onMonthChange, items, getDate, getKey, renderItem,
  onNew, newTitle = 'Agregar en este día', onDayClick, selected, maxPerCell = Infinity, headerExtra, loading,
}: {
  month: string;
  onMonthChange: (ym: string) => void;
  items: T[];
  getDate: (item: T) => string | null;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onNew?: (date: string) => void;
  newTitle?: string;
  onDayClick?: (date: string) => void;
  selected?: string | null;
  maxPerCell?: number;
  headerExtra?: ReactNode;
  loading?: boolean;
}) {
  const today = todayLocal();
  const [y, m] = month.split('-').map(Number);
  const startOffset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Lun=0
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${month}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDate = new Map<string, T[]>();
  for (const it of items) {
    const k = getDate(it)?.slice(0, 10);
    if (!k) continue;
    if (!byDate.has(k)) byDate.set(k, []);
    byDate.get(k)!.push(it);
  }

  return (
    <div className="zo-mcal">
      <div className="zo-mcal-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="zo-btn zo-btn-sm" onClick={() => onMonthChange(shiftMonth(month, -1))} title="Mes anterior" aria-label="Mes anterior"><ChevronLeft size={14} /></button>
          <strong style={{ minWidth: 150, textAlign: 'center' }}>{monthLabel(month)}</strong>
          <button className="zo-btn zo-btn-sm" onClick={() => onMonthChange(shiftMonth(month, 1))} title="Mes siguiente" aria-label="Mes siguiente"><ChevronRight size={14} /></button>
          {month !== today.slice(0, 7) && <button className="zo-btn zo-btn-sm zo-btn-ghost" onClick={() => onMonthChange(today.slice(0, 7))}>Hoy</button>}
        </div>
        {headerExtra}
      </div>

      <div className={`zo-cal-grid${loading ? ' loading' : ''}`}>
        {DOW_ES.map(d => <div key={d} className="zo-cal-dow">{d}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="zo-cal-cell empty" />;
          const list = byDate.get(date) ?? [];
          const extra = list.length - maxPerCell;
          return (
            <div
              key={i}
              className={`zo-cal-cell${date === today ? ' today' : ''}${selected === date ? ' selected' : ''}${onDayClick ? ' clickable' : ''}`}
              onClick={onDayClick ? () => onDayClick(date) : undefined}
            >
              <div className="zo-cal-daynum">
                <span>{Number(date.slice(8, 10))}</span>
                {onNew && (
                  <button className="zo-cal-add" title={newTitle} aria-label={`${newTitle} ${date}`} onClick={e => { e.stopPropagation(); onNew(date); }}>
                    <Plus size={12} />
                  </button>
                )}
              </div>
              <div className="zo-cal-items">
                {list.slice(0, maxPerCell).map(it => <Fragment key={getKey(it)}>{renderItem(it)}</Fragment>)}
                {extra > 0 && (
                  <button className="zo-cal-more" onClick={e => { e.stopPropagation(); onDayClick?.(date); }}>+{extra} más</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
