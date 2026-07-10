// File: send-invoice-button.tsx — Botón "Enviar al cliente" con modal de confirmación + preview.
'use client';

import { useState } from 'react';

export default function SendInvoiceButton({
  action, clientEmail, clientName, number, concept, dueDate, amountLabel, saldoLabel,
}: {
  action: () => void;           // server action ya bindeada al invoice
  clientEmail: string | null;
  clientName: string;
  number: string;
  concept: string;
  dueDate: string | null;
  amountLabel: string;
  saldoLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="zo-btn zo-btn-sm" onClick={() => setOpen(true)}>Enviar al cliente</button>
      {open && (
        <div className="zo-overlay" onClick={() => setOpen(false)}>
          <div className="zo-modal" onClick={e => e.stopPropagation()}>
            <h3>Enviar solicitud de pago</h3>
            {clientEmail ? (
              <>
                <p className="zo-modal-sub">
                  Se enviará un <strong style={{ color: '#fff' }}>email</strong> a <strong style={{ color: '#fff' }}>{clientEmail}</strong> ({clientName}) con el detalle de cobro.
                  No adjunta la factura fiscal ni un PDF: es un email con la información de la solicitud de pago.
                </p>
                <div className="zo-modal-box">
                  <div className="zo-modal-row"><span>Nº</span><span>{number}</span></div>
                  <div className="zo-modal-row"><span>Concepto</span><span style={{ textAlign: 'right' }}>{concept}</span></div>
                  <div className="zo-modal-row"><span>Monto</span><span>{amountLabel}</span></div>
                  {dueDate && <div className="zo-modal-row"><span>Vencimiento</span><span>{dueDate}</span></div>}
                  <div className="zo-modal-row"><span style={{ fontWeight: 700 }}>A pagar (saldo)</span><span style={{ fontWeight: 700 }}>{saldoLabel}</span></div>
                </div>
                <p className="zo-modal-sub" style={{ marginBottom: 16 }}>¿Confirmás enviar esto al email registrado del cliente?</p>
                <div className="zo-modal-actions">
                  <button type="button" className="zo-btn zo-btn-sm" onClick={() => setOpen(false)}>Cancelar</button>
                  <form action={action}><button type="submit" className="zo-btn zo-btn-primary zo-btn-sm">Sí, enviar email</button></form>
                </div>
              </>
            ) : (
              <>
                <p className="zo-modal-sub">El cliente no tiene un email cargado. Agregalo en su ficha para poder enviarle la solicitud de pago.</p>
                <div className="zo-modal-actions"><button type="button" className="zo-btn zo-btn-sm" onClick={() => setOpen(false)}>Cerrar</button></div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
