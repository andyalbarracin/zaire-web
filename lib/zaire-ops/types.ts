// File: types.ts
// Path: zaire-web/lib/zaire-ops/types.ts
// Description: Tipos y constantes del dominio Zaire Ops (clientes, proyectos,
//              incidencias, horas). Independiente del sitio público.

export type ClientStatus = 'activo' | 'pausado' | 'cerrado';
export type ProjectStatus = 'activo' | 'pausado' | 'cerrado' | 'archivado';
export type TicketPriority = 'baja' | 'media' | 'alta' | 'critica';
export type TicketStatus =
  | 'nueva' | 'en_analisis' | 'en_progreso' | 'esperando_cliente'
  | 'resuelta' | 'cerrada' | 'fuera_de_alcance';

export interface ZoClient {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  whatsapp: string | null;
  plan: string | null;
  monthly_support_hours: number;
  monthly_fee: number | null;
  currency: string;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZoProject {
  id: string;
  client_id: string;
  name: string;
  type: string;
  status: ProjectStatus;
  phase: string | null;
  production_url: string | null;
  staging_url: string | null;
  repository_url: string | null;
  stack: string | null;
  start_date: string | null;
  next_milestone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: { name: string } | null;
}

export interface ZoTicket {
  id: string;
  ticket_number: string | null;
  client_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  type: string;
  priority: TicketPriority;
  status: TicketStatus;
  source: string;
  reported_by: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  included_in_support: boolean;
  billable_extra: boolean;
  resolution: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  client?: { name: string } | null;
  project?: { name: string } | null;
  assignee?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface ZoComment {
  id: string;
  ticket_id: string;
  author_id: string | null;
  body: string;
  is_system: boolean;
  is_internal: boolean;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface ZoAttachment {
  id: string;
  ticket_id: string | null;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
}

export interface ZoTimeEntry {
  id: string;
  client_id: string;
  project_id: string | null;
  ticket_id: string | null;
  entry_date: string;
  minutes: number;
  work_type: string;
  description: string | null;
  billable: boolean;
  included_in_plan: boolean;
  created_at: string;
  client?: { name: string } | null;
  ticket?: { ticket_number: string | null; title: string } | null;
}

// ── Opciones para selects ───────────────────────────────────────────────────
export const CLIENT_STATUSES: ClientStatus[] = ['activo', 'pausado', 'cerrado'];
export const PROJECT_STATUSES: ProjectStatus[] = ['activo', 'pausado', 'cerrado', 'archivado'];
export const PROJECT_TYPES = [
  'Custom App', 'Automation', 'AI Agent', 'CRM / Revenue System',
  'Marketing System', 'Knowledge Base', 'Dashboard', 'Website', 'Internal Tool', 'Consulting',
];
export const TICKET_TYPES = [
  'bug', 'soporte', 'mejora', 'nueva_funcionalidad', 'cambio_de_alcance',
  'datos', 'infraestructura', 'consulta', 'fuera_de_alcance',
];
export const TICKET_PRIORITIES: TicketPriority[] = ['baja', 'media', 'alta', 'critica'];
export const TICKET_STATUSES: TicketStatus[] = [
  'nueva', 'en_analisis', 'en_progreso', 'esperando_cliente',
  'resuelta', 'cerrada', 'fuera_de_alcance',
];
export const TICKET_SOURCES = ['manual', 'whatsapp', 'email', 'llamada', 'formulario'];
export const WORK_TYPES = [
  'desarrollo', 'soporte', 'debugging', 'reunion', 'research',
  'documentacion', 'deploy', 'automatizacion', 'qa', 'comunicacion_cliente',
];

// ── Labels legibles ─────────────────────────────────────────────────────────
export const STATUS_LABEL: Record<TicketStatus, string> = {
  nueva: 'Nueva',
  en_analisis: 'En análisis',
  en_progreso: 'En progreso',
  esperando_cliente: 'Esperando cliente',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
  fuera_de_alcance: 'Fuera de alcance',
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica',
};

// Color de acento por estado/prioridad (para chips en la UI oscura).
export const STATUS_COLOR: Record<TicketStatus, string> = {
  nueva: '#3b82f6',
  en_analisis: '#a855f7',
  en_progreso: '#FF6A00',
  esperando_cliente: '#FFC107',
  resuelta: '#22c55e',
  cerrada: '#6b7280',
  fuera_de_alcance: '#E71D0A',
};

export const PRIORITY_COLOR: Record<TicketPriority, string> = {
  baja: '#6b7280', media: '#3b82f6', alta: '#FF6A00', critica: '#E71D0A',
};

// Estados que cuentan como "abiertos" (no resueltos/cerrados).
export const OPEN_STATUSES: TicketStatus[] = [
  'nueva', 'en_analisis', 'en_progreso', 'esperando_cliente',
];

export const humanLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const minutesToHours = (min: number | null | undefined) =>
  !min ? '0h' : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`;
