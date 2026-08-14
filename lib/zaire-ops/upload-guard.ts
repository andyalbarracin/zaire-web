// File: upload-guard.ts
// Validación de archivos subidos a los buckets públicos zo-*. Bloquea tipos peligrosos
// (SVG/HTML/JS/XML → posible XSS al servirse inline) y limita el tamaño. Devuelve el
// contentType seguro con el que guardar (fuerza octet-stream si es dudoso: no se ejecuta).

const MAX_BYTES = 50 * 1024 * 1024; // 50MB (alineado con serverActions.bodySizeLimit)

const BLOCKED_EXT = ['svg', 'html', 'htm', 'xhtml', 'js', 'mjs', 'jsx', 'xml', 'swf', 'php', 'sh'];
const BLOCKED_MIME = [
  'image/svg+xml', 'text/html', 'application/xhtml+xml',
  'application/javascript', 'text/javascript', 'application/x-shockwave-flash',
];

export type UploadCheck = { ok: true; contentType: string } | { ok: false; reason: string };

export function validateUpload(file: File): UploadCheck {
  if (!file || file.size === 0) return { ok: false, reason: 'Archivo vacío.' };
  if (file.size > MAX_BYTES) return { ok: false, reason: 'El archivo supera el límite de 50MB.' };

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (BLOCKED_EXT.includes(ext)) return { ok: false, reason: `Tipo de archivo no permitido (.${ext}).` };

  const mime = (file.type || '').toLowerCase();
  if (BLOCKED_MIME.some((m) => mime.includes(m))) return { ok: false, reason: 'Tipo de archivo no permitido.' };

  // contentType seguro: si viene vacío o dudoso, octet-stream → el navegador lo descarga, no lo ejecuta.
  const contentType = mime && !BLOCKED_MIME.includes(mime) ? file.type : 'application/octet-stream';
  return { ok: true, contentType };
}
