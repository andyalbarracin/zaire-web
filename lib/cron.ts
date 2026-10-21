// File: cron.ts
// Path: zaire-web/lib/cron.ts
// Description: Autorización de rutas llamadas por Vercel Cron. Si existe la env CRON_SECRET,
//              Vercel manda `Authorization: Bearer <CRON_SECRET>` en cada invocación.
//              `required`: la ruta no corre sin secret (ej. la que manda emails).

import { NextResponse } from 'next/server';

/** Devuelve una respuesta de rechazo, o `null` si la llamada está autorizada. */
export function checkCron(req: Request, required: boolean): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return required ? NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 503 }) : null;
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}
