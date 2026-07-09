// File: page.tsx — Detalle + edición de cliente
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClient, listProjects, listTickets, clientHoursThisMonth } from '@/lib/zaire-ops/queries';
import ClientFields from '@/app/dashboard/_components/client-fields';
import FormShell from '@/app/dashboard/_components/form-shell';
import { updateClientAction } from '../actions';
import { STATUS_LABEL, STATUS_COLOR, minutesToHours } from '@/lib/zaire-ops/types';
import RowLink from '@/app/dashboard/_components/row-link';
import { clientAccount, listInvoices, liveInvoiceStatus, money } from '@/lib/zaire-ops/billing';
import { listClientUsers } from '@/lib/zaire-ops/portal';
import { listDocuments, DOC_TYPES, DOC_TYPE_LABEL } from '@/lib/zaire-ops/documents';
import { addPortalUserAction, removePortalUserAction, uploadDocumentAction, deleteDocumentAction } from '../actions';
import ConfirmButton from '@/app/dashboard/_components/confirm-button';

export const dynamic = 'force-dynamic';

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const [projects, tickets, account, invoices, hours, portalUsers, documents] = await Promise.all([
    listProjects(id), listTickets({ clientId: id }), clientAccount(id), listInvoices(id), clientHoursThisMonth(id),
    listClientUsers(id), listDocuments(id),
  ]);
  const monthName = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// CLIENTE</div>
          <h1 className="zo-h1">{client.name}</h1>
          <div className="zo-sub">{client.plan ?? 'Sin plan'} · {client.monthly_support_hours}h/mes incluidas</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/dashboard/facturas?client=${client.id}`}><button className="zo-btn zo-btn-sm">Invoices</button></Link>
          <Link href={`/dashboard/reportes?client=${client.id}`}><button className="zo-btn zo-btn-sm">Reporte</button></Link>
          <Link href="/dashboard/clientes"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
        </div>
      </div>

      <div className="zo-kpis c3">
        <div className="zo-kpi accent"><div className="zo-kpi-n">{tickets.length}</div><div className="zo-kpi-l">Incidencias</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n">{projects.length}</div><div className="zo-kpi-l">Proyectos</div></div>
        <div className="zo-kpi"><div className="zo-kpi-n">{client.monthly_support_hours}h</div><div className="zo-kpi-l">Horas incluidas/mes</div></div>
      </div>

      <div className="zo-card">
        <div className="zo-card-title">// HORAS DE SOPORTE · {monthName}</div>
        <div className="zo-kpis c3" style={{ margin: 0 }}>
          <div className="zo-kpi"><div className="zo-kpi-n">{minutesToHours(hours.includedMin)}</div><div className="zo-kpi-l">Incluidas</div></div>
          <div className="zo-kpi"><div className="zo-kpi-n" style={{ color: hours.consumedMin > hours.includedMin ? '#FFC107' : '#fff' }}>{minutesToHours(hours.consumedMin)}</div><div className="zo-kpi-l">Consumidas</div></div>
          <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: hours.extraMin > 0 ? '#E71D0A' : '#22c55e' }}>{minutesToHours(hours.extraMin)}</div><div className="zo-kpi-l">Extra facturable</div></div>
        </div>
        {hours.extraMin > 0 && (
          <p style={{ marginTop: 14, fontSize: 13, color: '#aaa' }}>
            Consumió {minutesToHours(hours.extraMin)} por encima del plan este mes.{' '}
            <Link href={`/dashboard/facturas/nuevo?client=${client.id}`} style={{ color: '#FF6A00' }}>Generar invoice por horas extra →</Link>
          </p>
        )}
      </div>

      <div className="zo-card">
        <div className="zo-card-title">// EDITAR CLIENTE</div>
        <FormShell action={updateClientAction.bind(null, client.id)} submitLabel="Guardar cambios">
          <ClientFields client={client} />
        </FormShell>
      </div>

      <div className="zo-section-gap">
        <div className="zo-pagehead">
          <div className="zo-card-title">// ESTADO DE CUENTA</div>
          <Link href={`/dashboard/facturas/nuevo?client=${client.id}`}><button className="zo-btn zo-btn-sm">+ Invoice</button></Link>
        </div>
        <div className="zo-kpis c3">
          <div className="zo-kpi"><div className="zo-kpi-n">{money(account.invoiced, account.currency)}</div><div className="zo-kpi-l">Facturado</div></div>
          <div className="zo-kpi"><div className="zo-kpi-n">{money(account.paid, account.currency)}</div><div className="zo-kpi-l">Pagado</div></div>
          <div className="zo-kpi accent"><div className="zo-kpi-n" style={{ color: account.balance > 0 ? '#FFC107' : '#22c55e' }}>{money(account.balance, account.currency)}</div><div className="zo-kpi-l">Saldo / deuda</div></div>
        </div>
        {invoices.length === 0 ? (
          <div className="zo-table-wrap"><div className="zo-empty">Sin invoices. <Link href={`/dashboard/facturas/nuevo?client=${client.id}`} style={{ color: '#FF6A00' }}>Crear invoice →</Link></div></div>
        ) : (
          <div className="zo-table-wrap"><table className="zo-table">
            <thead><tr><th>Número</th><th>Concepto</th><th>Monto</th><th>Estado</th><th>Saldo</th></tr></thead>
            <tbody>{invoices.map(i => {
              const st = liveInvoiceStatus(i);
              const saldo = i.amount - (i.paid ?? 0);
              return (
                <RowLink key={i.id} href={`/dashboard/facturas/${i.id}`}>
                  <td className="zo-mono">{i.number ?? '—'}</td>
                  <td className="zo-rowlink">{i.concept}</td>
                  <td className="zo-mono">{money(i.amount, i.currency)}</td>
                  <td><span className="zo-chip"><span className="zo-dot" style={{ background: st.color }} />{st.label}</span></td>
                  <td className="zo-mono">{i.status === 'anulada' ? '—' : money(saldo, i.currency)}</td>
                </RowLink>
              );
            })}</tbody>
          </table></div>
        )}
      </div>

      <div className="zo-section-gap">
        <div className="zo-pagehead">
          <div className="zo-card-title">// INCIDENCIAS DEL CLIENTE</div>
          <Link href={`/dashboard/tickets/nuevo?client=${client.id}`}><button className="zo-btn zo-btn-sm">+ Incidencia</button></Link>
        </div>
        {tickets.length === 0 ? (
          <div className="zo-table-wrap"><div className="zo-empty">Sin incidencias para este cliente.</div></div>
        ) : (
          <div className="zo-table-wrap"><table className="zo-table">
            <thead><tr><th>ID</th><th>Título</th><th>Estado</th></tr></thead>
            <tbody>{tickets.map(t => (
              <RowLink key={t.id} href={`/dashboard/tickets/${t.id}`}>
                <td className="zo-mono">{t.ticket_number ?? '—'}</td>
                <td className="zo-rowlink">{t.title}</td>
                <td><span className="zo-chip"><span className="zo-dot" style={{ background: STATUS_COLOR[t.status] }} />{STATUS_LABEL[t.status]}</span></td>
              </RowLink>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// ACCESO AL PORTAL</div>
        <form action={addPortalUserAction.bind(null, client.id)} className="zo-form" style={{ maxWidth: '100%' }}>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Email autorizado</label><input className="zo-input" name="email" type="email" placeholder="cliente@empresa.com" /></div>
            <div className="zo-field" style={{ alignSelf: 'end' }}><button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">+ Autorizar</button></div>
          </div>
        </form>
        {portalUsers.length > 0 && (
          <div className="zo-table-wrap" style={{ marginTop: 12 }}>
            <table className="zo-table"><thead><tr><th>Email</th><th>Alta</th><th></th></tr></thead>
              <tbody>{portalUsers.map(u => (
                <tr key={u.id}><td>{u.email}</td><td className="zo-mono">{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                  <td><form action={removePortalUserAction.bind(null, client.id, u.id)}><ConfirmButton message="¿Quitar el acceso de este email?">Quitar</ConfirmButton></form></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// DOCUMENTOS DEL CLIENTE</div>
        <form action={uploadDocumentAction.bind(null, client.id)} className="zo-form" style={{ maxWidth: '100%' }}>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Título</label><input className="zo-input" name="title" placeholder="Handoff — SAS Trace" /></div>
            <div className="zo-field"><label className="zo-flabel">Tipo</label><select className="zo-select" name="type" defaultValue="handoff">{DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>)}</select></div>
          </div>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Archivo</label><input className="zo-input" name="file" type="file" /></div>
            <div className="zo-field" style={{ alignSelf: 'end' }}><label style={{ fontSize: 12, color: '#aaa' }}><input type="checkbox" name="visible" defaultChecked /> Visible para el cliente</label></div>
          </div>
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary zo-btn-sm" type="submit">+ Subir documento</button></div>
        </form>
        {documents.length > 0 && (
          <div className="zo-table-wrap" style={{ marginTop: 12 }}>
            <table className="zo-table"><thead><tr><th>Título</th><th>Tipo</th><th>Visible</th><th>Archivo</th><th></th></tr></thead>
              <tbody>{documents.map(d => (
                <tr key={d.id}><td>{d.title}</td><td>{DOC_TYPE_LABEL[d.type]}</td><td>{d.visible_to_client ? 'Sí' : 'No'}</td>
                  <td><a href={d.file_url} target="_blank" rel="noopener noreferrer" className="zo-rowlink">Ver →</a></td>
                  <td><form action={deleteDocumentAction.bind(null, client.id, d.id)}><ConfirmButton message="¿Borrar este documento?">Borrar</ConfirmButton></form></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
