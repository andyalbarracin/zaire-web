// File: route.ts
// Path: zaire-web/app/api/keepalive/route.ts
// Description: Keep-alive de Supabase. El plan Free pausa el proyecto tras 7 días con poca
//              actividad; Vercel Cron (vercel.json) llama acá una vez por día y se hace UNA
//              lectura mínima. Solo lectura: no guarda ni modifica nada.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkCron } from '@/lib/cron';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const denied = checkCron(req, false);
  if (denied) return denied;

  const t0 = Date.now();
  const { error } = await supabase.from('blog_posts').select('id').limit(1);
  const ms = Date.now() - t0;

  console.log(JSON.stringify({ evt: 'keepalive', ok: !error, ms, error: error?.message ?? null }));
  if (error) return NextResponse.json({ ok: false, ms, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ms });
}
