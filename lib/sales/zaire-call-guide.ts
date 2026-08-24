// File: lib/sales/zaire-call-guide.ts
// Guía de conversación de referencia para llamadas/speech de Zaire (estilo aprobado por el
// dueño, refinado con GPT). El motor la inyecta en la generación de TODO speech, para que
// cualquier LLM redacte con este enfoque discovery-first (no vender de entrada, descubrir dolor).
// Ampliar/ajustar = editar este texto.

export const CALL_GUIDE = `GUÍA DE CONVERSACIÓN DE REFERENCIA (seguí este ENFOQUE y TONO al armar el speech; es el estilo aprobado):

OBJETIVO DE LA PRIMERA LLAMADA: NO vender toda la suite. Conseguir una de estas tres:
1) hablar con la persona correcta, 2) entender cómo manejan HOY las órdenes/trabajos, 3) conseguir una demo corta (15-20 min).

TONO: colega técnico que sabe del oficio, humilde y directo. "Te robo 30 segundos". Voseo rioplatense. Nada de vendedor. La idea mental: no es "tengo un software maravilloso", es "¿esta empresa tiene el problema que mi software ya sabe resolver?".

APERTURA CON EL RESPONSABLE (ejemplo del estilo, adaptar):
"Hola, ¿cómo estás? Soy [nombre], de Zaire Technologies. Te robo treinta segundos. Desarrollamos un sistema para empresas industriales que trabajan con órdenes de trabajo, equipos y servicios técnicos. Ya lo implementamos en una empresa del sector y ahora estoy hablando con otras para entender cómo manejan hoy ese proceso. Te hago una consulta simple: las órdenes de trabajo, reparaciones y seguimiento de equipos, ¿las manejan con algún sistema o más con Excel, planillas y herramientas internas?" — y CALLAR.

REGLAS DE ORO:
- NO abrir con presuposiciones agresivas tipo "¿cuántas órdenes se te traspapelan?" (asume que trabajan mal, es agresivo).
- NO describir diez funciones de entrada. Primero preguntar y ESCUCHAR.
- Si usan Excel/Access/papel: NO criticar. "Perfecto, de hecho es común." Y preguntar: ¿está todo centralizado o también entra WhatsApp/mails/carpetas/PDFs? ¿pueden consultar el estado de un trabajo o hay que preguntarle a alguien? ¿cuántos trabajos abiertos a la vez? — así aparece el dolor.
- Si ya tienen sistema: NO decir "el nuestro es mejor". Preguntar si es a medida o un ERP, y si cubre solo administración o también el seguimiento técnico del trabajo/equipos. Si está todo resuelto, reconocerlo ("entonces hoy no tiene sentido que te venda nada") — suena serio y honesto.
- Recién cuando aparece un problema concreto, hablás de Zaire, y SOLO la parte relacionada a ese problema.

PEDIR LA DEMO: "Por lo que me contás, creo que tiene sentido que lo veas. Es una demo de 15-20 min donde te muestro un caso completo, de que entra una orden hasta que se termina. Si no encaja con cómo trabajan, no pasa nada. ¿Tenés un momento la semana que viene?".

SI DICE "MANDAME INFO": pedir el mail y preguntar qué le interesaría ver principalmente (órdenes / trazabilidad de equipos / seguimiento de servicio) para mandar algo personalizado, no genérico.

SI PREGUNTA PRECIO RÁPIDO: no esconderlo pero no cotizar a ciegas: "implementación inicial + licencia mensual; depende de cuántos lo usan, qué módulos y si hay que migrar datos. Para un número serio primero necesito entender cómo trabajan".

CORRECCIONES IMPORTANTES (no las ignores):
- NO usar la objeción categórica "Access no es multiusuario, no audita y no pasa una ISO". Puede ser falso según cómo lo tengan armado y quema credibilidad. Si hablás de Access/Excel, hacelo desde la pregunta (dónde queda la info, cómo consultan estados), no desde la descalificación.
- NO prometer "listo para auditoría ISO 9001 en dos clics". El cumplimiento ISO es del sistema de gestión de la empresa, no del software. Zaire AYUDA con trazabilidad, evidencias e historial — decilo así, sin garantizar el certificado.
- Para bombas/sellos/reparación de equipos: entrar por "cómo siguen un equipo desde que ingresa hasta que vuelve al cliente", MUCHO antes que hablar de transformación digital, IA o incluso de módulos.
- Pregunta de oro para reparadores de equipos: "Cuando les entra una bomba o un equipo para reparar, ¿cómo hacen hoy para seguir todo el proceso hasta que vuelve al cliente?".`;
