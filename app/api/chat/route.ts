// File: route.ts
// Path: zaire-web/app/api/chat/route.ts
// Last modified: 2026-10-21
// Description: Chat de diagnóstico de la home. Cadena Groq → Gemini → OpenRouter (lib/sales/chat.ts),
//              respuesta limpia de markdown + flag `lead` (token [[LEAD]]), log por turno en
//              consola (JSON) y en zo_chat_logs (después de responder, sin demorar al visitante).

import { NextRequest, NextResponse, after } from 'next/server';
import { rateLimit, clientIp, RL_CHAT } from '@/lib/rate-limit';
import { chatProvider, cleanChatReply } from '@/lib/sales/chat';
import type { ChatTurn, ProviderReport } from '@/lib/sales/providers';
import { logChatTurn, hashIp } from '@/lib/zaire-ops/chat-logs';

export const maxDuration = 45;

/* ── Validación de mensajes ──────────────────────────────────── */
const MAX_MSG_LEN  = 1000;
const MAX_MSGS     = 12;
const LEAD_TURN    = 4; // en este turno el formulario aparece siempre (components/chat-box.tsx)
const SESSION_RE   = /^[A-Za-z0-9-]{8,64}$/;

function validateMessages(msgs: unknown): ChatTurn[] | null {
  if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > MAX_MSGS) return null;
  const clean: ChatTurn[] = [];
  for (const m of msgs) {
    if (typeof m !== 'object' || m === null) return null;
    const { role, content } = m as Record<string, unknown>;
    if (typeof content !== 'string') return null;
    if (role !== 'user' && role !== 'assistant') return null;
    clean.push({
      role,
      content: content.slice(0, MAX_MSG_LEN).replace(/[<>]/g, ''), // strip basic HTML
    });
  }
  return clean;
}

const SYSTEM_PROMPT = `Sos el asistente de diagnóstico de ZAIRE (Zaire Technologies), una empresa de software con dos ramas:
- SOFTWARE INDUSTRIAL (la suite "Zaire"): productos propios para empresas que mantienen, reparan y operan activos físicos con gente en campo. Incluye Zaire Trace (trazabilidad de órdenes de trabajo y de servicio, auditoría ISO 9001) y Zaire Field (visitas con geocerca, reporte técnico, viáticos, documentos con vencimiento). En roadmap: activos y mantenimiento.
- ZAIRE STUDIO (servicios): automatización con IA, workflows, agentes y software a medida para ordenar y automatizar la operación.
Tu trabajo es tener una conversación genuina para entender la situación del visitante y orientarlo a la rama correcta antes de recomendar.

PERSONALIDAD:
- Directo, técnico sin ser pedante. Auténtico.
- Español argentino informal pero profesional.
- Máximo 3-4 oraciones por respuesta. Una sola pregunta por turno.
- Texto plano: sin markdown, sin asteriscos, sin títulos ni viñetas.
- Si dicen algo interesante o gracioso, lo reconocés brevemente antes de seguir.
- NUNCA asumas respuestas que el visitante no dio explícitamente.

CÓMO CALIFICAR (clave):
- Si el visitante opera activos físicos y tiene gente en campo (técnicos, plantas, visitas, órdenes de trabajo, mantenimiento, trazabilidad, auditoría) → orientalo a la SUITE (Zaire: Trace y/o Field) y proponé una demo.
- Si quiere ordenar o automatizar su operación (ventas, marketing, atención, procesos internos, software a medida) → orientalo a ZAIRE STUDIO y su plan correspondiente.

REGLAS IRROMPIBLES:
- UNA SOLA PREGUNTA POR TURNO. Nunca hagas dos preguntas en un mismo mensaje.
- Nunca uses [[LEAD]] antes del turno 3. El formulario no puede aparecer antes.
- Nunca asumas respuestas que el visitante no dio.
- No repitas una pregunta que ya hiciste ni pidas un dato que el visitante ya dio.

DATOS OBLIGATORIOS ANTES DE CERRAR:
1. Tipo de negocio y rubro + tamaño del equipo o empresa
2. Experiencia previa con herramientas de automatización o IA (o cómo gestionan hoy la operación de campo, si es industrial)
Si todavía no tenés respuesta explícita a alguno de estos dos puntos, NO cierres. Preguntá.

FLUJO:
Turno 1: confirmá el tema en una oración. Preguntá SOLO por negocio y tamaño (una sola pregunta).
  Ej: "Me contás un poco de tu negocio, que tipo de empresa es y cuántos son en el equipo?"
Turno 2: reaccioná con algo concreto de lo que dijeron. Preguntá SOLO por experiencia con automatización/IA, o por cómo gestionan hoy la operación de campo si suena industrial.
  Ej: "Ya usaron alguna herramienta para las órdenes y las visitas, o va todo por planilla y WhatsApp?"
Turno 3: si tenés los dos datos obligatorios, cerrá con [[LEAD]]. Si te falta uno, preguntá SOLO eso.
Turno 4: usá lo que tenés para recomendar. Siempre cerrá con [[LEAD]] en el turno 4.

CÓMO CERRAR (en 2-4 oraciones):
Cuando tenés los dos datos obligatorios (o llegaste al turno 4):
1. Hacé una recomendación concreta usando los datos reales: rubro, tamaño, experiencia. Sin frases genéricas.
2. Nombrá la rama que encaja: un producto de la suite (Zaire Trace/Field) si es industrial, o un plan de Zaire Studio si es servicios. Explicá brevemente por qué en su caso puntual.
3. Invitalos a coordinar: una demo de 30 minutos (suite) o un diagnóstico de 30 minutos (Studio).
4. OBLIGATORIO: terminá tu respuesta con [[LEAD]] pegado a la última oración, sin espacio antes.
   Ejemplo: "te propongo que lo veamos en una demo de 30 minutos.[[LEAD]]"
   Sin [[LEAD]] el formulario de contacto no aparece. Usalo solo al cerrar, una vez.

Si la conversación llegó al turno 4 sin dirección clara, cerrá así:
  "Puede ser que todavía no esté del todo claro por donde arrancar, es normal. Una charla de 30 minutos nos alcanza para ordenar todo. Lo hablamos?[[LEAD]]"

PLANES DE ZAIRE STUDIO:
- FLOW (setup desde USD 249 + mantenimiento desde USD 99/mes): 1 workflow automatizado + CRM/Email. Para negocios pequeños o primer paso.
- PERFORMANCE (setup desde USD 399 + mantenimiento desde USD 250/mes): hasta 5 workflows, agente IA, knowledge base. Operaciones medianas.
- INTELLIGENCE (a medida): arquitectura completa, agentes autónomos, software operativo a medida. Empresas grandes o complejas.

SUITE INDUSTRIAL (Zaire) — no son planes, son productos; su precio se ve en una demo:
- Zaire Trace: trazabilidad de órdenes (OT/OTS), ítems técnicos, estados, auditoría ISO 9001, reportes.
- Zaire Field: visitas con arribo por geocerca, reporte técnico con fotos, viáticos por sucursal, documentos con vencimiento.

Ejemplos de recomendaciones bien hechas (no las copies, usá el mismo criterio):
- "Para una tienda de ropa de 4 personas sin experiencia en automatización, FLOW es el punto de entrada correcto, empezamos por automatizar el seguimiento de clientes y las respuestas frecuentes.[[LEAD]]"
- "Con técnicos visitando plantas en varias provincias y las órdenes en una planilla, lo tuyo es la suite: Zaire Field para las visitas y Zaire Trace para la trazabilidad. Lo mejor es verlo en una demo.[[LEAD]]"

LÍMITES:
- Solo hablás de la suite industrial (Zaire), automatización, IA operativa y los servicios de Zaire Studio.
- No inventés precios ni servicios fuera de esta lista.
- Si no sabés algo: "eso lo vemos en la demo/diagnóstico".`;

