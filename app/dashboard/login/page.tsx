// File: page.tsx
// Path: zaire-web/app/dashboard/login/page.tsx
// Description: Pantalla de login de Zaire Ops. Usa el layout base (oscuro, sin shell).

'use client';

import { useActionState } from 'react';
import { signIn, type LoginState } from './actions';

const initial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <div className="zo-login">
      <form className="zo-login-box" action={action}>
        <div className="zo-login-brand">ZAIRE <em>OPS</em></div>
        <div className="zo-login-tag">Panel operativo · acceso privado</div>

        <div className="zo-form">
          <div className="zo-field">
            <label className="zo-flabel" htmlFor="email">Email</label>
            <input className="zo-input" id="email" name="email" type="email" required autoFocus placeholder="tu@email.com" />
          </div>
          <div className="zo-field">
            <label className="zo-flabel" htmlFor="password">Contraseña</label>
            <input className="zo-input" id="password" name="password" type="password" required placeholder="••••••••" />
          </div>

          {state.error && <div className="zo-error">{state.error}</div>}

          <button className="zo-btn zo-btn-primary" type="submit" disabled={pending}
            style={{ justifyContent: 'center', width: '100%' }}>
            {pending ? 'Ingresando…' : 'Ingresar →'}
          </button>
        </div>
      </form>
    </div>
  );
}
