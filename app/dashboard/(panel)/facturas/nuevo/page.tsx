// File: page.tsx — Nueva factura
import Link from 'next/link';
import { listClients } from '@/lib/zaire-ops/queries';
import InvoiceFields from '@/app/dashboard/_components/invoice-fields';
import FormShell from '@/app/dashboard/_components/form-shell';
import { createInvoiceAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NuevaFacturaPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client } = await searchParams;
  const clients = await listClients();
  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// COMERCIAL</div><h1 className="zo-h1">Nuevo invoice</h1></div>
        <Link href="/dashboard/facturas"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>
      {clients.length === 0 ? (
        <div className="zo-card"><div className="zo-empty">Creá un cliente primero. <Link href="/dashboard/clientes/nuevo" style={{ color: '#FF6A00' }}>Nuevo cliente →</Link></div></div>
      ) : (
        <FormShell action={createInvoiceAction} submitLabel="Crear invoice" cancelHref="/dashboard/facturas">
          <InvoiceFields clients={clients} defaultClientId={client} />
        </FormShell>
      )}
    </>
  );
}