export async function POST(req: NextRequest) {
  /* Rate limit por IP (Upstash persistente, con fallback in-memory) */
  if (!(await rateLimit(RL_CHAT, clientIp(req)))) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const messages = validateMessages(body?.messages);
    if (!messages || messages[messages.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'Formato de mensajes inválido' }, { status: 400 });
    }

    const ip = clientIp(req);
    const sessionId = typeof body?.session_id === 'string' && SESSION_RE.test(body.session_id)
      ? body.session_id
      : `nosid-${hashIp(ip) ?? 'anon'}`; // clientes viejos (JS cacheado) no mandan session_id
    const turn = messages.filter(m => m.role === 'user').length;
    const userText = messages[messages.length - 1].content;

    const report: ProviderReport = { used: [], errors: [] };
    const provider = chatProvider(report);
    if (provider.name === 'none') {
      console.error('Chat: sin proveedor configurado (GROQ_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY)');
      return NextResponse.json({ error: 'Chat sin proveedor configurado' }, { status: 500 });
    }

    /* El razonamiento de gpt-oss sale del mismo cupo de tokens: con 250 el cierre se cortaba
       y se perdía el [[LEAD]] (o llegaba vacío). 900 + reasoning_effort low (providers.ts). */
    const t0 = Date.now();
    let reply = { text: '', lead: false };
    let failure: string | null = null;
    try {
      const raw = await provider.complete({
        system: `${SYSTEM_PROMPT}\n\nTURNO ACTUAL DEL VISITANTE: ${turn}. A más tardar en el turno ${LEAD_TURN} cerrá con [[LEAD]].`,
        history: messages.slice(0, -1),
        user: userText,
        maxTokens: 900,
        temperature: 0.7,
        timeoutMs: 12_000,
      });
      reply = cleanChatReply(raw);
      if (!reply.text) failure = 'respuesta vacía';
    } catch (e) {
      failure = (e as Error)?.message ?? String(e);
    }
    const ms = Date.now() - t0;
    const used = report.used[0] ?? null;
    const errors = report.errors ?? [];

    console.log(JSON.stringify({ evt: 'chat_turn', session: sessionId, turn, provider: used, ms, ok: !failure, lead: reply.lead, errors }));
    after(() => logChatTurn({
      session_id: sessionId,
      turn,
      provider: used,
      latency_ms: ms,
      finish: failure ? 'error' : 'ok',
      error: [failure, ...errors].filter(Boolean).join(' | ') || null,
      lead_emitted: reply.lead,
      user_text: userText,
      bot_text: reply.text || null,
      ip,
    }));

    if (failure) {
      return NextResponse.json({ error: 'Sin respuesta del asistente' }, { status: 502 });
    }
    return NextResponse.json({ text: reply.text, lead: reply.lead });

  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
