// File: page.tsx — Detalle de factura (pagos, comprobantes, saldo, PDF)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInvoice, listPayments, liveInvoiceStatus, money, daysLate, PAYMENT_METHODS } from '@/lib/zaire-ops/billing';
import { listClients } from '@/lib/zaire-ops/queries';
import InvoiceFields from '@/app/dashboard/_components/invoice-fields';
import FormShell from '@/app/dashboard/_components/form-shell';
import ConfirmButton from '@/app/dashboard/_components/confirm-button';
import { updateInvoiceAction, anularInvoiceAction, addPaymentAction, markPaidAction, sendInvoiceAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function FacturaDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; err?: string }> }) {
  const { id } = await params;
  const { sent, err } = await searchParams;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const [clients, payments] = await Promise.all([listClients(), listPayments(id)]);
  const st = liveInvoiceStatus(invoice);
  const paid = invoice.paid ?? 0;
  const saldo = invoice.amount - paid;
  const moraActual = saldo > 0 ? daysLate(invoice.due_date) : 0; // días de mora corrientes sobre el saldo

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// {invoice.number ?? 'INVOICE'}</div>
          <h1 className="zo-h1">{invoice.concept}</h1>
          <div className="zo-sub" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className="zo-chip"><span className="zo-dot" style={{ background: st.color }} />{st.label}</span>
            <span className="zo-chip">{invoice.client?.name}</span>
            {invoice.due_date && <span className="zo-chip">Vence {invoice.due_date}</span>}
            {moraActual > 0 && <span className="zo-chip" style={{ background: 'rgba(231,29,10,.14)', color: '#ff6b5b' }}><span className="zo-dot" style={{ background: '#E71D0A' }} />{moraActual} día{moraActual === 1 ? '' : 's'} de mora</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {invoice.status !== 'anulada' && (
            <form action={sendInvoiceAction.bind(null, invoice.id)}><button className="zo-btn zo-btn-sm" type="submit">Enviar al cliente</button></form>
          )}
          <a href={`/dashboard/facturas-print?id=${invoice.id}`} target="_blank" rel="noopener noreferrer"><button className="zo-btn zo-btn-sm" type="button">Imprimir / PDF</button></a>
          <Link href={`/dashboard/facturas?client=${invoice.client_id}`}><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
        </div>
      </div>

      {sent && <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, background: 'rgba(34,197,94,.12)', border: '1px solid #22c55e', color: '#22c55e', fontSize: 13 }}>Solicitud de pago enviada al cliente por email. ✓</div>}
      {err && <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, background: 'rgba(231,29,10,.1)', border: '1px solid #E71D0A', color: '#ff6b5b', fontSize: 13 }}>{err}</div>}

      <div className="zo-kpis c3">
        <div className="zo-kpi"><div className="zo-kpi-n">{money(invoice.amount, invoice.currency)}</div><div className="zo-kpi-l">Monto</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n">{money(paid, invoice.currency)}</div><div className="zo-kpi-l">Pagado</div></div>
        <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: saldo > 0 ? '#FFC107' : '#22c55e' }}>{money(saldo, invoice.currency)}</div><div className="zo-kpi-l">Saldo</div></div>
      </div>

      {invoice.status !== 'anulada' && saldo > 0 && (
        <form action={markPaidAction.bind(null, invoice.id, invoice.client_id, invoice.currency, saldo)} style={{ marginBottom: 14 }}>
          <button className="zo-btn zo-btn-sm" type="submit">✓ Marcar como pagada</button>
        </form>
      )}

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
              <div className="zo-field"><label className="zo-flabel">Banco</label><input className="zo-input" name="bank" placeholder="Banco donde se acreditó" /></div>
            </div>
            <div className="zo-grid2">
              <div className="zo-field"><label className="zo-flabel">Comprobante (transferencia)</label><input className="zo-input" name="receipt" type="file" /></div>
              <div className="zo-field"><label className="zo-flabel">Factura (archivo)</label><input className="zo-input" name="invoice_file" type="file" /></div>
            </div>
            <input type="hidden" name="currency" value={invoice.currency} />
            <div className="zo-field"><label className="zo-flabel">Observaciones del pago</label><input className="zo-input" name="notes" placeholder="Referencia, nº de operación, detalle…" /></div>
            <div className="zo-form-actions"><button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">+ Registrar pago</button></div>
          </form>

          {payments.length > 0 && (
            <div className="zo-table-wrap" style={{ marginTop: 16 }}>
              <table className="zo-table">
                <thead><tr><th>Fecha</th><th>Método</th><th>Banco</th><th>Monto</th><th>Mora</th><th>Comprobante</th><th>Factura</th></tr></thead>
                <tbody>{payments.map(p => {
                  const mora = daysLate(invoice.due_date, p.paid_date);
                  return (
                    <tr key={p.id}>
                      <td className="zo-mono">{p.paid_date}</td>
                      <td>{p.method ?? '—'}</td>
                      <td>{p.bank ?? '—'}</td>
                      <td className="zo-mono">{money(p.amount, p.currency)}</td>
                      <td className="zo-mono" style={mora > 0 ? { color: '#ff6b5b' } : { color: '#22c55e' }}>{mora > 0 ? `${mora} d` : 'en fecha'}</td>
                      <td>{p.receipt_url ? <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="zo-rowlink">Ver →</a> : '—'}</td>
                      <td>{p.invoice_file_url ? <a href={p.invoice_file_url} target="_blank" rel="noopener noreferrer" className="zo-rowlink">Ver →</a> : '—'}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {invoice.status !== 'anulada' && (
        <div className="zo-card zo-section-gap">
          <div className="zo-card-title">// EDITAR INVOICE</div>
          <FormShell action={updateInvoiceAction.bind(null, invoice.id)} submitLabel="Guardar cambios">
            <InvoiceFields invoice={invoice} clients={clients} />
          </FormShell>
          <form action={anularInvoiceAction.bind(null, invoice.id)} style={{ marginTop: 12 }}><ConfirmButton message="¿Anular este invoice? Ya no se podrá cobrar.">Anular invoice</ConfirmButton></form>
        </div>
      )}
    </>
  );
}
