// File: page.tsx — Detalle de solicitud de pago: generar invoice, facturación, pagos.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getInvoice, listPayments, liveInvoiceStatus, facturacionStatus, money, daysLate, PAYMENT_METHODS } from '@/lib/zaire-ops/billing';
import { listClients } from '@/lib/zaire-ops/queries';
import InvoiceFields from '@/app/dashboard/_components/invoice-fields';
import FormShell from '@/app/dashboard/_components/form-shell';
import ConfirmButton from '@/app/dashboard/_components/confirm-button';
import FileDrop from '@/app/dashboard/_components/file-drop';
import SendInvoiceButton from '@/app/dashboard/_components/send-invoice-button';
import { updateInvoiceAction, anularInvoiceAction, addPaymentAction, editPaymentAction, deletePaymentAction, markPaidAction, sendInvoiceAction, setInvoicingAction } from '../actions';

export const dynamic = 'force-dynamic';

const okBanner = (msg: string) => (
  <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, background: 'rgba(34,197,94,.12)', border: '1px solid #22c55e', color: '#22c55e', fontSize: 13 }}>{msg}</div>
);

export default async function FacturaDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string; err?: string; psaved?: string; pdeleted?: string; fsaved?: string }> }) {
  const { id } = await params;
  const { sent, err, psaved, pdeleted, fsaved } = await searchParams;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const [clients, payments] = await Promise.all([listClients(), listPayments(id)]);
  const client = clients.find(c => c.id === invoice.client_id);
  const st = liveInvoiceStatus(invoice);
  const fst = facturacionStatus(invoice);
  const paid = invoice.paid ?? 0;
  const saldo = invoice.amount - paid;
  const moraActual = saldo > 0 ? daysLate(invoice.due_date) : 0;
  const activa = invoice.status !== 'anulada';

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// {invoice.number ?? 'SOLICITUD DE PAGO'}</div>
          <h1 className="zo-h1">{invoice.concept}</h1>
          <div className="zo-sub" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className="zo-chip"><span className="zo-dot" style={{ background: st.color }} />{st.label}</span>
            <span className="zo-chip"><span className="zo-dot" style={{ background: fst.color }} />{fst.label}</span>
            <span className="zo-chip">{invoice.client?.name}</span>
            {invoice.due_date && <span className="zo-chip">Vence {invoice.due_date}</span>}
            {moraActual > 0 && <span className="zo-chip" style={{ background: 'rgba(231,29,10,.14)', color: '#ff6b5b' }}><span className="zo-dot" style={{ background: '#E71D0A' }} />{moraActual} día{moraActual === 1 ? '' : 's'} de mora</span>}
          </div>
        </div>
        <Link href={`/dashboard/facturas?client=${invoice.client_id}`}><button className="zo-btn zo-back">← Volver</button></Link>
      </div>

      {sent && okBanner('Solicitud de pago enviada al cliente por email. ✓')}
      {psaved && okBanner('Pago guardado. ✓')}
      {pdeleted && okBanner('Pago eliminado. ✓')}
      {fsaved && okBanner('Facturación actualizada. ✓')}
      {err && <div style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 16, background: 'rgba(231,29,10,.1)', border: '1px solid #E71D0A', color: '#ff6b5b', fontSize: 13 }}>{err}</div>}

      {/* KPIs stack (cuando está anulada, a lo ancho) */}
      {!activa && (
        <div className="zo-kpis c3">
          <div className="zo-kpi"><div className="zo-kpi-n">{money(invoice.amount, invoice.currency)}</div><div className="zo-kpi-l">Monto</div></div>
          <div className="zo-kpi"><div className="zo-kpi-n">{money(paid, invoice.currency)}</div><div className="zo-kpi-l">Pagado</div></div>
          <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: saldo > 0 ? '#FFC107' : '#22c55e' }}>{money(saldo, invoice.currency)}</div><div className="zo-kpi-l">Saldo</div></div>
        </div>
      )}

      {/* 1 ── GENERAR INVOICE (izq) + KPIs (der) ──────────────── */}
      {activa && (
        <div className="zo-2col">
          <div className="zo-card">
            <div className="zo-card-title">// GENERAR INVOICE</div>
            <div className="zo-sub" style={{ fontSize: 12, marginBottom: 14 }}>Definí los datos de la solicitud de pago. Con “Imprimir / PDF” generás el documento.</div>
            <FormShell
              action={updateInvoiceAction.bind(null, invoice.id)}
              submitLabel="Guardar cambios"
              extra={<a href={`/dashboard/facturas-print?id=${invoice.id}`} target="_blank" rel="noopener noreferrer"><button type="button" className="zo-btn">Imprimir / PDF</button></a>}
            >
              <InvoiceFields invoice={invoice} clients={clients} />
            </FormShell>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
              <SendInvoiceButton
                action={sendInvoiceAction.bind(null, invoice.id)}
                clientEmail={client?.email ?? null}
                clientName={invoice.client?.name ?? ''}
                number={invoice.number ?? '—'}
                concept={invoice.concept}
                dueDate={invoice.due_date}
                amountLabel={money(invoice.amount, invoice.currency)}
                saldoLabel={money(saldo, invoice.currency)}
              />
              <form action={anularInvoiceAction.bind(null, invoice.id)}><ConfirmButton message="¿Anular esta solicitud? Ya no se podrá cobrar.">Anular solicitud</ConfirmButton></form>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="zo-kpi"><div className="zo-kpi-n">{money(invoice.amount, invoice.currency)}</div><div className="zo-kpi-l">Monto</div></div>
            <div className="zo-kpi"><div className="zo-kpi-n">{money(paid, invoice.currency)}</div><div className="zo-kpi-l">Pagado</div></div>
            <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: saldo > 0 ? '#FFC107' : '#22c55e' }}>{money(saldo, invoice.currency)}</div><div className="zo-kpi-l">Saldo</div></div>
          </div>
        </div>
      )}

      {/* 2 ── FACTURACIÓN ─────────────────────────────────────── */}
      {activa && (
        <div className="zo-card zo-section-gap">
          <div className="zo-card-title">// FACTURACIÓN (FISCAL / ARCA)</div>
          <div className="zo-sub" style={{ fontSize: 12, marginBottom: 14 }}>Independiente del pago. Los cambios se guardan solo al presionar “Guardar facturación”.</div>
          <form action={setInvoicingAction.bind(null, invoice.id)} className="zo-form" style={{ maxWidth: '100%' }}>
            <div className="zo-grid3">
              <div className="zo-field"><label className="zo-flabel">Nº de factura fiscal</label><input className="zo-input" name="fiscal_number" defaultValue={invoice.fiscal_number ?? ''} placeholder="A-0001-00001234" /></div>
              <div className="zo-field"><label className="zo-flabel">Fecha de facturación</label><input className="zo-input" name="invoiced_at" type="date" defaultValue={invoice.invoiced_at ?? ''} /></div>
              <div className="zo-field" style={{ justifyContent: 'flex-end' }}><label className="zo-checkbox"><input type="checkbox" name="invoiced" defaultChecked={invoice.invoiced} /> Facturada (emitida)</label></div>
              <div className="zo-field zo-span3">
                <FileDrop name="invoice_file" label="Archivo de factura fiscal" hint="PDF o imagen · hasta 50MB" />
                {invoice.invoice_file_url && <a href={invoice.invoice_file_url} target="_blank" rel="noopener noreferrer" className="zo-rowlink" style={{ fontSize: 12, marginTop: 6 }}>Ver factura actual →</a>}
              </div>
            </div>
            <div className="zo-form-actions"><button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">Guardar facturación</button></div>
          </form>
        </div>
      )}

      {/* 3 ── REGISTRAR PAGO ──────────────────────────────────── */}
      {activa && (
        <div className="zo-card zo-section-gap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="zo-card-title" style={{ marginBottom: 0 }}>// REGISTRAR PAGO</div>
            {saldo > 0 && <form action={markPaidAction.bind(null, invoice.id, invoice.client_id, invoice.currency, saldo)}><button className="zo-btn zo-btn-sm" type="submit">✓ Marcar como pagada</button></form>}
          </div>
          <form action={addPaymentAction.bind(null, invoice.id, invoice.client_id)} className="zo-form" style={{ maxWidth: '100%', marginTop: 14 }}>
            <div className="zo-grid3">
              <div className="zo-field"><label className="zo-flabel">Monto *</label><input className="zo-input" name="amount" type="number" min="0" step="0.01" required defaultValue={saldo > 0 ? saldo : ''} /></div>
              <div className="zo-field"><label className="zo-flabel">Fecha</label><input className="zo-input" name="paid_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
              <div className="zo-field"><label className="zo-flabel">Método</label><select className="zo-select" name="method" defaultValue="Transferencia">{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div className="zo-field"><label className="zo-flabel">Banco</label><input className="zo-input" name="bank" placeholder="Banco donde se acreditó" /></div>
              <div className="zo-field zo-span2"><label className="zo-flabel">Observaciones del pago</label><input className="zo-input" name="notes" placeholder="Referencia, nº de operación, detalle…" /></div>
              <div className="zo-field zo-span3"><FileDrop name="receipt" label="Comprobante (transferencia)" hint="PDF o imagen · hasta 50MB" /></div>
            </div>
            <input type="hidden" name="currency" value={invoice.currency} />
            <div className="zo-form-actions"><button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">+ Registrar pago</button></div>
          </form>

          {payments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {payments.map(p => {
                const mora = daysLate(invoice.due_date, p.paid_date);
                return (
                  <div key={p.id} style={{ border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 13 }}>
                        <span className="zo-mono">{p.paid_date}</span>
                        <span className="zo-mono" style={{ fontWeight: 700 }}>{money(p.amount, p.currency)}</span>
                        <span className="zo-chip">{p.method ?? '—'}</span>
                        {p.bank && <span style={{ color: '#aaa' }}>{p.bank}</span>}
                        <span className="zo-mono" style={mora > 0 ? { color: '#ff6b5b' } : { color: '#22c55e' }}>{mora > 0 ? `${mora} d mora` : 'en fecha'}</span>
                        {p.receipt_url && <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="zo-rowlink">Comprobante →</a>}
                        {p.notes && <span style={{ color: '#888' }}>· {p.notes}</span>}
                      </div>
                      <form action={deletePaymentAction.bind(null, p.id, invoice.id)}><ConfirmButton message="¿Eliminar este pago? Se recalcula el saldo.">Eliminar</ConfirmButton></form>
                    </div>
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ cursor: 'pointer', fontSize: 12, color: '#888' }}>Editar pago</summary>
                      <form action={editPaymentAction.bind(null, p.id, invoice.id)} className="zo-form" style={{ maxWidth: '100%', marginTop: 10 }}>
                        <div className="zo-grid3">
                          <div className="zo-field"><label className="zo-flabel">Monto *</label><input className="zo-input" name="amount" type="number" min="0" step="0.01" required defaultValue={p.amount} /></div>
                          <div className="zo-field"><label className="zo-flabel">Fecha</label><input className="zo-input" name="paid_date" type="date" defaultValue={p.paid_date} /></div>
                          <div className="zo-field"><label className="zo-flabel">Método</label><select className="zo-select" name="method" defaultValue={p.method ?? 'Transferencia'}>{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                          <div className="zo-field"><label className="zo-flabel">Banco</label><input className="zo-input" name="bank" defaultValue={p.bank ?? ''} /></div>
                          <div className="zo-field zo-span2"><label className="zo-flabel">Observaciones</label><input className="zo-input" name="notes" defaultValue={p.notes ?? ''} /></div>
                          <div className="zo-field zo-span3"><FileDrop name="receipt" label="Reemplazar comprobante (opcional)" hint="PDF o imagen · hasta 50MB" /></div>
                        </div>
                        <div className="zo-form-actions"><button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">Guardar cambios del pago</button></div>
                      </form>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
