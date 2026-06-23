// File: actions.ts
// Path: zaire-web/app/dashboard/actions.ts
// Description: Server actions compartidas del panel (logout).

'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect('/dashboard/login');
}
