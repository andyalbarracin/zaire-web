// File: page.tsx — Nueva incidencia
import Link from 'next/link';
import { listClients, listProjects } from '@/lib/zaire-ops/queries';
import TicketFields from '@/app/dashboard/_components/ticket-fields';
import { createTicketAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NuevoTicketPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const [clients, projects] = await Promise.all([listClients(), listProjects(client)]);

  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// INCIDENCIAS</div><h1 className="zo-h1">Nueva incidencia</h1></div>
        <Link href="/dashboard/tickets"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>
      {clients.length === 0 ? (
        <div className="zo-card"><div className="zo-empty">Primero creá un cliente. <Link href="/dashboard/clientes/nuevo" style={{ color: '#FF6A00' }}>Nuevo cliente →</Link></div></div>
      ) : (
        <form action={createTicketAction} className="zo-form">
          <TicketFields clients={clients} projects={projects} defaultClientId={client} />
          <div className="zo-form-actions">
            <button type="submit" className="zo-btn zo-btn-primary">Crear incidencia</button>
            <Link href="/dashboard/tickets"><button type="button" className="zo-btn">Cancelar</button></Link>
          </div>
        </form>
      )}
    </>
  );
}
