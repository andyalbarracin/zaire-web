// File: page.tsx — Setup inicial (crea el primer owner si no hay usuarios)
import { redirect } from 'next/navigation';
import { countUsers } from '@/lib/zaire-ops/profiles';
import SetupForm from './setup-form';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  if ((await countUsers()) > 0) redirect('/dashboard/login');
  return <SetupForm />;
}
