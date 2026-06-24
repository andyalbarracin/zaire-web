'use client';

import { useState } from 'react';

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input className="zo-input" readOnly value={url} style={{ flex: 1, fontFamily: 'var(--fm)', fontSize: 12 }} onFocus={e => e.currentTarget.select()} />
      <button
        type="button"
        className="zo-btn zo-btn-sm"
        onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      >
        {copied ? '¡Copiado!' : 'Copiar'}
      </button>
    </div>
  );
}
