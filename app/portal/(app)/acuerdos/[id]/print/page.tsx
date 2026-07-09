// File: page.tsx — PDF de acuerdo del portal (verifica que sea del cliente logueado).
import { notFound } from 'next/navigation';
import { requirePortalClient, logPortalEvent } from '@/lib/zaire-ops/portal';
import { getAgreement } from '@/lib/zaire-ops/agreements';
import PrintButton from '@/app/dashboard/reportes-print/print-button';

export const dynamic = 'force-dynamic';

export default async function PortalAgreementPrint({ params }: { params: Promise<{ id: string }> }) {
  const { clientId, email } = await requirePortalClient();
  const { id } = await params;
  const a = await getAgreement(id);
  if (!a || a.client_id !== clientId) notFound();
  await logPortalEvent({ clientId, email, event: 'download_agreement', entityType: 'agreement', entityId: id });

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111' }}>
      <div className="zo-noprint" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <PrintButton />
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '44px 44px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #111', paddingBottom: 14, marginBottom: 28 }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: 20, fontWeight: 900 }}>ZAIRE</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>{a.client?.name ?? ''}</div>
        </div>

        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 12.5, lineHeight: 1.65, color: '#1a1a1a' }}>
          {a.terms}
        </div>

        {a.status === 'firmado' && (
          <div style={{ marginTop: 40, borderTop: '1px solid #ddd', paddingTop: 20 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', marginBottom: 12 }}>Constancia de firma electrónica</div>
            <table style={{ fontSize: 12.5, color: '#222' }}>
              <tbody>
                <tr><td style={{ padding: '3px 18px 3px 0', color: '#888' }}>Firmante</td><td>{a.signed_name ?? a.signer_name ?? '—'}</td></tr>
                <tr><td style={{ padding: '3px 18px 3px 0', color: '#888' }}>Fecha y hora</td><td>{a.signed_at ? new Date(a.signed_at).toLocaleString('es-AR') : '—'}</td></tr>
                <tr><td style={{ padding: '3px 18px 3px 0', color: '#888' }}>Aceptó términos</td><td>{a.accepted ? 'Sí' : 'No'}</td></tr>
                <tr><td style={{ padding: '3px 18px 3px 0', color: '#888' }}>Dirección IP</td><td style={{ fontFamily: 'monospace' }}>{a.sign_ip ?? '—'}</td></tr>
              </tbody>
            </table>
            {a.signature_url && (
              <div style={{ marginTop: 14 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.signature_url} alt="firma" style={{ maxWidth: 300, border: '1px solid #ddd', borderRadius: 6 }} />
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 36, fontFamily: 'monospace', fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.08em', borderTop: '1px solid #eee', paddingTop: 14 }}>
          Documento generado por Zaire Ops · zairetech.com
        </div>
      </div>
    </div>
  );
}
