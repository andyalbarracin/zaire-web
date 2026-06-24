// File: page.tsx — Nuevo acuerdo
import Link from 'next/link';
import { listClients } from '@/lib/zaire-ops/queries';
import AgreementFields from '@/app/dashboard/_components/agreement-fields';
import { createAgreementAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NuevoAcuerdoPage() {
  const clients = await listClients();
  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// COMERCIAL</div><h1 className="zo-h1">Nuevo acuerdo</h1></div>
        <Link href="/dashboard/acuerdos"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>
      {clients.length === 0 ? (
        <div className="zo-card"><div className="zo-empty">Creá un cliente primero. <Link href="/dashboard/clientes/nuevo" style={{ color: '#FF6A00' }}>Nuevo cliente →</Link></div></div>
      ) : (
        <form action={createAgreementAction} className="zo-form">
          <AgreementFields clients={clients} />
          <div className="zo-form-actions">
            <button type="submit" className="zo-btn zo-btn-primary">Crear acuerdo</button>
            <Link href="/dashboard/acuerdos"><button type="button" className="zo-btn">Cancelar</button></Link>
          </div>
        </form>
      )}
    </>
  );
}
