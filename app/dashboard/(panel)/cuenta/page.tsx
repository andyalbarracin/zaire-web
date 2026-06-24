// File: page.tsx — Mi cuenta (perfil + contraseña)
import { getMyProfile, ROLE_LABEL } from '@/lib/zaire-ops/profiles';
import Avatar from '@/app/dashboard/_components/avatar';
import { updateAccountAction, changePasswordAction } from './actions';

export const dynamic = 'force-dynamic';

const OK = { marginBottom: 16, background: 'rgba(34,197,94,.08)', borderColor: 'rgba(34,197,94,.3)', color: '#9be8b3' };

export default async function CuentaPage({ searchParams }: { searchParams: Promise<{ ok?: string; pw?: string; error?: string }> }) {
  const sp = await searchParams;
  const profile = await getMyProfile();
  if (!profile) return null;

  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// CONFIGURACIÓN</div><h1 className="zo-h1">Mi cuenta</h1><div className="zo-sub">{profile.email} · {ROLE_LABEL[profile.role]}</div></div>
      </div>

      {sp.ok && <div className="zo-card" style={OK}>Perfil actualizado.</div>}
      {sp.pw && <div className="zo-card" style={OK}>Contraseña actualizada.</div>}
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
    </>
  );
}
