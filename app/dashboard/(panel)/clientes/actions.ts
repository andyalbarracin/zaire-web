// File: actions.ts
// Path: zaire-web/app/dashboard/(panel)/clientes/actions.ts

'use server';

import { redirect } from 'next/navigation';
import { createClient as dbCreateClient, updateClient } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s, sReq, n, nN } from '@/lib/zaire-ops/form';
import type { ClientStatus } from '@/lib/zaire-ops/types';

function parse(fd: FormData) {
  return {
    name: sReq(fd, 'name'),
    contact_name: s(fd, 'contact_name'),
    email: s(fd, 'email'),
    whatsapp: s(fd, 'whatsapp'),
    plan: s(fd, 'plan'),
    monthly_support_hours: n(fd, 'monthly_support_hours'),
    monthly_fee: nN(fd, 'monthly_fee'),
    currency: sReq(fd, 'currency') || 'USD',
    status: (sReq(fd, 'status') || 'activo') as ClientStatus,
    notes: s(fd, 'notes'),
  };
}

export async function createClientAction(fd: FormData) {
  await requireUser();
  const c = await dbCreateClient(parse(fd));
  redirect(`/dashboard/clientes/${c.id}`);
}

export async function updateClientAction(id: string, fd: FormData) {
  await requireUser();
  await updateClient(id, parse(fd));
  redirect(`/dashboard/clientes/${id}`);
}
