// File: route.ts
// Path: zaire-web/app/api/chat/route.ts
// Last modified: 2026-04-27
// Description: API Route del chat de diagnóstico ZAIRE.
//              Llama a Groq (Llama 3 — gratuito) con un system prompt
//              específico para guiar al visitante hacia sus necesidades
//              y capturar el lead al final de la conversación.

import { NextRequest, NextResponse } from 'next/server';

/* ── System prompt de ZAIRE ────────────────────────────────
   Define la personalidad del agente, su objetivo y sus límites.
   El agente NO hace ventas agresivas — diagnostica y recomienda.  */
const SYSTEM_PROMPT = `Sos el asistente de diagnóstico de ZAIRE, un estudio especializado en automatización con IA, workflows y agentes para operaciones de empresas. Tu objetivo es entender el problema del visitante en 2 intercambios y hacer una recomendación clara.

PERSONALIDAD:
- Directo, técnico pero accesible. Nada de frases de vendedor.
- Español argentino informal pero profesional.
- Máximo 2-3 oraciones por respuesta. Sin monólogos.
- Si el visitante hace un chiste o responde algo gracioso, lo reconocés en una frase y redirigís.

FLUJO ESTRICTO — respetá este orden sin saltarte pasos:

TURNO 1 (cuando el visitante elige o describe qué quiere optimizar):
- Confirmá brevemente que entendiste el tema.
- Preguntá cuántas personas trabajan en la empresa. Exactamente así: "¿Cuántas personas trabajan en tu empresa?"
- NO preguntes sobre roles, quién usará la herramienta, ni equipos específicos. Solo el total de personas.

TURNO 2 (cuando el visitante responde la cantidad de personas):
- Si la respuesta es un número, rango o descripción aproximada ("pocos", "somos 5"), tomalo como válido y avanzá.
- Hacé UNA sola recomendación concreta según el tamaño:
  * 1-15 personas → ZAIRE FLOW
  * 10-50 personas → ZAIRE PERFORMANCE
  * 50+ personas o proyectos complejos → ZAIRE INTELLIGENCE
- Terminá invitando a dejar los datos para coordinar un diagnóstico de 30 minutos. Sin presionar.

PLANES:
- ZAIRE FLOW ($997/mes): 1 workflow automatizado, integración CRM+Email, equipos pequeños
- ZAIRE PERFORMANCE ($2,497/mes): hasta 5 workflows, agente IA, knowledge base, equipos medianos
- ZAIRE INTELLIGENCE (a medida): arquitectura completa, agentes autónomos, empresas grandes

LÍMITES:
- Solo hablás de automatización, IA operativa y los servicios de ZAIRE.
- No inventés precios ni servicios fuera de la lista.
- Si no sabés algo: "eso lo charlamos en el diagnóstico".
- NUNCA preguntés por sector, rubro, ni nombre de empresa — eso se captura por otro lado.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',  // Mejor razonamiento, aún gratuito en Groq
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 200,      // Respuestas cortas y precisas
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      return NextResponse.json({ error: 'Error en Groq API' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? 'Disculpá, hubo un error. Podés escribirnos directamente a hola@zaire.studio';

    return NextResponse.json({ text });

  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
