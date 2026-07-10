// File: sign-modal.tsx — Firma electrónica tipeada: escribir el nombre → preview en cursiva → aceptar.
'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signPortalAgreementAction } from './actions';

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="zp-btn zp-btn-primary" disabled={disabled || pending}>{pending ? 'Firmando…' : 'Firmar y aceptar'}</button>;
}

export default function SignModal({ id, defaultName }: { id: string; defaultName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [accepted, setAccepted] = useState(false);
  const action = signPortalAgreementAction.bind(null, id);

  return (
    <>
      <div className="zp-sign-slot" onClick={() => setOpen(true)}>
        <div className="zp-sign-placeholder">✍️ Hacé clic acá para firmar el acuerdo</div>
      </div>

      {open && (
        <div className="zp-overlay-modal" onClick={() => setOpen(false)}>
          <div className="zp-modal" onClick={e => e.stopPropagation()}>
            <h3>Firmar acuerdo</h3>
            <p>Escribí tu nombre completo. Aparecerá como tu firma electrónica y queda registrada tu aceptación con fecha, hora y datos de acceso.</p>
            <form action={action}>
              <div className="zp-field">
                <label className="zp-flabel">Tu nombre completo</label>
                <input className="zp-input" name="signed_name" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre y apellido" autoFocus />
              </div>
              <div className="zp-field">
                <label className="zp-flabel">Tu firma</label>
                <div className="zp-sign-line">
                  {name.trim() ? <span className="zp-sign-preview">{name}</span> : <span className="zp-sign-placeholder">Tu firma aparece acá</span>}
                </div>
              </div>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#ccc', cursor: 'pointer', marginTop: 4 }}>
                <input type="checkbox" name="accepted" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ marginTop: 3 }} />
                <span>He leído y <strong>acepto los términos y condiciones</strong> de este acuerdo.</span>
              </label>
              <div className="zp-modal-actions">
                <button type="button" className="zp-btn" onClick={() => setOpen(false)}>Cancelar</button>
                <Submit disabled={!name.trim() || !accepted} />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
