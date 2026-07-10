'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { getAgreement, signAgreementTyped } from '@/lib/zaire-ops/agreements';

// Firma electrónica tipeada del acuerdo desde el portal (dueño verificado + audit trail).
export async function signPortalAgreementAction(id: string, fd: FormData) {
  const { clientId, email } = await requirePortalClient();
  const a = await getAgreement(id);
  if (!a || a.client_id !== clientId) redirect('/portal/acuerdos');
  if (a.status === 'firmado') redirect(`/portal/acuerdos/${id}`);

  const name = String(fd.get('signed_name') ?? '').trim().slice(0, 80).replace(/[<>]/g, '');
  const accepted = fd.get('accepted') === 'on';
  if (!name || !accepted) redirect(`/portal/acuerdos/${id}?err=1`);

  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim() || null;
  const ua = h.get('user-agent') ?? null;

  const ok = await signAgreementTyped(id, { signed_name: name, sign_ip: ip, sign_user_agent: ua });
  if (ok) await logPortalEvent({ clientId, email, event: 'sign_agreement', entityType: 'agreement', entityId: id, metadata: { signed_name: name } });
  redirect(`/portal/acuerdos/${id}?signed=1`);
}
