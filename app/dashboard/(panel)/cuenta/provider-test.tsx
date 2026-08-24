'use client';
// provider-test.tsx — chips de salud + botón "Probar" por proveedor: hace una llamada real
// mínima y muestra si responde (ms + modelo) o el error (modelo muerto / sin crédito / etc.).

import { useState } from 'react';
import { testProviderA } from './actions';

const LABEL: Record<string, string> = { groq: 'Groq', openai: 'OpenAI', gemini: 'Gemini', openrouter: 'OpenRouter' };
type Result = { ok: true; ms: number; model: string } | { ok: false; error: string };

export default function ProviderTest({ providers }: { providers: { name: string; hasKey: boolean }[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});

  async function test(name: string) {
    setBusy(name);
    const r = await testProviderA(name);
    setBusy(null);
    setResults(prev => ({ ...prev, [name]: r }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {providers.map(p => {
        const r = results[p.name];
        return (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="zo-chip" style={{ color: p.hasKey ? '#9be8b3' : '#888', minWidth: 130 }}>
              <span className="zo-dot" style={{ background: p.hasKey ? '#22c55e' : '#555' }} />
              {LABEL[p.name] ?? p.name}: {p.hasKey ? 'key ok' : 'sin key'}
            </span>
            <button type="button" className="zo-btn zo-btn-sm" onClick={() => test(p.name)} disabled={!p.hasKey || busy === p.name}>
              {busy === p.name ? 'Probando…' : 'Probar'}
            </button>
            {r && (r.ok
              ? <span style={{ fontSize: 12, color: '#22c55e' }}>✓ responde ({r.ms} ms · {r.model})</span>
              : <span style={{ fontSize: 12, color: '#e0574a', lineHeight: 1.4 }}>✗ {r.error}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
