// File: sidebar.tsx — navegación lateral de Zaire Ops (colapsable, persistida en cookie)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FolderKanban, AlertCircle, Clock, FileText, UserCog, UserCircle, FileSignature, Receipt, Inbox, ChevronLeft,
  type LucideIcon,
} from 'lucide-react';

const OPS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/proyectos', label: 'Proyectos', icon: FolderKanban },
  { href: '/dashboard/tickets', label: 'Incidencias', icon: AlertCircle },
  { href: '/dashboard/horas', label: 'Horas', icon: Clock },
  { href: '/dashboard/reportes', label: 'Reportes', icon: FileText },
];

export default function Sidebar({ role, defaultCollapsed = false }: { role: 'owner' | 'admin' | 'member'; defaultCollapsed?: boolean }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // Mantiene la clase del shell en sync con el estado (sin flash: el SSR ya la aplica por cookie).
  useEffect(() => {
    document.querySelector('.zo-shell')?.classList.toggle('zo-collapsed', collapsed);
  }, [collapsed]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `zo_sidebar=${next ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
  };

  const Item = ({ href, label, Icon, exact }: { href: string; label: string; Icon: LucideIcon; exact?: boolean }) => {
    const active = exact ? path === href : path.startsWith(href);
    return (
      <Link href={href} className={`zo-nav-item${active ? ' active' : ''}`} title={label}>
        <Icon className="zo-nav-ico" strokeWidth={1.75} />
        <span className="zo-nav-txt">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="zo-sidebar">
      <div className="zo-brand">
        <div className="zo-brand-txt">
          <div className="zo-brand-name">ZAIRE <em>OPS</em></div>
          <div className="zo-brand-tag">Sistema operativo interno</div>
        </div>
        <button
          type="button"
          className="zo-collapse-btn"
          onClick={toggle}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <ChevronLeft className="zo-collapse-ico" strokeWidth={2} />
        </button>
      </div>
      <nav className="zo-nav">
        <div className="zo-nav-section">Operación</div>
        {OPS.map(it => <Item key={it.href} href={it.href} label={it.label} Icon={it.icon} exact={it.exact} />)}

        <div className="zo-nav-section">Comercial</div>
        <Item href="/dashboard/leads" label="Leads" Icon={Inbox} />
        <Item href="/dashboard/acuerdos" label="Acuerdos" Icon={FileSignature} />
        <Item href="/dashboard/facturas" label="Finanzas" Icon={Receipt} />

        <div className="zo-nav-section">Configuración</div>
        {(role === 'owner' || role === 'admin') && <Item href="/dashboard/equipo" label="Equipo" Icon={UserCog} />}
        <Item href="/dashboard/cuenta" label="Mi cuenta" Icon={UserCircle} />
      </nav>
    </aside>
  );
}
