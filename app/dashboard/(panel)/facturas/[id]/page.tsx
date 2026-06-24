// File: page.tsx — Detalle de factura (pagos, comprobantes, saldo, PDF)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInvoice, listPayments, liveInvoiceStatus, money, PAYMENT_METHODS } from '@/lib/zaire-ops/billing';
import { listClients } from '@/lib/zaire-ops/queries';
import InvoiceFields from '@/app/dashboard/_components/invoice-fields';
import { updateInvoiceAction, anularInvoiceAction, addPaymentAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function FacturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const [clients, payments] = await Promise.all([listClients(), listPayments(id)]);
  const st = liveInvoiceStatus(invoice);
  const paid = invoice.paid ?? 0;
  const saldo = invoice.amount - paid;

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// {invoice.number ?? 'FACTURA'}</div>
          <h1 className="zo-h1">{invoice.concept}</h1>
          <div className="zo-sub" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className="zo-chip"><span className="zo-dot" style={{ background: st.color }} />{st.label}</span>
            <span className="zo-chip">{invoice.client?.name}</span>
            {invoice.due_date && <span className="zo-chip">Vence {invoice.due_date}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`/dashboard/facturas-print?id=${invoice.id}`} target="_blank" rel="noopener noreferrer"><button className="zo-btn zo-btn-sm" type="button">Imprimir / PDF</button></a>
          <Link href={`/dashboard/facturas?client=${invoice.client_id}`}><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
        </div>
      </div>

      <div className="zo-kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="zo-kpi"><div className="zo-kpi-n">{money(invoice.amount, invoice.currency)}</div><div className="zo-kpi-l">Monto</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n">{money(paid, invoice.currency)}</div><div className="zo-kpi-l">Pagado</div></div>
        <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: saldo > 0 ? '#FFC107' : '#22c55e' }}>{money(saldo, invoice.currency)}</div><div className="zo-kpi-l">Saldo</div></div>
      </div>

      {invoice.status !== 'anulada' && (
        <div className="zo-card">
          <div className="zo-card-title">// REGISTRAR PAGO / COMPROBANTE</div>
          <form action={addPaymentAction.bind(null, invoice.id, invoice.client_id)} className="zo-form" style={{ maxWidth: '100%' }}>
            <div className="zo-grid2">
              <div className="zo-field"><label className="zo-flabel">Monto *</label><input className="zo-input" name="amount" type="number" min="0" step="0.01" required defaultValue={saldo > 0 ? saldo : ''} /></div>
              <div className="zo-field"><label className="zo-flabel">Fecha</label><input className="zo-input" name="paid_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
            </div>
            <div className="zo-grid2">
              <div className="zo-field"><label className="zo-flabel">Método</label><select className="zo-select" name="method" defaultValue="Transferencia">{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div className="zo-field"><label className="zo-flabel">Comprobante (archivo)</label><input className="zo-input" name="receipt" type="file" /></div>
            </div>
            <input type="hidden" name="currency" value={invoice.currency} />
            <div className="zo-field"><label className="zo-flabel">Notas</label><input className="zo-input" name="notes" placeholder="Referencia, banco…" /></div>
            <div className="zo-form-actions"><button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">+ Registrar pago</button></div>
          </form>

          {payments.length > 0 && (
            <div className="zo-table-wrap" style={{ marginTop: 16 }}>
              <table className="zo-table">
                <thead><tr><th>Fecha</th><th>Método</th><th>Monto</th><th>Comprobante</th></tr></thead>
                <tbody>{payments.map(p => (
                  <tr key={p.id}><td className="zo-mono">{p.paid_date}</td><td>{p.method ?? '—'}</td><td className="zo-mono">{money(p.amount, p.currency)}</td><td>{p.receipt_url ? <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="zo-rowlink">Ver →</a> : '—'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {invoice.status !== 'anulada' && (
        <div className="zo-card zo-section-gap">
          <div className="zo-card-title">// EDITAR FACTURA</div>
          <form action={updateInvoiceAction.bind(null, invoice.id)} className="zo-form">
            <InvoiceFields invoice={invoice} clients={clients} />
            <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">Guardar cambios</button></div>
          </form>
          <form action={anularInvoiceAction.bind(null, invoice.id)} style={{ marginTop: 12 }}><button className="zo-btn zo-btn-ghost zo-btn-sm" type="submit">Anular factura</button></form>
        </div>
      )}
    </>
  );
}
