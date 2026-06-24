'use client';

import { useActionState } from 'react';
import { createFirstOwner, type SetupState } from './actions';

const initial: SetupState = {};

export default function SetupForm() {
  const [state, action, pending] = useActionState(createFirstOwner, initial);
  return (
    <div className="zo-login">
      <form className="zo-login-box" action={action}>
        <div className="zo-login-brand">ZAIRE <em>OPS</em></div>
        <div className="zo-login-tag">Configuración inicial · crear owner</div>
        <div className="zo-form">
          <div className="zo-field"><label className="zo-flabel">Tu nombre</label><input className="zo-input" name="full_name" placeholder="Andrés" autoFocus /></div>
          <div className="zo-field"><label className="zo-flabel">Email</label><input className="zo-input" name="email" type="email" required placeholder="tu@email.com" /></div>
          <div className="zo-field"><label className="zo-flabel">Contraseña (mín. 8)</label><input className="zo-input" name="password" type="password" required minLength={8} placeholder="••••••••" /></div>
          {state.error && <div className="zo-error">{state.error}</div>}
          <button className="zo-btn zo-btn-primary" type="submit" disabled={pending} style={{ justifyContent: 'center', width: '100%' }}>
            {pending ? 'Creando…' : 'Crear mi usuario →'}
          </button>
        </div>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="/dashboard/login" className="zo-sub" style={{ fontSize: 12 }}>Ya tengo cuenta · Ingresar</a>
        </div>
      </form>
    </div>
  );
}
