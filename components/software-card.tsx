// File: software-card.tsx
// Path: zaire-web/components/software-card.tsx
// Last modified: 2026-06-19
// Description: Bloque transversal "Software Operativo a Medida" para /servicios.
//              Card a 2 columnas: izquierda = texto + tecnologías; derecha =
//              sistemas recientes apilados (Zaire Tracking, NIMO). El label de
//              sección (// SOFTWARE OPERATIVO · ...) vive fuera, en la página.
//              NO es una Capa: es base operativa transversal.

import { IApps } from '@/components/icons';

const systems = [
  {
    name: 'Zaire Tracking',
    label: 'Trazabilidad · Órdenes de trabajo',
    desc: 'Sistema para organizar órdenes de trabajo, productos, estados de reparación y trazabilidad operativa en empresas industriales.',
    keys: 'OT · Trazabilidad · Reportes · Industria',
  },
  {
    name: 'NIMO',
    label: 'CRM · Web inmobiliaria',
    desc: 'CRM inmobiliario con administrador de propiedades, consultas, estados, imágenes y frontend público personalizable.',
    keys: 'CRM · Propiedades · Consultas · Web',
  },
];

export default function SoftwareCard() {
  return (
    <div className="soft-card">
      <div className="soft-grid">
        {/* Columna izquierda: título, descripción y tecnologías */}
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
        </div>

        {/* Columna derecha: sistemas recientes apilados */}
        <div className="soft-systems">
          <div className="soft-systems-lbl">// SISTEMAS RECIENTES</div>
          <div className="soft-subgrid">
            {systems.map(s => (
              <div key={s.name} className="soft-sub-card">
                <div className="soft-sub-name">{s.name}</div>
                <div className="soft-sub-lbl">{s.label}</div>
                <p className="soft-sub-desc">{s.desc}</p>
                <div className="soft-sub-keys">{s.keys}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
