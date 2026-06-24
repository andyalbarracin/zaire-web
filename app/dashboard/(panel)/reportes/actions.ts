'use server';

import { redirect } from 'next/navigation';
import { Resend } from 'resend';
import { getMonthlyReport } from '@/lib/zaire-ops/queries';
import { buildReportEmailHtml } from '@/lib/zaire-ops/report-email';

export async function sendReportAction(fd: FormData) {
  const clientId = String(fd.get('client') || '');
  const year = Number(fd.get('year'));
  const month = Number(fd.get('month'));
  const base = `/dashboard/reportes?client=${clientId}&year=${year}&month=${month}`;

  const report = await getMonthlyReport(clientId, year, month);
  if (!report.client?.email) {
    redirect(`${base}&err=${encodeURIComponent('El cliente no tiene email cargado. Agregalo en su ficha.')}`);
  }
  if (!process.env.RESEND_API_KEY) {
    redirect(`${base}&err=${encodeURIComponent('Resend no está configurado (RESEND_API_KEY).')}`);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com';
  const fromDomain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const { subject, html } = buildReportEmailHtml(report, year, month);

  try {
    await resend.emails.send({ from: `ZAIRE <noreply@${fromDomain}>`, to: report.client.email, subject, html });
  } catch {
    redirect(`${base}&err=${encodeURIComponent('No se pudo enviar el email. Revisá el dominio verificado en Resend.')}`);
  }
  redirect(`${base}&sent=1`);
}
