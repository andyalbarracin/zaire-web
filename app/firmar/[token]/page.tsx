// File: page.tsx — Página pública de firma de acuerdo (magic link). Sin auth.
import type { Metadata } from 'next';
import { getAgreementByToken, type ZoAgreement } from '@/lib/zaire-ops/agreements';
import SignaturePad from './signature-pad';
import { signAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Firmar acuerdo — ZAIRE', robots: { index: false, follow: false } };

const lbl: React.CSSProperties = { fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', marginBottom: 4 };
const fmt = (n: number | null, cur: string) => n == null ? '—' : `${cur} ${Number(n).toLocaleString('es-AR')}`;

function Info({ a }: { a: ZoAgreement }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px 24px', marginBottom: 24, fontSize: 13.5 }}>
      <div><div style={lbl}>Cliente</div>{a.client?.name ?? '—'}</div>
      <div><div style={lbl}>Proyecto</div>{a.project_name}</div>
      <div><div style={lbl}>Plan</div>{a.plan ?? '—'}</div>
      <div><div style={lbl}>Inversión</div>{fmt(a.setup_fee, a.currency)} setup · {fmt(a.monthly_fee, a.currency)}/mes</div>
    </div>
  );
}

function Terms({ terms }: { terms: string }) {
  return (
    <>
      <div style={lbl}>Términos y condiciones</div>
      <div style={{ whiteSpace: 'pre-wrap', fontSize: 12.5, lineHeight: 1.7, color: '#333', background: '#faf9f6', border: '1px solid #e5e3dd', borderRadius: 6, padding: '18px 20px', maxHeight: 380, overflow: 'auto' }}>{terms}</div>
    </>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e3dd', borderRadius: 6, padding: 36 }}>{children}</div>
      <div style={{ textAlign: 'center', marginTop: 16, fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#999' }}>ZAIRE · zairetech.com</div>
    </div>
  );
}

const Header = (
  <div style={{ borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 24 }}>
    <div style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 900 }}>ZAIRE</div>
    <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#FF6A00' }}>Acuerdo de servicios</div>
  </div>
);

export default async function FirmarPage({
  params, searchParams,
}: { params: Promise<{ token: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const a = await getAgreementByToken(token);

  if (!a) return <Wrap><p style={{ color: '#555' }}>Este link no es válido o expiró. Pedí uno nuevo a ZAIRE.</p></Wrap>;

  if (a.status === 'firmado' || sp.ok === '1') {
    return (
      <Wrap>
        {Header}
        <div style={{ background: '#e9f9ee', border: '1px solid #b6e6c4', color: '#1c7a3f', borderRadius: 6, padding: '14px 16px', marginBottom: 20, fontSize: 14 }}>
          ✓ Acuerdo aceptado y firmado{a.signed_at ? ` el ${new Date(a.signed_at).toLocaleString('es-AR')}` : ''}. ¡Gracias!
        </div>
        <Info a={a} />
        <Terms terms={a.terms} />
        {a.signature_url && (
          <div style={{ marginTop: 20 }}>
            <div style={lbl}>Firma</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.signature_url} alt="firma" style={{ maxWidth: 300, border: '1px solid #e5e3dd', borderRadius: 6 }} />
          </div>
        )}
      </Wrap>
    );
  }

  return (
    <Wrap>
      {Header}
      <Info a={a} />
      <Terms terms={a.terms} />
      {sp.err === '1' && (
        <div style={{ background: '#fde8e6', border: '1px solid #f5b8b1', color: '#c0392b', borderRadius: 6, padding: '10px 14px', margin: '16px 0', fontSize: 13 }}>
          Para firmar necesitás dibujar tu firma, escribir tu nombre y marcar la casilla de aceptación.
        </div>
      )}
      <form action={signAction.bind(null, token)} style={{ marginTop: 24 }}>
        <div style={lbl}>Tu firma</div>
        <SignaturePad />
        <div style={{ marginTop: 16 }}>
          <label style={{ ...lbl, display: 'block' }}>Nombre y apellido</label>
          <input name="signed_name" required defaultValue={a.signer_name ?? ''} placeholder="Tu nombre completo"
            style={{ width: '100%', padding: '11px 13px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14 }} />
        </div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '18px 0', fontSize: 13.5, color: '#333', cursor: 'pointer' }}>
          <input type="checkbox" name="accepted" required style={{ marginTop: 3, width: 16, height: 16, accentColor: '#FF6A00' }} />
          <span>He leído y <strong>acepto</strong> los términos y condiciones detallados arriba para el proyecto <strong>{a.project_name}</strong>.</span>
        </label>
        <button type="submit" style={{ width: '100%', padding: 13, background: '#FF6A00', color: '#111', border: 'none', borderRadius: 6, fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer' }}>
          Firmar y aceptar
        </button>
        <p style={{ fontSize: 11, color: '#999', marginTop: 12, textAlign: 'center' }}>Al firmar se registran fecha, hora e IP como constancia (Ley 25.506).</p>
      </form>
    </Wrap>
  );
}
