// File: page.tsx — Proyectos (lista)
import Link from 'next/link';
import { listProjects } from '@/lib/zaire-ops/queries';
import { humanLabel } from '@/lib/zaire-ops/types';

export const dynamic = 'force-dynamic';
const SC: Record<string, string> = { activo: '#22c55e', pausado: '#FFC107', cerrado: '#6b7280', archivado: '#444' };

export default async function ProyectosPage() {
  const projects = await listProjects();
  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// OPERACIÓN</div><h1 className="zo-h1">Proyectos</h1><div className="zo-sub">{projects.length} proyecto(s)</div></div>
        <Link href="/dashboard/proyectos/nuevo"><button className="zo-btn zo-btn-primary">+ Nuevo proyecto</button></Link>
      </div>
      {projects.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">Sin proyectos todavía. <Link href="/dashboard/proyectos/nuevo" style={{ color: '#FF6A00' }}>Agregá el primero →</Link></div></div>
      ) : (
        <div className="zo-table-wrap"><table className="zo-table">
          <thead><tr><th>Proyecto</th><th>Cliente</th><th>Tipo</th><th>Fase</th><th>Estado</th></tr></thead>
          <tbody>{projects.map(p => (
            <tr key={p.id}>
              <td><Link href={`/dashboard/proyectos/${p.id}`} className="zo-rowlink">{p.name}</Link></td>
              <td>{p.client?.name ?? '—'}</td>
              <td className="zo-mono">{p.type}</td>
              <td>{p.phase ?? '—'}</td>
              <td><span className="zo-chip"><span className="zo-dot" style={{ background: SC[p.status] }} />{humanLabel(p.status)}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
