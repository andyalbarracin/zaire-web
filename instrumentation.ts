// File: instrumentation.ts
// Path: zaire-web/instrumentation.ts
// Last modified: 2026-04-27
// Description: Parchea localStorage roto de Node.js 22+ antes de que cargue
//              cualquier módulo. Next.js 15 + Node 22+ pasa --localstorage-file
//              sin path válido, dejando localStorage como objeto sin métodos.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = globalThis as any;
    if (typeof g.localStorage !== 'undefined' && typeof g.localStorage?.getItem !== 'function') {
      const store: Record<string, string> = {};
      g.localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        key: () => null,
        length: 0,
      };
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}
