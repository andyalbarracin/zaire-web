// File: icons.tsx
// Path: zaire-web/components/icons.tsx
// Last modified: 2026-04-27
// Description: Íconos SVG minimalistas del sistema ZAIRE.
//              Estilo: trazo uniforme 1.5px, monocolor, sin rellenos complejos.

type IconProps = { s?: string; size?: number };

export const IWorkflow = ({ s = '#FF6A00', size = 40 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" width={size} height={size}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="5" r="2" />
    <circle cx="19" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
    <line x1="7" y1="12" x2="10" y2="12" />
    <line x1="14" y1="12" x2="17" y2="12" />
    <line x1="12" y1="7" x2="12" y2="10" />
    <line x1="12" y1="14" x2="12" y2="17" />
  </svg>
);

export const IAgent = ({ s = '#FF6A00', size = 40 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" width={size} height={size}>
    <rect x="6" y="8" width="12" height="10" rx="1" />
    <rect x="9" y="11" width="2" height="2" />
    <rect x="13" y="11" width="2" height="2" />
    <path d="M9 8V6a3 3 0 016 0v2" />
    <line x1="12" y1="18" x2="12" y2="21" />
  </svg>
);

export const IKnowledge = ({ s = '#FF6A00', size = 40 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" width={size} height={size}>
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path d="M4 6v4c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
    <path d="M4 10v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" />
  </svg>
);

export const IRevenue = ({ s = '#FF6A00', size = 40 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" width={size} height={size}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

export const IGrowth = ({ s = '#FF6A00', size = 40 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" width={size} height={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v9l5 3" />
  </svg>
);

export const IInfra = ({ s = '#FF6A00', size = 40 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" width={size} height={size}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const IApps = ({ s = '#FF6A00', size = 40 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" width={size} height={size}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <polyline points="10 12.5 8 14.5 10 16.5" />
    <polyline points="14 12.5 16 14.5 14 16.5" />
  </svg>
);

/* ── Stack icons ─────────────────────────────────────────── */
export const IN8n = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <circle cx="7" cy="16" r="4" stroke={s} strokeWidth="1.5" />
    <circle cx="25" cy="16" r="4" stroke={s} strokeWidth="1.5" />
    <circle cx="16" cy="8" r="4" stroke={s} strokeWidth="1.5" />
    <circle cx="16" cy="24" r="4" stroke={s} strokeWidth="1.5" />
    <line x1="11" y1="16" x2="21" y2="16" stroke={s} strokeWidth="1.5" />
    <line x1="16" y1="12" x2="16" y2="20" stroke={s} strokeWidth="1.5" />
  </svg>
);

export const IClaude = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <path d="M16 4 C10 4 6 8 6 14 C6 18 8 21 12 23 L12 28 L16 25 L20 28 L20 23 C24 21 26 18 26 14 C26 8 22 4 16 4Z" stroke={s} strokeWidth="1.5" />
    <circle cx="12" cy="14" r="1.5" fill={s} />
    <circle cx="20" cy="14" r="1.5" fill={s} />
  </svg>
);

export const IOpenAI = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <path d="M16 4 L28 11 L28 21 L16 28 L4 21 L4 11 Z" stroke={s} strokeWidth="1.5" />
    <circle cx="16" cy="16" r="4" stroke={s} strokeWidth="1.5" />
  </svg>
);

export const ISupabase = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <path d="M6 6 L20 6 L20 20 L6 20 Z" stroke={s} strokeWidth="1.5" />
    <path d="M12 12 L26 12 L26 26 L12 26 Z" stroke={s} strokeWidth="1.5" />
  </svg>
);

export const IMCP = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <rect x="4" y="12" width="8" height="8" rx="1" stroke={s} strokeWidth="1.5" />
    <rect x="20" y="4" width="8" height="8" rx="1" stroke={s} strokeWidth="1.5" />
    <rect x="20" y="20" width="8" height="8" rx="1" stroke={s} strokeWidth="1.5" />
    <line x1="12" y1="16" x2="20" y2="8" stroke={s} strokeWidth="1.5" />
    <line x1="12" y1="16" x2="20" y2="24" stroke={s} strokeWidth="1.5" />
  </svg>
);

export const IPostgres = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <ellipse cx="16" cy="8" rx="10" ry="4" stroke={s} strokeWidth="1.5" />
    <path d="M6 8 L6 24 C6 26.2 10.5 28 16 28 C21.5 28 26 26.2 26 24 L26 8" stroke={s} strokeWidth="1.5" />
    <line x1="6" y1="16" x2="26" y2="16" stroke={s} strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

export const IRAG = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <circle cx="16" cy="16" r="10" stroke={s} strokeWidth="1.5" />
    <path d="M16 6 L16 26 M6 16 L26 16" stroke={s} strokeWidth="1" />
    <path d="M9 9 Q16 16 23 9 M9 23 Q16 16 23 23" stroke={s} strokeWidth="1" />
  </svg>
);

export const IOllama = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <circle cx="10" cy="14" r="5" stroke={s} strokeWidth="1.5" />
    <circle cx="22" cy="14" r="5" stroke={s} strokeWidth="1.5" />
    <path d="M5 19 C5 24 27 24 27 19" stroke={s} strokeWidth="1.5" />
    <line x1="10" y1="19" x2="10" y2="26" stroke={s} strokeWidth="1.5" />
    <line x1="22" y1="19" x2="22" y2="26" stroke={s} strokeWidth="1.5" />
  </svg>
);

export const IAPI = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <polyline points="8 10 4 16 8 22" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
    <polyline points="24 10 28 16 24 22" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="14" y1="8" x2="18" y2="24" stroke={s} strokeWidth="1.5" />
  </svg>
);

export const ICRM = ({ s = '#FF6A00', size = 32 }: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
    <rect x="6" y="8" width="20" height="16" rx="1" stroke={s} strokeWidth="1.5" />
    <line x1="6" y1="13" x2="26" y2="13" stroke={s} strokeWidth="1" />
    <line x1="14" y1="8" x2="14" y2="24" stroke={s} strokeWidth="1" />
  </svg>
);
