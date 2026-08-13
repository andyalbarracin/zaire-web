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

// Email comercial a un lead (from de marca, reply-to a quien lo manda, adjuntos por URL).
export async function sendLeadEmail(opts: {
  to: string; subject: string; html: string; replyTo?: string;
  attachments?: { filename: string; path: string }[];
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.com';
  const fromDomain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  try {
    await resend.emails.send({
      from: `Zaire Technologies <hola@${fromDomain}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
    });
    return true;
  } catch {
    return false;
  }
}
