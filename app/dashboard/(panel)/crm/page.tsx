// File: page.tsx — CRM de marketing: tablero kanban de leads (import CSV/XLS, dnd, etapas editables).
import { requireUser } from '@/lib/zaire-ops/auth';
import { listStages, listLeads } from '@/lib/zaire-ops/crm';
import CrmBoard from './board';

export const dynamic = 'force-dynamic';

export default async function CrmPage() {
  await requireUser();
  const [stages, leads] = await Promise.all([listStages(), listLeads()]);

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// MARKETING</div>
          <h1 className="zo-h1">CRM</h1>
          <div className="zo-sub">{leads.length} lead(s) · {stages.length} etapa(s)</div>
        </div>
      </div>

      <CrmBoard initialStages={stages} initialLeads={leads} />
    </>
  );
}
