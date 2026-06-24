// File: page.tsx — Factura imprimible (PDF vía navegador). Sin shell, fondo blanco.
import { requireUser } from '@/lib/zaire-ops/auth';
import { getInvoice, liveInvoiceStatus, money } from '@/lib/zaire-ops/billing';
import PrintButton from '@/app/dashboard/reportes-print/print-button';

export const dynamic = 'force-dynamic';
const lbl: React.CSSProperties = { fontFamily: 'monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', marginBottom: 4 };

export default async function FacturaPrintPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireUser();
  const { id } = await searchParams;
  if (!id) return <div style={{ background: '#fff', minHeight: '100vh', color: '#111', padding: 48 }}>Falta la factura.</div>;
  const invoice = await getInvoice(id);
  if (!invoice) return <div style={{ background: '#fff', minHeight: '100vh', color: '#111', padding: 48 }}>Factura no encontrada.</div>;

  const st = liveInvoiceStatus(invoice);
  const paid = invoice.paid ?? 0;
  const saldo = invoice.amount - paid;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111' }}>
      <div className="zo-noprint" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <a href={`/dashboard/facturas/${invoice.id}`} style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>← Volver</a>
        <PrintButton />
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'sans-serif', fontSize: 20, fontWeight: 900 }}>ZAIRE</div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#FF6A00' }}>Invoice · Solicitud de pago</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}>{invoice.number ?? '—'}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>{invoice.issue_date}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28, fontSize: 13 }}>
          <div><div style={lbl}>De</div>ZAIRE — Intelligent Operations Studio<br />Buenos Aires, Argentina<br />zairetech.com</div>
          <div><div style={lbl}>Para</div>{invoice.client?.name ?? '—'}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee', marginBottom: 20 }}>
          <thead><tr><th style={{ textAlign: 'left', padding: '10px 12px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', borderBottom: '1px solid #eee' }}>Concepto</th><th style={{ textAlign: 'right', padding: '10px 12px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', borderBottom: '1px solid #eee' }}>Monto</th></tr></thead>
          <tbody><tr><td style={{ padding: '12px', fontSize: 13.5 }}>{invoice.concept}</td><td style={{ padding: '12px', fontSize: 13.5, textAlign: 'right', fontWeight: 700 }}>{money(invoice.amount, invoice.currency)}</td></tr></tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ fontSize: 13 }}>
            <tbody>
              <tr><td style={{ padding: '4px 16px 4px 0', color: '#888' }}>Total</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{money(invoice.amount, invoice.currency)}</td></tr>
              <tr><td style={{ padding: '4px 16px 4px 0', color: '#888' }}>Pagado</td><td style={{ textAlign: 'right' }}>{money(paid, invoice.currency)}</td></tr>
              <tr><td style={{ padding: '8px 16px 4px 0', color: '#111', fontWeight: 700, borderTop: '1px solid #eee' }}>Saldo</td><td style={{ textAlign: 'right', fontWeight: 700, borderTop: '1px solid #eee', color: saldo > 0 ? '#c0392b' : '#1c7a3f' }}>{money(saldo, invoice.currency)}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, fontFamily: 'monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#888' }}>Estado: {st.label}</div>
        {invoice.notes && <p style={{ marginTop: 16, fontSize: 12.5, color: '#555', whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>}
        <div style={{ marginTop: 28, fontSize: 11, color: '#888', fontStyle: 'italic', lineHeight: 1.6, background: '#faf9f6', border: '1px solid #eee', borderRadius: 6, padding: '12px 14px' }}>
          Este documento es una <strong>solicitud de pago</strong> y no constituye una factura fiscal/contable. La factura fiscal correspondiente (ARCA) se emite por separado.
        </div>
        <div style={{ marginTop: 24, fontFamily: 'monospace', fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', borderTop: '1px solid #eee', paddingTop: 14 }}>Documento generado por Zaire Ops · zairetech.com</div>
      </div>
    </div>
  );
}
