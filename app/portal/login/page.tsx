// File: page.tsx — Login del portal (magic link).
'use client';

import { Suspense, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { requestMagicLinkAction } from './actions';

function Submit() {
  const { pending } = useFormStatus();
  return <button className="zp-btn zp-btn-primary" type="submit" disabled={pending}>{pending ? 'Enviando…' : 'Enviar link de acceso'}</button>;
}

function LoginInner() {
  const [state, action] = useActionState(requestMagicLinkAction, {});
  const error = useSearchParams().get('error');

  return (
    <div className="zp-shell" style={{ maxWidth: 420, paddingTop: 80 }}>
      <div className="zp-brand" style={{ fontSize: 20, marginBottom: 24 }}>ZAIRE <em>·</em> Portal</div>
      {error === 'unauthorized' && <div className="zp-alert zp-alert-warn">Tu email no está habilitado para ningún portal. Escribinos a hola@zairetech.com.</div>}
      {state.sent ? (
        <div className="zp-alert zp-alert-ok">Te enviamos un link de acceso a tu email. Revisá tu bandeja (y spam).</div>
      ) : (
        <form action={action}>
          <p className="zp-sub">Ingresá con tu email. Te mandamos un link para entrar, sin contraseñas.</p>
          <div className="zp-field">
            <label className="zp-flabel">Email</label>
            <input className="zp-input" name="email" type="email" required placeholder="vos@empresa.com" />
          </div>
          {state.error && <div className="zp-alert zp-alert-warn">{state.error}</div>}
          <Submit />
        </form>
      )}
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
