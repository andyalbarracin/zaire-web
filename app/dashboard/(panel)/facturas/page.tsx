// File: page.tsx — Invoices / solicitudes de pago (lista + estado de cuenta + cuentas por cobrar)
import Link from 'next/link';
import { listInvoices, clientAccount, receivables, liveInvoiceStatus, isOverdue, money } from '@/lib/zaire-ops/billing';
import { getClient } from '@/lib/zaire-ops/queries';
import RowLink from '@/app/dashboard/_components/row-link';

export const dynamic = 'force-dynamic';

const FILTERS: [string, string][] = [['', 'Todas'], ['porcobrar', 'Por cobrar'], ['vencidas', 'Vencidas'], ['pagadas', 'Pagadas']];
const PAGE_SIZE = 15;

// Arma un href a /dashboard/facturas conservando los params activos.
function hrefWith(base: { client?: string; filter?: string; q?: string; page?: number }): string {
  const sp = new URLSearchParams();
  if (base.client) sp.set('client', base.client);
  if (base.filter) sp.set('filter', base.filter);
  if (base.q) sp.set('q', base.q);
  if (base.page && base.page > 1) sp.set('page', String(base.page));
  const qs = sp.toString();
  return `/dashboard/facturas${qs ? `?${qs}` : ''}`;
}

export default async function FacturasPage({ searchParams }: { searchParams: Promise<{ client?: string; filter?: string; q?: string; page?: string }> }) {
  const { client, filter, q, page } = await searchParams;
  const [invoices, account, cli, rec] = await Promise.all([
    listInvoices(client),
    client ? clientAccount(client) : Promise.resolve(null),
    client ? getClient(client) : Promise.resolve(null),
    client ? Promise.resolve(null) : receivables(),
  ]);

  const term = (q ?? '').trim().toLowerCase();
  const filtered = invoices.filter(i => {
    const saldo = i.amount - (i.paid ?? 0);
    if (filter === 'porcobrar' && !(i.status !== 'anulada' && saldo > 0)) return false;
    if (filter === 'vencidas' && !isOverdue(i)) return false;
    if (filter === 'pagadas' && !(i.status !== 'anulada' && i.amount > 0 && (i.paid ?? 0) >= i.amount)) return false;
    if (term) {
      const hay = `${i.number ?? ''} ${i.concept} ${i.client?.name ?? ''}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

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
        <div className="zo-kpis c3">
          <div className="zo-kpi"><div className="zo-kpi-n">{money(account.invoiced, account.currency)}</div><div className="zo-kpi-l">Facturado</div></div>
          <div className="zo-kpi"><div className="zo-kpi-n">{money(account.paid, account.currency)}</div><div className="zo-kpi-l">Pagado</div></div>
          <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: account.balance > 0 ? '#FFC107' : '#22c55e' }}>{money(account.balance, account.currency)}</div><div className="zo-kpi-l">Saldo / deuda</div></div>
        </div>
      )}

      {rec && (
        <div className="zo-kpis c2">
          <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: rec.totalDue > 0 ? '#FFC107' : '#22c55e' }}>{money(rec.totalDue, rec.currency)}</div><div className="zo-kpi-l">Por cobrar (total)</div></div>
          <div className="zo-kpi"><div className="zo-kpi-n" style={{ color: rec.overdueDue > 0 ? '#E71D0A' : '#fff' }}>{money(rec.overdueDue, rec.currency)}</div><div className="zo-kpi-l">Vencido</div></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        {!client ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(([f, label]) => (
              <Link key={f || 'all'} href={hrefWith({ client, filter: f || undefined, q })}>
                <span className="zo-chip" style={(filter ?? '') === f ? { background: '#FF6A00', color: '#111' } : {}}>{label}</span>
              </Link>
            ))}
          </div>
        ) : <span />}
        <form method="get" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {client && <input type="hidden" name="client" value={client} />}
          {filter && <input type="hidden" name="filter" value={filter} />}
          <input className="zo-input" name="q" defaultValue={q ?? ''} placeholder="Buscar nº, concepto o cliente…" style={{ minWidth: 240, padding: '7px 12px', fontSize: 12 }} />
          <button className="zo-btn zo-btn-sm" type="submit">Buscar</button>
          {term && <Link href={hrefWith({ client, filter })}><span className="zo-chip">Limpiar ✕</span></Link>}
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">{term ? 'Sin resultados para tu búsqueda.' : <>Sin invoices. <Link href="/dashboard/facturas/nuevo" style={{ color: '#FF6A00' }}>Creá el primero →</Link></>}</div></div>
      ) : (
        <div className="zo-table-wrap"><table className="zo-table">
          <thead><tr><th>Número</th><th>Cliente</th><th>Concepto</th><th>Vence</th><th>Monto</th><th>Estado</th><th>Saldo</th></tr></thead>
          <tbody>{pageItems.map(i => {
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 18 }}>
          {current > 1
            ? <Link href={hrefWith({ client, filter, q, page: current - 1 })}><span className="zo-chip">← Anterior</span></Link>
            : <span className="zo-chip" style={{ opacity: .35 }}>← Anterior</span>}
          <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: '#888', letterSpacing: '.06em' }}>Página {current} de {totalPages}</span>
          {current < totalPages
            ? <Link href={hrefWith({ client, filter, q, page: current + 1 })}><span className="zo-chip">Siguiente →</span></Link>
            : <span className="zo-chip" style={{ opacity: .35 }}>Siguiente →</span>}
        </div>
      )}
    </>
  );
}
