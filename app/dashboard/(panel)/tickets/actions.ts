'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createTicket, updateTicket, getTicket, createTimeEntry,
  addComment, uploadTicketFile, addAttachment, deleteAttachment, profileName,
} from '@/lib/zaire-ops/queries';
import { getMyProfile } from '@/lib/zaire-ops/profiles';
import { s, sReq, nN, n, b } from '@/lib/zaire-ops/form';
import { STATUS_LABEL, type TicketPriority, type TicketStatus } from '@/lib/zaire-ops/types';

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
    estimated_minutes: nN(fd, 'estimated_minutes'),
    actual_minutes: nN(fd, 'actual_minutes'),
    included_in_support: b(fd, 'included_in_support'),
    billable_extra: b(fd, 'billable_extra'),
    resolution: s(fd, 'resolution'),
  };
}

export async function createTicketAction(fd: FormData) {
  const t = await createTicket(parse(fd));
  redirect(`/dashboard/tickets/${t.id}`);
}

export async function updateTicketAction(id: string, fd: FormData) {
  const prev = await getTicket(id);
  const patch = parse(fd);
  await updateTicket(id, patch);

  // Log de actividad: cambios de estado y asignación quedan en el timeline.
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
    }
  }
  redirect(`/dashboard/tickets/${id}`);
}

export async function addCommentAction(ticketId: string, fd: FormData) {
  const me = await getMyProfile();
  const body = String(fd.get('body') || '').trim();
  if (body) {
    await addComment({ ticket_id: ticketId, author_id: me?.id ?? null, body, is_internal: b(fd, 'is_internal') });
  }
  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

export async function uploadAttachmentAction(ticketId: string, fd: FormData) {
  const file = fd.get('file') as File | null;
  if (file && typeof file === 'object' && file.size > 0) {
    const res = await uploadTicketFile(ticketId, file);
    if (res) await addAttachment({ ticket_id: ticketId, file_url: res.url, file_name: res.name, file_type: res.type });
  }
  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

export async function deleteAttachmentAction(ticketId: string, id: string) {
  await deleteAttachment(id);
  revalidatePath(`/dashboard/tickets/${ticketId}`);
}

// Registrar horas directamente desde una incidencia.
export async function logTimeAction(ticketId: string, clientId: string, projectId: string | null, fd: FormData) {
  await createTimeEntry({
    ticket_id: ticketId,
    client_id: clientId,
    project_id: projectId,
    minutes: n(fd, 'minutes'),
    work_type: sReq(fd, 'work_type') || 'soporte',
    description: s(fd, 'description'),
    billable: b(fd, 'billable'),
    included_in_plan: b(fd, 'included_in_plan'),
    entry_date: sReq(fd, 'entry_date') || new Date().toISOString().slice(0, 10),
  });
  redirect(`/dashboard/tickets/${ticketId}`);
}
