'use server';

import { revalidatePath } from 'next/cache';
import { createTimeEntry, deleteTimeEntry } from '@/lib/zaire-ops/queries';
import { s, sReq, n, b } from '@/lib/zaire-ops/form';

export async function createTimeEntryAction(fd: FormData) {
  await createTimeEntry({
    client_id: sReq(fd, 'client_id'),
    minutes: n(fd, 'minutes'),
    work_type: sReq(fd, 'work_type') || 'desarrollo',
    description: s(fd, 'description'),
    entry_date: sReq(fd, 'entry_date') || new Date().toISOString().slice(0, 10),
    billable: b(fd, 'billable'),
    included_in_plan: b(fd, 'included_in_plan'),
  });
  revalidatePath('/dashboard/horas');
}

export async function deleteTimeEntryAction(id: string) {
  await deleteTimeEntry(id);
  revalidatePath('/dashboard/horas');
}
