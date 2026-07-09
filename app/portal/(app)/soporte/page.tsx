// File: page.tsx — Soporte / ayuda del portal (manuales de uso, normas).
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';

export const dynamic = 'force-dynamic';

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="zp-card" style={{ marginBottom: 16 }}>
      <div className="zp-lbl" style={{ marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#cfcfcf', lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

export default async function PortalSoporte() {
  const { clientId, email } = await requirePortalClient();
  await logPortalEvent({ clientId, email, event: 'view_support' });

  return (
    <>
      <div className="zp-lbl">// SOPORTE</div>
      <h1 className="zp-h1">Ayuda y guías de uso</h1>
      <div className="zp-sub">Cómo aprovechar tu portal y trabajar con ZAIRE.</div>

      <Block title="Qué encontrás en tu portal">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li><strong>Finanzas:</strong> tus facturas, saldo y vencimientos, con descarga en PDF.</li>
          <li><strong>Acuerdos:</strong> tus acuerdos enviados y firmados.</li>
          <li><strong>Documentos:</strong> entregables como el handoff del proyecto y presupuestos.</li>
          <li><strong>Mi empresa:</strong> tus datos y los accesos habilitados.</li>
          <li><strong>Incidencias:</strong> abrí y seguí pedidos de soporte.</li>
        </ul>
      </Block>

      <Block title="Cómo presentar una incidencia">
        Entrá a <strong>Incidencias → Nueva incidencia</strong>. Poné un título claro, describí
        el problema con el mayor detalle posible y elegí la prioridad. Podés adjuntar
        <strong> imágenes o videos</strong> (hasta 50&nbsp;MB) para mostrar el caso. Vas a poder
        seguir el estado desde la misma sección; también te contactamos por email.
      </Block>

      <Block title="Prioridades — cómo elegir">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li><strong>Baja:</strong> consulta o mejora sin urgencia.</li>
          <li><strong>Media:</strong> algo que molesta pero podés seguir operando.</li>
          <li><strong>Alta:</strong> afecta una parte importante de tu operación.</li>
          <li><strong>Crítica:</strong> algo está caído o bloquea tu trabajo.</li>
        </ul>
      </Block>

      <Block title="Seguridad y buenas prácticas">
        Tu acceso es personal: el link de ingreso llega a tu email y no requiere contraseña.
        No compartas ese link. Solo vas a ver la información de tu empresa. Si detectás algo
        raro o perdés acceso, escribinos a <a href="mailto:hola@zairetech.com" style={{ color: '#FF6A00' }}>hola@zairetech.com</a>.
      </Block>

      <Block title="¿Necesitás ayuda?">
        Escribinos a <a href="mailto:hola@zairetech.com" style={{ color: '#FF6A00' }}>hola@zairetech.com</a> o
        abrí una incidencia. Estamos para ayudarte.
      </Block>
    </>
  );
}
