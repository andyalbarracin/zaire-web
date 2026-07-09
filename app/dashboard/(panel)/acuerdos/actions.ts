'use server';

import { redirect } from 'next/navigation';
import { Resend } from 'resend';
import { createAgreement, updateAgreement, getAgreement, defaultTerms } from '@/lib/zaire-ops/agreements';
import { getClient } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s, sReq, nN, actionError, type FormState } from '@/lib/zaire-ops/form';

function esc(s = ''): string { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

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

// Envía el magic link de firma al cliente por email y marca el acuerdo como enviado.
export async function sendAgreementLinkAction(id: string) {
  await requireUser();
  const base = `/dashboard/acuerdos/${id}`;
  const a = await getAgreement(id);
  if (!a) redirect('/dashboard/acuerdos');
  const client = await getClient(a.client_id);
  const to = a.signer_email || client?.email;
  if (!to) redirect(`${base}?err=${encodeURIComponent('El acuerdo/cliente no tiene email. Cargá un email de firmante o en la ficha del cliente.')}`);
  if (!process.env.RESEND_API_KEY) redirect(`${base}?err=${encodeURIComponent('Resend no está configurado (RESEND_API_KEY).')}`);

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com';
  const fromDomain = site.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const link = `${site}/firmar/${a.token}`;
  const html = `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
    <div style="background:#111;padding:24px 36px">
      <span style="font-family:monospace;font-size:16px;font-weight:700;color:#fff;letter-spacing:.15em">ZAIRE</span>
      <span style="font-family:monospace;font-size:9px;color:#FF6A00;letter-spacing:.1em;text-transform:uppercase;margin-left:14px">ACUERDO PARA FIRMAR</span>
    </div>
    <div style="padding:36px;background:#F5F5F0">
      <h1 style="font-size:22px;font-weight:800;color:#111;margin:0 0 8px">${esc(a.project_name)}</h1>
      <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px">Hola ${esc(a.signer_name || client?.name || '')}, te compartimos el acuerdo para que lo revises y firmes online. Es rápido y seguro.</p>
      <a href="${link}" style="display:inline-block;background:#FF6A00;color:#111;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px">Ver y firmar el acuerdo →</a>
      <p style="font-size:12px;color:#888;margin:24px 0 0">Si el botón no funciona, copiá este link: <br>${link}</p>
    </div>
    <div style="background:#111;padding:16px 36px"><span style="font-family:monospace;font-size:9px;color:#666;letter-spacing:.08em">ZAIRE · zairetech.com</span></div>
  </div>`;

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: `ZAIRE <noreply@${fromDomain}>`, to, subject: `Acuerdo para firmar — ${a.project_name} · ZAIRE`, html,
    });
  } catch {
    redirect(`${base}?err=${encodeURIComponent('No se pudo enviar el email. Revisá el dominio verificado en Resend.')}`);
  }
  if (a.status === 'borrador') await updateAgreement(id, { status: 'enviado', sent_at: new Date().toISOString() });
  redirect(`${base}?sent=1`);
}
