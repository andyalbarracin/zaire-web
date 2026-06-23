// File: page.tsx — Nuevo cliente
import Link from 'next/link';
import ClientFields from '@/app/dashboard/_components/client-fields';
import { createClientAction } from '../actions';

export default function NuevoClientePage() {
  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// CLIENTES</div><h1 className="zo-h1">Nuevo cliente</h1></div>
        <Link href="/dashboard/clientes"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>
      <form action={createClientAction} className="zo-form">
        <ClientFields />
        <div className="zo-form-actions">
          <button type="submit" className="zo-btn zo-btn-primary">Crear cliente</button>
          <Link href="/dashboard/clientes"><button type="button" className="zo-btn">Cancelar</button></Link>
        </div>
      </form>
    </>
  );
}
