// File: seed-blog.mjs
// Path: zaire-web/scripts/seed-blog.mjs
// Last modified: 2026-04-27
// Description: Seed inicial de la tabla blog_posts en Supabase.
//              Ejecutar una sola vez: node scripts/seed-blog.mjs
//              Requiere que .env.local tenga NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Leer .env.local manualmente (Node no lo carga automático)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .filter(([k]) => k)
    .map(([k, ...v]) => [k, v.join('=')])
);

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error('❌ Falta SUPABASE_SERVICE_ROLE_KEY en .env.local');
  console.error('   Ir a: supabase.com → tu proyecto → Settings → API → "service_role" (secret)');
  process.exit(1);
}

// service_role bypasea RLS — solo usar en scripts de server, nunca en el cliente
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const posts = [
  {
    slug: 'por-que-automatizaciones-falla-3-meses',
    title: 'Por qué el 80% de las automatizaciones falla a los 3 meses',
    excerpt: 'No es el software, no es la integración y tampoco es el equipo. La mayoría de las automatizaciones mueren por falta de arquitectura base. Exploramos los 4 patrones de falla más comunes y cómo evitarlos desde el diseño.',
    content: `## El problema no es la herramienta

Cuando una automatización falla a los 3 meses, la reacción típica es culpar al software. "n8n es difícil", "Make no escala", "el webhook es inestable". Pero en el 80% de los casos que vemos en ZAIRE, el problema es anterior a la elección de herramienta.

## Los 4 patrones de falla

### 1. Sin owner definido
La automatización fue construida por alguien que ya no está, o por un consultor externo sin handoff. Cuando algo falla, nadie sabe cómo intervenir.

### 2. Sin manejo de errores
Los flujos felices son fáciles de construir. El problema son los casos edge: el CRM que devuelve un campo vacío, el email que rebota, la API que responde 429. Sin lógica de error, cualquier excepción mata el flujo.

### 3. Dependencias ocultas
La automatización depende de un campo en HubSpot que alguien renombró, o de una hoja de cálculo que ya no se actualiza. Sin documentación de dependencias, cualquier cambio colateral rompe el sistema.

### 4. Sin monitoreo
Si no hay alertas cuando algo falla, el problema no se detecta hasta que un cliente se queja. Para entonces, el daño está hecho.

## La solución: arquitectura antes que código

Antes de construir cualquier automatización, definí: quién es el owner operativo, qué pasa cuando falla, de qué sistemas depende y cómo vas a monitorear que funciona.

Esas cuatro preguntas valen más que cualquier herramienta.`,
    category: 'Automatización',
    read_time: 8,
    published_at: '2025-04-15',
    featured: true,
    cover_bg: '#111',
    cover_accent: '#FF6A00',
  },
  {
    slug: 'mcp-protocolo-agentes-herramientas',
    title: 'MCP: el protocolo que cambia cómo los agentes usan herramientas',
    excerpt: "Anthropic's MCP no es hype. Es infraestructura. Explicamos qué es, cómo funciona y por qué lo usamos en ZAIRE para conectar agentes con sistemas reales.",
    content: `## Qué es MCP

Model Context Protocol (MCP) es un estándar abierto de Anthropic que define cómo los agentes IA se conectan a herramientas externas: bases de datos, APIs, archivos, sistemas de búsqueda.

## Por qué importa

La diferencia entre un chatbot y un agente real es la capacidad de actuar. MCP es la infraestructura que permite esa acción de forma segura y predecible.

En ZAIRE lo usamos para conectar agentes a Supabase, n8n, CRMs y sistemas propios del cliente.

## Cómo funciona

Un servidor MCP expone "tools" que el agente puede invocar. Cada tool tiene un nombre, descripción y esquema de parámetros. El agente decide cuándo y cómo usarlas basándose en el contexto de la conversación.`,
    category: 'Agentes IA',
    read_time: 5,
    published_at: '2025-04-08',
    featured: false,
    cover_bg: '#1a0a00',
    cover_accent: '#FF6A00',
  },
  {
    slug: 'pipeline-ventas-funciona-solo',
    title: 'Cómo construir un pipeline de ventas que funciona solo',
    excerpt: 'Un pipeline sin automatización es solo un Excel glorificado. Esta es la arquitectura que usamos para equipos B2B que quieren cerrar más sin contratar más.',
    content: `## El problema del pipeline manual

Un CRM sin automatización es un tablero de visualización. Los datos entran cuando alguien los carga, los seguimientos dependen de la memoria del vendedor.

## La arquitectura que funciona

**Captación automatizada**: Los leads entran al CRM sin intervención humana.

**Calificación por agente**: Un agente IA evalúa cada lead según criterios definidos y lo clasifica antes de asignarlo al equipo.

**Seguimiento orquestado**: Secuencias de email, WhatsApp y tareas generadas automáticamente según el estado del deal.

## El resultado

Equipos de 3 personas cerrando lo que antes requería 8. No por magia, sino por eliminar todo el trabajo que no requiere juicio humano.`,
    category: 'Revenue',
    read_time: 6,
    published_at: '2025-04-01',
    featured: false,
    cover_bg: '#1a1a1a',
    cover_accent: '#FFC107',
  },
  {
    slug: 'rag-vs-fine-tuning-cuando-usar',
    title: 'RAG vs. fine-tuning: cuándo usar cada uno',
    excerpt: 'La decisión más importante al construir un agente con conocimiento de empresa. Una guía práctica con criterios reales, no teoría de papers.',
    content: `## La pregunta equivocada

"¿RAG o fine-tuning?" es la pregunta equivocada. La pregunta correcta es: "¿qué tipo de conocimiento necesita mi agente?"

## RAG: para conocimiento que cambia

Ideal cuando el conocimiento se actualiza frecuentemente o las fuentes son documentos estructurados.

La arquitectura: documents → embeddings → vector DB → retrieval → generación.

## Fine-tuning: para comportamiento, no conocimiento

Fine-tuning ajusta el comportamiento del modelo: tono, formato, patrones de respuesta. No es un mecanismo eficiente para injectar conocimiento.

## La regla práctica

En el 95% de los casos de empresa, RAG es la respuesta correcta.`,
    category: 'Arquitectura',
    read_time: 7,
    published_at: '2025-03-22',
    featured: false,
    cover_bg: '#FF6A00',
    cover_accent: '#111',
  },
  {
    slug: 'errores-n8n-produccion',
    title: 'El error más común al implementar n8n en producción',
    excerpt: 'n8n es una herramienta poderosa. Pero sin los patrones correctos, los workflows colapsan con el crecimiento. Estos son los 5 errores que vemos siempre.',
    content: `## n8n en producción es diferente

n8n en local funciona. n8n en producción con 50 workflows activos requiere otra mentalidad.

## Los 5 errores más comunes

**1. Un solo workflow para todo**: El monolito de automatización. La solución: workflows atómicos conectados por webhooks internos.

**2. Sin manejo de errores en cada nodo**: Cada llamada a API puede fallar. Si no tenés un "Error Trigger" y lógica de retry, una API caída detiene todo.

**3. Credenciales hardcodeadas**: Las credenciales van en el gestor de credenciales de n8n, no en el cuerpo del nodo.

**4. Sin límites de rate**: Si tu workflow llama a una API externa en loop sin throttling, terminás baneado.

**5. Sin documentación de triggers**: ¿Qué dispara este workflow? ¿Con qué frecuencia? ¿Quién lo mantiene?`,
    category: 'Operaciones',
    read_time: 4,
    published_at: '2025-03-15',
    featured: false,
    cover_bg: '#1a1a1a',
    cover_accent: '#4ade80',
  },
  {
    slug: 'agente-soporte-sin-alucinaciones',
    title: 'Cómo diseñar un agente de soporte que no alucine',
    excerpt: 'Los agentes de soporte fallan cuando no tienen memoria, contexto ni límites claros. Esta es la arquitectura que funciona en producción real.',
    content: `## El problema de la alucinación en soporte

Un agente de soporte que inventa información es peor que no tener agente.

## Las tres causas raíz

**Sin base de conocimiento estructurada**: El agente genera respuestas plausibles pero incorrectas.

**Sin límites de dominio**: El agente intenta responder todo en lugar de escalar lo que no sabe.

**Sin memoria de contexto**: Cada mensaje es tratado como una conversación nueva.

## La arquitectura que funciona

1. Knowledge base via RAG — solo responde con base en lo que recupera.
2. Prompt con límites explícitos — si no encontrás la información, decilo y escalá.
3. Memoria de sesión — ID de conversación y resumen del contexto previo.
4. Escalado automático — si el score de confianza del retrieval es bajo, transferir a humano.`,
    category: 'Agentes IA',
    read_time: 6,
    published_at: '2025-03-08',
    featured: false,
    cover_bg: '#FFC107',
    cover_accent: '#111',
  },
];

async function seed() {
  console.log('🌱 Iniciando seed de blog_posts...\n');

  for (const post of posts) {
    const { error } = await supabase
      .from('blog_posts')
      .upsert(post, { onConflict: 'slug' });

    if (error) {
      console.error(`❌ Error en "${post.slug}":`, error.message);
    } else {
      console.log(`✓  ${post.slug}`);
    }
  }

  console.log('\n✅ Seed completado.');
}

seed().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
