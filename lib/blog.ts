// File: blog.ts
// Path: zaire-web/lib/blog.ts
// Last modified: 2026-04-27
// Description: Capa de datos del blog. Fetch desde Supabase con fallback a
//              datos dummy para desarrollo sin base configurada.

import { supabase } from './supabase';

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  read_time: number;
  published_at: string;
  featured: boolean;
  cover_bg: string;   // color CSS del fondo de portada (fallback si no hay imagen)
  cover_accent: string;
  cover_image?: string | null;   // URL de imagen de portada (opcional; si existe, se usa en vez del color)
}

/* ── Posts dummy para desarrollo y seed inicial ─────────── */
export const DUMMY_POSTS: BlogPost[] = [
  {
    id: 1,
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

Antes de construir cualquier automatización, definí:
- ¿Quién es el owner operativo?
- ¿Qué pasa cuando falla?
- ¿De qué sistemas depende y cómo se notifica si cambian?
- ¿Cómo vas a monitorear que funciona?

Esas cuatro preguntas valen más que cualquier herramienta.`,
    category: 'Automatización',
    read_time: 8,
    published_at: '2025-04-15',
    featured: true,
    cover_bg: '#111',
    cover_accent: '#FF6A00',
  },
  {
    id: 2,
    slug: 'mcp-protocolo-agentes-herramientas',
    title: 'MCP: el protocolo que cambia cómo los agentes usan herramientas',
    excerpt: "Anthropic's MCP no es hype. Es infraestructura. Explicamos qué es, cómo funciona y por qué lo usamos en ZAIRE para conectar agentes con sistemas reales.",
    content: `## Qué es MCP

Model Context Protocol (MCP) es un estándar abierto de Anthropic que define cómo los agentes IA se conectan a herramientas externas: bases de datos, APIs, archivos, sistemas de búsqueda.

Antes de MCP, cada integración era ad-hoc. Ahora, cualquier herramienta que implemente el protocolo es automáticamente accesible para cualquier agente compatible.

## Por qué importa

La diferencia entre un chatbot y un agente real es la capacidad de actuar. MCP es la infraestructura que permite esa acción de forma segura y predecible.

En ZAIRE lo usamos para conectar agentes a Supabase, n8n, CRMs y sistemas propios del cliente. El resultado: agentes que no solo responden, sino que modifican datos, envían mensajes y disparan flujos.

## Cómo funciona

Un servidor MCP expone "tools" que el agente puede invocar. Cada tool tiene un nombre, descripción y esquema de parámetros. El agente decide cuándo y cómo usarlas basándose en el contexto de la conversación.

La arquitectura es simple: cliente (el agente) habla con servidor (el sistema externo) a través del protocolo estandarizado.`,
    category: 'Agentes IA',
    read_time: 5,
    published_at: '2025-04-08',
    featured: false,
    cover_bg: '#1a0a00',
    cover_accent: '#FF6A00',
  },
  {
    id: 3,
    slug: 'pipeline-ventas-funciona-solo',
    title: 'Cómo construir un pipeline de ventas que funciona solo',
    excerpt: 'Un pipeline sin automatización es solo un Excel glorificado. Esta es la arquitectura que usamos para equipos B2B que quieren cerrar más sin contratar más.',
    content: `## El problema del pipeline manual

Un CRM sin automatización es un tablero de visualización. Los datos entran cuando alguien los carga, los seguimientos dependen de la memoria del vendedor, y el reporting requiere horas de consolidación.

## La arquitectura que funciona

Un pipeline inteligente tiene tres capas:

**Captación automatizada**: Los leads entran al CRM sin intervención humana. Formularios, LinkedIn, email, WhatsApp — todo converge en un punto de entrada unificado.

**Calificación por agente**: Un agente IA evalúa cada lead según criterios definidos (industria, tamaño, señales de intención) y lo clasifica antes de asignarlo al equipo.

**Seguimiento orquestado**: Secuencias de email, WhatsApp y tareas generadas automáticamente según el estado del deal y el comportamiento del lead.

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
    id: 4,
    slug: 'rag-vs-fine-tuning-cuando-usar',
    title: 'RAG vs. fine-tuning: cuándo usar cada uno',
    excerpt: 'La decisión más importante al construir un agente con conocimiento de empresa. Una guía práctica con criterios reales, no teoría de papers.',
    content: `## La pregunta equivocada

"¿RAG o fine-tuning?" es la pregunta equivocada. La pregunta correcta es: "¿qué tipo de conocimiento necesita mi agente?"

## RAG: para conocimiento que cambia

Recuperación augmentada de generación (RAG) es ideal cuando:
- El conocimiento se actualiza frecuentemente
- Las fuentes son documentos estructurados (manuales, FAQs, bases de datos)
- Necesitás que el agente cite fuentes específicas

La arquitectura: documents → embeddings → vector DB → retrieval → generación.

## Fine-tuning: para comportamiento, no conocimiento

Fine-tuning ajusta el comportamiento del modelo: tono, formato, patrones de respuesta. No es un mecanismo eficiente para injectar conocimiento — el modelo "olvida" datos específicos durante el entrenamiento.

## La regla práctica

En el 95% de los casos de empresa, RAG es la respuesta correcta. Fine-tuning tiene sentido solo cuando necesitás ajustar un comportamiento muy específico que el prompting no puede lograr.`,
    category: 'Arquitectura',
    read_time: 7,
    published_at: '2025-03-22',
    featured: false,
    cover_bg: '#FF6A00',
    cover_accent: '#111',
  },
  {
    id: 5,
    slug: 'errores-n8n-produccion',
    title: 'El error más común al implementar n8n en producción',
    excerpt: 'n8n es una herramienta poderosa. Pero sin los patrones correctos, los workflows colapsan con el crecimiento. Estos son los 5 errores que vemos siempre.',
    content: `## n8n en producción es diferente

n8n en local o en un VPS propio funciona. n8n en producción con 50 workflows activos y 10k ejecuciones diarias requiere otra mentalidad.

## Los 5 errores más comunes

**1. Un solo workflow para todo**: El monolito de automatización. Falla un paso y se rompe todo. La solución: workflows atómicos conectados por webhooks internos.

**2. Sin manejo de errores en cada nodo**: Cada llamada a API puede fallar. Si no tenés un "Error Trigger" y lógica de retry, una API caída detiene todo el flujo.

**3. Credenciales hardcodeadas**: Las credenciales van en el gestor de credenciales de n8n, no en el cuerpo del nodo. Simple, pero se ignora el 60% de las veces.

**4. Sin límites de rate**: Si tu workflow llama a una API externa en loop sin throttling, terminás baneado. Usá el nodo "Wait" estratégicamente.

**5. Sin documentación de triggers**: ¿Qué dispara este workflow? ¿Con qué frecuencia? ¿Quién lo mantiene? Sin eso, el workflow es una caja negra.`,
    category: 'Operaciones',
    read_time: 4,
    published_at: '2025-03-15',
    featured: false,
    cover_bg: '#1a1a1a',
    cover_accent: '#4ade80',
  },
  {
    id: 6,
    slug: 'agente-soporte-sin-alucinaciones',
    title: 'Cómo diseñar un agente de soporte que no alucine',
    excerpt: 'Los agentes de soporte fallan cuando no tienen memoria, contexto ni límites claros. Esta es la arquitectura que funciona en producción real.',
    content: `## El problema de la alucinación en soporte

Un agente de soporte que inventa información es peor que no tener agente. La confianza del cliente se pierde en un solo intercambio.

## Las tres causas raíz

**Sin base de conocimiento estructurada**: El agente no tiene acceso a información verificada y genera respuestas plausibles pero incorrectas.

**Sin límites de dominio**: El agente intenta responder todo en lugar de escalar lo que no sabe.

**Sin memoria de contexto**: Cada mensaje es tratado como una conversación nueva, perdiendo el hilo.

## La arquitectura que funciona

1. **Knowledge base via RAG**: Toda la información del producto/servicio en un vector DB. El agente solo responde con base en lo que recupera.

2. **Prompt con límites explícitos**: "Si no encontrás la información en los documentos provistos, decí exactamente eso y escalá al humano."

3. **Memoria de sesión**: Un ID de conversación y un resumen del contexto previo inyectado en cada llamada.

4. **Escalado automático**: Si el score de confianza del retrieval es bajo, transferir a humano sin intentar responder.`,
    category: 'Agentes IA',
    read_time: 6,
    published_at: '2025-03-08',
    featured: false,
    cover_bg: '#FFC107',
    cover_accent: '#111',
  },
];

/* ── Funciones de acceso a datos ─────────────────────────── */

export async function getAllPosts(): Promise<BlogPost[]> {
  // Si Supabase está configurado, usarlo; si no, retorna dummy data
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url === 'https://your-project.supabase.co') {
    return DUMMY_POSTS.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false });

  if (error || !data?.length) return DUMMY_POSTS;
  return data as BlogPost[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url === 'https://your-project.supabase.co') {
    return DUMMY_POSTS.find(p => p.slug === slug) ?? null;
  }

  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  return (data as BlogPost) ?? DUMMY_POSTS.find(p => p.slug === slug) ?? null;
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find(p => p.featured) ?? posts[0] ?? null;
}
