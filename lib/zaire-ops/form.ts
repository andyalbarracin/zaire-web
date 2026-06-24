// File: form.ts
// Path: zaire-web/lib/zaire-ops/form.ts
// Description: Helpers para parsear FormData en server actions de Zaire Ops.

export const sReq = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export const s = (fd: FormData, k: string): string | null => {
  const v = String(fd.get(k) ?? '').trim();
  return v === '' ? null : v;
};

export const n = (fd: FormData, k: string): number => {
  const v = fd.get(k);
  const x = Number(v);
  return v === null || v === '' || Number.isNaN(x) ? 0 : x;
};

export const nN = (fd: FormData, k: string): number | null => {
  const v = fd.get(k);
  if (v === null || v === '') return null;
  const x = Number(v);
  return Number.isNaN(x) ? null : x;
};

export const b = (fd: FormData, k: string): boolean => {
  const v = fd.get(k);
  return v === 'on' || v === 'true' || v === '1';
};

// Lee un input en HORAS (decimal) y lo convierte a minutos para la DB.
export const hoursToMin = (fd: FormData, k: string): number | null => {
  const v = fd.get(k);
  if (v === null || v === '') return null;
  const h = Number(v);
  return Number.isNaN(h) ? null : Math.round(h * 60);
};

// Para defaultValue de inputs en horas a partir de minutos guardados.
export const minToHours = (min: number | null | undefined): string => min == null ? '' : String(min / 60);
