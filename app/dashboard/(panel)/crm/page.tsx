// File: page.tsx — CRM de marketing: kanban de leads (import CSV/XLS, dnd, etapas editables)
// o calendario de actividades (?view=calendar&m=YYYY-MM).
import { requireUser } from '@/lib/zaire-ops/auth';
import { listStages, listLeads, listPendingActivities } from '@/lib/zaire-ops/crm';
import { listProfiles } from '@/lib/zaire-ops/profiles';
import { todayLocal } from '@/lib/zaire-ops/dates';
import CrmBoard from './board';

export const dynamic = 'force-dynamic';

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ view?: string; m?: string }> }) {
  const user = await requireUser();
  const { view, m } = await searchParams;
  const [stages, leads, pending, profiles] = await Promise.all([
    listStages(), listLeads(), listPendingActivities(), listProfiles(),
  ]);
  const people = profiles.map(p => ({ id: p.id, name: p.full_name || p.email || 'Usuario' }));
  const month = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : todayLocal().slice(0, 7);
  const today = todayLocal();
  const overdue = pending?.filter(a => a.due_date < today).length ?? 0;
  const dueToday = pending?.filter(a => a.due_date === today).length ?? 0;

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// MARKETING</div>
          <h1 className="zo-h1">CRM</h1>
          <div className="zo-sub">
            {leads.length} lead(s) · {stages.length} etapa(s)
            {pending && ` · ${dueToday} tarea(s) hoy`}
            {overdue > 0 && <span style={{ color: '#ff8a7d' }}> · {overdue} vencida(s)</span>}
          </div>
        </div>
      </div>

      <CrmBoard
        initialStages={stages}
        initialLeads={leads}
        pending={pending}
        people={people}
        meId={user.id}
        initialView={view === 'calendar' ? 'calendar' : 'board'}
        initialMonth={month}
      />
    </>
  );
}
