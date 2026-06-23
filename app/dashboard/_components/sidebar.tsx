// File: sidebar.tsx
// Path: zaire-web/app/dashboard/_components/sidebar.tsx
// Description: Navegación lateral de Zaire Ops. Marca el ítem activo por ruta.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FolderKanban, AlertCircle, Clock, FileText } from 'lucide-react';

const ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/proyectos', label: 'Proyectos', icon: FolderKanban },
  { href: '/dashboard/tickets', label: 'Incidencias', icon: AlertCircle },
  { href: '/dashboard/horas', label: 'Horas', icon: Clock },
  { href: '/dashboard/reportes', label: 'Reportes', icon: FileText },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="zo-sidebar">
      <div className="zo-brand">
        <div className="zo-brand-name">ZAIRE <em>OPS</em></div>
        <div className="zo-brand-tag">Sistema operativo interno</div>
      </div>
      <nav className="zo-nav">
        <div className="zo-nav-section">Operación</div>
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`zo-nav-item${active ? ' active' : ''}`}>
              <Icon className="zo-nav-ico" strokeWidth={1.75} />
              <span className="zo-nav-txt">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
