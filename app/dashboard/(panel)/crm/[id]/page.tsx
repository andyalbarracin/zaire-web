// File: page.tsx — Ficha detallada de un lead del CRM (datos, archivos, log, investigar con IA).
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/zaire-ops/auth';
import { getLead, listStages, listLeadEvents } from '@/lib/zaire-ops/crm';
import { listProfiles } from '@/lib/zaire-ops/profiles';
import LeadDetail from './lead-detail';

export const dynamic = 'force-dynamic';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const [lead, stages, events, profiles] = await Promise.all([
    getLead(id), listStages(), listLeadEvents(id), listProfiles(),
  ]);
  if (!lead) notFound();
  const people = profiles.map(p => ({ id: p.id, name: p.full_name || p.email || 'Usuario' }));

  return <LeadDetail lead={lead} stages={stages} events={events} people={people} />;
}
