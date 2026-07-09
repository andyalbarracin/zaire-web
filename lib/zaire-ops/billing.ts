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
  bank: string | null;             // banco donde se depositó / acreditó
  receipt_url: string | null;      // comprobante de transferencia
  invoice_file_url: string | null; // factura fiscal (archivo separado)
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

// Vencido = no anulado, con saldo, y due_date pasada.
export function isOverdue(i: ZoInvoice): boolean {
  if (i.status === 'anulada' || !i.due_date) return false;
  if ((i.paid ?? 0) >= i.amount) return false;
  return i.due_date < new Date().toISOString().slice(0, 10);
}

// Días de mora: diferencia positiva entre una fecha de referencia y el vencimiento.
// - Con `refDate` (fecha de pago) → mora con que se pagó.
// - Sin `refDate` → mora corriente a hoy (para saldo pendiente).
// Base reutilizable para un futuro cálculo de intereses.
export function daysLate(dueDate?: string | null, refDate?: string | null): number {
  if (!dueDate) return 0;
  const ref = refDate ?? new Date().toISOString().slice(0, 10);
  const d = Math.floor((Date.parse(ref) - Date.parse(dueDate)) / 86_400_000);
  return d > 0 ? d : 0;
}

// Estado "vivo" derivado de los pagos + vencimiento (pagada / vencida / parcial / pendiente / anulada).
export function liveInvoiceStatus(i: ZoInvoice): { label: string; color: string } {
  if (i.status === 'anulada') return { label: 'Anulada', color: '#6b7280' };
  const paid = i.paid ?? 0;
  if (i.amount > 0 && paid >= i.amount) return { label: 'Pagada', color: '#22c55e' };
  if (isOverdue(i)) return { label: paid > 0 ? 'Vencida (parcial)' : 'Vencida', color: '#E71D0A' };
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

// Sube un archivo del pago a Storage. `kind` separa comprobante de factura.
export async function uploadPaymentFile(invoiceId: string, file: File, kind: 'receipts' | 'invoices' = 'receipts'): Promise<string | null> {
  if (!file || file.size === 0 || file.size > 50 * 1024 * 1024) return null;
  const admin = db();
  const safe = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${kind}/${invoiceId}/${Date.now()}-${safe}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from('zo-files').upload(path, buffer, { contentType: file.type || 'application/octet-stream' });
  if (error) return null;
  return admin.storage.from('zo-files').getPublicUrl(path).data.publicUrl;
}

// Alias retrocompatible (comprobante de transferencia).
export const uploadReceipt = (invoiceId: string, file: File) => uploadPaymentFile(invoiceId, file, 'receipts');

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

// Cuentas por cobrar globales: invoices con saldo (no anuladas), total y vencido.
export async function receivables(): Promise<{ totalDue: number; overdueDue: number; currency: string; items: ZoInvoice[] }> {
  const all = await listInvoices();
  const today = new Date().toISOString().slice(0, 10);
  const items = all.filter(i => i.status !== 'anulada' && (i.paid ?? 0) < i.amount);
  let totalDue = 0, overdueDue = 0;
  for (const i of items) {
    const saldo = i.amount - (i.paid ?? 0);
    totalDue += saldo;
    if (i.due_date && i.due_date < today) overdueDue += saldo;
  }
  items.sort((a, b) => (a.due_date ?? '9999-99-99').localeCompare(b.due_date ?? '9999-99-99'));
  return { totalDue, overdueDue, currency: items[0]?.currency ?? 'USD', items };
}

function esc(s = ''): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// HTML branded de la solicitud de pago para enviar al cliente (Resend).
export function buildInvoiceEmailHtml(i: ZoInvoice, clientName: string): { subject: string; html: string } {
  const saldo = i.amount - (i.paid ?? 0);
  const subject = `Solicitud de pago ${i.number ?? ''} · ZAIRE`;
  const row = (l: string, v: string, strong = false) => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#888">${l}</td>
      <td style="padding:8px 0;font-size:${strong ? '15px;font-weight:800' : '13px'};color:#111;text-align:right">${v}</td>
    </tr>`;
  const html = `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
    <div style="background:#111;padding:24px 36px">
      <span style="font-family:monospace;font-size:16px;font-weight:700;color:#fff;letter-spacing:.15em">ZAIRE</span>
      <span style="font-family:monospace;font-size:9px;color:#FF6A00;letter-spacing:.1em;text-transform:uppercase;margin-left:14px">SOLICITUD DE PAGO</span>
    </div>
    <div style="padding:36px;background:#F5F5F0">
      <p style="font-family:monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin:0 0 6px">// ${esc(i.number ?? '')}</p>
      <h1 style="font-family:sans-serif;font-size:22px;font-weight:800;color:#111;margin:0 0 4px">${esc(i.concept)}</h1>
      <p style="font-size:14px;color:#555;margin:0 0 24px">Hola ${esc(clientName)}, te compartimos el detalle del pago.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e3dd;border-radius:4px;padding:0 16px">
        <tr><td colspan="2" style="height:8px"></td></tr>
        ${row('Monto', money(i.amount, i.currency))}
        ${i.paid ? row('Pagado', money(i.paid, i.currency)) : ''}
        ${i.due_date ? row('Vencimiento', i.due_date) : ''}
        ${row('A pagar', money(saldo, i.currency), true)}
        <tr><td colspan="2" style="height:8px"></td></tr>
      </table>
      ${i.notes ? `<p style="font-size:13px;color:#555;margin:20px 0 0;white-space:pre-wrap">${esc(i.notes)}</p>` : ''}
      <p style="font-size:11px;color:#999;font-style:italic;margin:24px 0 0;line-height:1.6">Este documento es una solicitud de pago y no constituye una factura fiscal/contable. La factura fiscal correspondiente se emite por separado.</p>
    </div>
    <div style="background:#111;padding:16px 36px"><span style="font-family:monospace;font-size:9px;color:#666;letter-spacing:.08em">ZAIRE · zairetech.com</span></div>
  </div>`;
  return { subject, html };
}
