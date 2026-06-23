// File: project-fields.tsx — campos del formulario de proyecto (alta/edición)
import { PROJECT_STATUSES, PROJECT_TYPES, humanLabel, type ZoProject, type ZoClient } from '@/lib/zaire-ops/types';

export default function ProjectFields({
  project, clients, defaultClientId,
}: { project?: ZoProject | null; clients: ZoClient[]; defaultClientId?: string }) {
  const p = project ?? undefined;
  const selected = p?.client_id ?? defaultClientId ?? '';
  return (
    <>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Cliente *</label>
          <select className="zo-select" name="client_id" required defaultValue={selected}>
            <option value="" disabled>Elegí un cliente…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="zo-field">
          <label className="zo-flabel">Nombre del proyecto *</label>
          <input className="zo-input" name="name" required defaultValue={p?.name ?? ''} placeholder="SAS Trace" />
        </div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field">
          <label className="zo-flabel">Tipo</label>
          <select className="zo-select" name="type" defaultValue={p?.type ?? 'Custom App'}>
            {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="zo-field">
          <label className="zo-flabel">Estado</label>
          <select className="zo-select" name="status" defaultValue={p?.status ?? 'activo'}>
            {PROJECT_STATUSES.map(st => <option key={st} value={st}>{humanLabel(st)}</option>)}
          </select>
        </div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field"><label className="zo-flabel">Fase</label><input className="zo-input" name="phase" defaultValue={p?.phase ?? ''} placeholder="Fase 1" /></div>
        <div className="zo-field"><label className="zo-flabel">Stack</label><input className="zo-input" name="stack" defaultValue={p?.stack ?? ''} placeholder="Next.js, Supabase, Vercel" /></div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field"><label className="zo-flabel">URL producción</label><input className="zo-input" name="production_url" defaultValue={p?.production_url ?? ''} placeholder="https://app..." /></div>
        <div className="zo-field"><label className="zo-flabel">Repositorio</label><input className="zo-input" name="repository_url" defaultValue={p?.repository_url ?? ''} placeholder="https://github.com/..." /></div>
      </div>
      <div className="zo-grid2">
        <div className="zo-field"><label className="zo-flabel">URL staging</label><input className="zo-input" name="staging_url" defaultValue={p?.staging_url ?? ''} /></div>
        <div className="zo-field"><label className="zo-flabel">Próximo hito</label><input className="zo-input" name="next_milestone" defaultValue={p?.next_milestone ?? ''} placeholder="Entrega de reportes" /></div>
      </div>
      <div className="zo-field"><label className="zo-flabel">Notas</label><textarea className="zo-textarea" name="notes" defaultValue={p?.notes ?? ''} /></div>
    </>
  );
}
