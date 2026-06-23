// File: page.tsx — Clientes (lista)
import Link from 'next/link';
import { listClients } from '@/lib/zaire-ops/queries';
import { humanLabel } from '@/lib/zaire-ops/types';

export const dynamic = 'force-dynamic';

const SC: Record<string, string> = { activo: '#22c55e', pausado: '#FFC107', cerrado: '#6b7280' };

export default async function ClientesPage() {
  const clients = await listClients();
  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// OPERACIÓN</div>
          <h1 className="zo-h1">Clientes</h1>
          <div className="zo-sub">{clients.length} cliente(s)</div>
        </div>
        <Link href="/dashboard/clientes/nuevo"><button className="zo-btn zo-btn-primary">+ Nuevo cliente</button></Link>
      </div>

      {clients.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">
          Sin clientes todavía. <Link href="/dashboard/clientes/nuevo" style={{ color: '#FF6A00' }}>Agregá el primero →</Link>
        </div></div>
      ) : (
        <div className="zo-table-wrap">
          <table className="zo-table">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Plan</th><th>Horas/mes</th><th>Estado</th></tr></thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td><Link href={`/dashboard/clientes/${c.id}`} className="zo-rowlink">{c.name}</Link></td>
                  <td>{c.contact_name ?? '—'}</td>
                  <td>{c.plan ?? '—'}</td>
                  <td className="zo-mono">{c.monthly_support_hours ?? 0}h</td>
                  <td><span className="zo-chip"><span className="zo-dot" style={{ background: SC[c.status] }} />{humanLabel(c.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
