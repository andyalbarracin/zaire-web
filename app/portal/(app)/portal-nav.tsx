// File: portal-nav.tsx — Navegación del portal: sidebar colapsable + barra mobile.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Wallet, FileSignature, FolderOpen, Building2, AlertCircle,
  LifeBuoy, ChevronLeft, Menu, LogOut, type LucideIcon,
} from 'lucide-react';
import { portalSignOut } from './actions';

const NAV: { href: string; label: string; Icon: LucideIcon; exact?: boolean }[] = [
  { href: '/portal', label: 'Inicio', Icon: Home, exact: true },
  { href: '/portal/finanzas', label: 'Finanzas', Icon: Wallet },
  { href: '/portal/acuerdos', label: 'Acuerdos', Icon: FileSignature },
  { href: '/portal/documentos', label: 'Documentos', Icon: FolderOpen },
  { href: '/portal/empresa', label: 'Mi empresa', Icon: Building2 },
  { href: '/portal/incidencias', label: 'Incidencias', Icon: AlertCircle },
];

const app = () => document.querySelector('.zp-app');
const closeDrawer = () => app()?.setAttribute('data-open', 'false');

function toggleCollapse() {
  const next = app()?.getAttribute('data-collapsed') !== 'true';
  app()?.setAttribute('data-collapsed', String(next));
  document.cookie = `zp_sidebar=${next ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
}
function toggleDrawer() {
  const next = app()?.getAttribute('data-open') !== 'true';
  app()?.setAttribute('data-open', String(next));
}

function NavItem({ href, label, Icon, exact }: { href: string; label: string; Icon: LucideIcon; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path.startsWith(href);
  return (
    <Link href={href} className={`zp-nav-item${active ? ' active' : ''}`} title={label} onClick={closeDrawer}>
      <Icon className="zp-nav-ico" strokeWidth={1.75} />
      <span className="zp-nav-txt">{label}</span>
    </Link>
  );
}

export function PortalSidebar({ clientName, email }: { clientName: string; email: string }) {
  const path = usePathname();
  const supportActive = path.startsWith('/portal/soporte');
  return (
    <>
      <aside className="zp-sidebar">
        <div className="zp-side-brand">
          <span className="zp-side-brand-txt">ZAIRE <em>·</em> Portal</span>
          <button type="button" className="zp-collapse-btn" onClick={toggleCollapse} aria-label="Colapsar menú" title="Colapsar">
            <ChevronLeft className="zp-collapse-ico" size={15} strokeWidth={2} />
          </button>
        </div>

        <nav className="zp-nav-col">
          {NAV.map(it => <NavItem key={it.href} {...it} />)}
          <div style={{ flex: 1 }} />
          <hr className="zp-side-sep" />
          <Link href="/portal/soporte" className={`zp-nav-item${supportActive ? ' active' : ''}`} title="Soporte" onClick={closeDrawer}>
            <LifeBuoy className="zp-nav-ico" strokeWidth={1.75} />
            <span className="zp-nav-txt">Soporte</span>
          </Link>
        </nav>

        <div className="zp-side-foot">
          <div>
            <div className="zp-side-foot-lbl">Sesión</div>
            <div className="zp-side-foot-txt" title={email}>{email}</div>
          </div>
          <form action={portalSignOut}>
            <button type="submit" className="zp-logout"><LogOut size={15} strokeWidth={1.75} /><span className="zp-nav-txt">Salir</span></button>
          </form>
        </div>
      </aside>
      <div className="zp-overlay" onClick={closeDrawer} />
    </>
  );
}

export function PortalMobileBar({ clientName }: { clientName: string }) {
  return (
    <div className="zp-mobilebar">
      <button type="button" className="zp-hamb" onClick={toggleDrawer} aria-label="Abrir menú"><Menu size={20} /></button>
      <span className="zp-side-brand-txt" style={{ fontSize: 12 }}>ZAIRE <em style={{ color: '#FF6A00', fontStyle: 'normal' }}>·</em> {clientName}</span>
      <span style={{ width: 38 }} />
    </div>
  );
}
