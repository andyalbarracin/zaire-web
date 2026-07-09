// File: page.tsx — Inicio del portal: resumen + log del acceso.
import Link from 'next/link';
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { getClient, listTickets } from '@/lib/zaire-ops/queries';
import { listInvoices, money, daysLate } from '@/lib/zaire-ops/billing';
import { listDocuments } from '@/lib/zaire-ops/documents';
import { OPEN_STATUSES } from '@/lib/zaire-ops/types';

export const dynamic = 'force-dynamic';

export default async function PortalHome() {
  const { clientId, email } = await requirePortalClient();
  await logPortalEvent({ clientId, email, event: 'login' });

  const [client, invoices, tickets, docs] = await Promise.all([
    getClient(clientId), listInvoices(clientId), listTickets({ clientId }), listDocuments(clientId, true),
  ]);
  const saldo = invoices.filter(i => i.status !== 'anulada').reduce((s, i) => s + (i.amount - (i.paid ?? 0)), 0);
  const overdue = invoices.filter(i => i.status !== 'anulada' && (i.paid ?? 0) < i.amount && i.due_date && daysLate(i.due_date) > 0);
  const openTickets = tickets.filter(t => OPEN_STATUSES.includes(t.status)).length;
  const cur = invoices[0]?.currency ?? client?.currency ?? 'USD';

  return (
    <>
      <div className="zp-lbl">// PORTAL</div>
      <h1 className="zp-h1">Hola, {client?.contact_name ?? client?.name}</h1>
      <div className="zp-sub">Este es tu espacio en ZAIRE.</div>

      {overdue.length > 0 && (
        <div className="zp-alert zp-alert-warn">
          Tenés {overdue.length} factura(s) con pagos vencidos. Revisá <Link href="/portal/finanzas" style={{ color: '#ff8a7d', textDecoration: 'underline' }}>Finanzas</Link>.
        </div>
      )}

      <div className="zp-cards">
        <div className="zp-card"><div className="zp-card-n" style={{ color: saldo > 0 ? '#FFC107' : '#22c55e' }}>{money(saldo, cur)}</div><div className="zp-card-l">Saldo pendiente</div></div>
        <div className="zp-card"><div className="zp-card-n">{openTickets}</div><div className="zp-card-l">Incidencias abiertas</div></div>
        <div className="zp-card"><div className="zp-card-n">{docs.length}</div><div className="zp-card-l">Documentos</div></div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link className="zp-btn" href="/portal/finanzas">Ver finanzas →</Link>
        <Link className="zp-btn" href="/portal/documentos">Ver documentos →</Link>
        <Link className="zp-btn zp-btn-primary" href="/portal/incidencias">Nueva incidencia →</Link>
      </div>
    </>
  );
}
