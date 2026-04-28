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
          <span style="font-family:monospace;font-size:9px;color:#aaa;letter-spacing:.08em;text-transform:uppercase">
            © ZAIRE 2026
          </span>
          <a href="mailto:hola@zaire.studio"
             style="font-family:monospace;font-size:9px;color:#aaa;letter-spacing:.08em">
            hola@zaire.studio
          </a>
        </div>
      </div>
    `,
  };
}

/* ── Template notificación interna ── */
function internalNotification(d: {
  name?: string; email: string; whatsapp?: string;
  company?: string; employees?: string; challenge?: string;
  message?: string; need?: string; source?: string; conversation?: string;
  ai_knowledge?: string;
}) {
  const field = (label: string, val?: string) => val ? `
    <tr>
      <td style="font-family:monospace;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.08em;padding:6px 12px 6px 0;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="font-size:13px;color:#fff;padding:6px 0;line-height:1.5">${val}</td>
    </tr>` : '';

  const conversationHtml = d.conversation
    ? d.conversation.split('\n').map(line => {
        const isBot = line.startsWith('ZAIRE:');
        const text = line.replace(/^(ZAIRE|Visitante): /, '');
        return `<div style="margin-bottom:8px;padding:8px 12px;background:${isBot ? '#1a1a1a' : '#222'};border-left:2px solid ${isBot ? '#FF6A00' : '#444'};border-radius:2px">
          <span style="font-family:monospace;font-size:9px;color:${isBot ? '#FF6A00' : '#666'};text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:4px">${isBot ? 'ZAIRE' : 'VISITANTE'}</span>
          <span style="font-size:13px;color:#ccc;line-height:1.5">${text}</span>
        </div>`;
      }).join('')
    : '<p style="color:#555;font-size:12px">Sin conversación registrada.</p>';

  return {
    subject: `🔔 Nuevo lead — ${d.name || d.email} (${d.source || 'web'})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;padding:0">

        <!-- Header -->
        <div style="background:#111;padding:24px 32px;border-bottom:1px solid #1e1e1e">
          <span style="font-family:monospace;font-size:16px;font-weight:700;color:#fff;letter-spacing:.15em">ZAIRE</span>
          <span style="font-family:monospace;font-size:9px;color:#FF6A00;letter-spacing:.1em;text-transform:uppercase;margin-left:16px">NUEVO LEAD</span>
        </div>

        <!-- Datos de contacto -->
        <div style="padding:24px 32px;background:#111">
          <div style="font-family:monospace;font-size:9px;color:#555;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px">// CONTACTO</div>
          <table cellpadding="0" cellspacing="0" style="width:100%">
            ${field('Nombre', d.name)}
            ${field('Email', `<a href="mailto:${d.email}" style="color:#FF6A00">${d.email}</a>`)}
            ${field('WhatsApp', d.whatsapp ? `<a href="https://wa.me/${d.whatsapp.replace(/\D/g,'')}" style="color:#FF6A00">${d.whatsapp}</a>` : undefined)}
            ${field('Empresa', d.company)}
            ${field('Equipo', d.employees)}
            ${field('Desafío', d.challenge)}
            ${field('Necesidad', d.need)}
            ${field('Conoce IA', d.ai_knowledge)}
            ${field('Fuente', d.source)}
          </table>
          ${d.message ? `<div style="margin-top:16px;padding:12px 16px;background:#1a1a1a;border-left:2px solid #FF6A00;border-radius:2px"><div style="font-family:monospace;font-size:9px;color:#555;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Mensaje</div><p style="font-size:13px;color:#ccc;line-height:1.65;margin:0">${d.message}</p></div>` : ''}
        </div>

        <!-- Conversación -->
        <div style="padding:24px 32px;background:#0d0d0d">
          <div style="font-family:monospace;font-size:9px;color:#555;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px">// CONVERSACIÓN DEL CHAT</div>
          ${conversationHtml}
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;background:#111;border-top:1px solid #1e1e1e">
          <span style="font-family:monospace;font-size:9px;color:#333;letter-spacing:.06em">ZAIRE · Notificación automática · ${new Date().toLocaleString('es-AR')}</span>
        </div>
      </div>
    `,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, whatsapp, company, employees, challenge, message, conversation, need, source, ai_knowledge } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    /* 1. Guardar en Supabase */
    const supabase = getSupabase();
    const { error: dbError } = await supabase.from('leads').insert({
      name:         name || null,
      email,
      whatsapp:     whatsapp || null,
      company:      company || null,
      employees:    employees || null,
      challenge:    challenge || null,
      message:      message || null,
      conversation: conversation || null,
      need:         need || null,
      source:       source || 'web',
      ai_knowledge: ai_knowledge || null,
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
        html:    internalNotification({ name, email, whatsapp, company, employees, challenge, message, need, source, conversation, ai_knowledge }).html,
      });
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('Lead route error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
