// File: page.tsx — Detalle de un invoice en el portal del cliente (solo lectura).
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { getInvoice, listPayments, liveInvoiceStatus, facturacionStatus, money, daysLate } from '@/lib/zaire-ops/billing';

export const dynamic = 'force-dynamic';

export default async function PortalInvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { clientId, email } = await requirePortalClient();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice || invoice.client_id !== clientId) notFound();
  await logPortalEvent({ clientId, email, event: 'view_invoice', entityType: 'invoice', entityId: id });

  const payments = await listPayments(id);
  const st = liveInvoiceStatus(invoice);
  const fst = facturacionStatus(invoice);
  const paid = invoice.paid ?? 0;
  const saldo = invoice.amount - paid;
  const mora = saldo > 0 ? daysLate(invoice.due_date) : 0;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="zp-lbl">// {invoice.number ?? 'INVOICE'}</div>
          <h1 className="zp-h1">{invoice.concept}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className="zp-chip"><span className="zp-dot" style={{ background: st.color }} />{st.label}</span>
            <span className="zp-chip"><span className="zp-dot" style={{ background: fst.color }} />{invoice.invoiced ? 'Facturada' : 'Sin facturar'}</span>
            {invoice.due_date && <span className="zp-chip">Vence {invoice.due_date}</span>}
            {mora > 0 && <span className="zp-chip" style={{ background: 'rgba(231,29,10,.14)', color: '#ff8a7d' }}>{mora} d de mora</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="zp-btn" href={`/portal/finanzas/${invoice.id}/print`} target="_blank" rel="noopener noreferrer">Ver solicitud (PDF)</a>
          {invoice.invoice_file_url && <a className="zp-btn zp-btn-primary" href={invoice.invoice_file_url} target="_blank" rel="noopener noreferrer">Descargar factura</a>}
          <Link className="zp-btn" href="/portal/finanzas">← Volver</Link>
        </div>
      </div>

      <div className="zp-cards" style={{ marginTop: 24 }}>
        <div className="zp-card"><div className="zp-card-n">{money(invoice.amount, invoice.currency)}</div><div className="zp-card-l">Monto</div></div>
        <div className="zp-card"><div className="zp-card-n">{money(paid, invoice.currency)}</div><div className="zp-card-l">Pagado</div></div>
        <div className="zp-card"><div className="zp-card-n" style={{ color: saldo > 0 ? '#FFC107' : '#22c55e' }}>{money(saldo, invoice.currency)}</div><div className="zp-card-l">Saldo</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div className="zp-card">
          <div className="zp-lbl" style={{ marginBottom: 10 }}>Detalle</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #161616', fontSize: 13.5 }}><span style={{ color: '#888' }}>Emitida</span><span>{invoice.issue_date}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #161616', fontSize: 13.5 }}><span style={{ color: '#888' }}>Vencimiento</span><span>{invoice.due_date ?? '—'}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #161616', fontSize: 13.5 }}><span style={{ color: '#888' }}>Facturación</span><span>{invoice.invoiced ? `Facturada${invoice.fiscal_number ? ` · ${invoice.fiscal_number}` : ''}` : 'Sin facturar'}</span></div>
          {invoice.notes && <div style={{ padding: '10px 0', fontSize: 13, color: '#bbb', whiteSpace: 'pre-wrap' }}>{invoice.notes}</div>}
        </div>

        <div className="zp-card">
          <div className="zp-lbl" style={{ marginBottom: 10 }}>Pagos registrados</div>
          {payments.length === 0 ? (
            <div style={{ fontSize: 13, color: '#777' }}>Todavía no hay pagos registrados.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {payments.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5, padding: '6px 0', borderBottom: '1px solid #161616' }}>
                  <span style={{ fontFamily: 'var(--fm,monospace)' }}>{p.paid_date}</span>
                  <span>{p.method ?? '—'}</span>
                  <span style={{ fontFamily: 'var(--fm,monospace)', fontWeight: 700 }}>{money(p.amount, p.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
