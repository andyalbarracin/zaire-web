// File: research.ts
// Path: zaire-web/lib/zaire-ops/research.ts
// Description: "Investigar lead" — sugiere valores para campos vacíos y genera un brief.
//   Ahora corre por la CADENA de proveedores (openai → gemini → groq, ver lib/sales/providers),
//   así aprovecha OpenAI/Gemini cuando hay tokens y cae a Groq como red de seguridad.
//   Server-only. Las sugerencias son GUESSES para revisar; no navega la web ni afirma como cierto.

import type { CrmLead } from './crm';
import { CRM_INDUSTRIES, CRM_EMPLOYEES } from './crm-constants';
import { createProvider, type ProviderSettings } from '@/lib/sales/providers';

export interface ResearchFields {
  website?: string; industry?: string; city?: string; employees?: string;
  modules_interest?: string; market_notes?: string;
}
export type ResearchResult = { fields: ResearchFields; brief: string } | { error: string };

const SYSTEM = `Sos un asistente de research comercial para el equipo de Zaire (Argentina). Zaire vende:
- ZAIRE INDUSTRIAL: suite modular para operación industrial. Módulos: Trace (órdenes de trabajo y trazabilidad ISO 9001), Field (trabajo de campo con geocerca y viáticos), Assets (gestión de activos: hoja de vida, TCO, MTBF), Stock (repuestos a costo), CRM (comercial). Para empresas que mantienen, reparan y operan activos físicos (industria, oil & gas, servicios industriales).
- ZAIRE STUDIO: automatización, agentes con IA y software a medida.

Dado un prospecto, respondé EXCLUSIVAMENTE un JSON válido con esta forma:
{
  "fields": {
    "website": "dominio probable si podés inferirlo del nombre (ej: https://empresa.com), si no, omitir",
    "industry": "EXACTAMENTE una de la lista de industrias que te paso, o omitir",
    "city": "ciudad probable de la sede si la conocés, si no, omitir",
    "employees": "EXACTAMENTE uno de: ${CRM_EMPLOYEES.join(' | ')}, o omitir",
    "modules_interest": "qué módulos de Zaire le encajarían, separados por coma",
    "market_notes": "1-2 frases de contexto del sector"
  },
  "brief": "texto con estos títulos, en español rioplatense, con criterio y sin humo:\\n1) Lectura rápida\\n2) Qué de Zaire le encaja\\n3) Ángulo de entrada (speech sugerido, 2-3 frases)\\n4) Preguntas para calificar (3-4)\\n5) Objeciones probables y respuesta (2-3)"
}

Reglas irrompibles:
- En "fields", incluí SOLO las claves que puedas inferir con criterio; las demás omitilas. Son sugerencias para que un humano revise: preferí omitir antes que inventar con seguridad.
- NO inventes cifras exactas de facturación ni nombres de personas.
- "industry" debe ser EXACTAMENTE uno de: ${CRM_INDUSTRIES.join(' | ')}.
- El "brief" máximo ~350 palabras.`;

// Transporte único: la cadena de proveedores. Devuelve texto o null (nunca lanza).
async function llmChat(
  system: string,
  user: string,
  opts?: { json?: boolean; maxTokens?: number; temperature?: number; settings?: ProviderSettings },
): Promise<string | null> {
  try {
    const provider = createProvider(opts?.settings);
    const text = await provider.complete({
      system, user,
      json: !!opts?.json,
      maxTokens: opts?.maxTokens ?? 800,
      temperature: opts?.temperature ?? 0.5,
    });
    return text?.trim() || null;
  } catch {
    return null;
  }
}

export async function researchLead(lead: CrmLead, settings?: ProviderSettings): Promise<ResearchResult> {
  const known = [
    ['Empresa', lead.company], ['Industria', lead.industry], ['Ciudad', lead.city],
    ['Sitio web', lead.website], ['Empleados', lead.employees], ['Interés declarado', lead.modules_interest],
    ['Presupuesto', lead.budget], ['Observaciones', lead.market_notes], ['Contacto', lead.contact_person],
  ].filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n');

  const user = `Prospecto (datos ya cargados):\n${known || '- (solo el nombre)'}\n\nCompletá los campos que falten con sugerencias y generá el brief. Devolvé solo el JSON.`;

  const raw = await llmChat(SYSTEM, user, { json: true, maxTokens: 1200, temperature: 0.5, settings });
  if (!raw) return { error: 'La IA no respondió (probá de nuevo en un momento).' };

  try {
    const parsed = JSON.parse(raw) as { fields?: ResearchFields; brief?: string };
    const fields = sanitizeFields(parsed.fields ?? {});
    const brief = (parsed.brief ?? '').trim();
    if (!brief && Object.keys(fields).length === 0) return { error: 'La IA no devolvió un resultado útil.' };
    return { fields, brief };
  } catch {
    // Si no vino JSON válido, usamos el texto como brief.
    return { fields: {}, brief: raw };
  }
}

