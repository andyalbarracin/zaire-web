// File: crm-constants.ts
// Path: zaire-web/lib/zaire-ops/crm-constants.ts
// Description: Constantes compartidas del CRM (industrias, empleados, medio de contacto).
//   Sin directivas: se importa tanto en cliente (ficha) como en server (research/IA),
//   para que la IA sugiera valores que matcheen los selects.

export const CRM_INDUSTRIES = [
  'Oil & Gas — Upstream (perforación / extracción)',
  'Oil & Gas — Midstream (transporte / ductos)',
  'Oil & Gas — Downstream (refinación)',
  'Oil & Gas — Servicios de campo',
  'Energía — Generación eléctrica',
  'Energía — Renovables (solar / eólica)',
  'Minería',
  'Metalúrgica / Siderurgia',
  'Petroquímica / Química',
  'Manufactura / Industrial',
  'Alimentos y bebidas',
  'Agroindustria',
  'Construcción',
  'Automotriz / Autopartes',
  'Papel / Celulosa',
  'Cemento / Materiales',
  'Farmacéutica / Laboratorios',
  'Logística / Transporte',
  'Mantenimiento industrial / Servicios',
  'Agua / Saneamiento',
  'Otra',
];

export const CRM_EMPLOYEES = ['1–5', '6–20', '21–50', '51–200', '201–500', '500+'];

export const CRM_PREFERRED = ['Teléfono', 'WhatsApp', 'Email', 'LinkedIn', 'Presencial', 'Otro'];
