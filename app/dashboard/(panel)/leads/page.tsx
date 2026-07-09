// File: page.tsx — Sistema de handoff: leads del sitio (lista + filtros + buscador + paginación)
import Link from 'next/link';
import { listLeads, LEAD_STATUSES, LEAD_STATUS_LABEL, LEAD_STATUS_COLOR } from '@/lib/zaire-ops/leads';
import RowLink from '@/app/dashboard/_components/row-link';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const FILTERS: [string, string][] = [['', 'Todos'], ...LEAD_STATUSES.map(s => [s, LEAD_STATUS_LABEL[s]] as [string, string])];

function hrefWith(base: { filter?: string; q?: string; page?: number }): string {
  const sp = new URLSearchParams();
  if (base.filter) sp.set('filter', base.filter);
  if (base.q) sp.set('q', base.q);
  if (base.page && base.page > 1) sp.set('page', String(base.page));
  const qs = sp.toString();
  return `/dashboard/leads${qs ? `?${qs}` : ''}`;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string; page?: string }> }) {
  const { filter, q, page } = await searchParams;
  const all = await listLeads();

  const term = (q ?? '').trim().toLowerCase();
  const filtered = all.filter(l => {
    if (filter && l.status !== filter) return false;
    if (term) {
      const hay = `${l.name ?? ''} ${l.email} ${l.company ?? ''} ${l.challenge ?? ''} ${l.need ?? ''}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const newCount = all.filter(l => l.status === 'nuevo').length;

  return (
    <>
      <div className="zo-pagehead">
        <div>
          <div className="zo-lbl">// COMERCIAL</div>
          <h1 className="zo-h1">Leads</h1>
          <div className="zo-sub">{filtered.length} lead(s){newCount ? ` · ${newCount} sin gestionar` : ''}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(([f, label]) => (
            <Link key={f || 'all'} href={hrefWith({ filter: f || undefined, q })}>
              <span className="zo-chip" style={(filter ?? '') === f ? { background: '#FF6A00', color: '#111' } : {}}>{label}</span>
            </Link>
          ))}
        </div>
        <form method="get" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {filter && <input type="hidden" name="filter" value={filter} />}
          <input className="zo-input" name="q" defaultValue={q ?? ''} placeholder="Buscar nombre, email, empresa…" style={{ minWidth: 240, padding: '7px 12px', fontSize: 12 }} />
          <button className="zo-btn zo-btn-sm" type="submit">Buscar</button>
          {term && <Link href={hrefWith({ filter })}><span className="zo-chip">Limpiar ✕</span></Link>}
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="zo-table-wrap"><div className="zo-empty">{term || filter ? 'Sin leads para ese filtro.' : 'Todavía no entraron leads del sitio.'}</div></div>
      ) : (
        <div className="zo-table-wrap"><table className="zo-table">
          <thead><tr><th>Fecha</th><th>Nombre</th><th>Empresa</th><th>Email</th><th>Fuente</th><th>Estado</th></tr></thead>
          <tbody>{pageItems.map(l => (
            <RowLink key={l.id} href={`/dashboard/leads/${l.id}`}>
              <td className="zo-mono">{fmtDate(l.created_at)}</td>
              <td className="zo-rowlink">{l.name ?? '—'}</td>
              <td>{l.company ?? '—'}</td>
              <td className="zo-mono" style={{ fontSize: 12 }}>{l.email}</td>
              <td><span className="zo-chip">{l.source ?? 'web'}</span></td>
              <td><span className="zo-chip"><span className="zo-dot" style={{ background: LEAD_STATUS_COLOR[l.status] }} />{LEAD_STATUS_LABEL[l.status]}</span></td>
            </RowLink>
          ))}</tbody>
        </table></div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 18 }}>
          {current > 1
            ? <Link href={hrefWith({ filter, q, page: current - 1 })}><span className="zo-chip">← Anterior</span></Link>
            : <span className="zo-chip" style={{ opacity: .35 }}>← Anterior</span>}
          <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: '#888', letterSpacing: '.06em' }}>Página {current} de {totalPages}</span>
          {current < totalPages
            ? <Link href={hrefWith({ filter, q, page: current + 1 })}><span className="zo-chip">Siguiente →</span></Link>
            : <span className="zo-chip" style={{ opacity: .35 }}>Siguiente →</span>}
        </div>
      )}
    </>
  );
}
