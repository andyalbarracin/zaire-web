// File: sidebar.tsx — navegación lateral de Zaire Ops (con sección Configuración)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FolderKanban, AlertCircle, Clock, FileText, UserCog, UserCircle, FileSignature, Receipt,
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

export default function Sidebar({ role }: { role: 'owner' | 'admin' | 'member' }) {
  const path = usePathname();

  const Item = ({ href, label, Icon, exact }: { href: string; label: string; Icon: LucideIcon; exact?: boolean }) => {
    const active = exact ? path === href : path.startsWith(href);
    return (
      <Link href={href} className={`zo-nav-item${active ? ' active' : ''}`}>
        <Icon className="zo-nav-ico" strokeWidth={1.75} />
        <span className="zo-nav-txt">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="zo-sidebar">
      <div className="zo-brand">
        <div className="zo-brand-name">ZAIRE <em>OPS</em></div>
        <div className="zo-brand-tag">Sistema operativo interno</div>
      </div>
      <nav className="zo-nav">
        <div className="zo-nav-section">Operación</div>
        {OPS.map(it => <Item key={it.href} href={it.href} label={it.label} Icon={it.icon} exact={it.exact} />)}

        <div className="zo-nav-section">Comercial</div>
        <Item href="/dashboard/acuerdos" label="Acuerdos" Icon={FileSignature} />
        <Item href="/dashboard/facturas" label="Invoices" Icon={Receipt} />

        <div className="zo-nav-section">Configuración</div>
        {(role === 'owner' || role === 'admin') && <Item href="/dashboard/equipo" label="Equipo" Icon={UserCog} />}
        <Item href="/dashboard/cuenta" label="Mi cuenta" Icon={UserCircle} />
      </nav>
    </aside>
  );
}
