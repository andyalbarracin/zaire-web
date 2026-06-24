'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em',
        padding: '9px 16px', background: '#FF6A00', color: '#111', border: 'none', borderRadius: 6, cursor: 'pointer',
      }}
    >
      Imprimir / Guardar PDF
    </button>
  );
}
