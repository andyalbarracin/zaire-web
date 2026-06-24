// File: page.tsx — Equipo (gestión de usuarios y roles)
import { requireRole, listProfiles, ROLE_LABEL, ROLES } from '@/lib/zaire-ops/profiles';
import Avatar from '@/app/dashboard/_components/avatar';
import { createUserAction, setRoleAction, deleteUserAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function EquipoPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const me = await requireRole(['owner', 'admin']);
  const sp = await searchParams;
  const team = await listProfiles();

  return (
    <>
      <div className="zo-pagehead">
        <div><div className="zo-lbl">// CONFIGURACIÓN</div><h1 className="zo-h1">Equipo</h1><div className="zo-sub">{team.length} usuario(s)</div></div>
      </div>

      {sp.error && <div className="zo-error" style={{ marginBottom: 16 }}>{sp.error}</div>}
      {sp.ok && <div className="zo-card" style={{ marginBottom: 16, background: 'rgba(34,197,94,.08)', borderColor: 'rgba(34,197,94,.3)', color: '#9be8b3' }}>Usuario creado. Ya puede ingresar con su email y contraseña.</div>}

      <div className="zo-card">
        <div className="zo-card-title">// CREAR USUARIO</div>
        <form action={createUserAction} className="zo-form" style={{ maxWidth: '100%' }}>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Nombre</label><input className="zo-input" name="full_name" placeholder="Nombre del colaborador" /></div>
            <div className="zo-field"><label className="zo-flabel">Email *</label><input className="zo-input" name="email" type="email" required placeholder="persona@email.com" /></div>
          </div>
          <div className="zo-grid2">
            <div className="zo-field"><label className="zo-flabel">Contraseña (mín. 8) *</label><input className="zo-input" name="password" type="password" required minLength={8} placeholder="••••••••" /></div>
            <div className="zo-field"><label className="zo-flabel">Rol</label><select className="zo-select" name="role" defaultValue="member">{ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></div>
          </div>
          <div className="zo-form-actions"><button className="zo-btn zo-btn-primary" type="submit">+ Crear usuario</button></div>
          <div className="zo-sub" style={{ fontSize: 12 }}>Queda activo al instante, sin confirmación por email.</div>
        </form>
      </div>

      <div className="zo-section-gap">
        <div className="zo-card-title">// MIEMBROS</div>
        <div className="zo-table-wrap"><table className="zo-table">
          <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th /></tr></thead>
          <tbody>{team.map(u => (
            <tr key={u.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar profile={u} />
                  <span style={{ color: '#fff' }}>{u.full_name ?? '—'}{u.id === me.id && <span className="zo-mono" style={{ marginLeft: 6 }}>(vos)</span>}</span>
                </div>
              </td>
              <td className="zo-mono">{u.email ?? '—'}</td>
              <td>
                <form action={setRoleAction.bind(null, u.id)} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select className="zo-select" name="role" defaultValue={u.role} style={{ padding: '6px 10px', width: 'auto' }}>{ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                  <button className="zo-btn zo-btn-ghost zo-btn-sm" type="submit">Guardar</button>
                </form>
              </td>
              <td>{me.role === 'owner' && u.id !== me.id && (
                <form action={deleteUserAction.bind(null, u.id)}><button className="zo-btn zo-btn-ghost zo-btn-sm" type="submit">Borrar</button></form>
              )}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}
