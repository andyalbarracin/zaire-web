// File: zaire-ops-create-admin.mjs
// Crea el usuario admin de Zaire Ops en Supabase Auth.
// Uso:
//   ZO_ADMIN_EMAIL="tu@email.com" ZO_ADMIN_PASSWORD="tu-pass-fuerte" \
//   node scripts/zaire-ops-create-admin.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// Carga .env.local sin dependencias.
try {
  const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch { /* sin .env.local: se usan las del shell */ }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ZO_ADMIN_EMAIL;
const password = process.env.ZO_ADMIN_PASSWORD;

if (!url || !serviceKey) {
  console.error('✗ Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}
if (!email || !password) {
  console.error('✗ Pasá ZO_ADMIN_EMAIL y ZO_ADMIN_PASSWORD como variables de entorno.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // sin paso de confirmación por email
});

if (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
console.log('✓ Admin de Zaire Ops creado:', data.user.email);
console.log('  Entrá en /dashboard y logueate con esas credenciales.');
