'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createInvoice, updateInvoice, addPayment, uploadReceipt } from '@/lib/zaire-ops/billing';
import { s, sReq, nN } from '@/lib/zaire-ops/form';

function parseInvoice(fd: FormData) {
  return {
    client_id: sReq(fd, 'client_id'),
    concept: sReq(fd, 'concept'),
    amount: nN(fd, 'amount') ?? 0,
    currency: sReq(fd, 'currency') || 'USD',
    due_date: s(fd, 'due_date'),
    notes: s(fd, 'notes'),
  };
}

export async function createInvoiceAction(fd: FormData) {
  const i = await createInvoice(parseInvoice(fd));
  redirect(`/dashboard/facturas/${i.id}`);
}

export async function updateInvoiceAction(id: string, fd: FormData) {
  await updateInvoice(id, parseInvoice(fd));
  redirect(`/dashboard/facturas/${id}`);
}

export async function anularInvoiceAction(id: string) {
  await updateInvoice(id, { status: 'anulada' });
  redirect(`/dashboard/facturas/${id}`);
}

export async function addPaymentAction(invoiceId: string, clientId: string, fd: FormData) {
  const file = fd.get('receipt') as File | null;
  let receipt_url: string | null = null;
  if (file && typeof file === 'object' && file.size > 0) receipt_url = await uploadReceipt(invoiceId, file);

  await addPayment({
    invoice_id: invoiceId,
    client_id: clientId,
    amount: nN(fd, 'amount') ?? 0,
    currency: sReq(fd, 'currency') || 'USD',
    paid_date: sReq(fd, 'paid_date') || new Date().toISOString().slice(0, 10),
    method: s(fd, 'method'),
    receipt_url,
    notes: s(fd, 'notes'),
  });
  revalidatePath(`/dashboard/facturas/${invoiceId}`);
}
