// File: page.tsx — Nuevo acuerdo
import Link from 'next/link';
import { listClients } from '@/lib/zaire-ops/queries';
import AgreementFields from '@/app/dashboard/_components/agreement-fields';
import FormShell from '@/app/dashboard/_components/form-shell';
import { createAgreementAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NuevoAcuerdoPage() {
  const clients = await listClients();
  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// COMERCIAL</div><h1 className="zo-h1">Nuevo acuerdo</h1></div>
        <Link href="/dashboard/acuerdos"><button className="zo-btn zo-back">← Volver</button></Link>
      </div>
      {clients.length === 0 ? (
        <div className="zo-card"><div className="zo-empty">Creá un cliente primero. <Link href="/dashboard/clientes/nuevo" style={{ color: '#FF6A00' }}>Nuevo cliente →</Link></div></div>
      ) : (
        <FormShell action={createAgreementAction} submitLabel="Crear acuerdo" cancelHref="/dashboard/acuerdos">
          <AgreementFields clients={clients} />
        </FormShell>
      )}
    </>
  );
}
