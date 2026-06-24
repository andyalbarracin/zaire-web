// File: agreement-fields.tsx — campos del formulario de acuerdo (alta/edición)
import type { ZoClient } from '@/lib/zaire-ops/types';
import type { ZoAgreement } from '@/lib/zaire-ops/agreements';

export default function AgreementFields({ agreement, clients }: { agreement?: ZoAgreement | null; clients: ZoClient[] }) {
  const a = agreement ?? undefined;
  return (
    <>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Cliente *</label>
          <select className="zo-select" name="client_id" required defaultValue={a?.client_id ?? ''}>
            <option value="" disabled>Elegí…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="zo-field"><label className="zo-flabel">Nombre del proyecto *</label><input className="zo-input" name="project_name" required defaultValue={a?.project_name ?? ''} placeholder="SAS Trace" /></div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field"><label className="zo-flabel">Plan</label><input className="zo-input" name="plan" defaultValue={a?.plan ?? ''} placeholder="Zaire Intelligence — Opción B" /></div>
        <div className="zo-field"><label className="zo-flabel">Moneda</label><select className="zo-select" name="currency" defaultValue={a?.currency ?? 'USD'}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field"><label className="zo-flabel">Setup (pago único)</label><input className="zo-input" name="setup_fee" type="number" min="0" step="1" defaultValue={a?.setup_fee ?? ''} placeholder="3000" /></div>
        <div className="zo-field"><label className="zo-flabel">Mensual</label><input className="zo-input" name="monthly_fee" type="number" min="0" step="1" defaultValue={a?.monthly_fee ?? ''} placeholder="350" /></div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field"><label className="zo-flabel">Firmante (nombre)</label><input className="zo-input" name="signer_name" defaultValue={a?.signer_name ?? ''} placeholder="Andrés / Leo" /></div>
        <div className="zo-field"><label className="zo-flabel">Firmante (email)</label><input className="zo-input" name="signer_email" type="email" defaultValue={a?.signer_email ?? ''} placeholder="contacto@cliente.com" /></div>
      </div>
      <div className="zo-field">
        <label className="zo-flabel">Términos y condiciones {agreement ? '' : '· vacío = autogenerar desde los datos'}</label>
        <textarea className="zo-textarea" name="terms" defaultValue={a?.terms ?? ''} style={{ minHeight: 280, fontFamily: 'var(--fu)', fontSize: 13 }} placeholder="Dejalo vacío para autogenerar la plantilla, o escribí/pegá tus términos…" />
      </div>
    </>
  );
}
