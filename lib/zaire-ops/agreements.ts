// File: agreements.ts
// Path: zaire-web/lib/zaire-ops/agreements.ts
// Description: Acuerdos/contratos de Zaire Ops con aceptación electrónica
//              (magic link + firma + checkbox + audit trail). Server-only.

import { randomBytes } from 'node:crypto';
import { createSupabaseAdmin } from './supabase-admin';

const db = () => createSupabaseAdmin();

export type AgreementStatus = 'borrador' | 'enviado' | 'firmado' | 'anulado';

export interface ZoAgreement {
  id: string;
  client_id: string;
  project_name: string;
  plan: string | null;
  setup_fee: number | null;
  monthly_fee: number | null;
  currency: string;
  terms: string;
  signer_name: string | null;
  signer_email: string | null;
  token: string;
  status: AgreementStatus;
  sent_at: string | null;
  signed_at: string | null;
  signed_name: string | null;
  accepted: boolean;
  signature_url: string | null;
  sign_ip: string | null;
  sign_user_agent: string | null;
  created_at: string;
  updated_at: string;
  client?: { name: string } | null;
}

export const AGREEMENT_STATUS_LABEL: Record<AgreementStatus, string> = {
  borrador: 'Borrador', enviado: 'Enviado', firmado: 'Firmado', anulado: 'Anulado',
};
export const AGREEMENT_STATUS_COLOR: Record<AgreementStatus, string> = {
  borrador: '#6b7280', enviado: '#3b82f6', firmado: '#22c55e', anulado: '#E71D0A',
};

export function genToken(): string {
  return randomBytes(24).toString('base64url');
}

const fmtMoney = (n?: number | null, cur = 'USD') => n == null ? '—' : `${cur} ${Number(n).toLocaleString('es-AR')}`;

// Plantilla EDITABLE de términos. Es un borrador orientativo para Argentina;
// debe ser revisado por un profesional legal antes de usarse en producción.
export function defaultTerms(p: {
  projectName: string; plan?: string | null; setupFee?: number | null; monthlyFee?: number | null; currency?: string; clientName?: string;
}): string {
  const cur = p.currency ?? 'USD';
  const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `ACUERDO DE PRESTACIÓN DE SERVICIOS — ZAIRE

Entre ZAIRE (Andrés Albarracín, "el Proveedor"), con domicilio en Buenos Aires, Argentina, y ${p.clientName ?? 'el Cliente'} ("el Cliente"), se acuerda lo siguiente:

1. OBJETO. El Proveedor desarrollará, pondrá en producción y mantendrá el sistema "${p.projectName}", una aplicación web a medida, conforme al plan contratado "${p.plan ?? '—'}".

2. PRECIO Y FORMA DE PAGO.
   • Setup (pago único): ${fmtMoney(p.setupFee, cur)}.
   • Mantenimiento mensual: ${fmtMoney(p.monthlyFee, cur)} por mes, facturado desde la puesta en producción.
   El mantenimiento incluye hosting administrado, backups diarios, monitoreo, mantenimiento correctivo y de seguridad, soporte por email y WhatsApp, y la bolsa de microajustes evolutivos correspondiente al plan.

3. ALCANCE. Las tareas fuera del alcance del plan (módulos nuevos, integraciones externas, cambios estructurales de base de datos) se presupuestan por separado y por escrito.

4. PROPIEDAD DE LOS DATOS. Todos los datos cargados en el sistema son propiedad exclusiva del Cliente y se entregan en formato exportable (Excel/CSV) ante solicitud. El Proveedor no comparte datos con terceros.

5. CONFIDENCIALIDAD. Ambas partes mantendrán la confidencialidad de la información intercambiada durante la relación.

6. PROPIEDAD INTELECTUAL. El Cliente obtiene una licencia de uso del sistema mientras se mantenga vigente el servicio. El código base, frameworks y componentes reutilizables permanecen como propiedad del Proveedor, salvo acuerdo de cesión por escrito.

7. VIGENCIA Y RENOVACIÓN. El servicio de mantenimiento se renueva mensualmente de forma automática. Cualquiera de las partes puede darlo de baja con 30 días de aviso por escrito.

8. CANCELACIÓN. Ante la baja, el Proveedor entregará una exportación completa de los datos del Cliente, quien abonará los servicios prestados hasta la fecha de baja.

9. LIMITACIÓN DE RESPONSABILIDAD. El Proveedor pondrá su mejor esfuerzo en garantizar disponibilidad y seguridad. No será responsable por daños indirectos o lucro cesante derivados de caídas de servicios de terceros (hosting, conectividad).

10. LEY APLICABLE Y JURISDICCIÓN. Este acuerdo se rige por las leyes de la República Argentina; para cualquier controversia las partes se someten a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.

11. ACEPTACIÓN ELECTRÓNICA. La aceptación de estos términos mediante la firma manuscrita y la casilla de conformidad en esta página constituye manifestación de voluntad válida conforme a la Ley 25.506 y al Código Civil y Comercial de la Nación. Se registran fecha, hora, dirección IP y datos del firmante como constancia.

Emitido el ${today}.`;
}

export async function listAgreements(): Promise<ZoAgreement[]> {
  const { data } = await db().from('zo_agreements').select('*, client:zo_clients(name)').order('created_at', { ascending: false });
  return (data ?? []) as ZoAgreement[];
}

export async function getAgreement(id: string): Promise<ZoAgreement | null> {
  const { data } = await db().from('zo_agreements').select('*, client:zo_clients(name)').eq('id', id).single();
  return (data as ZoAgreement) ?? null;
}

export async function getAgreementByToken(token: string): Promise<ZoAgreement | null> {
  const { data } = await db().from('zo_agreements').select('*, client:zo_clients(name)').eq('token', token).single();
  return (data as ZoAgreement) ?? null;
}

export async function createAgreement(input: Partial<ZoAgreement>): Promise<ZoAgreement> {
  const { data, error } = await db().from('zo_agreements').insert({ ...input, token: genToken() }).select().single();
  if (error) throw new Error(error.message);
  return data as ZoAgreement;
}

export async function updateAgreement(id: string, input: Partial<ZoAgreement>): Promise<void> {
  const { error } = await db().from('zo_agreements').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function signAgreement(token: string, data: {
  signed_name: string; signature_url: string; sign_ip: string | null; sign_user_agent: string | null;
}): Promise<boolean> {
  const { error, count } = await db()
    .from('zo_agreements')
    .update({
      status: 'firmado', accepted: true, signed_at: new Date().toISOString(),
      signed_name: data.signed_name, signature_url: data.signature_url,
      sign_ip: data.sign_ip, sign_user_agent: data.sign_user_agent,
    }, { count: 'exact' })
    .eq('token', token)
    .neq('status', 'firmado');
  return !error && (count ?? 0) > 0;
}
