// File: invoice-fields.tsx — campos del formulario de factura (alta/edición)
import type { ZoClient } from '@/lib/zaire-ops/types';
import type { ZoInvoice } from '@/lib/zaire-ops/billing';

export default function InvoiceFields({ invoice, clients, defaultClientId }: { invoice?: ZoInvoice | null; clients: ZoClient[]; defaultClientId?: string }) {
  const i = invoice ?? undefined;
  return (
    <>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Cliente *</label>
          <select className="zo-select" name="client_id" required defaultValue={i?.client_id ?? defaultClientId ?? ''}>
            <option value="" disabled>Elegí…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="zo-field"><label className="zo-flabel">Concepto *</label><input className="zo-input" name="concept" required defaultValue={i?.concept ?? ''} placeholder="Setup SAS Trace / Mantenimiento Junio" /></div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Monto *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="zo-input" name="amount" type="number" min="0" step="0.01" required defaultValue={i?.amount ?? ''} placeholder="350" style={{ flex: 1 }} />
            <select className="zo-select" name="currency" defaultValue={i?.currency ?? 'USD'} style={{ width: 92 }}><option value="USD">USD</option><option value="ARS">ARS</option></select>
          </div>
        </div>
        <div className="zo-field"><label className="zo-flabel">Vencimiento</label><input className="zo-input" name="due_date" type="date" defaultValue={i?.due_date ?? ''} /></div>
      </div>
      <div className="zo-field"><label className="zo-flabel">Notas</label><textarea className="zo-textarea" name="notes" defaultValue={i?.notes ?? ''} placeholder="Detalle / período facturado…" /></div>
      {!invoice && (
        <div className="zo-field" style={{ maxWidth: 260 }}>
          <label className="zo-flabel">Dividir en cuotas</label>
          <input className="zo-input" name="installments" type="number" min="1" max="36" defaultValue="1" />
          <span style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Ej: monto 3000 en 3 cuotas = 3 invoices de 1000.</span>
        </div>
      )}
    </>
  );
}
