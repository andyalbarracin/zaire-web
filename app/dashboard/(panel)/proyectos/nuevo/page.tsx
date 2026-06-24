// File: page.tsx — Nuevo proyecto
import Link from 'next/link';
import { listClients } from '@/lib/zaire-ops/queries';
import ProjectFields from '@/app/dashboard/_components/project-fields';
import FormShell from '@/app/dashboard/_components/form-shell';
import { createProjectAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NuevoProyectoPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const clients = await listClients();
  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// PROYECTOS</div><h1 className="zo-h1">Nuevo proyecto</h1></div>
        <Link href="/dashboard/proyectos"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>
      {clients.length === 0 ? (
        <div className="zo-card"><div className="zo-empty">Primero creá un cliente. <Link href="/dashboard/clientes/nuevo" style={{ color: '#FF6A00' }}>Nuevo cliente →</Link></div></div>
      ) : (
        <FormShell action={createProjectAction} submitLabel="Crear proyecto" cancelHref="/dashboard/proyectos">
          <ProjectFields clients={clients} defaultClientId={client} />
        </FormShell>
      )}
    </>
  );
}
