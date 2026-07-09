// File: page.tsx — Finanzas del cliente: facturas, saldo, mora. Solo lectura.
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { listInvoices, liveInvoiceStatus, isOverdue, daysLate, money } from '@/lib/zaire-ops/billing';

export const dynamic = 'force-dynamic';

export default async function PortalFinanzas() {
  const { clientId, email } = await requirePortalClient();
  await logPortalEvent({ clientId, email, event: 'view_finance' });
  const invoices = await listInvoices(clientId);
  const cur = invoices[0]?.currency ?? 'USD';
  const saldo = invoices.filter(i => i.status !== 'anulada').reduce((s, i) => s + (i.amount - (i.paid ?? 0)), 0);

  return (
    <>
      <div className="zp-lbl">// FINANZAS</div>
      <h1 className="zp-h1">Tus facturas</h1>
      <div className="zp-cards">
        <div className="zp-card"><div className="zp-card-n" style={{ color: saldo > 0 ? '#FFC107' : '#22c55e' }}>{money(saldo, cur)}</div><div className="zp-card-l">Saldo pendiente</div></div>
      </div>
      {invoices.length === 0 ? (
        <div className="zp-table-wrap"><div style={{ padding: 24, color: '#888' }}>Todavía no hay facturas.</div></div>
      ) : (
        <div className="zp-table-wrap"><table className="zp-table">
          <thead><tr><th>Número</th><th>Concepto</th><th>Vence</th><th>Monto</th><th>Estado</th><th>Saldo</th><th>PDF</th></tr></thead>
          <tbody>{invoices.map(i => {
            const st = liveInvoiceStatus(i); const saldoI = i.amount - (i.paid ?? 0);
            const mora = saldoI > 0 && i.due_date ? daysLate(i.due_date) : 0;
            return (
              <tr key={i.id}>
                <td style={{ fontFamily: 'var(--fm,monospace)' }}>{i.number ?? '—'}</td>
                <td>{i.concept}{mora > 0 && <span className="zp-chip" style={{ marginLeft: 8, background: 'rgba(231,29,10,.14)', color: '#ff8a7d' }}>{mora} d mora</span>}</td>
                <td style={{ fontFamily: 'var(--fm,monospace)', color: isOverdue(i) ? '#ff8a7d' : undefined }}>{i.due_date ?? '—'}</td>
                <td style={{ fontFamily: 'var(--fm,monospace)' }}>{money(i.amount, i.currency)}</td>
                <td><span className="zp-chip"><span className="zp-dot" style={{ background: st.color }} />{st.label}</span></td>
                <td style={{ fontFamily: 'var(--fm,monospace)' }}>{i.status === 'anulada' ? '—' : money(saldoI, i.currency)}</td>
                <td><a className="zp-chip" href={`/portal/finanzas/${i.id}/print`} target="_blank" rel="noopener noreferrer">Ver →</a></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      )}
    </>
  );
}