// Datos del prospecto en texto, para los prompts.
function leadFacts(lead: CrmLead): string {
  return [
    ['Nombre', lead.name], ['Empresa', lead.company], ['Contacto', lead.contact_person],
    ['Industria', lead.industry], ['Ciudad', lead.city], ['Empleados', lead.employees],
    ['Interés / módulos', lead.modules_interest], ['Presupuesto', lead.budget],
    ['Observaciones del mercado', lead.market_notes],
  ].filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- (pocos datos)';
}

// Guión breve para una llamada telefónica, según etapa/industria/necesidades.
export async function callScript(lead: CrmLead, stageName?: string, lastNote?: string | null, settings?: ProviderSettings): Promise<{ text: string } | { error: string }> {
  const system = `Sos un coach de ventas de Zaire (Argentina). Zaire vende la suite industrial Zaire Industrial (Trace, Field, Assets, Stock, CRM) y Zaire Studio (automatización / IA / software a medida). Generá un GUIÓN BREVE para una llamada telefónica en español rioplatense, con criterio y sin humo. Incluí: apertura (1-2 frases para presentarte y captar), 2-3 puntos clave según su industria/necesidad, una pregunta para abrir conversación, y el objetivo (agendar una demo de 30 min). Máximo 160 palabras. NO inventes datos del prospecto.`;
  const user = `Prospecto:\n${leadFacts(lead)}\n- Etapa: ${stageName ?? '—'}\n${lastNote ? `- Última interacción: ${lastNote}\n` : ''}\nGenerá el guión.`;
  const text = await llmChat(system, user, { maxTokens: 500, settings });
  return text ? { text } : { error: 'La IA no respondió (probá de nuevo).' };
}

// Borrador de email (asunto + cuerpo, sin firma).
export async function emailDraft(lead: CrmLead, stageName?: string, settings?: ProviderSettings): Promise<{ subject: string; body: string } | { error: string }> {
  const system = `Sos del equipo comercial de Zaire (Argentina). Zaire vende la suite industrial Zaire Industrial (órdenes, campo, activos, stock, comercial) y Zaire Studio (automatización / IA / software a medida). Redactá un email de contacto o seguimiento para el prospecto, en español rioplatense, profesional y directo, sin humo. Objetivo: proponer una demo de 30 minutos. NO incluyas firma ni saludo de cierre (se agregan aparte). NO inventes datos ni cifras. Devolvé JSON válido: {"subject": "...", "body": "..."}. El body en texto plano con saltos de línea, breve (máx ~140 palabras), abriendo con el nombre si lo hay.`;
  const user = `Prospecto:\n${leadFacts(lead)}\n- Etapa: ${stageName ?? '—'}\nRedactá el email. Solo el JSON.`;
  const raw = await llmChat(system, user, { json: true, maxTokens: 600, settings });
  if (!raw) return { error: 'La IA no respondió (probá de nuevo).' };
  try {
    const p = JSON.parse(raw) as { subject?: string; body?: string };
    return { subject: (p.subject ?? '').trim() || 'Zaire — propuesta de demo', body: (p.body ?? '').trim() };
  } catch { return { subject: 'Zaire — propuesta de demo', body: raw }; }
}

// Solo dejamos claves conocidas; industry/employees deben matchear los selects.
function sanitizeFields(f: ResearchFields): ResearchFields {
  const out: ResearchFields = {};
  const put = (k: keyof ResearchFields, v: unknown) => { if (typeof v === 'string' && v.trim()) out[k] = v.trim(); };
  put('website', f.website); put('city', f.city); put('modules_interest', f.modules_interest); put('market_notes', f.market_notes);
  if (typeof f.industry === 'string' && CRM_INDUSTRIES.includes(f.industry)) out.industry = f.industry;
  if (typeof f.employees === 'string' && CRM_EMPLOYEES.includes(f.employees)) out.employees = f.employees;
  return out;
}
