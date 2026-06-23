'use server';

import { redirect } from 'next/navigation';
import { createTicket, updateTicket, createTimeEntry } from '@/lib/zaire-ops/queries';
import { s, sReq, nN, n, b } from '@/lib/zaire-ops/form';
import type { TicketPriority, TicketStatus } from '@/lib/zaire-ops/types';

function parse(fd: FormData) {
  return {
    title: sReq(fd, 'title'),
    client_id: sReq(fd, 'client_id'),
    project_id: s(fd, 'project_id'),
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
  await updateTicket(id, parse(fd));
  redirect(`/dashboard/tickets/${id}`);
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
