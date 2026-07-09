// File: page.tsx — Incidencias del cliente: lista + crear nueva.
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { listTickets } from '@/lib/zaire-ops/queries';
import { STATUS_LABEL, STATUS_COLOR, PRIORITY_LABEL } from '@/lib/zaire-ops/types';
import NewTicketForm from './new-ticket-form';

export const dynamic = 'force-dynamic';

export default async function PortalIncidencias({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { clientId, email } = await requirePortalClient();
  await logPortalEvent({ clientId, email, event: 'view_tickets' });
  const { ok } = await searchParams;
  const tickets = await listTickets({ clientId });

  return (
    <>
      <div className="zp-lbl">// INCIDENCIAS</div>
      <h1 className="zp-h1">Soporte</h1>
      {ok && <div className="zp-alert zp-alert-ok">Recibimos tu incidencia. Te contactamos a la brevedad. ✓</div>}

      <NewTicketForm />

      <h2 style={{ fontSize: 15, margin: '28px 0 12px', color: '#ccc' }}>Tus incidencias</h2>
      {tickets.length === 0 ? (
        <div className="zp-table-wrap"><div style={{ padding: 24, color: '#888' }}>Todavía no cargaste incidencias.</div></div>
      ) : (
        <div className="zp-table-wrap"><table className="zp-table">
          <thead><tr><th>Nº</th><th>Título</th><th>Prioridad</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>{tickets.map(t => (
            <tr key={t.id}>
              <td style={{ fontFamily: 'var(--fm,monospace)' }}>{t.ticket_number ?? '—'}</td>
              <td>{t.title}</td>
              <td>{PRIORITY_LABEL[t.priority]}</td>
              <td><span className="zp-chip"><span className="zp-dot" style={{ background: STATUS_COLOR[t.status] }} />{STATUS_LABEL[t.status]}</span></td>
              <td style={{ fontFamily: 'var(--fm,monospace)' }}>{new Date(t.created_at).toLocaleDateString('es-AR')}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
