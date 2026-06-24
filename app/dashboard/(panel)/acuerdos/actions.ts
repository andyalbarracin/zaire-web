'use server';

import { redirect } from 'next/navigation';
import { createAgreement, updateAgreement, defaultTerms } from '@/lib/zaire-ops/agreements';
import { getClient } from '@/lib/zaire-ops/queries';
import { s, sReq, nN } from '@/lib/zaire-ops/form';

function parse(fd: FormData) {
  return {
    client_id: sReq(fd, 'client_id'),
    project_name: sReq(fd, 'project_name'),
    plan: s(fd, 'plan'),
    setup_fee: nN(fd, 'setup_fee'),
    monthly_fee: nN(fd, 'monthly_fee'),
    currency: sReq(fd, 'currency') || 'USD',
    signer_name: s(fd, 'signer_name'),
    signer_email: s(fd, 'signer_email'),
    terms: sReq(fd, 'terms'),
  };
}

export async function createAgreementAction(fd: FormData) {
  const data = parse(fd);
  if (!data.terms) {
    const client = await getClient(data.client_id);
    data.terms = defaultTerms({
      projectName: data.project_name, plan: data.plan, setupFee: data.setup_fee,
      monthlyFee: data.monthly_fee, currency: data.currency, clientName: client?.name,
    });
  }
  const a = await createAgreement(data);
  redirect(`/dashboard/acuerdos/${a.id}`);
}

export async function updateAgreementAction(id: string, fd: FormData) {
  await updateAgreement(id, parse(fd));
  redirect(`/dashboard/acuerdos/${id}`);
}

export async function markSentAction(id: string) {
  await updateAgreement(id, { status: 'enviado', sent_at: new Date().toISOString() });
  redirect(`/dashboard/acuerdos/${id}`);
}
