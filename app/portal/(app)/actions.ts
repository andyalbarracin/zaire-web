'use server';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/zaire-ops/supabase-server';

export async function portalSignOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect('/portal/login');
}
