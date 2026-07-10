'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { createInvoice, updateInvoice, addPayment, editPayment, deletePayment, uploadPaymentFile, getInvoice, buildInvoiceEmailHtml } from '@/lib/zaire-ops/billing';
import { getClient } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s, sReq, nN, b, actionError, type FormState } from '@/lib/zaire-ops/form';

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

function validateInvoice(d: ReturnType<typeof parseInvoice>): string | null {
  if (!d.client_id) return 'Elegí un cliente.';
  if (!d.concept) return 'El concepto es obligatorio.';
  if (!(d.amount > 0)) return 'El monto debe ser mayor a 0.';
  return null;
}

export async function createInvoiceAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const base = parseInvoice(fd);
  const invalid = validateInvoice(base);
  if (invalid) return { error: invalid };

  const cuotas = Math.max(1, Math.min(36, Number(fd.get('installments')) || 1));
  let to: string;
  try {
    if (cuotas === 1) {
      const i = await createInvoice(base);
      to = `/dashboard/facturas/${i.id}`;
    } else {
      const each = Math.round((base.amount / cuotas) * 100) / 100;
      for (let n = 1; n <= cuotas; n++) {
        await createInvoice({ ...base, amount: each, concept: `${base.concept} · Cuota ${n}/${cuotas}` });
      }
      to = `/dashboard/facturas?client=${base.client_id}`;
    }
  } catch (e) { return actionError(e); }
  redirect(to);
}

export async function updateInvoiceAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const data = parseInvoice(fd);
  const invalid = validateInvoice(data);
  if (invalid) return { error: invalid };
  try { await updateInvoice(id, data); }
  catch (e) { return actionError(e); }
  redirect(`/dashboard/facturas/${id}`);
}

export async function anularInvoiceAction(id: string) {
  await requireUser();
  await updateInvoice(id, { status: 'anulada' });
  redirect(`/dashboard/facturas/${id}`);
}

// Marca el invoice como pagado registrando el saldo restante como un pago.
export async function markPaidAction(invoiceId: string, clientId: string, currency: string, saldo: number) {
  await requireUser();
  if (saldo > 0) {
    await addPayment({
      invoice_id: invoiceId, client_id: clientId, amount: saldo, currency,
      paid_date: new Date().toISOString().slice(0, 10), method: 'Marcado pagado',
    });
  }
  revalidatePath(`/dashboard/facturas/${invoiceId}`);
}

export async function sendInvoiceAction(invoiceId: string) {
  await requireUser();
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
  await requireUser();
  const base = `/dashboard/facturas/${invoiceId}`;
  const amount = nN(fd, 'amount') ?? 0;
  if (!(amount > 0)) redirect(`${base}?err=${encodeURIComponent('El monto del pago debe ser mayor a 0.')}`);

  try {
    const receiptFile = fd.get('receipt') as File | null;
    let receipt_url: string | null = null;
    if (receiptFile && typeof receiptFile === 'object' && receiptFile.size > 0) receipt_url = await uploadPaymentFile(invoiceId, receiptFile, 'receipts');

    await addPayment({
      invoice_id: invoiceId,
      client_id: clientId,
      amount,
      currency: sReq(fd, 'currency') || 'USD',
      paid_date: sReq(fd, 'paid_date') || new Date().toISOString().slice(0, 10),
      method: s(fd, 'method'),
      bank: s(fd, 'bank'),
      receipt_url,
      notes: s(fd, 'notes'),
    });
  } catch (e) {
    redirect(`${base}?err=${encodeURIComponent(actionError(e).error ?? 'No se pudo registrar el pago.')}`);
  }
  revalidatePath(base);
}

// Edita un pago existente (fecha/monto/método/banco/notas + reemplazo opcional del comprobante).
export async function editPaymentAction(paymentId: string, invoiceId: string, fd: FormData) {
  await requireUser();
  const base = `/dashboard/facturas/${invoiceId}`;
  const amount = nN(fd, 'amount') ?? 0;
  if (!(amount > 0)) redirect(`${base}?err=${encodeURIComponent('El monto del pago debe ser mayor a 0.')}`);
  try {
    const patch: Record<string, unknown> = {
      amount,
      paid_date: sReq(fd, 'paid_date') || new Date().toISOString().slice(0, 10),
      method: s(fd, 'method'),
      bank: s(fd, 'bank'),
      notes: s(fd, 'notes'),
    };
    const receiptFile = fd.get('receipt') as File | null;
    if (receiptFile && typeof receiptFile === 'object' && receiptFile.size > 0) {
      const url = await uploadPaymentFile(invoiceId, receiptFile, 'receipts');
      if (url) patch.receipt_url = url;
    }
    await editPayment(paymentId, patch);
  } catch (e) {
    redirect(`${base}?err=${encodeURIComponent(actionError(e).error ?? 'No se pudo guardar el pago.')}`);
  }
  redirect(`${base}?psaved=1`);
}

export async function deletePaymentAction(paymentId: string, invoiceId: string) {
  await requireUser();
  await deletePayment(paymentId);
  redirect(`/dashboard/facturas/${invoiceId}?pdeleted=1`);
}

// Actualiza el eje de FACTURACIÓN de la solicitud (facturada, factura fiscal, fecha, nº).
export async function setInvoicingAction(invoiceId: string, fd: FormData) {
  await requireUser();
  const base = `/dashboard/facturas/${invoiceId}`;
  try {
    const patch: Record<string, unknown> = {
      invoiced: b(fd, 'invoiced'),
      invoiced_at: s(fd, 'invoiced_at'),
      fiscal_number: s(fd, 'fiscal_number'),
    };
    const file = fd.get('invoice_file') as File | null;
    if (file && typeof file === 'object' && file.size > 0) {
      const url = await uploadPaymentFile(invoiceId, file, 'fiscal');
      if (url) patch.invoice_file_url = url;
    }
    await updateInvoice(invoiceId, patch);
  } catch (e) {
    redirect(`${base}?err=${encodeURIComponent(actionError(e).error ?? 'No se pudo guardar la facturación.')}`);
  }
  redirect(`${base}?fsaved=1`);
}
