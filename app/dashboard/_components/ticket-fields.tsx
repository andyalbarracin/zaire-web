// File: ticket-fields.tsx — campos del formulario de incidencia (alta/edición)
import {
  TICKET_TYPES, TICKET_PRIORITIES, TICKET_STATUSES, TICKET_SOURCES,
  STATUS_LABEL, PRIORITY_LABEL, humanLabel,
  type ZoTicket, type ZoClient, type ZoProject,
} from '@/lib/zaire-ops/types';
import type { ZoProfile } from '@/lib/zaire-ops/profiles';
import { minToHours } from '@/lib/zaire-ops/form';

export default function TicketFields({
  ticket, clients, projects, members, defaultClientId, edit,
}: {
  ticket?: ZoTicket | null; clients: ZoClient[]; projects: ZoProject[]; members: ZoProfile[];
  defaultClientId?: string; edit?: boolean;
}) {
  const t = ticket ?? undefined;
  return (
    <>
      <div className="zo-field">
        <label className="zo-flabel">Título *</label>
        <input className="zo-input" name="title" required defaultValue={t?.title ?? ''} placeholder="Error al cargar imagen" />
      </div>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Cliente *</label>
          <select className="zo-select" name="client_id" required defaultValue={t?.client_id ?? defaultClientId ?? ''}>
            <option value="" disabled>Elegí…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="zo-field">
          <label className="zo-flabel">Proyecto</label>
          <select className="zo-select" name="project_id" defaultValue={t?.project_id ?? ''}>
            <option value="">— Ninguno —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.client?.name ? `${p.client.name} — ${p.name}` : p.name}</option>)}
          </select>
        </div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Tipo</label>
          <select className="zo-select" name="type" defaultValue={t?.type ?? 'soporte'}>
            {TICKET_TYPES.map(x => <option key={x} value={x}>{humanLabel(x)}</option>)}
          </select>
        </div>
        <div className="zo-field">
          <label className="zo-flabel">Prioridad</label>
          <select className="zo-select" name="priority" defaultValue={t?.priority ?? 'media'}>
            {TICKET_PRIORITIES.map(x => <option key={x} value={x}>{PRIORITY_LABEL[x]}</option>)}
          </select>
        </div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Estado</label>
          <select className="zo-select" name="status" defaultValue={t?.status ?? 'nueva'}>
            {TICKET_STATUSES.map(x => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}
          </select>
        </div>
        <div className="zo-field">
          <label className="zo-flabel">Asignado a</label>
          <select className="zo-select" name="assigned_to" defaultValue={t?.assigned_to ?? ''}>
            <option value="">— Sin asignar —</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>)}
          </select>
        </div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Canal</label>
          <select className="zo-select" name="source" defaultValue={t?.source ?? 'manual'}>
            {TICKET_SOURCES.map(x => <option key={x} value={x}>{humanLabel(x)}</option>)}
          </select>
        </div>
        <div className="zo-field">
          <label className="zo-flabel">Reportado por</label>
          <input className="zo-input" name="reported_by" defaultValue={t?.reported_by ?? ''} placeholder="Cliente / vos" />
        </div>
      </div>
      <div className="zo-field">
        <label className="zo-flabel">Descripción</label>
        <textarea className="zo-textarea" name="description" defaultValue={t?.description ?? ''} placeholder="Detalle del problema o pedido…" />
      </div>
      <div className="zo-grid2">
        <div className="zo-field"><label className="zo-flabel">Horas estimadas</label><input className="zo-input" name="estimated_hours" type="number" min="0" step="0.25" defaultValue={minToHours(t?.estimated_minutes)} placeholder="—" /></div>
        <div className="zo-field"><label className="zo-flabel">Horas reales</label><input className="zo-input" name="actual_hours" type="number" min="0" step="0.25" defaultValue={minToHours(t?.actual_minutes)} placeholder="—" /></div>
      </div>
      <div className="zo-grid2">
        <label className="zo-checkbox"><input type="checkbox" name="included_in_support" defaultChecked={t?.included_in_support ?? true} /> Incluida en soporte mensual</label>
        <label className="zo-checkbox"><input type="checkbox" name="billable_extra" defaultChecked={t?.billable_extra ?? false} /> Facturable extra</label>
      </div>
      {edit && (
        <div className="zo-field">
          <label className="zo-flabel">Resolución</label>
          <textarea className="zo-textarea" name="resolution" defaultValue={t?.resolution ?? ''} placeholder="Qué se hizo para resolver…" />
        </div>
      )}
    </>
  );
}
