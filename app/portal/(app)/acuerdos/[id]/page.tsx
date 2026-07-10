// File: page.tsx — Detalle de acuerdo en el portal: términos + firma electrónica tipeada.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { getAgreement } from '@/lib/zaire-ops/agreements';
import { getClient } from '@/lib/zaire-ops/queries';
import SignModal from '../sign-modal';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = { enviado: '#FFC107', firmado: '#22c55e', anulado: '#E71D0A' };

export default async function PortalAgreementDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ signed?: string; err?: string }> }) {
  const { clientId, email } = await requirePortalClient();
  const { id } = await params;
  const { signed, err } = await searchParams;
  const a = await getAgreement(id);
  if (!a || a.client_id !== clientId || a.status === 'borrador') notFound();
  await logPortalEvent({ clientId, email, event: 'view_agreement', entityType: 'agreement', entityId: id });

  const client = await getClient(clientId);
  const isSigned = a.status === 'firmado';
  const canSign = a.status === 'enviado';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="zp-lbl">// ACUERDO</div>
          <h1 className="zp-h1">{a.project_name}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className="zp-chip"><span className="zp-dot" style={{ background: STATUS_COLOR[a.status] ?? '#888' }} />{isSigned ? 'Firmado' : a.status === 'enviado' ? 'Pendiente de firma' : a.status}</span>
            {a.plan && <span className="zp-chip">{a.plan}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="zp-btn" href={`/portal/acuerdos/${a.id}/print`} target="_blank" rel="noopener noreferrer">Ver / descargar PDF</a>
          <Link className="zp-btn" href="/portal/acuerdos">← Volver</Link>
        </div>
      </div>

      {signed && <div className="zp-alert zp-alert-ok" style={{ marginTop: 20 }}>¡Acuerdo firmado! Gracias. Quedó registrada tu aceptación. ✓</div>}
      {err && <div className="zp-alert zp-alert-warn" style={{ marginTop: 20 }}>Completá tu nombre y aceptá los términos para firmar.</div>}

      {/* Términos del acuerdo */}
      <div className="zp-card" style={{ marginTop: 20 }}>
        <div className="zp-lbl" style={{ marginBottom: 12 }}>Términos y condiciones</div>
        <div style={{ maxHeight: 460, overflowY: 'auto', fontSize: 13.5, color: '#cfcfcf', lineHeight: 1.7, whiteSpace: 'pre-wrap', paddingRight: 8 }}>
          {a.terms}
        </div>
      </div>

      {/* Firma */}
      <div className="zp-card" style={{ marginTop: 16 }}>
        <div className="zp-lbl" style={{ marginBottom: 12 }}>Firma</div>
        {isSigned ? (
          <div>
            <div className="zp-sign-line" style={{ maxWidth: 380 }}>
              {a.signature_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={a.signature_url} alt="firma" style={{ maxHeight: 52 }} />
                : <span className="zp-sign-preview">{a.signed_name}</span>}
            </div>
            <div style={{ fontSize: 12.5, color: '#888', marginTop: 12, lineHeight: 1.7 }}>
              Firmado por <strong style={{ color: '#ddd' }}>{a.signed_name}</strong>
              {a.signed_at && <> · {new Date(a.signed_at).toLocaleString('es-AR')}</>}<br />
              Firma electrónica registrada con aceptación de términos. Constancia: {email}{a.sign_ip ? ` · IP ${a.sign_ip}` : ''}.
            </div>
          </div>
        ) : canSign ? (
          <>
            <p className="zp-sub" style={{ marginBottom: 12 }}>
              Al firmar, dejás registrada tu aceptación de los términos de arriba. Es una <strong>firma electrónica</strong>: querés saber más en la sección <Link href="/portal/soporte" style={{ color: '#FF6A00' }}>Soporte</Link>.
            </p>
            <SignModal id={a.id} defaultName={client?.contact_name ?? ''} />
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#888' }}>Este acuerdo no está disponible para firmar.</div>
        )}
      </div>
    </>
  );
}
