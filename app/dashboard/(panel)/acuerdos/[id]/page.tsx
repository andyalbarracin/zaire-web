// File: page.tsx — Detalle de acuerdo (magic link + estado + firma)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getAgreement, AGREEMENT_STATUS_LABEL, AGREEMENT_STATUS_COLOR } from '@/lib/zaire-ops/agreements';
import { listClients } from '@/lib/zaire-ops/queries';
import AgreementFields from '@/app/dashboard/_components/agreement-fields';
import FormShell from '@/app/dashboard/_components/form-shell';
import CopyLink from '@/app/dashboard/_components/copy-link';
import { updateAgreementAction, markSentAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AgreementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAgreement(id);
  if (!a) notFound();
  const clients = await listClients();

  const h = await headers();
  const host = h.get('host') ?? '';
  const proto = host.includes('localhost') ? 'http' : 'https';
  const link = `${proto}://${host}/firmar/${a.token}`;

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// ACUERDO</div>
          <h1 className="zo-h1">{a.project_name}</h1>
          <div className="zo-sub" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className="zo-chip"><span className="zo-dot" style={{ background: AGREEMENT_STATUS_COLOR[a.status] }} />{AGREEMENT_STATUS_LABEL[a.status]}</span>
            <span className="zo-chip">{a.client?.name}</span>
            {a.plan && <span className="zo-chip">{a.plan}</span>}
          </div>
        </div>
        <Link href="/dashboard/acuerdos"><button className="zo-btn zo-btn-ghost">← Volver</button></Link>
      </div>

      {a.status !== 'anulado' && (
        <div className="zo-card">
          <div className="zo-card-title">// LINK DE FIRMA (MAGIC LINK)</div>
          <CopyLink url={link} />
          <div className="zo-sub" style={{ fontSize: 12, marginTop: 10 }}>Envialo al cliente. Al abrirlo lee los términos, firma y acepta — el estado se actualiza acá solo.</div>
          {a.status === 'borrador' && (
            <form action={markSentAction.bind(null, a.id)} style={{ marginTop: 14 }}><button className="zo-btn zo-btn-sm" type="submit">Marcar como enviado</button></form>
          )}
        </div>
      )}

      {a.status === 'firmado' ? (
        <div className="zo-card zo-section-gap">
          <div className="zo-card-title">// FIRMADO ✓</div>
          <dl className="zo-dl">
            <dt>Firmante</dt><dd>{a.signed_name ?? a.signer_name ?? '—'}</dd>
            <dt>Fecha y hora</dt><dd>{a.signed_at ? new Date(a.signed_at).toLocaleString('es-AR') : '—'}</dd>
            <dt>Aceptó términos</dt><dd>{a.accepted ? 'Sí' : 'No'}</dd>
            <dt>IP</dt><dd className="zo-mono">{a.sign_ip ?? '—'}</dd>
          </dl>
          {a.signature_url && (
            <div style={{ marginTop: 16 }}>
              <div className="zo-flabel" style={{ marginBottom: 8 }}>Firma</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.signature_url} alt="firma" style={{ maxWidth: 320, background: '#fff', borderRadius: 8, border: '1px solid #222' }} />
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={link} target="_blank" rel="noopener noreferrer"><button className="zo-btn zo-btn-sm" type="button">Ver acuerdo firmado</button></a>
            <a href={`/dashboard/acuerdos-print?id=${a.id}`} target="_blank" rel="noopener noreferrer"><button className="zo-btn zo-btn-sm" type="button">Descargar PDF</button></a>
          </div>
        </div>
      ) : (
        <div className="zo-card zo-section-gap">
          <div className="zo-card-title">// EDITAR ACUERDO</div>
          <FormShell
            action={updateAgreementAction.bind(null, a.id)}
            submitLabel="Guardar cambios"
            extra={<a href={`/dashboard/acuerdos-print?id=${a.id}`} target="_blank" rel="noopener noreferrer"><button type="button" className="zo-btn">Descargar PDF</button></a>}
          >
            <AgreementFields agreement={a} clients={clients} />
          </FormShell>
        </div>
      )}
    </>
  );
}
