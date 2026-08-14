// File: web-search.ts
// Búsqueda web (Serper.dev — resultados de Google vía API, free tier) + fetch de una página
// para extraer texto. Server-only. Con esto, el LLM (GPT/el que sea) extrae datos REALES del
// material que le pasamos, sin inventar. Requiere SERPER_API_KEY (signup gratis en serper.dev).

export interface SerperOrganic { title: string; link: string; snippet: string; }
export interface SerperResult { organic: SerperOrganic[]; knowledgeGraph?: Record<string, unknown>; }

export async function serperSearch(query: string): Promise<SerperResult | null> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'ar', hl: 'es', num: 8 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const organic: SerperOrganic[] = (data.organic ?? []).map((o: { title?: string; link?: string; snippet?: string }) => ({
      title: o.title ?? '', link: o.link ?? '', snippet: o.snippet ?? '',
    }));
    return { organic, knowledgeGraph: data.knowledgeGraph as Record<string, unknown> | undefined };
  } catch {
    return null;
  }
}

/** Baja una página y la convierte a texto plano acotado (para dársela al LLM). */
export async function fetchPageText(url: string, maxChars = 12000): Promise<string | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZaireBot/1.0)' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('text/plain')) return null;

    const html = (await res.text()).slice(0, 400000);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, maxChars) || null;
  } catch {
    return null;
  }
}
