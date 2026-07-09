'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Resend } from 'resend';
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { createTicket, getClient } from '@/lib/zaire-ops/queries';
import { buildPortalTicketEmail } from '@/lib/zaire-ops/portal-email';
import { rateLimit, RL_LEAD } from '@/lib/rate-limit';
import type { TicketPriority } from '@/lib/zaire-ops/types';

const clean = (v: FormDataEntryValue | null, max = 2000) => String(v ?? '').trim().slice(0, max).replace(/[<>]/g, '');

export async function createPortalTicketAction(_prev: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  const { clientId, email } = await requirePortalClient();

  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? 'unknown').trim();
  if (!(await rateLimit(RL_LEAD, `portal-ticket:${ip}`))) return { error: 'Demasiadas incidencias seguidas. Probá en un rato.' };

  const title = clean(fd.get('title'), 200);
  const description = clean(fd.get('description'), 4000);
  const priorityRaw = String(fd.get('priority') ?? 'media');
  const priority = (['baja', 'media', 'alta', 'critica'].includes(priorityRaw) ? priorityRaw : 'media') as TicketPriority;
  if (!title) return { error: 'Poné un título.' };
  if (!description) return { error: 'Contanos qué pasa en la descripción.' };

  const client = await getClient(clientId);
  const ticket = await createTicket({
    client_id: clientId, title, description, priority,
    type: 'soporte', source: 'portal', reported_by: email, status: 'nueva',
  });

  await logPortalEvent({ clientId, email, event: 'create_ticket', entityType: 'ticket', entityId: ticket.id });

  if (process.env.RESEND_API_KEY) {
    try {
      const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com';
      const fromDomain = site.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const notify = (process.env.NOTIFY_EMAILS || process.env.NOTIFY_EMAIL || 'albarracin.andres@gmail.com').split(',').map(e => e.trim()).filter(Boolean);
      const { subject, html } = buildPortalTicketEmail({
        clientName: client?.name ?? 'Cliente', ticketNumber: ticket.ticket_number ?? '', title, description, priority, email,
      });
      await new Resend(process.env.RESEND_API_KEY).emails.send({ from: `ZAIRE Portal <noreply@${fromDomain}>`, to: notify, subject, html });
    } catch { /* el ticket ya quedó creado; el email no bloquea */ }
  }

  redirect('/portal/incidencias?ok=1');
}
