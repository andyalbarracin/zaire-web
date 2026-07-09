// File: route.ts — Callback del magic link: intercambia el code por sesión.
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const origin = req.nextUrl.origin;
  if (code) {
    const supabase = await createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/portal`);
}
