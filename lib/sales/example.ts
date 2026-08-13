// File: lib/sales/example.ts
// Ejemplo obligatorio (Parte 7). Ejecutar:
//   npx tsx --env-file=.env.local lib/sales/example.ts
import { analizarLead } from './analyze';

async function main() {
  const out = await analizarLead({
    nombre: 'Bombas y Servicios',
    rubro: 'reparacion y mantenimiento de bombas',
  });
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
