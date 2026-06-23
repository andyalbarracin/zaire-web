// File: route.ts
// Path: zaire-web/app/api/zaire-ops/tickets/route.ts
// Description: Ruta API semilla de Zaire Ops (lectura de incidencias). Protegida
//              por bearer token. Base para que n8n / agentes / MCP consulten datos.
//              Vive bajo /api (no /dashboard), así que el middleware no la afecta;
//              su gate es el token ZAIRE_OPS_API_TOKEN.

import { NextResponse, type NextRequest } from 'next/server';
import { listTickets } from '@/lib/zaire-ops/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = process.env.ZAIRE_OPS_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'ZAIRE_OPS_API_TOKEN no configurado' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get('status') ?? undefined;
  const clientId = req.nextUrl.searchParams.get('client') ?? undefined;
  const tickets = await listTickets({ status, clientId });
  return NextResponse.json({ count: tickets.length, tickets });
}
