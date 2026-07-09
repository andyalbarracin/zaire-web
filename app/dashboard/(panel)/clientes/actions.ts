// File: actions.ts
// Path: zaire-web/app/dashboard/(panel)/clientes/actions.ts

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as dbCreateClient, updateClient } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s, sReq, n, nN, actionError, type FormState } from '@/lib/zaire-ops/form';
import type { ClientStatus } from '@/lib/zaire-ops/types';
import { addClientUser, removeClientUser } from '@/lib/zaire-ops/portal';
import { uploadDocumentFile, createDocument, deleteDocument, type DocType } from '@/lib/zaire-ops/documents';

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

export async function addPortalUserAction(clientId: string, fd: FormData) {
  await requireUser();
  try { await addClientUser(clientId, String(fd.get('email') ?? '')); } catch { /* email inválido/duplicado: se ignora en v1 */ }
  revalidatePath(`/dashboard/clientes/${clientId}`);
}

export async function removePortalUserAction(clientId: string, userId: string) {
  await requireUser();
  await removeClientUser(userId);
  revalidatePath(`/dashboard/clientes/${clientId}`);
}

export async function uploadDocumentAction(clientId: string, fd: FormData) {
  await requireUser();
  const file = fd.get('file') as File | null;
  const title = String(fd.get('title') ?? '').trim();
  const type = (String(fd.get('type') ?? 'otro')) as DocType;
  const visible = fd.get('visible') !== null;
  if (file && typeof file === 'object' && file.size > 0 && title) {
    const url = await uploadDocumentFile(clientId, file);
    if (url) await createDocument({ client_id: clientId, title, type, file_url: url, visible_to_client: visible });
  }
  revalidatePath(`/dashboard/clientes/${clientId}`);
}

export async function deleteDocumentAction(clientId: string, docId: string) {
  await requireUser();
  await deleteDocument(docId);
  revalidatePath(`/dashboard/clientes/${clientId}`);
}
