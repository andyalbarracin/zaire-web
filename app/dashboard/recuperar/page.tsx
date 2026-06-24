'use client';

import { useActionState } from 'react';
import { requestReset, type RecoverState } from './actions';

const initial: RecoverState = {};

export default function RecuperarPage() {
  const [state, action, pending] = useActionState(requestReset, initial);
  return (
    <div className="zo-login">
      <form className="zo-login-box" action={action}>
        <div className="zo-login-brand">ZAIRE <em>OPS</em></div>
        <div className="zo-login-tag">Recuperar contraseña</div>
        {state.ok ? (
          <div className="zo-form">
            <div className="zo-card" style={{ background: 'rgba(34,197,94,.08)', borderColor: 'rgba(34,197,94,.3)', color: '#9be8b3' }}>
              Te enviamos un email con el link para restablecer tu contraseña. Revisá tu bandeja (y spam).
            </div>
            <a href="/dashboard/login" className="zo-btn" style={{ justifyContent: 'center' }}>← Volver al login</a>
          </div>
        ) : (
          <div className="zo-form">
            <div className="zo-field"><label className="zo-flabel">Email</label><input className="zo-input" name="email" type="email" required autoFocus placeholder="tu@email.com" /></div>
            {state.error && <div className="zo-error">{state.error}</div>}
            <button className="zo-btn zo-btn-primary" type="submit" disabled={pending} style={{ justifyContent: 'center', width: '100%' }}>
              {pending ? 'Enviando…' : 'Enviar link de recuperación'}
            </button>
            <a href="/dashboard/login" className="zo-sub" style={{ fontSize: 12, textAlign: 'center' }}>← Volver al login</a>
          </div>
        )}
      </form>
    </div>
  );
}
