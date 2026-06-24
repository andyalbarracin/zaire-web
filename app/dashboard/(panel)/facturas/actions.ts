'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { createInvoice, updateInvoice, addPayment, uploadReceipt, getInvoice, buildInvoiceEmailHtml } from '@/lib/zaire-ops/billing';
import { getClient } from '@/lib/zaire-ops/queries';
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
  const base = parseInvoice(fd);
  const cuotas = Math.max(1, Math.min(36, Number(fd.get('installments')) || 1));

  if (cuotas === 1) {
    const i = await createInvoice(base);
    redirect(`/dashboard/facturas/${i.id}`);
  }

  // Plan de pagos: dividir el monto en N invoices (Cuota i/N).
  const each = Math.round((base.amount / cuotas) * 100) / 100;
  for (let n = 1; n <= cuotas; n++) {
    await createInvoice({ ...base, amount: each, concept: `${base.concept} · Cuota ${n}/${cuotas}` });
  }
  redirect(`/dashboard/facturas?client=${base.client_id}`);
}

export async function updateInvoiceAction(id: string, fd: FormData) {
  await updateInvoice(id, parseInvoice(fd));
  redirect(`/dashboard/facturas/${id}`);
}

export async function anularInvoiceAction(id: string) {
  await updateInvoice(id, { status: 'anulada' });
  redirect(`/dashboard/facturas/${id}`);
}

// Marca el invoice como pagado registrando el saldo restante como un pago.
export async function markPaidAction(invoiceId: string, clientId: string, currency: string, saldo: number) {
  if (saldo > 0) {
    await addPayment({
      invoice_id: invoiceId, client_id: clientId, amount: saldo, currency,
      paid_date: new Date().toISOString().slice(0, 10), method: 'Marcado pagado',
    });
  }
  revalidatePath(`/dashboard/facturas/${invoiceId}`);
}

export async function sendInvoiceAction(invoiceId: string) {
  const base = `/dashboard/facturas/${invoiceId}`;
  const invoice = await getInvoice(invoiceId);
  if (!invoice) redirect(base);
  const client = await getClient(invoice.client_id);
  if (!client?.email) redirect(`${base}?err=${encodeURIComponent('El cliente no tiene email cargado. Agregalo en su ficha.')}`);
  if (!process.env.RESEND_API_KEY) redirect(`${base}?err=${encodeURIComponent('Resend no está configurado (RESEND_API_KEY).')}`);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com';
  const fromDomain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const { subject, html } = buildInvoiceEmailHtml(invoice, client.name);
  try {
    await resend.emails.send({ from: `ZAIRE <noreply@${fromDomain}>`, to: client.email, subject, html });
  } catch {
    redirect(`${base}?err=${encodeURIComponent('No se pudo enviar el email. Revisá el dominio verificado en Resend.')}`);
  }
  redirect(`${base}?sent=1`);
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
