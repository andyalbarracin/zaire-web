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

// Plantilla EDITABLE de términos para Argentina (orientativa; revisar con un profesional
// legal antes de producción). Se parametriza con los datos del acuerdo.
export function defaultTerms(p: {
  projectName: string; plan?: string | null; setupFee?: number | null; monthlyFee?: number | null; currency?: string; clientName?: string;
}): string {
  const cur = p.currency ?? 'USD';
  const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const cliente = p.clientName ?? '"CLIENTE"';
  return `TÉRMINOS Y CONDICIONES
ACUERDO DE PRESTACIÓN DE SERVICIOS — ZAIRE

Entre ZAIRE (Andrés Albarracín, en adelante, el Proveedor), con domicilio en Buenos Aires, Argentina, y ${cliente} (en adelante, el Cliente), se acuerda lo siguiente:

1. OBJETO
El Proveedor desarrollará, pondrá en producción y mantendrá el sistema "${p.projectName}", una aplicación web a medida, conforme al plan contratado "${p.plan ?? '—'}" y al presupuesto/comercial aprobado por el Cliente, que forma parte integrante del presente acuerdo.

2. PRECIO, FACTURACIÓN Y FORMA DE PAGO
El Cliente abonará al Proveedor:
   • Setup (pago único): ${fmtMoney(p.setupFee, cur)}.
   • Mantenimiento mensual: ${fmtMoney(p.monthlyFee, cur)} por mes, facturado desde la puesta en producción.
Salvo que se indique otra cosa por escrito, los importes se expresan en dólares estadounidenses y no incluyen impuestos, percepciones, retenciones, comisiones bancarias ni costos de transferencia, que estarán a cargo del Cliente si correspondieran.
Las facturas deberán abonarse dentro de los 5 días corridos desde su fecha de emisión, salvo pacto distinto por escrito.

3. MORA Y SUSPENSIÓN
La falta de pago en término producirá la mora automática, sin necesidad de intimación previa. En caso de mora, el Proveedor podrá, previa notificación por email o WhatsApp:
   • suspender total o parcialmente el servicio, soporte, mantenimiento o acceso al sistema;
   • reprogramar tareas pendientes;
   • retener entregas no vencidas hasta la regularización de la deuda.
La suspensión por falta de pago no implicará renuncia al cobro de los importes adeudados ni resolverá automáticamente el contrato.

4. ALCANCE DEL SERVICIO
El mantenimiento mensual incluye, conforme al plan contratado y al presupuesto aprobado:
   • hosting o infraestructura administrada por el Proveedor o por terceros contratados a tal fin;
   • backups según disponibilidad y políticas del proveedor de infraestructura utilizado;
   • monitoreo razonable del servicio;
   • mantenimiento correctivo;
   • actualizaciones de seguridad razonables;
   • soporte por email y WhatsApp dentro de horario comercial;
   • microajustes evolutivos incluidos en el plan, si correspondieran.
Quedan expresamente fuera de alcance, salvo presupuesto adicional aceptado por escrito:
   • módulos nuevos;
   • integraciones externas no previstas originalmente;
   • cambios estructurales de base de datos;
   • migraciones complejas;
   • cambios de lógica de negocio;
   • desarrollos no contemplados en el presupuesto inicial;
   • soporte fuera del horario previsto;
   • tareas derivadas de cambios regulatorios, técnicos o comerciales ajenos al alcance original.

5. PLAZO MÍNIMO, VIGENCIA Y RENOVACIÓN
El presente acuerdo tendrá un plazo mínimo de permanencia de 4 meses contados desde la puesta en producción del sistema. Cumplido ese plazo mínimo, el servicio de mantenimiento se renovará mensualmente de forma automática, salvo notificación de baja cursada por cualquiera de las partes con una antelación mínima de 30 días corridos. Si el Cliente solicitara la baja antes de cumplir el plazo mínimo, deberá abonar igualmente los importes comprometidos hasta completar dicho plazo.

6. ACEPTACIÓN DE ENTREGABLES
Los entregables, avances, módulos o funcionalidades presentadas por el Proveedor se considerarán aceptados si el Cliente no formula observaciones concretas por escrito dentro de los 3 días hábiles de su entrega o habilitación para revisión. El Cliente contará con hasta 3 rondas razonables de revisión sobre cada entrega comprendida en el alcance aprobado. Las solicitudes adicionales, cambios de criterio o nuevos requerimientos podrán ser considerados fuera de alcance y presupuestarse aparte. Las observaciones deberán ser claras, concretas y referidas al alcance contratado. La falta de respuesta del Cliente dentro del plazo indicado implicará aprobación tácita.

7. SOPORTE Y CANALES VÁLIDOS
El soporte ordinario será prestado de lunes a viernes, de 9:00 a 18:00 horas, en días hábiles, mediante los canales informados por el Proveedor, principalmente email y WhatsApp. El Proveedor procurará responder las consultas dentro de la misma jornada hábil o, según la complejidad del caso, dentro de un plazo razonable. Los tiempos de resolución podrán variar según la naturaleza del incidente, la disponibilidad de terceros y la necesidad de acceso, validación o información por parte del Cliente. No se garantiza atención inmediata ni soporte fuera del horario indicado, salvo acuerdo expreso por escrito.

8. DATOS, CONFIDENCIALIDAD Y TRATAMIENTO
Todos los datos cargados en el sistema son propiedad del Cliente. En caso de que el sistema procese datos personales, el Cliente será el responsable de los datos y de su licitud de recolección, carga y uso; el Proveedor actuará únicamente como prestador técnico en la medida en que intervenga sobre esos datos para prestar el servicio. El Proveedor no compartirá los datos del Cliente con terceros, salvo:
   • proveedores tecnológicos necesarios para la prestación del servicio;
   • requerimiento legal o judicial;
   • autorización expresa del Cliente.
El servicio podrá utilizar infraestructura o servicios de terceros seleccionados por el Proveedor, incluyendo, entre otros, hosting, base de datos, almacenamiento, autenticación, correo o monitoreo. El Proveedor no será responsable por fallas propias de esos terceros, sin perjuicio de realizar esfuerzos razonables de gestión y seguimiento. Ambas partes se obligan a mantener la confidencialidad de la información comercial, técnica y operativa intercambiada durante la relación contractual, obligación que subsistirá aun después de terminada la relación.

9. PROPIEDAD INTELECTUAL
Salvo pacto expreso de cesión por escrito, el Cliente obtiene una licencia de uso del sistema mientras se mantenga vigente la contratación y al día en sus pagos. El código base, frameworks, librerías, componentes reutilizables, lógica general, know-how, plantillas, automatizaciones reutilizables y demás activos preexistentes o reutilizables del Proveedor permanecerán como propiedad exclusiva del Proveedor. Los desarrollos específicos para el Cliente podrán ser utilizados por este dentro del marco del servicio contratado. La entrega de código fuente, cesión total de derechos o migración completa del sistema no se presumirán y requerirán acuerdo específico por escrito.

10. COLABORACIÓN DEL CLIENTE
El Cliente se obliga a:
   • designar un interlocutor válido;
   • brindar información, accesos y validaciones necesarias;
   • revisar avances y entregables en tiempo razonable;
   • comunicar errores o incidencias con suficiente detalle;
   • utilizar el sistema de manera diligente y conforme a su finalidad.
Las demoras, omisiones o faltas de respuesta del Cliente podrán afectar plazos de entrega, soporte o implementación, sin que ello configure incumplimiento del Proveedor.

11. BAJA, PORTABILIDAD Y SALIDA
Una vez solicitada válidamente la baja con el preaviso indicado, el Proveedor entregará al Cliente una exportación razonable de sus datos en formato estándar o exportable, como por ejemplo CSV o Excel, dentro de los 30 días corridos siguientes a la fecha efectiva de baja, siempre que el Cliente se encuentre al día con todos sus pagos. La migración asistida, transformaciones especiales de datos, soporte a terceros proveedores, reinstalaciones, documentación ampliada o tareas extraordinarias de salida no están incluidas y podrán presupuestarse por separado. Luego de la baja efectiva y de la entrega de la exportación, el Proveedor podrá desactivar accesos, infraestructura, automatizaciones y entornos vinculados al servicio, sin obligación de conservación indefinida.

12. LIMITACIÓN DE RESPONSABILIDAD
El Proveedor asumirá una obligación de medios y no garantiza resultados comerciales específicos, continuidad absoluta, ausencia total de errores ni disponibilidad ininterrumpida. En ningún caso el Proveedor será responsable por:
   • daños indirectos;
   • lucro cesante;
   • pérdida de chance;
   • pérdida de negocios;
   • decisiones tomadas por el Cliente en base al uso del sistema;
   • incidentes originados en servicios de terceros;
   • caídas de conectividad, hosting, APIs, integraciones, correo, base de datos u otros proveedores externos;
   • uso indebido del sistema por parte del Cliente o de terceros autorizados por este.
La responsabilidad total del Proveedor, cualquiera fuere su causa, quedará limitada al monto efectivamente abonado por el Cliente al Proveedor en los 3 meses anteriores al hecho que motive el reclamo.

13. FUERZA MAYOR Y TERCEROS
El Proveedor no será responsable por incumplimientos o demoras causados por hechos de fuerza mayor, caso fortuito, actos de autoridad, cortes de energía, fallas masivas de internet, ataques informáticos generalizados o fallas de proveedores externos esenciales para la prestación del servicio. Asimismo, el Cliente reconoce que determinados componentes del servicio dependen de terceros y pueden verse afectados por cambios de precio, políticas, límites técnicos, interrupciones o discontinuidad decididos por dichos terceros.

14. NOTIFICACIONES
Las partes constituyen como domicilios y canales válidos de notificación los informados al inicio de la relación comercial y/o en el presupuesto, incluyendo domicilio electrónico, email y WhatsApp de contacto operativo y administrativo. Toda comunicación enviada por esos medios se considerará válida, salvo notificación fehaciente de cambio.

15. LEY APLICABLE Y JURISDICCIÓN
Este acuerdo se regirá por las leyes de la República Argentina. Para cualquier controversia derivada de su interpretación, cumplimiento o ejecución, las partes se someten a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, con renuncia a cualquier otro fuero o jurisdicción que pudiera corresponder.

16. ACEPTACIÓN ELECTRÓNICA
Las partes reconocen la validez de la celebración y aceptación del presente acuerdo por medios electrónicos. La conformidad podrá acreditarse mediante firma electrónica, firma manuscrita digitalizada, aceptación por correo electrónico, casilla de conformidad, validación por mensaje o cualquier otro medio electrónico razonable que permita identificar al aceptante y dejar constancia de su voluntad. Como respaldo, podrán conservarse registros de fecha, hora, dirección IP, correo electrónico, mensajes de validación, versión del documento aceptado y demás evidencias técnicas disponibles.

Emitido el ${today}.

Proveedor: ZAIRE / Andrés Albarracín
Cliente: ${p.clientName ?? '[NOMBRE / RAZÓN SOCIAL]'}
Firma / aceptación electrónica: __________________`;
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
