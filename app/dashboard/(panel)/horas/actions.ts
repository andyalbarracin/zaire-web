'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createTimeEntry, deleteTimeEntry } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s, sReq, b, hoursToMin, actionError } from '@/lib/zaire-ops/form';

export async function createTimeEntryAction(fd: FormData) {
  await requireUser();
  const client_id = sReq(fd, 'client_id');
  const minutes = hoursToMin(fd, 'hours') ?? 0;
  if (!client_id) redirect(`/dashboard/horas?err=${encodeURIComponent('Elegí un cliente.')}`);
  if (!(minutes > 0)) redirect(`/dashboard/horas?err=${encodeURIComponent('Cargá las horas (mayor a 0).')}`);

  try {
    await createTimeEntry({
      client_id,
      minutes,
      work_type: sReq(fd, 'work_type') || 'desarrollo',
      description: s(fd, 'description'),
      entry_date: sReq(fd, 'entry_date') || new Date().toISOString().slice(0, 10),
      billable: b(fd, 'billable'),
      included_in_plan: b(fd, 'included_in_plan'),
    });
  } catch (e) {
    redirect(`/dashboard/horas?err=${encodeURIComponent(actionError(e).error ?? 'No se pudo registrar.')}`);
  }
  revalidatePath('/dashboard/horas');
}

export async function deleteTimeEntryAction(id: string) {
  await requireUser();
  await deleteTimeEntry(id);
  revalidatePath('/dashboard/horas');
}
