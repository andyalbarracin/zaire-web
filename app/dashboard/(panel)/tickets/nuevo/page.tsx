// File: page.tsx — Nueva incidencia
import Link from 'next/link';
import { listClients, listProjects } from '@/lib/zaire-ops/queries';
import { listProfiles } from '@/lib/zaire-ops/profiles';
import TicketFields from '@/app/dashboard/_components/ticket-fields';
import FormShell from '@/app/dashboard/_components/form-shell';
import { createTicketAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NuevoTicketPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const [clients, projects, members] = await Promise.all([listClients(), listProjects(client), listProfiles()]);

  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// INCIDENCIAS</div><h1 className="zo-h1">Nueva incidencia</h1></div>
        <Link href="/dashboard/tickets"><button className="zo-btn zo-back">← Volver</button></Link>
      </div>
      {clients.length === 0 ? (
        <div className="zo-card"><div className="zo-empty">Primero creá un cliente. <Link href="/dashboard/clientes/nuevo" style={{ color: '#FF6A00' }}>Nuevo cliente →</Link></div></div>
      ) : (
        <FormShell action={createTicketAction} submitLabel="Crear incidencia" cancelHref="/dashboard/tickets">
          <TicketFields clients={clients} projects={projects} members={members} defaultClientId={client} />
        </FormShell>
      )}
    </>
  );
}
