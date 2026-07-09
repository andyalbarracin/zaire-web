'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createPortalTicketAction } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return <button className="zp-btn zp-btn-primary" type="submit" disabled={pending}>{pending ? 'Enviando…' : 'Crear incidencia'}</button>;
}

export default function NewTicketForm() {
  const [state, action] = useActionState(createPortalTicketAction, {});
  return (
    <div className="zp-card">
      <form action={action}>
        <div className="zp-field"><label className="zp-flabel">Título</label><input className="zp-input" name="title" required placeholder="Resumen corto del problema" /></div>
        <div className="zp-field"><label className="zp-flabel">Descripción</label><textarea className="zp-textarea" name="description" required rows={4} placeholder="Contanos qué pasa, con el mayor detalle posible" /></div>
        <div className="zp-field" style={{ maxWidth: 220 }}><label className="zp-flabel">Prioridad</label>
          <select className="zp-select" name="priority" defaultValue="media"><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Crítica</option></select>
        </div>
        {state.error && <div className="zp-alert zp-alert-warn">{state.error}</div>}
        <Submit />
      </form>
    </div>
  );
}
