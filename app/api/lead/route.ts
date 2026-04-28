// File: route.ts
// Path: zaire-web/app/api/lead/route.ts
// Last modified: 2026-04-27
// Description: Recibe leads del chat y del formulario de contacto.
//              1. Guarda en tabla `leads` de Supabase (usando service_role key).
//              2. Envía email de confirmación automática al visitante via Resend.
//              3. Envía notificación interna a ZAIRE.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

/* ── Clientes lazy — se instancian en runtime, no en build ── */
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const getResend = () => process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/* ── Template email de confirmación al visitante ── */
function confirmationEmail(name: string) {
  const firstName = name?.split(' ')[0] || 'ahí';
  return {
    subject: 'Recibimos tu consulta — ZAIRE',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <div style="background:#111;padding:32px 40px">
          <div style="font-family:monospace;font-size:18px;font-weight:700;color:#fff;letter-spacing:.1em">
            ZAIRE
          </div>
        </div>
        <div style="padding:40px;background:#F5F5F0">
          <p style="font-size:14px;color:#555;margin-bottom:24px">Hola ${firstName},</p>
          <p style="font-size:16px;font-weight:600;color:#111;margin-bottom:16px">
            Recibimos tu consulta.
          </p>
          <p style="font-size:14px;color:#555;line-height:1.75;margin-bottom:24px">
            Nos ponemos en contacto en las próximas <strong>24 horas hábiles</strong>
            para coordinar un diagnóstico de 30 minutos donde identificamos
            cuál es el proceso de mayor impacto para tu operación.
          </p>
          <p style="font-size:14px;color:#555;line-height:1.75;margin-bottom:32px">
            Sin compromiso. Sin propuestas genéricas. Con criterio.
          </p>
          <div style="background:#111;padding:20px 24px;border-radius:2px">
            <p style="font-family:monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#aaa;margin-bottom:8px">
              Mientras tanto, podés explorar
            </p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.cloud'}/planes"
               style="font-family:monospace;font-size:11px;color:#FF6A00;letter-spacing:.06em;text-transform:uppercase">
              → Ver planes y servicios
            </a>
          </div>
        </div>
        <div style="padding:20px 40px;background:#111;display:flex;justify-content:space-between">
          <span style="font-family:monospace;font-size:9px;color:#444;letter-spacing:.08em;text-transform:uppercase">
            © ZAIRE 2026
          </span>
          <a href="mailto:hola@zaire.studio"
             style="font-family:monospace;font-size:9px;color:#444;letter-spacing:.08em">
            hola@zaire.studio
          </a>
        </div>
      </div>
    `,
  };
}

/* ── Template notificación interna ── */
function internalNotification(data: Record<string, string>) {
  return {
    subject: `🔔 Nuevo lead — ${data.name || 'Sin nombre'} (${data.source || 'web'})`,
    html: `
      <div style="font-family:monospace;max-width:560px;margin:0 auto;padding:32px;background:#111;color:#aaa">
        <h2 style="color:#FF6A00;font-size:14px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:24px">
          Nuevo lead recibido
        </h2>
        ${Object.entries(data).map(([k, v]) => v ? `
          <div style="margin-bottom:12px">
            <span style="color:#555;font-size:10px;text-transform:uppercase;letter-spacing:.08em">${k}:</span>
            <br/><span style="color:#fff;font-size:13px">${v}</span>
          </div>
        ` : '').join('')}
      </div>
    `,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, employees, challenge, message, conversation, need, source } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    /* 1. Guardar en Supabase */
    const supabase = getSupabase();
    const { error: dbError } = await supabase.from('leads').insert({
      name:         name || null,
      email,
      company:      company || null,
      employees:    employees || null,
      challenge:    challenge || null,
      message:      message || null,
      conversation: conversation || null,
      need:         need || null,
      source:       source || 'web',
    });

    if (dbError) {
      console.error('Supabase insert error:', dbError.message);
      // No bloquear la respuesta si falla la DB — igual mandamos el email
    }

    /* 2. Email de confirmación al visitante */
    const resend = getResend();
    if (resend) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zairetech.cloud';
      const fromDomain = siteUrl.replace('https://', '').replace('http://', '');
      const { subject, html } = confirmationEmail(name || '');
      await resend.emails.send({
        from:    `ZAIRE <noreply@${fromDomain}>`,
        to:      email,
        subject,
        html,
      });

      /* 3. Notificación interna */
      await resend.emails.send({
        from:    `ZAIRE Leads <noreply@${fromDomain}>`,
        to:      process.env.NOTIFY_EMAIL || 'albarracin.andres@gmail.com',
        subject: `🔔 Nuevo lead — ${name || email}`,
        html:    internalNotification({ name, email, company, employees, challenge, message, need, source }).html,
      });
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('Lead route error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
