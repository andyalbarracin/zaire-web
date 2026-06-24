// File: billing.ts
// Path: zaire-web/lib/zaire-ops/billing.ts
// Description: Facturas (invoices) y pagos (comprobantes) de Zaire Ops. Server-only.

import { createSupabaseAdmin } from './supabase-admin';

const db = () => createSupabaseAdmin();

export type InvoiceStatus = 'pendiente' | 'pagada' | 'anulada';

export interface ZoInvoice {
  id: string;
  client_id: string;
  agreement_id: string | null;
  number: string | null;
  concept: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: { name: string } | null;
  paid?: number;   // calculado: suma de pagos
}

export interface ZoPayment {
  id: string;
  invoice_id: string | null;
  client_id: string;
  amount: number;
  currency: string;
  paid_date: string;
  method: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  pendiente: 'Pendiente', pagada: 'Pagada', anulada: 'Anulada',
};
export const INVOICE_STATUS_COLOR: Record<InvoiceStatus, string> = {
  pendiente: '#FFC107', pagada: '#22c55e', anulada: '#6b7280',
};
export const PAYMENT_METHODS = ['Transferencia', 'Efectivo', 'Mercado Pago', 'Cripto', 'Cheque', 'Otro'];

// Estado "vivo" derivado de los pagos (pagada / parcial / pendiente / anulada).
export function liveInvoiceStatus(i: ZoInvoice): { label: string; color: string } {
  if (i.status === 'anulada') return { label: 'Anulada', color: '#6b7280' };
  const paid = i.paid ?? 0;
  if (i.amount > 0 && paid >= i.amount) return { label: 'Pagada', color: '#22c55e' };
  if (paid > 0) return { label: 'Parcial', color: '#3b82f6' };
  return { label: 'Pendiente', color: '#FFC107' };
}

export const money = (n?: number | null, cur = 'USD') => `${cur} ${Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await db().from('zo_invoices').select('id', { count: 'exact', head: true }).gte('issue_date', `${year}-01-01`);
  return `INV-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`;
}

async function paidByInvoice(clientId?: string): Promise<Map<string, number>> {
  let q = db().from('zo_payments').select('invoice_id, amount');
  if (clientId) q = q.eq('client_id', clientId);
  const { data } = await q;
  const map = new Map<string, number>();
  for (const p of (data ?? []) as { invoice_id: string | null; amount: number }[]) {
    if (p.invoice_id) map.set(p.invoice_id, (map.get(p.invoice_id) ?? 0) + Number(p.amount ?? 0));
  }
  return map;
}

export async function listInvoices(clientId?: string): Promise<ZoInvoice[]> {
  let q = db().from('zo_invoices').select('*, client:zo_clients(name)').order('issue_date', { ascending: false });
  if (clientId) q = q.eq('client_id', clientId);
  const { data } = await q;
  const paid = await paidByInvoice(clientId);
  return ((data ?? []) as ZoInvoice[]).map(i => ({ ...i, paid: paid.get(i.id) ?? 0 }));
}

export async function getInvoice(id: string): Promise<ZoInvoice | null> {
  const { data } = await db().from('zo_invoices').select('*, client:zo_clients(name)').eq('id', id).single();
  if (!data) return null;
  const { data: pays } = await db().from('zo_payments').select('amount').eq('invoice_id', id);
  const paid = (pays ?? []).reduce((s, p) => s + Number((p as { amount: number }).amount ?? 0), 0);
  return { ...(data as ZoInvoice), paid };
}

export async function createInvoice(input: Partial<ZoInvoice>): Promise<ZoInvoice> {
  const number = await nextInvoiceNumber();
  const { data, error } = await db().from('zo_invoices').insert({ ...input, number }).select().single();
  if (error) throw new Error(error.message);
  return data as ZoInvoice;
}

export async function updateInvoice(id: string, input: Partial<ZoInvoice>): Promise<void> {
  const { error } = await db().from('zo_invoices').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listPayments(invoiceId: string): Promise<ZoPayment[]> {
  const { data } = await db().from('zo_payments').select('*').eq('invoice_id', invoiceId).order('paid_date', { ascending: false });
  return (data ?? []) as ZoPayment[];
}

export async function addPayment(input: Partial<ZoPayment>): Promise<void> {
  const { error } = await db().from('zo_payments').insert(input);
  if (error) throw new Error(error.message);
  // Recalcular estado de la factura.
  if (input.invoice_id) {
    const inv = await getInvoice(input.invoice_id);
    if (inv && inv.status !== 'anulada') {
      const status: InvoiceStatus = (inv.paid ?? 0) >= inv.amount ? 'pagada' : 'pendiente';
      if (status !== inv.status) await updateInvoice(inv.id, { status });
    }
  }
}

export async function uploadReceipt(invoiceId: string, file: File): Promise<string | null> {
  if (!file || file.size === 0 || file.size > 50 * 1024 * 1024) return null;
  const admin = db();
  const safe = file.name.replace(/[^\w.\-]/g, '_');
  const path = `receipts/${invoiceId}/${Date.now()}-${safe}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from('zo-files').upload(path, buffer, { contentType: file.type || 'application/octet-stream' });
  if (error) return null;
  return admin.storage.from('zo-files').getPublicUrl(path).data.publicUrl;
}

export async function clientAccount(clientId: string): Promise<{ invoiced: number; paid: number; balance: number; currency: string }> {
  const supabase = db();
  const [{ data: invoices }, { data: payments }, { data: client }] = await Promise.all([
    supabase.from('zo_invoices').select('amount, status').eq('client_id', clientId),
    supabase.from('zo_payments').select('amount').eq('client_id', clientId),
    supabase.from('zo_clients').select('currency').eq('id', clientId).single(),
  ]);
  const invoiced = (invoices ?? []).filter(i => (i as { status: string }).status !== 'anulada').reduce((s, i) => s + Number((i as { amount: number }).amount ?? 0), 0);
  const paid = (payments ?? []).reduce((s, p) => s + Number((p as { amount: number }).amount ?? 0), 0);
  return { invoiced, paid, balance: invoiced - paid, currency: (client as { currency?: string })?.currency ?? 'USD' };
}
