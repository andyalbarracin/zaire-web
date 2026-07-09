'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getLead, updateLead, deleteLead, leadStatus } from '@/lib/zaire-ops/leads';
import { createClient as dbCreateClient } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s } from '@/lib/zaire-ops/form';

export async function updateLeadStatusAction(id: string, fd: FormData) {
  await requireUser();
  await updateLead(id, { status: leadStatus(String(fd.get('status') ?? '')) });
  revalidatePath(`/dashboard/leads/${id}`);
}

export async function updateLeadNotesAction(id: string, fd: FormData) {
  await requireUser();
  await updateLead(id, { notes: s(fd, 'notes') });
  revalidatePath(`/dashboard/leads/${id}`);
}

export async function deleteLeadAction(id: string) {
  await requireUser();
  await deleteLead(id);
  redirect('/dashboard/leads');
}

// Convierte un lead en cliente (zo_clients) con los datos ya cargados, marca el
// lead como "ganado" y lo enlaza. Idempotente: si ya se convirtió, no duplica.
export async function convertLeadToClientAction(id: string) {
  await requireUser();
  const lead = await getLead(id);
  if (!lead) redirect('/dashboard/leads');
  if (lead.converted_client_id) redirect(`/dashboard/clientes/${lead.converted_client_id}`);

  const notesParts = [
    'Convertido desde lead del sitio.',
    lead.challenge ? `Desafío: ${lead.challenge}.` : '',
    lead.need ? `Necesidad: ${lead.need}.` : '',
    lead.ai_knowledge ? `Experiencia IA: ${lead.ai_knowledge}.` : '',
  ].filter(Boolean);

  const client = await dbCreateClient({
    name: lead.company || lead.name || lead.email,
    contact_name: lead.name,
    email: lead.email,
    whatsapp: lead.whatsapp,
    status: 'activo',
    currency: 'USD',
    notes: notesParts.join(' '),
  });

  await updateLead(id, { status: 'ganado', converted_client_id: client.id });
  redirect(`/dashboard/clientes/${client.id}`);
}
