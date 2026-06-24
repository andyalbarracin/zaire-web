// File: page.tsx — Invoices / solicitudes de pago (lista + estado de cuenta)
import Link from 'next/link';
import { listInvoices, clientAccount, liveInvoiceStatus, money } from '@/lib/zaire-ops/billing';
import { getClient } from '@/lib/zaire-ops/queries';
import RowLink from '@/app/dashboard/_components/row-link';

export const dynamic = 'force-dynamic';

export default async function FacturasPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const [invoices, account, cli] = await Promise.all([
    listInvoices(client),
    client ? clientAccount(client) : Promise.resolve(null),
    client ? getClient(client) : Promise.resolve(null),
  ]);

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// COMERCIAL</div>
          <h1 className="zo-h1">Invoices</h1>
          <div className="zo-sub">{cli ? `${cli.name} · ` : ''}{invoices.length} solicitud(es) de pago</div>
        </div>
        <Link href={`/dashboard/facturas/nuevo${client ? `?client=${client}` : ''}`}><button className="zo-btn zo-btn-primary">+ Nuevo invoice</button></Link>
      </div>

      {account && (
        <div className="zo-kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="zo-kpi"><div className="zo-kpi-n">{money(account.invoiced, account.currency)}</div><div className="zo-kpi-l">Facturado</div></div>
          <div className="zo-kpi"><div className="zo-kpi-n">{money(account.paid, account.currency)}</div><div className="zo-kpi-l">Pagado</div></div>
          <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: account.balance > 0 ? '#FFC107' : '#22c55e' }}>{money(account.balance, account.currency)}</div><div className="zo-kpi-l">Saldo / deuda</div></div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">Sin invoices. <Link href="/dashboard/facturas/nuevo" style={{ color: '#FF6A00' }}>Creá el primero →</Link></div></div>
      ) : (
        <div className="zo-table-wrap"><table className="zo-table">
          <thead><tr><th>Número</th><th>Cliente</th><th>Concepto</th><th>Monto</th><th>Estado</th><th>Saldo</th></tr></thead>
          <tbody>{invoices.map(i => {
            const st = liveInvoiceStatus(i);
            const saldo = i.amount - (i.paid ?? 0);
            return (
              <RowLink key={i.id} href={`/dashboard/facturas/${i.id}`}>
                <td className="zo-mono">{i.number ?? '—'}</td>
                <td>{i.client?.name ?? '—'}</td>
                <td className="zo-rowlink">{i.concept}</td>
                <td className="zo-mono">{money(i.amount, i.currency)}</td>
                <td><span className="zo-chip"><span className="zo-dot" style={{ background: st.color }} />{st.label}</span></td>
                <td className="zo-mono">{i.status === 'anulada' ? '—' : money(saldo, i.currency)}</td>
              </RowLink>
            );
          })}</tbody>
        </table></div>
      )}
    </>
  );
}
