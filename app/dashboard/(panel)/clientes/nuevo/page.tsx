// File: page.tsx — Nuevo cliente
import Link from 'next/link';
import ClientFields from '@/app/dashboard/_components/client-fields';
import FormShell from '@/app/dashboard/_components/form-shell';
import { createClientAction } from '../actions';

export default function NuevoClientePage() {
  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// CLIENTES</div><h1 className="zo-h1">Nuevo cliente</h1></div>
        <Link href="/dashboard/clientes"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>
      <FormShell action={createClientAction} submitLabel="Crear cliente" cancelHref="/dashboard/clientes">
        <ClientFields />
      </FormShell>
    </>
  );
}
