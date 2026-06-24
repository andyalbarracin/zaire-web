// File: page.tsx — Horas (registro + listado del mes)
import { listClients, listTimeEntries } from '@/lib/zaire-ops/queries';
import { WORK_TYPES, humanLabel, minutesToHours } from '@/lib/zaire-ops/types';
import { createTimeEntryAction, deleteTimeEntryAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function HorasPage() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const [clients, entries] = await Promise.all([listClients(), listTimeEntries({ from, to })]);
  const total = entries.reduce((sum, e) => sum + (e.minutes ?? 0), 0);
  const monthName = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// OPERACIÓN</div><h1 className="zo-h1">Horas</h1><div className="zo-sub">{monthName} · total {minutesToHours(total)}</div></div>
      </div>

      <div className="zo-card">
        <div className="zo-card-title">// REGISTRAR HORAS</div>
        {clients.length === 0 ? (
          <div className="zo-empty">Creá un cliente primero.</div>
        ) : (
          <form action={createTimeEntryAction} className="zo-form" style={{ maxWidth: '100%' }}>
            <div className="zo-grid2">
              <div className="zo-field"><label className="zo-flabel">Cliente *</label>
                <select className="zo-select" name="client_id" required defaultValue="">
                  <option value="" disabled>Elegí…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="zo-field"><label className="zo-flabel">Horas *</label><input className="zo-input" name="hours" type="number" min="0" step="0.25" required placeholder="1.5" /></div>
            </div>
            <div className="zo-grid2">
              <div className="zo-field"><label className="zo-flabel">Tipo</label>
                <select className="zo-select" name="work_type" defaultValue="desarrollo">{WORK_TYPES.map(w => <option key={w} value={w}>{humanLabel(w)}</option>)}</select>
              </div>
              <div className="zo-field"><label className="zo-flabel">Fecha</label><input className="zo-input" name="entry_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
            </div>
            <div className="zo-field"><label className="zo-flabel">Descripción</label><input className="zo-input" name="description" placeholder="Qué hiciste" /></div>
            <div className="zo-grid2">
              <label className="zo-checkbox"><input type="checkbox" name="included_in_plan" defaultChecked /> Dentro del plan</label>
              <label className="zo-checkbox"><input type="checkbox" name="billable" /> Facturable extra</label>
            </div>
            <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">+ Registrar</button></div>
          </form>
        )}
      </div>

      <div className="zo-section-gap">
        <div className="zo-card-title">// REGISTROS DEL MES</div>
        {entries.length === 0 ? (
          <div className="zo-table-wrap"><div className="zo-empty">Sin horas registradas este mes.</div></div>
        ) : (
          <div className="zo-table-wrap"><table className="zo-table">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Incidencia</th><th>Tipo</th><th>Descripción</th><th>Tiempo</th><th /></tr></thead>
            <tbody>{entries.map(e => (
              <tr key={e.id}>
                <td className="zo-mono">{e.entry_date}</td>
                <td>{e.client?.name ?? '—'}</td>
                <td className="zo-mono">{e.ticket?.ticket_number ?? '—'}</td>
                <td>{humanLabel(e.work_type)}</td>
                <td>{e.description ?? '—'}</td>
                <td className="zo-mono">{minutesToHours(e.minutes)}</td>
                <td><form action={deleteTimeEntryAction.bind(null, e.id)}><button className="zo-btn zo-btn-ghost zo-btn-sm" type="submit">Borrar</button></form></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
