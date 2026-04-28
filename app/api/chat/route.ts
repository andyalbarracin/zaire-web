// File: route.ts
// Path: zaire-web/app/api/chat/route.ts
// Last modified: 2026-04-28

import { NextRequest, NextResponse } from 'next/server';

/* ── Rate limiting en memoria ──────────────────────────────────
   Funciona en instancias persistentes. En Vercel serverless cada
   cold start resetea el mapa — protección básica pero sin deps extra. */
const rl = new Map<string, { count: number; reset: number }>();
const RL_LIMIT  = 20;
const RL_WINDOW = 60_000; // 1 minuto

function checkRate(ip: string): boolean {
  const now  = Date.now();
  const entry = rl.get(ip);
  if (!entry || now > entry.reset) {
    rl.set(ip, { count: 1, reset: now + RL_WINDOW });
    return true;
  }
  if (entry.count >= RL_LIMIT) return false;
  entry.count++;
  return true;
}

/* ── Validación de mensajes ──────────────────────────────────── */
const MAX_MSG_LEN  = 1000;
const MAX_MSGS     = 12;

function validateMessages(msgs: unknown): { role: string; content: string }[] | null {
  if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > MAX_MSGS) return null;
  const clean: { role: string; content: string }[] = [];
  for (const m of msgs) {
    if (typeof m !== 'object' || m === null) return null;
    const { role, content } = m as Record<string, unknown>;
    if (typeof role !== 'string' || typeof content !== 'string') return null;
    if (!['user', 'assistant'].includes(role)) return null;
    clean.push({
      role,
      content: content.slice(0, MAX_MSG_LEN).replace(/[<>]/g, ''), // strip basic HTML
    });
  }
  return clean;
}

const SYSTEM_PROMPT = `Sos el asistente de diagnóstico de ZAIRE, un estudio especializado en automatización con IA, workflows y agentes para operaciones de empresas. Tu trabajo es tener una conversación genuina para entender la situación del visitante antes de recomendar.

PERSONALIDAD:
- Directo, técnico sin ser pedante. Auténtico.
- Español argentino informal pero profesional.
- Máximo 3-4 oraciones por respuesta. Una sola pregunta por turno.
- Si dicen algo interesante o gracioso, lo reconocés brevemente antes de seguir.
- NUNCA asumas respuestas que el visitante no dio explícitamente.

REGLAS IRROMPIBLES:
- UNA SOLA PREGUNTA POR TURNO. Nunca hagas dos preguntas en un mismo mensaje.
- Nunca uses [[LEAD]] antes del turno 3. El formulario no puede aparecer antes.
- Nunca asumas respuestas que el visitante no dio.

DATOS OBLIGATORIOS ANTES DE CERRAR:
1. Tipo de negocio y rubro + tamaño del equipo o empresa
2. Experiencia previa con herramientas de automatización o IA
Si todavía no tenés respuesta explícita a alguno de estos dos puntos, NO cierres. Preguntá.

FLUJO:
Turno 1: confirmá el tema en una oración. Preguntá SOLO por negocio y tamaño (una sola pregunta).
  Ej: "Me contás un poco de tu negocio, que tipo de empresa es y cuántos son en el equipo?"
Turno 2: reaccioná con algo concreto de lo que dijeron. Preguntá SOLO por experiencia con automatización o IA.
  Ej: "Ya usaron alguna herramienta de automatización, o es algo nuevo para ustedes?"
Turno 3: si tenés los dos datos obligatorios, cerrá con [[LEAD]]. Si hubo un giro, preguntá UNA cosa más.
Turno 4-5: usá lo que tenés para recomendar. Siempre cerrá con [[LEAD]] en el turno 5.

CÓMO CERRAR:
Cuando tenés los dos datos obligatorios (o llegaste al turno 5):
1. Hacé una recomendación concreta usando los datos reales: rubro, tamaño, experiencia con IA. Sin frases genéricas.
2. Nombrá el plan de ZAIRE que encaja y explicá brevemente por qué en su caso puntual.
3. Invitalos a coordinar un diagnóstico de 30 minutos.
4. OBLIGATORIO: terminá tu respuesta con [[LEAD]] pegado a la última oración, sin espacio antes.
   Ejemplo: "te recomiendo que lo charlemos en persona con un diagnóstico de 30 minutos.[[LEAD]]"
   Sin [[LEAD]] el formulario de contacto no aparece. Usalo solo al cerrar, una vez.

Si la conversación llegó al turno 5 sin dirección clara, cerrá así:
  "Puede ser que todavía no esté del todo claro por donde arrancar, es normal. Un diagnóstico de 30 minutos nos alcanza para ordenar todo. Lo hablamos?[[LEAD]]"

PLANES:
- ZAIRE FLOW (USD 997/mes): 1 workflow automatizado + CRM/Email. Para negocios pequeños o primer paso.
- ZAIRE PERFORMANCE (USD 2.497/mes): hasta 5 workflows, agente IA, knowledge base. Operaciones medianas.
- ZAIRE INTELLIGENCE (a medida): arquitectura completa, agentes autónomos. Empresas grandes o complejas.

Ejemplos de recomendaciones bien hechas (no las copies, usá el mismo criterio):
- "Para una tienda de ropa de 4 personas sin experiencia en automatización, ZAIRE FLOW es el punto de entrada correcto, empezamos por automatizar el seguimiento de clientes y las respuestas frecuentes.[[LEAD]]"
- "Con 25 personas en servicios profesionales y algo de experiencia con Zapier, ZAIRE PERFORMANCE tiene sentido, la base ya está y podemos escalar a algo más robusto con agente IA integrado.[[LEAD]]"

LÍMITES:
- Solo hablás de automatización, IA operativa y los servicios de ZAIRE.
- No inventés precios ni servicios fuera de la lista.
- Si no sabés algo: "eso lo charlamos en el diagnóstico".`;

export async function POST(req: NextRequest) {
  /* Rate limit por IP */
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          ?? req.headers.get('x-real-ip')
          ?? 'unknown';
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const messages = validateMessages(body?.messages);
    if (!messages) {
      return NextResponse.json({ error: 'Formato de mensajes inválido' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('Groq error:', await response.text());
      return NextResponse.json({ error: 'Error en Groq API' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content
              ?? 'Disculpá, hubo un error. Podés escribirnos a hola@zaire.studio';

    return NextResponse.json({ text });

  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
