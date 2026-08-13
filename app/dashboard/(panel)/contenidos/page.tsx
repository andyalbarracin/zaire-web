// File: page.tsx — Content deck (gestor de contenidos): tabla + kanban por estado.
import { requireUser } from '@/lib/zaire-ops/auth';
import { listContentStages, listContentItems } from '@/lib/zaire-ops/content';
import ContentBoard from './board';

export const dynamic = 'force-dynamic';

export default async function ContenidosPage() {
  await requireUser();
  const [stages, items] = await Promise.all([listContentStages(), listContentItems()]);

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// MARKETING</div>
          <h1 className="zo-h1">Contenidos</h1>
          <div className="zo-sub">{items.length} contenido(s) · {stages.length} estado(s)</div>
        </div>
      </div>

      <ContentBoard initialStages={stages} initialItems={items} />
    </>
  );
}
