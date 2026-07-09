// File: portal-email.ts — Email interno etiquetado cuando un cliente crea una incidencia.
function esc(s = ''): string { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

export interface PortalTicketAttachment { name: string; type: string; url: string; }

export function buildPortalTicketEmail(input: {
  clientName: string; ticketNumber: string; title: string; description: string; priority: string; email: string;
  attachments?: PortalTicketAttachment[];
}): { subject: string; html: string } {
  const subject = `[ZAIRE PORTAL · Incidencia] ${input.clientName} — ${input.title}`;

  const atts = input.attachments ?? [];
  const images = atts.filter(a => a.type.startsWith('image/'));
  const others = atts.filter(a => !a.type.startsWith('image/')); // videos, pdf, zip, etc.

  const imagesHtml = images.length ? `
    <div style="padding:0 32px 8px;background:#111">
      <div style="font-family:monospace;font-size:9px;color:#666;letter-spacing:.1em;text-transform:uppercase;margin:16px 0 10px">Imágenes adjuntas</div>
      ${images.map(im => `<a href="${im.url}"><img src="${im.url}" alt="${esc(im.name)}" style="max-width:100%;border-radius:8px;border:1px solid #222;margin-bottom:10px" /></a>`).join('')}
    </div>` : '';

  const othersHtml = others.length ? `
    <div style="padding:8px 32px 20px;background:#111">
      <p style="font-size:12px;color:#aaa;line-height:1.6;margin:0">
        📎 Existen videos u otros archivos vinculados a esta incidencia (no se adjuntan al email):
        <strong style="color:#ddd">${others.map(o => esc(o.name)).join(', ')}</strong>.
        Vení al panel para verlos.
      </p>
    </div>` : '';

  const html = `
  <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d">
    <div style="background:#111;padding:24px 32px;border-bottom:1px solid #1e1e1e">
      <span style="font-family:monospace;font-size:16px;font-weight:700;color:#fff;letter-spacing:.15em">ZAIRE</span>
      <span style="font-family:monospace;font-size:9px;color:#FF6A00;letter-spacing:.1em;text-transform:uppercase;margin-left:16px">INCIDENCIA · PORTAL</span>
    </div>
    <div style="padding:24px 32px;background:#111;color:#ddd">
      <p style="font-size:13px;color:#888;margin:0 0 4px">${esc(input.ticketNumber)} · ${esc(input.clientName)} · Prioridad ${esc(input.priority)}</p>
      <h1 style="font-size:20px;color:#fff;margin:0 0 12px">${esc(input.title)}</h1>
      <div style="background:#1a1a1a;border-left:2px solid #FF6A00;border-radius:2px;padding:12px 16px;white-space:pre-wrap;font-size:13px;line-height:1.6">${esc(input.description)}</div>
      <p style="font-size:12px;color:#777;margin-top:16px">Creada por ${esc(input.email)} desde el portal.</p>
    </div>
    ${imagesHtml}
    ${othersHtml}
  </div>`;
  return { subject, html };
}
