// File: page.tsx — PDF de factura del portal (verifica que sea del cliente logueado).
import { notFound } from 'next/navigation';
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { getInvoice, liveInvoiceStatus, money } from '@/lib/zaire-ops/billing';
import PrintButton from '@/app/dashboard/reportes-print/print-button';

export const dynamic = 'force-dynamic';
const lbl: React.CSSProperties = { fontFamily: 'monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', marginBottom: 4 };

export default async function PortalInvoicePrint({ params }: { params: Promise<{ id: string }> }) {
  const { clientId, email } = await requirePortalClient();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice || invoice.client_id !== clientId) notFound();
  await logPortalEvent({ clientId, email, event: 'download_invoice', entityType: 'invoice', entityId: id });

  const st = liveInvoiceStatus(invoice);
  const paid = invoice.paid ?? 0; const saldo = invoice.amount - paid;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111' }}>
      <div className="zo-noprint" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #eee' }}><PrintButton /></div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 28 }}>
          <div><div style={{ fontSize: 20, fontWeight: 900 }}>ZAIRE</div><div style={{ ...lbl, color: '#FF6A00' }}>Invoice · Solicitud de pago</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{invoice.number ?? '—'}</div><div style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>{invoice.issue_date}</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28, fontSize: 13 }}>
          <div><div style={lbl}>De</div>ZAIRE — Intelligent Operations Studio<br />zairetech.com</div>
          <div><div style={lbl}>Para</div>{invoice.client?.name ?? '—'}</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee', marginBottom: 20 }}>
          <thead><tr><th style={{ textAlign: 'left', padding: '10px 12px', ...lbl, borderBottom: '1px solid #eee' }}>Concepto</th><th style={{ textAlign: 'right', padding: '10px 12px', ...lbl, borderBottom: '1px solid #eee' }}>Monto</th></tr></thead>
          <tbody><tr><td style={{ padding: 12, fontSize: 13.5 }}>{invoice.concept}</td><td style={{ padding: 12, fontSize: 13.5, textAlign: 'right', fontWeight: 700 }}>{money(invoice.amount, invoice.currency)}</td></tr></tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ fontSize: 13 }}><tbody>
            <tr><td style={{ padding: '4px 16px 4px 0', color: '#888' }}>Total</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{money(invoice.amount, invoice.currency)}</td></tr>
            <tr><td style={{ padding: '4px 16px 4px 0', color: '#888' }}>Pagado</td><td style={{ textAlign: 'right' }}>{money(paid, invoice.currency)}</td></tr>
            <tr><td style={{ padding: '8px 16px 4px 0', fontWeight: 700, borderTop: '1px solid #eee' }}>Saldo</td><td style={{ textAlign: 'right', fontWeight: 700, borderTop: '1px solid #eee', color: saldo > 0 ? '#c0392b' : '#1c7a3f' }}>{money(saldo, invoice.currency)}</td></tr>
          </tbody></table>
        </div>
        <div style={{ marginTop: 16, ...lbl }}>Estado: {st.label}</div>
        <div style={{ marginTop: 28, fontSize: 11, color: '#888', fontStyle: 'italic', background: '#faf9f6', border: '1px solid #eee', borderRadius: 6, padding: '12px 14px' }}>
          Este documento es una <strong>solicitud de pago</strong> y no constituye una factura fiscal (ARCA), que se emite por separado.
        </div>
      </div>
    </div>
  );
}
