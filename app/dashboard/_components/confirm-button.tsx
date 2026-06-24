// File: confirm-button.tsx — botón de submit con confirmación nativa para acciones destructivas.
'use client';

export default function ConfirmButton({
  children,
  message = '¿Confirmás esta acción?',
  className = 'zo-btn zo-btn-ghost zo-btn-sm',
  style,
}: {
  children: React.ReactNode;
  message?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}
    >
      {children}
    </button>
  );
}
