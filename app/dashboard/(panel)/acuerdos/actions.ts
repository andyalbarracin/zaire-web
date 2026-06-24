'use server';

import { redirect } from 'next/navigation';
import { createAgreement, updateAgreement, defaultTerms } from '@/lib/zaire-ops/agreements';
import { getClient } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s, sReq, nN, actionError, type FormState } from '@/lib/zaire-ops/form';

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

export async function createAgreementAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const data = parse(fd);
  if (!data.client_id) return { error: 'Elegí un cliente.' };
  if (!data.project_name) return { error: 'El nombre del proyecto/acuerdo es obligatorio.' };
  let id: string;
  try {
    if (!data.terms) {
      const client = await getClient(data.client_id);
      data.terms = defaultTerms({
        projectName: data.project_name, plan: data.plan, setupFee: data.setup_fee,
        monthlyFee: data.monthly_fee, currency: data.currency, clientName: client?.name,
      });
    }
    id = (await createAgreement(data)).id;
  } catch (e) { return actionError(e); }
  redirect(`/dashboard/acuerdos/${id}`);
}

export async function updateAgreementAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const data = parse(fd);
  if (!data.project_name) return { error: 'El nombre del proyecto/acuerdo es obligatorio.' };
  try { await updateAgreement(id, data); }
  catch (e) { return actionError(e); }
  redirect(`/dashboard/acuerdos/${id}`);
}

export async function markSentAction(id: string) {
  await requireUser();
  await updateAgreement(id, { status: 'enviado', sent_at: new Date().toISOString() });
  redirect(`/dashboard/acuerdos/${id}`);
}
