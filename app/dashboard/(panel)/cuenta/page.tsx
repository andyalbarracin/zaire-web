// File: page.tsx — Mi cuenta (perfil + contraseña + proveedores de IA)
import { getMyProfile, ROLE_LABEL } from '@/lib/zaire-ops/profiles';
import { resolveProviderSettings, LLM_PROVIDERS } from '@/lib/zaire-ops/llm-config';
import { getUsageSummary, totalsByProvider } from '@/lib/zaire-ops/ai-usage';
import { providerHasKey } from '@/lib/sales/providers';
import Avatar from '@/app/dashboard/_components/avatar';
import { updateAccountAction, changePasswordAction, updateLlmConfigAction } from './actions';
import ProviderTest from './provider-test';

export const dynamic = 'force-dynamic';

const OK = { marginBottom: 16, background: 'rgba(34,197,94,.08)', borderColor: 'rgba(34,197,94,.3)', color: '#9be8b3' };

const PROVIDER_LABEL: Record<string, string> = {
  groq: 'Groq (gratis)', openai: 'OpenAI', gemini: 'Gemini (free tier)', openrouter: 'OpenRouter',
};

export default async function CuentaPage({ searchParams }: { searchParams: Promise<{ ok?: string; pw?: string; llm?: string; error?: string }> }) {
  const sp = await searchParams;
  const profile = await getMyProfile();
  if (!profile) return null;
  const llm = await resolveProviderSettings();
  const usage = await getUsageSummary(14);
  const totals = totalsByProvider(usage);

  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// CONFIGURACIÓN</div><h1 className="zo-h1">Mi cuenta</h1><div className="zo-sub">{profile.email} · {ROLE_LABEL[profile.role]}</div></div>
      </div>

      {sp.ok && <div className="zo-card" style={OK}>Perfil actualizado.</div>}
      {sp.pw && <div className="zo-card" style={OK}>Contraseña actualizada.</div>}
      {sp.llm && <div className="zo-card" style={OK}>Proveedores de IA actualizados.</div>}
      {sp.error && <div className="zo-error" style={{ marginBottom: 16 }}>{sp.error}</div>}

      <div className="zo-card">
        <div className="zo-card-title">// PERFIL</div>
        <form action={updateAccountAction} className="zo-form">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Avatar profile={profile} size={64} />
            <div className="zo-field" style={{ flex: 1 }}>
              <label className="zo-flabel">Foto de perfil</label>
              <input className="zo-input" name="avatar" type="file" accept="image/*" />
            </div>
          </div>
          <div className="zo-field"><label className="zo-flabel">Nombre</label><input className="zo-input" name="full_name" defaultValue={profile.full_name ?? ''} placeholder="Tu nombre" /></div>
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">Guardar perfil</button></div>
        </form>
      </div>

      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// CAMBIAR CONTRASEÑA</div>
        <form action={changePasswordAction} className="zo-form">
          <div className="zo-field"><label className="zo-flabel">Nueva contraseña (mín. 8)</label><input className="zo-input" name="password" type="password" minLength={8} required placeholder="••••••••" /></div>
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">Cambiar contraseña</button></div>
        </form>
      </div>

      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// PROVEEDORES DE IA</div>
        <p style={{ fontSize: 12.5, color: '#888', lineHeight: 1.6, marginBottom: 14 }}>
          El motor usa una cadena <strong style={{ color: '#bbb' }}>primaria → secundaria → fallback</strong>: prueba la primaria; si falla o agota su tope, pasa a la siguiente; el fallback (Groq) es la red de seguridad. Las <strong style={{ color: '#bbb' }}>API keys van en <code>.env.local</code></strong> del server; acá elegís roles, modelos y topes.
        </p>

        <ProviderTest providers={LLM_PROVIDERS.map(p => ({ name: p, hasKey: providerHasKey(p) }))} />

        <form action={updateLlmConfigAction} className="zo-form">
          <div className="zo-grid2">
            <div className="zo-field">
              <label className="zo-flabel">Primaria</label>
              <select className="zo-select" name="primary_provider" defaultValue={llm.primary}>
                {LLM_PROVIDERS.map(p => <option key={p} value={p}>{PROVIDER_LABEL[p]}</option>)}
              </select>
            </div>
            <div className="zo-field">
              <label className="zo-flabel">Secundaria (opcional)</label>
              <select className="zo-select" name="secondary_provider" defaultValue={llm.secondary || ''}>
                <option value="">— ninguna —</option>
                {LLM_PROVIDERS.map(p => <option key={p} value={p}>{PROVIDER_LABEL[p]}</option>)}
              </select>
            </div>
            <div className="zo-field">
              <label className="zo-flabel">Fallback</label>
              <select className="zo-select" name="fallback_provider" defaultValue={llm.fallback}>
                {LLM_PROVIDERS.map(p => <option key={p} value={p}>{PROVIDER_LABEL[p]}</option>)}
              </select>
            </div>
            <div className="zo-field" />
            <div className="zo-field"><label className="zo-flabel">Tope de llamadas a la primaria (por análisis)</label><input className="zo-input" name="max_primary_calls" type="number" min={1} defaultValue={llm.maxPrimaryCalls ?? 3} /></div>
            <div className="zo-field"><label className="zo-flabel">Tope de llamadas a la secundaria</label><input className="zo-input" name="max_secondary_calls" type="number" min={1} defaultValue={llm.maxSecondaryCalls ?? 3} /></div>
            <div className="zo-field"><label className="zo-flabel">Modelo OpenAI</label><input className="zo-input" name="model_openai" defaultValue={llm.models?.openai ?? ''} placeholder="gpt-4o-mini" /></div>
            <div className="zo-field"><label className="zo-flabel">Modelo Gemini</label><input className="zo-input" name="model_gemini" defaultValue={llm.models?.gemini ?? ''} placeholder="gemini-2.0-flash" /></div>
            <div className="zo-field"><label className="zo-flabel">Modelo Groq</label><input className="zo-input" name="model_groq" defaultValue={llm.models?.groq ?? ''} placeholder="openai/gpt-oss-120b" /></div>
            <div className="zo-field"><label className="zo-flabel">Modelo OpenRouter</label><input className="zo-input" name="model_openrouter" defaultValue={llm.models?.openrouter ?? ''} placeholder="openai/gpt-4o-mini" /></div>
          </div>
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">Guardar proveedores</button></div>
        </form>
      </div>

      <div className="zo-card zo-section-gap">
        <div className="zo-card-title">// USO DE IA · ÚLTIMOS 14 DÍAS</div>
        {usage.length === 0 ? (
          <p style={{ fontSize: 12.5, color: '#888', lineHeight: 1.6 }}>
            Todavía no hay uso registrado. Si acabás de correr la migración <code>0015_ai_cache_usage.sql</code>, se va a ir poblando con cada generación. No es un saldo, es un conteo propio de llamadas por proveedor.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {totals.map(t => (
                <span key={t.provider} className="zo-chip">{PROVIDER_LABEL[t.provider] ?? t.provider}: <strong style={{ marginLeft: 4, color: '#ddd' }}>{t.calls}</strong></span>
              ))}
            </div>
            <div className="zo-table-wrap"><table className="zo-table">
              <thead><tr><th>Día</th><th>Proveedor</th><th>Llamadas</th></tr></thead>
              <tbody>
                {usage.map((r, i) => (
                  <tr key={i}><td className="zo-mono">{r.day}</td><td>{PROVIDER_LABEL[r.provider] ?? r.provider}</td><td>{r.calls}</td></tr>
                ))}
              </tbody>
            </table></div>
          </>
        )}
      </div>
    </>
  );
}
