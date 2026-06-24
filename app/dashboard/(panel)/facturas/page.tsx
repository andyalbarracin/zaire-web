// File: page.tsx — Invoices / solicitudes de pago (lista + estado de cuenta + cuentas por cobrar)
import Link from 'next/link';
import { listInvoices, clientAccount, receivables, liveInvoiceStatus, isOverdue, money } from '@/lib/zaire-ops/billing';
import { getClient } from '@/lib/zaire-ops/queries';
import RowLink from '@/app/dashboard/_components/row-link';

export const dynamic = 'force-dynamic';

const FILTERS: [string, string][] = [['', 'Todas'], ['porcobrar', 'Por cobrar'], ['vencidas', 'Vencidas'], ['pagadas', 'Pagadas']];

export default async function FacturasPage({ searchParams }: { searchParams: Promise<{ client?: string; filter?: string }> }) {
  const { client, filter } = await searchParams;
  const [invoices, account, cli, rec] = await Promise.all([
    listInvoices(client),
    client ? clientAccount(client) : Promise.resolve(null),
    client ? getClient(client) : Promise.resolve(null),
    client ? Promise.resolve(null) : receivables(),
  ]);

  const filtered = invoices.filter(i => {
    const saldo = i.amount - (i.paid ?? 0);
    if (filter === 'porcobrar') return i.status !== 'anulada' && saldo > 0;
    if (filter === 'vencidas') return isOverdue(i);
    if (filter === 'pagadas') return i.status !== 'anulada' && i.amount > 0 && (i.paid ?? 0) >= i.amount;
    return true;
  });

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// COMERCIAL</div>
          <h1 className="zo-h1">Invoices</h1>
          <div className="zo-sub">{cli ? `${cli.name} · ` : ''}{filtered.length} solicitud(es) de pago</div>
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

      {rec && (
        <div className="zo-kpis" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: rec.totalDue > 0 ? '#FFC107' : '#22c55e' }}>{money(rec.totalDue, rec.currency)}</div><div className="zo-kpi-l">Por cobrar (total)</div></div>
          <div className="zo-kpi"><div className="zo-kpi-n" style={{ color: rec.overdueDue > 0 ? '#E71D0A' : '#fff' }}>{money(rec.overdueDue, rec.currency)}</div><div className="zo-kpi-l">Vencido</div></div>
        </div>
      )}

      {!client && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          {FILTERS.map(([f, label]) => (
            <Link key={f || 'all'} href={`/dashboard/facturas${f ? `?filter=${f}` : ''}`}>
              <span className="zo-chip" style={(filter ?? '') === f ? { background: '#FF6A00', color: '#111' } : {}}>{label}</span>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">Sin invoices. <Link href="/dashboard/facturas/nuevo" style={{ color: '#FF6A00' }}>Creá el primero →</Link></div></div>
      ) : (
        <div className="zo-table-wrap"><table className="zo-table">
          <thead><tr><th>Número</th><th>Cliente</th><th>Concepto</th><th>Vence</th><th>Monto</th><th>Estado</th><th>Saldo</th></tr></thead>
          <tbody>{filtered.map(i => {
            const st = liveInvoiceStatus(i);
            const saldo = i.amount - (i.paid ?? 0);
            return (
              <RowLink key={i.id} href={`/dashboard/facturas/${i.id}`}>
                <td className="zo-mono">{i.number ?? '—'}</td>
                <td>{i.client?.name ?? '—'}</td>
                <td className="zo-rowlink">{i.concept}</td>
                <td className="zo-mono" style={isOverdue(i) ? { color: '#E71D0A' } : undefined}>{i.due_date ?? '—'}</td>
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
