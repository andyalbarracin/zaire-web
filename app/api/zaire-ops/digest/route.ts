// File: route.ts
// Path: zaire-web/app/api/zaire-ops/digest/route.ts
// Description: Resumen diario por email de actividades del CRM (vencidas + de hoy), uno por persona.
//              Lo llama Vercel Cron (vercel.json) de lunes a viernes a la mañana. Exige CRON_SECRET.
//              `?dry=1` devuelve qué mandaría sin enviar. No modifica datos.

import { NextRequest, NextResponse } from 'next/server';
import { checkCron } from '@/lib/cron';
import { buildCrmDigests } from '@/lib/zaire-ops/crm-digest';
import { sendOpsEmail } from '@/lib/zaire-ops/mailer';
import { todayLocal } from '@/lib/zaire-ops/dates';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCron(req, true);
  if (denied) return denied;

  const t0 = Date.now();
  const today = todayLocal();
  const digests = await buildCrmDigests(today);
  if (digests === null) {
    return NextResponse.json({ ok: false, error: 'Tabla de actividades no disponible (migración 0017)' }, { status: 503 });
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1';
  let sent = 0;
  if (!dry) {
    for (const d of digests) {
      if (await sendOpsEmail({ to: d.to, subject: d.subject, html: d.html })) sent += 1;
    }
  }

  const summary = digests.map(d => ({ to: d.to, today: d.today, overdue: d.overdue }));
  console.log(JSON.stringify({ evt: 'crm_digest', today, dry, recipients: digests.length, sent, ms: Date.now() - t0 }));
  return NextResponse.json({ ok: true, today, dry, recipients: summary, sent });
}
