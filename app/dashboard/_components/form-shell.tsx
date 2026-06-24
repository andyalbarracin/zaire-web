// File: form-shell.tsx — envuelve un form con useActionState: error inline + estado "Guardando…".
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import type { FormState } from '@/lib/zaire-ops/form';

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="zo-btn zo-btn-primary" disabled={pending}>
      {pending ? 'Guardando…' : label}
    </button>
  );
}

export default function FormShell({
  action, submitLabel, cancelHref, extra, children,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  submitLabel: string;
  cancelHref?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="zo-form">
      {children}
      {state?.error && <div className="zo-form-error">⚠ {state.error}</div>}
      <div className="zo-form-actions">
        <SubmitBtn label={submitLabel} />
        {extra}
        {cancelHref && <Link href={cancelHref}><button type="button" className="zo-btn">Cancelar</button></Link>}
      </div>
    </form>
  );
}
