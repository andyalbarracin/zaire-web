// File: actions.ts
// Path: zaire-web/app/dashboard/(panel)/clientes/actions.ts

'use server';

import { redirect } from 'next/navigation';
import { createClient as dbCreateClient, updateClient } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s, sReq, n, nN, actionError, type FormState } from '@/lib/zaire-ops/form';
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

export async function createClientAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const data = parse(fd);
  if (!data.name) return { error: 'El nombre del cliente es obligatorio.' };
  let id: string;
  try { id = (await dbCreateClient(data)).id; }
  catch (e) { return actionError(e); }
  redirect(`/dashboard/clientes/${id}`);
}

export async function updateClientAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const data = parse(fd);
  if (!data.name) return { error: 'El nombre del cliente es obligatorio.' };
  try { await updateClient(id, data); }
  catch (e) { return actionError(e); }
  redirect(`/dashboard/clientes/${id}`);
}
