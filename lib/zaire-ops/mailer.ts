// File: mailer.ts — envío de emails de Zaire Ops vía Resend (server-only). No lanza: devuelve bool.
import { Resend } from 'resend';

export async function sendOpsEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com';
  const fromDomain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  try {
    await resend.emails.send({ from: `ZAIRE Ops <noreply@${fromDomain}>`, to: opts.to, subject: opts.subject, html: opts.html });
    return true;
  } catch {
    return false;
  }
}
