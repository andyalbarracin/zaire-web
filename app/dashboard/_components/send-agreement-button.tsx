// File: send-agreement-button.tsx — "Enviar al cliente por email" con modal de confirmación + preview.
'use client';

import { useState } from 'react';

export default function SendAgreementButton({
  action, recipient, clientName, projectName, plan, pdfHref,
}: {
  action: () => void;       // server action ya bindeada al acuerdo
  recipient: string | null; // email destino (firmante o cliente)
  clientName: string;
  projectName: string;
  plan: string | null;
  pdfHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="zo-btn zo-btn-primary zo-btn-sm" onClick={() => setOpen(true)}>Enviar al cliente por email</button>
      {open && (
        <div className="zo-overlay" onClick={() => setOpen(false)}>
          <div className="zo-modal" onClick={e => e.stopPropagation()}>
            <h3>Enviar acuerdo para firmar</h3>
            {recipient ? (
              <>
                <p className="zo-modal-sub">
                  Se enviará un <strong style={{ color: '#fff' }}>email</strong> a <strong style={{ color: '#fff' }}>{recipient}</strong> ({clientName}) con un botón para <strong style={{ color: '#fff' }}>ver y firmar el acuerdo online</strong> (link único). No adjunta el PDF; el cliente lo lee y firma desde el link.
                </p>
                <div className="zo-modal-box">
                  <div className="zo-modal-row"><span>Proyecto</span><span style={{ textAlign: 'right' }}>{projectName}</span></div>
                  {plan && <div className="zo-modal-row"><span>Plan</span><span style={{ textAlign: 'right' }}>{plan}</span></div>}
                  <div className="zo-modal-row"><span>Destinatario</span><span>{recipient}</span></div>
                </div>
                <p className="zo-modal-sub" style={{ marginBottom: 16 }}>
                  Podés <a href={pdfHref} target="_blank" rel="noopener noreferrer" style={{ color: '#FF6A00' }}>ver el PDF del acuerdo</a> antes de enviar. ¿Confirmás el envío?
                </p>
                <div className="zo-modal-actions">
                  <button type="button" className="zo-btn zo-btn-sm" onClick={() => setOpen(false)}>Cancelar</button>
                  <form action={action}><button type="submit" className="zo-btn zo-btn-primary zo-btn-sm">Sí, enviar email</button></form>
                </div>
              </>
            ) : (
              <>
                <p className="zo-modal-sub">No hay un email de destino. Cargá el email del firmante en el acuerdo (o el del cliente en su ficha) para poder enviarlo.</p>
                <div className="zo-modal-actions"><button type="button" className="zo-btn zo-btn-sm" onClick={() => setOpen(false)}>Cerrar</button></div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
