// File: client-fields.tsx
// Path: zaire-web/app/dashboard/_components/client-fields.tsx
// Description: Campos del formulario de cliente (compartido alta/edición).

import { CLIENT_STATUSES, humanLabel, type ZoClient } from '@/lib/zaire-ops/types';

export default function ClientFields({ client }: { client?: ZoClient | null }) {
  const c = client ?? undefined;
  return (
    <>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Nombre *</label>
          <input className="zo-input" name="name" required defaultValue={c?.name ?? ''} placeholder="SAS Supplier" />
        </div>
        <div className="zo-field">
          <label className="zo-flabel">Contacto principal</label>
          <input className="zo-input" name="contact_name" defaultValue={c?.contact_name ?? ''} placeholder="Andrés / Leo" />
        </div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Email</label>
          <input className="zo-input" name="email" type="email" defaultValue={c?.email ?? ''} placeholder="contacto@empresa.com" />
        </div>
        <div className="zo-field">
          <label className="zo-flabel">WhatsApp</label>
          <input className="zo-input" name="whatsapp" defaultValue={c?.whatsapp ?? ''} placeholder="+54..." />
        </div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Plan / acuerdo</label>
          <input className="zo-input" name="plan" defaultValue={c?.plan ?? ''} placeholder="Mantenimiento mensual" />
        </div>
        <div className="zo-field">
          <label className="zo-flabel">Estado</label>
          <select className="zo-select" name="status" defaultValue={c?.status ?? 'activo'}>
            {CLIENT_STATUSES.map(st => <option key={st} value={st}>{humanLabel(st)}</option>)}
          </select>
        </div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Horas incluidas / mes</label>
          <input className="zo-input" name="monthly_support_hours" type="number" step="0.5" min="0" defaultValue={c?.monthly_support_hours ?? 0} />
        </div>
        <div className="zo-field">
          <label className="zo-flabel">Fee mensual</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="zo-input" name="monthly_fee" type="number" step="1" min="0" defaultValue={c?.monthly_fee ?? ''} placeholder="0" style={{ flex: 1 }} />
            <select className="zo-select" name="currency" defaultValue={c?.currency ?? 'USD'} style={{ width: 92 }}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
        </div>
      </div>
      <div className="zo-field">
        <label className="zo-flabel">Notas</label>
        <textarea className="zo-textarea" name="notes" defaultValue={c?.notes ?? ''} placeholder="Detalles del contrato, contexto operativo..." />
      </div>
    </>
  );
}
