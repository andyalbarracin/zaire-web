// File: page.tsx — Detalle + edición de proyecto
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject, listClients, listTickets } from '@/lib/zaire-ops/queries';
import ProjectFields from '@/app/dashboard/_components/project-fields';
import { updateProjectAction } from '../actions';
import { STATUS_LABEL, STATUS_COLOR } from '@/lib/zaire-ops/types';

export const dynamic = 'force-dynamic';

export default async function ProyectoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [clients, tickets] = await Promise.all([listClients(), listTickets({ clientId: project.client_id })]);
  const projectTickets = tickets.filter(t => t.project_id === project.id);

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// PROYECTO</div>
          <h1 className="zo-h1">{project.name}</h1>
          <div className="zo-sub">{project.client?.name} · {project.type}{project.phase ? ` · ${project.phase}` : ''}</div>
        </div>
        <Link href="/dashboard/proyectos"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>

      <div className="zo-card">
        <div className="zo-card-title">// EDITAR PROYECTO</div>
        <form action={updateProjectAction.bind(null, project.id)} className="zo-form">
          <ProjectFields project={project} clients={clients} />
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">Guardar cambios</button></div>
        </form>
      </div>

      <div className="zo-section-gap">
        <div className="zo-card-title">// INCIDENCIAS DEL PROYECTO</div>
        {projectTickets.length === 0 ? (
          <div className="zo-table-wrap"><div className="zo-empty">Sin incidencias asociadas a este proyecto.</div></div>
        ) : (
          <div className="zo-table-wrap"><table className="zo-table">
            <thead><tr><th>ID</th><th>Título</th><th>Estado</th></tr></thead>
            <tbody>{projectTickets.map(t => (
              <tr key={t.id}>
                <td className="zo-mono">{t.ticket_number ?? '—'}</td>
                <td><Link href={`/dashboard/tickets/${t.id}`} className="zo-rowlink">{t.title}</Link></td>
                <td><span className="zo-chip"><span className="zo-dot" style={{ background: STATUS_COLOR[t.status] }} />{STATUS_LABEL[t.status]}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
