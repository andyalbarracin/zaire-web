// File: page.tsx — Ficha detallada de un lead del CRM (datos, archivos, actividades, log, investigar con IA).
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/zaire-ops/auth';
import { getLead, listStages, listLeadEvents, listLeadActivities } from '@/lib/zaire-ops/crm';
import { listProfiles } from '@/lib/zaire-ops/profiles';
import LeadDetail from './lead-detail';

export const dynamic = 'force-dynamic';
// La "Investigación con IA" (búsqueda web + extracción + análisis) puede tardar: más margen
// que el default para evitar 504 (aplica en Vercel Pro; en Hobby el tope sigue siendo ~10s).
export const maxDuration = 60;

// "Volver" regresa a la vista de origen (ej. el calendario en un mes dado); solo rutas del CRM.
const BACK_RE = /^\/dashboard\/crm(\?[\w=&%.-]*)?$/;

export default async function LeadDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const user = await requireUser();
  const [{ id }, { back }] = await Promise.all([params, searchParams]);
  const [lead, stages, events, profiles, activities] = await Promise.all([
    getLead(id), listStages(), listLeadEvents(id), listProfiles(), listLeadActivities(id),
  ]);
  if (!lead) notFound();
  const people = profiles.map(p => ({ id: p.id, name: p.full_name || p.email || 'Usuario' }));
  const backHref = back && BACK_RE.test(back) ? back : '/dashboard/crm';

  return (
    <LeadDetail
      lead={lead} stages={stages} events={events} people={people}
      activities={activities} meId={user.id} backHref={backHref}
    />
  );
}
