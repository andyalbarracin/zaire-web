// File: software-card.tsx
// Path: zaire-web/components/software-card.tsx
// Last modified: 2026-07-14
// Description: Bloque transversal "Software Operativo a Medida" para /servicios.
//              Card con texto + tecnologías. El label de sección
//              (// SOFTWARE OPERATIVO · ...) vive fuera, en la página.
//              NO es una Capa: es base operativa transversal. Los productos propios
//              (Zaire Trace, NIMO) viven en /sistemas.

import Link from 'next/link';
import { IApps } from '@/components/icons';

export default function SoftwareCard() {
  return (
    <div className="soft-card">
      <div className="soft-main">
        <div className="soft-icon">
          <IApps s="#FF6A00" size={40} />
        </div>
        <div className="soft-title">Software Operativo a Medida</div>
        <p className="soft-desc">
          Cuando las herramientas existentes no alcanzan, construimos plataformas propias: CRMs,
          dashboards, portales, sistemas de trazabilidad, administradores internos y aplicaciones
          web diseñadas alrededor del proceso real de cada cliente.
        </p>
        <p className="soft-desc" style={{ color: '#999', fontSize: 13 }}>
          La lógica no es sumar otra herramienta aislada, sino crear una base operativa donde
          convivan datos, permisos, reportes, automatizaciones, integraciones y agentes IA.
        </p>
        <div className="soft-tech">
          Next.js · Supabase · PostgreSQL · Vercel · APIs · Auth · Dashboards
        </div>
        <p className="soft-desc" style={{ fontSize: 13, marginTop: 4 }}>
          ¿Buscás software de producto en vez de un sistema a medida? Mirá{' '}
          <Link href="/sistemas" style={{ color: '#FF6A00', fontWeight: 500 }}>Zaire →</Link>
        </p>
      </div>
    </div>
  );
}
