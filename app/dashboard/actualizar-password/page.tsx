'use client';

import { useActionState } from 'react';
import { updatePassword, type UpdatePwState } from './actions';

const initial: UpdatePwState = {};

export default function ActualizarPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, initial);
  return (
    <div className="zo-login">
      <form className="zo-login-box" action={action}>
        <div className="zo-login-brand">ZAIRE <em>OPS</em></div>
        <div className="zo-login-tag">Nueva contraseña</div>
        <div className="zo-form">
          <div className="zo-field"><label className="zo-flabel">Nueva contraseña (mín. 8)</label><input className="zo-input" name="password" type="password" required minLength={8} autoFocus placeholder="••••••••" /></div>
          {state.error && <div className="zo-error">{state.error}</div>}
          <button className="zo-btn zo-btn-primary" type="submit" disabled={pending} style={{ justifyContent: 'center', width: '100%' }}>
            {pending ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
