// File: page.tsx — Nuevo proyecto
import Link from 'next/link';
import { listClients } from '@/lib/zaire-ops/queries';
import ProjectFields from '@/app/dashboard/_components/project-fields';
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
        <form action={createProjectAction} className="zo-form">
          <ProjectFields clients={clients} defaultClientId={client} />
          <div className="zo-form-actions">
            <button type="submit" className="zo-btn zo-btn-primary">Crear proyecto</button>
            <Link href="/dashboard/proyectos"><button type="button" className="zo-btn">Cancelar</button></Link>
          </div>
        </form>
      )}
    </>
  );
}
