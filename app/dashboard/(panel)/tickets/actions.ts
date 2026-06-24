'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createTicket, updateTicket, getTicket, getClient, createTimeEntry,
  addComment, uploadTicketFile, addAttachment, deleteAttachment, profileName,
} from '@/lib/zaire-ops/queries';
import { getMyProfile, getProfileById } from '@/lib/zaire-ops/profiles';
import { requireUser } from '@/lib/zaire-ops/auth';
import { Resend } from 'resend';
import { buildTicketEmailHtml } from '@/lib/zaire-ops/ticket-email';
import { sendOpsEmail } from '@/lib/zaire-ops/mailer';
import { buildAssignmentEmail, buildCommentEmail } from '@/lib/zaire-ops/team-email';
import { s, sReq, b, hoursToMin, actionError, type FormState } from '@/lib/zaire-ops/form';
import { STATUS_LABEL, type TicketPriority, type TicketStatus, type ZoTicket } from '@/lib/zaire-ops/types';

function parse(fd: FormData) {
  return {
    title: sReq(fd, 'title'),
    client_id: sReq(fd, 'client_id'),
    project_id: s(fd, 'project_id'),
    assigned_to: s(fd, 'assigned_to'),
    type: sReq(fd, 'type') || 'soporte',
    priority: (sReq(fd, 'priority') || 'media') as TicketPriority,
    status: (sReq(fd, 'status') || 'nueva') as TicketStatus,
    source: sReq(fd, 'source') || 'manual',
    description: s(fd, 'description'),
    reported_by: s(fd, 'reported_by'),
    estimated_minutes: hoursToMin(fd, 'estimated_hours'),
    actual_minutes: hoursToMin(fd, 'actual_hours'),
    included_in_support: b(fd, 'included_in_support'),
    billable_extra: b(fd, 'billable_extra'),
    resolution: s(fd, 'resolution'),
  };
}

// ── Notificaciones internas al equipo (no bloqueantes; no avisan al propio actor) ──
async function sendAssignmentNotice(ticket: ZoTicket, assigneeId: string) {
  const who = await getProfileById(assigneeId);
  if (!who?.email) return;
  const { subject, html } = buildAssignmentEmail(ticket, who.full_name ?? who.email);
  await sendOpsEmail({ to: who.email, subject, html });
}

async function sendCommentNotice(ticket: ZoTicket, body: string, authorName: string) {
  if (!ticket.assigned_to) return;
  const who = await getProfileById(ticket.assigned_to);
  if (!who?.email) return;
  const { subject, html } = buildCommentEmail(ticket, body, authorName, who.full_name ?? who.email);
  await sendOpsEmail({ to: who.email, subject, html });
}

export async function createTicketAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const data = parse(fd);
  if (!data.title) return { error: 'El título de la incidencia es obligatorio.' };
  if (!data.client_id) return { error: 'Elegí un cliente.' };
  let t: ZoTicket;
  try { t = await createTicket(data); }
  catch (e) { return actionError(e); }

  const me = await getMyProfile();
  if (data.assigned_to && data.assigned_to !== me?.id) {
    const full = await getTicket(t.id);
    if (full) await sendAssignmentNotice(full, data.assigned_to);
  }
  redirect(`/dashboard/tickets/${t.id}`);
}

export async function updateTicketAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const patch = parse(fd);
  if (!patch.title) return { error: 'El título de la incidencia es obligatorio.' };
  if (!patch.client_id) return { error: 'Elegí un cliente.' };
  try {
    const prev = await getTicket(id);
    await updateTicket(id, patch);

    // Log de actividad + notificación al nuevo asignado.
    const me = await getMyProfile();
    if (prev) {
      if (prev.status !== patch.status) {
        await addComment({
          ticket_id: id, author_id: me?.id ?? null, is_system: true,
          body: `cambió el estado: ${STATUS_LABEL[prev.status]} → ${STATUS_LABEL[patch.status]}`,
        });
      }
      if ((prev.assigned_to ?? null) !== (patch.assigned_to ?? null)) {
        const who = await profileName(patch.assigned_to ?? null);
        await addComment({
          ticket_id: id, author_id: me?.id ?? null, is_system: true,
          body: patch.assigned_to ? `asignó la incidencia a ${who}` : 'quitó la asignación',
        });
        if (patch.assigned_to && patch.assigned_to !== me?.id) {
          await sendAssignmentNotice({ ...prev, ...patch } as ZoTicket, patch.assigned_to);
        }
      }
    }
  } catch (e) { return actionError(e); }
  redirect(`/dashboard/tickets/${id}`);
}

export async function addCommentAction(ticketId: string, fd: FormData) {
  await requireUser();
  const me = await getMyProfile();
  const body = String(fd.get('body') || '').trim();
  if (body) {
    await addComment({ ticket_id: ticketId, author_id: me?.id ?? null, body, is_internal: b(fd, 'is_internal') });
    const ticket = await getTicket(ticketId);
    if (ticket?.assigned_to && ticket.assigned_to !== me?.id) {
      await sendCommentNotice(ticket, body, me?.full_name ?? me?.email ?? 'Un miembro del equipo');
    }
  }
  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

export async function uploadAttachmentAction(ticketId: string, fd: FormData) {
  await requireUser();
  const file = fd.get('file') as File | null;
  if (file && typeof file === 'object' && file.size > 0) {
    const res = await uploadTicketFile(ticketId, file);
    if (res) await addAttachment({ ticket_id: ticketId, file_url: res.url, file_name: res.name, file_type: res.type });
  }
  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

export async function deleteAttachmentAction(ticketId: string, id: string) {
  await requireUser();
  await deleteAttachment(id);
  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

// Notificación MANUAL al cliente sobre la incidencia (botón, no automático).
export async function notifyClientAction(ticketId: string) {
  await requireUser();
  const base = `/dashboard/tickets/${ticketId}`;
  const ticket = await getTicket(ticketId);
  if (!ticket) redirect(base);
  const client = await getClient(ticket.client_id);
  if (!client?.email) redirect(`${base}?err=${encodeURIComponent('El cliente no tiene email cargado. Agregalo en su ficha.')}`);
  if (!process.env.RESEND_API_KEY) redirect(`${base}?err=${encodeURIComponent('Resend no está configurado (RESEND_API_KEY).')}`);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com';
  const fromDomain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const { subject, html } = buildTicketEmailHtml(ticket, client.name);
  try {
    await resend.emails.send({ from: `ZAIRE <noreply@${fromDomain}>`, to: client.email, subject, html });
  } catch {
    redirect(`${base}?err=${encodeURIComponent('No se pudo enviar el email. Revisá el dominio verificado en Resend.')}`);
  }
  redirect(`${base}?sent=1`);
}

// Registrar horas directamente desde una incidencia.
export async function logTimeAction(ticketId: string, clientId: string, projectId: string | null, fd: FormData) {
  await requireUser();
  await createTimeEntry({
    ticket_id: ticketId,
    client_id: clientId,
    project_id: projectId,
    minutes: hoursToMin(fd, 'hours') ?? 0,
    work_type: sReq(fd, 'work_type') || 'soporte',
    description: s(fd, 'description'),
    billable: b(fd, 'billable'),
    included_in_plan: b(fd, 'included_in_plan'),
    entry_date: sReq(fd, 'entry_date') || new Date().toISOString().slice(0, 10),
  });
  redirect(`/dashboard/tickets/${ticketId}`);
}
