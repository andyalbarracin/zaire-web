'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { signAgreement } from '@/lib/zaire-ops/agreements';

export async function signAction(token: string, fd: FormData) {
  const signature = String(fd.get('signature') || '');
  const signed_name = String(fd.get('signed_name') || '').trim();
  const accepted = fd.get('accepted') === 'on';

  if (!accepted || !signed_name || !signature) {
    redirect(`/firmar/${token}?err=1`);
  }

  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim() || null;
  const ua = h.get('user-agent') ?? null;

  await signAgreement(token, { signed_name, signature_url: signature, sign_ip: ip, sign_user_agent: ua });
  redirect(`/firmar/${token}?ok=1`);
}
