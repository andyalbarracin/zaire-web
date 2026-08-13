// File: research.ts
// Path: zaire-web/lib/zaire-ops/research.ts
// Description: "Investigar lead" — usa Groq (la misma LLM del chat del sitio) para
//   generar un brief comercial accionable. Server-only. La IA es limitada y gratuita:
//   NO navega la web ni inventa datos; da lectura, ángulo de entrada, preguntas y objeciones.

import type { CrmLead } from './crm';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM = `Sos un asistente de research comercial para el equipo de Zaire (Argentina). Zaire vende dos cosas:
- ZAIRE INDUSTRIAL: suite modular para la operación industrial. Módulos: Trace (órdenes de trabajo y de servicio, trazabilidad ISO 9001), Field (trabajo de campo con geocerca, reporte y viáticos), Assets (gestión de activos: hoja de vida, TCO, MTBF), Stock (repuestos valuados a costo), CRM (comercial: cotiza con margen y genera la orden). Para empresas que mantienen, reparan y operan activos físicos (industria, oil & gas, servicios industriales).
- ZAIRE STUDIO: automatización, agentes con IA y software a medida.

Dado un prospecto, generá un brief accionable para la llamada, en español rioplatense (voseo), con criterio y sin humo. Usá EXACTAMENTE estos títulos, cortos:

1) Lectura rápida
2) Qué de Zaire le encaja
3) Ángulo de entrada (speech sugerido)
4) Preguntas para calificar
5) Objeciones probables y respuesta

Reglas irrompibles:
- NO inventes cifras, nombres de personas, ni URLs específicas del prospecto. Si un dato no te lo dieron, no lo afirmes.
- Ajustá el ángulo según industria, tamaño (empleados) y presupuesto.
- Concreto y breve. Máximo ~350 palabras.`;

export async function researchLead(lead: CrmLead): Promise<{ text: string } | { error: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { error: 'La IA no está configurada (falta GROQ_API_KEY).' };

  const facts = [
    ['Empresa', lead.company],
    ['Industria', lead.industry],
    ['Ciudad', lead.city],
    ['Sitio web', lead.website],
    ['Empleados', lead.employees],
    ['Módulos / interés declarado', lead.modules_interest],
    ['Presupuesto base', lead.budget],
    ['Observaciones del mercado', lead.market_notes],
    ['Contacto', lead.contact_person],
  ].filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n');

  const user = `Prospecto:\n${facts || '- (pocos datos cargados)'}\n\nGenerá el brief para encararlo.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }],
        max_tokens: 800,
        temperature: 0.6,
      }),
    });
    if (!res.ok) return { error: 'La IA no respondió (probá de nuevo en un momento).' };
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return { error: 'La IA no devolvió contenido.' };
    return { text };
  } catch {
    return { error: 'Error al conectar con la IA.' };
  }
}
