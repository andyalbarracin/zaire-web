// File: staff.ts
// Path: zaire-web/lib/zaire-ops/staff.ts
// Description: Quién es EQUIPO (acceso al panel /dashboard). Tener sesión de Supabase NO alcanza:
//   los clientes del portal (link único) y cualquiera que se registre también tienen sesión.
//   La marca vive en `app_metadata.zo_staff`, que solo puede escribir el service role
//   (user_metadata la puede editar el propio usuario: no sirve para permisos).
//   Sin dependencias: lo usa el middleware.

export function isStaff(user: { app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return user?.app_metadata?.zo_staff === true;
}
