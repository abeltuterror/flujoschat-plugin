# Cuestionario de descubrimiento — qué preguntar antes de crear un agente

Este documento le sirve a la IA que ejecuta el skill `crear-agente`. Su objetivo es que el
dueño del negocio termine el paso 1 con una idea clara de qué agente quiere, sin sentir que
rellena un formulario.

## Cómo se usa

- **Dos rondas, no veinte preguntas.** La ronda 1 cubre los bloques A y B (negocio, objetivo,
  límites). La ronda 2 cubre C a F (fuentes, acciones, datos del cliente, voz), y se hace
  DESPUÉS de enseñarle el menú de lo posible (`catalogo-capacidades.md`), porque muchas de esas
  respuestas dependen de que sepa qué existe.
- **Propón valores por defecto y pide confirmación.** "Asumo que tutea, responde en español de
  Perú y pasa a una persona cuando el cliente lo pide o se queja. ¿Cambio algo?" es una
  pregunta; seis preguntas sueltas son un interrogatorio.
- **No preguntes lo que ya dijo.** Si en la petición inicial ya contó que es una clínica dental
  en Lima, el bloque A está casi resuelto: confirma y sigue.
- **Cada respuesta se traduce en algo concreto** (una sección del prompt, una capacidad, una
  categoría de conocimiento). La columna "Se traduce en" existe para que no se pregunte nada
  decorativo.
- **Cierre obligatorio:** antes de pasar al diseño, escribe la frase-resumen del final. Si no
  puedes rellenarla, falta una respuesta.

## Bloque A — Negocio y objetivo (ronda 1)

| Pregunta | Por qué | Se traduce en |
|---|---|---|
| ¿A qué se dedica el negocio y en qué ciudad o país atiende? | Define tono, moneda, variante de español y contexto. La fecha del día la pone la plataforma sola, en la zona horaria del negocio; no hay que pedirla. | Sección "Identidad y rol" del prompt; variante de idioma |
| ¿Quién le escribe por WhatsApp: clientes actuales, interesados, ambos? | Cambia el saludo y lo que se puede dar por sabido. | Identidad y primer mensaje |
| ¿Qué quieres que logre el agente en una conversación típica? (resolver dudas · vender o cotizar · agendar citas · captar datos · orientar y derivar) | Es el objetivo del prompt y decide la plantilla base. Un agente con dos objetivos distintos suele ser dos agentes. | Sección "Tu trabajo"; plantilla de `plantillas-prompt.md` |
| ¿Cómo se llamará el asistente? ¿Se presenta como asistente virtual? | Un nombre y una presentación honesta evitan que el cliente crea que habla con una persona. Recomendado: presentarse como asistente virtual del negocio. | Identidad |

## Bloque B — Alcance y límites (ronda 1)

| Pregunta | Por qué | Se traduce en |
|---|---|---|
| ¿Qué temas SÍ debe atender? ¿Cuáles NO, aunque le pregunten? | El alcance explícito es lo que evita que opine de todo. | Sección "Tu trabajo" y "Lo que no haces" |
| ¿Qué no debe prometer jamás? (descuentos, plazos de entrega, diagnósticos, reembolsos, garantías…) | Las prohibiciones concretas valen más que cualquier pedido genérico de "sé prudente". | "Lo que no haces" |
| ¿Cuándo quieres que pase a una persona? (el cliente lo pide · reclamo · cliente molesto · pago o dinero · urgencia · no supo resolver en dos intentos) | La herramienta para derivar existe siempre en todo agente; lo que falta es el criterio. Sin criterio, o deriva todo o no deriva nunca. | Sección "Pasa a una persona" |
| ¿Hay horario en que sí hay personas atendiendo? | Para que el agente diga la verdad al derivar ("alguien te escribe en horario de atención, lunes a sábado de 9 a 19"). | Texto de derivación |

## Bloque C — Fuentes de verdad (ronda 2)

| Pregunta | Por qué | Se traduce en |
|---|---|---|
| ¿Tienes textos con preguntas frecuentes, políticas, catálogo, precios, horarios? ¿Los puedes pegar aquí o dictarlos? | Es la base de conocimiento. Por este canal solo entra texto pegado; los archivos se suben desde el panel. Cada documento indexado gasta saldo de IA: hay que contarlos antes. | Categorías + documentos de conocimiento |
| ¿Hay datos que cambian por cliente o por minuto (estado de un pedido, stock, saldo, envío)? ¿Dónde viven (sistema propio, ERP, una hoja de Google, un Google Apps Script)? | Eso no va al prompt ni al conocimiento: va a algo que lo consulta en vivo. Si vive en una hoja de Google, `google_sheets_consultar` la lee sin programar nada; pregunta entonces si esa hoja tiene datos de clientes que otro cliente no deba ver, porque el agente lee cualquier fila que coincida con lo que pregunte. Si ya tienen un Apps Script publicado como aplicación web, una herramienta `APPS_SCRIPT`. Si no, HTTP o MCP. Empezar por solo lectura. | Capacidad `google_sheets_consultar`, o herramienta HTTP, MCP o `APPS_SCRIPT` |
| Si esa herramienta necesita una clave de acceso (o, en un Apps Script, la clave compartida), ¿quién la tiene? | La clave NO se pide por el chat ni se envía por este canal: el dueño la añade en el panel, en la ficha de la herramienta. Solo hace falta saber que existe. | Pendiente del panel |
| ¿Tienes manuales, catálogos o políticas en Google Drive? | Dos caminos: importarlos a la base de conocimiento desde el panel (*Importar de Drive*: se indexan, gastan saldo y se re-sincronizan solos) o que el agente los lea en vivo con `google_drive_buscar` (solo los documentos elegidos y los que están directamente dentro de las carpetas elegidas, nunca sus subcarpetas). Pregunta si alguno tiene algo que un cliente no deba ver: lo que el agente lee puede acabar en su respuesta. | Categoría con documentos importados, o capacidad `google_drive_buscar` atada |

## Bloque D — Acciones (ronda 2, después del menú de lo posible)

| Pregunta | Por qué | Se traduce en |
|---|---|---|
| ¿Debe agendar, mover o cancelar citas reales? | Capacidad integrada de agenda. Requiere que la agenda del negocio esté configurada en el panel (horario, cupo, profesionales). | Capacidad `agenda` atada al agente; política de agenda en el prompt |
| ¿Usas Google Calendar para tus citas? ¿Quieres que el agente mire ahí las horas ocupadas, o que además cree los eventos? | Capacidades `google_calendar` y `google_calendar_editar`. Requieren que el dueño conecte su cuenta en Configuración → Integraciones → Google, y cada nivel por separado. Mirar y escribir son dos decisiones, no una. | Capacidad atada al agente; en el prompt, cuándo mirar antes de prometer una hora |
| ¿Hay algo de la conversación que alguien de tu equipo tenga que ver por correo? | Capacidad `google_gmail_enviar`. Pregunta A QUÉ direcciones (hasta 5): el agente no las elige, las fijas tú en el panel y escribe a la lista entera. Si ahí pones el correo de un cliente, ahí llega. Depende del permiso de envío de Gmail, que Google tiene que aprobar para FlujosChat. | Capacidad atada; en el prompt, el criterio de cuándo avisar |
| ¿Quieres que le mande al cliente por correo un resumen o una cotización en texto? | Capacidad `google_gmail_escribir_cliente`. Pregunta: ¿quién guarda hoy el correo del cliente en su ficha? (solo vale uno guardado por una persona desde el panel o por una integración por la API; uno que el cliente le dicte al agente no sirve hasta que un asesor lo confirme); ¿qué correos del equipo reciben la copia oculta?; y si este agente lee también datos de otros clientes (hojas, Drive): en ese caso, no se enciende. Solo texto, sin enlaces, y depende del mismo permiso de envío de Gmail. | Capacidad atada; interruptor, campo del correo y copia oculta en el panel; en el prompt, cuándo ofrecer el correo |
| ¿Llevas los interesados o los pedidos en una hoja de cálculo? | Capacidad `google_sheets_anotar`. Pregunta CUÁL hoja y, sobre todo, **qué columnas tiene su primera fila y si los datos van en la primera pestaña**: se escribe al final de esa, no se puede elegir otra. El dueño entrega las hojas una a una desde el panel. | Capacidad atada; en el prompt, qué datos anotar, en qué orden y cuándo |
| ¿El agente tiene que cambiar datos en esa hoja (el estado de un pedido, la dirección de entrega)? | Capacidad `google_sheets_actualizar`, siempre junto con `google_sheets_consultar` en el mismo agente (la fila sale de la búsqueda). Pregunta QUÉ columnas se le dejan cambiar: el dueño las marca en la hoja terminando su título en "(editable)". No hay autorización por cliente: la columna que identifica al cliente (teléfono, DNI, correo) nunca se marca. | Capacidades atadas; en el prompt, qué puede cambiar y que lo confirme con el cliente antes |
| ¿Debe guardar nombre, documento, correo u otros datos en la ficha del cliente? ¿Qué campos personalizados tienes? | Capacidad integrada de ficha. Solo rellena campos que ya existen; no crea campos. | Capacidad `contacto`; variables `{{campo.<slug>}}` |
| ¿Quieres que ofrezca opciones con botones tocables? | Capacidad integrada de botones: máximo 3 opciones cerradas por mensaje, títulos cortos. | Capacidad `botones`; regla de formato en el prompt |
| ¿Debe recomendar y arrancar alguno de tus flujos de WhatsApp? | Capacidad integrada de flujos: el agente elige por la descripción del flujo, así que los flujos necesitan una buena descripción. | Capacidad `flujos` |
| ¿Alguna acción que ESCRIBA en tu sistema (crear pedido, emitir nota, cambiar datos)? | Recomendación: no al inicio. Si sí, herramienta separada, y el prompt exige repetir los datos y esperar un sí explícito antes de ejecutarla. | Herramienta HTTP de escritura + política de confirmación |

## Bloque E — Datos del cliente (ronda 2)

| Pregunta | Por qué | Se traduce en |
|---|---|---|
| ¿Qué datos del cliente quieres que el agente conozca al empezar? (nombre, teléfono, campos personalizados) | Se escriben en el prompt como marcadores y se rellenan en cada conversación. Un dato que falta aparece como `(sin dato)`, así que el prompt debe escribirse para que eso se lea bien. | Bloque "Datos del cliente" con `{{cliente.nombre}}`, `{{cliente.telefono}}`, `{{campo.<slug>}}` |
| ¿Cómo se llaman exactamente esos campos personalizados? | El marcador usa el nombre del campo en minúsculas, sin acentos y con guiones bajos ("Fecha de nacimiento" → `fecha_de_nacimiento`). Un nombre mal escrito sale como `(sin dato)`. | Slugs verificados |

## Bloque F — Voz y formato (ronda 2, con defaults propuestos)

| Pregunta | Default propuesto | Se traduce en |
|---|---|---|
| ¿Tú o usted? | Tú, salvo negocios formales (legal, salud privada, banca) | Sección "Estilo" |
| ¿Emojis? | Máximo uno, y solo al saludar | "Estilo" |
| ¿Largo de los mensajes? | 1 a 3 líneas, una pregunta por mensaje | "Estilo" |
| ¿Idioma si el cliente escribe en otro? | Responde en el idioma del cliente | "Estilo" |
| ¿Variante de español? | La del país del negocio (Perú, México, Colombia, Argentina, España…) | "Estilo" |

## Bloque G — Operativa (solo si aplica)

| Pregunta | Por qué | Se traduce en |
|---|---|---|
| ¿Un agente solo o varios trabajando en equipo? | Un agente por trabajo. Si hay dos trabajos con tonos o reglas distintos, son dos agentes y un equipo (skill `crear-equipo`). Un agente solo también necesita un equipo de un miembro para atender. | Decisión de equipo; `handoffDescription` si va a recibir derivaciones |
| ¿Ya existe un flujo o un equipo donde encajarlo? | Para no duplicar y para saber cómo se conecta a WhatsApp. | `list_teams`, `list_flows` |
| ¿Volumen aproximado de conversaciones al día? | Orienta el modelo (el recomendado es el más económico; el catálogo válido lo publica `get_agent_schema`) y el aviso de coste. | Campo `model` (o `null` para el default) |

## Cierre: la frase-resumen

Antes de diseñar, escribe y muestra esta frase rellena:

> Un agente que **[objetivo]** para **[negocio, ciudad]**, que atiende a **[quién]**, que sí
> **[alcance]**, que nunca **[prohibiciones]**, que usa **[conocimiento / herramientas /
> capacidades]** y que pasa a una persona cuando **[criterio]**. Habla en **[tú/usted, variante]**
> con mensajes de **[largo]**.

Si algún corchete queda vacío, esa es la única pregunta que falta.

## Verificado contra

| Ref | Qué respalda | Archivo (repo chatboxabel) | Fecha |
|---|---|---|---|
| F1 | Las capacidades integradas y sus prerrequisitos | `backend/src/modules/ai/tools/builtin-catalog.js`, `backend/src/modules/mcp/agent-schema.js` | 2026-09-13 |
| F25 | Herramienta `APPS_SCRIPT` y su clave compartida solo desde el panel | `backend/src/modules/ai/tools/apps-script-tool.js`, `backend/src/modules/mcp/agent-schema.js` | 2026-09-13 |
| F26 | Gmail al cliente: dirección de la ficha guardada desde el panel o la API, copia oculta, exfiltración | `backend/src/modules/ai/tools/google-gmail-cliente-tools.js` | 2026-09-13 |
| F27 | Sheets consultar y modificar: cualquier fila que coincida, columnas "(editable)", sin autorización por cliente | `backend/src/modules/ai/tools/google-sheets-consulta-tools.js`, `backend/src/modules/ai/tools/google-sheets-actualizar-tools.js` | 2026-09-13 |
| F29 | Drive: leer en vivo lo elegido y sus hijos directos, o importarlo al conocimiento | `backend/src/modules/ai/tools/google-drive-tools.js`, `docs/referencia/base-conocimiento.md` | 2026-09-13 |
| F5 | La fecha del día la inyecta la plataforma (sin hora) | `backend/src/modules/ai/runtime/fecha-actual.js` | 2026-09-05 |
| F6 | La herramienta de derivar a humano existe en todo agente | `backend/src/modules/ai/tools/builtin-tools.js` | 2026-09-05 |
| F7 | Por MCP solo entra texto; los documentos gastan saldo al indexarse | `backend/src/modules/mcp/tools/ai.tools.js` (`create_knowledge_document`) | 2026-09-05 |
| F16 | Variables del prompt, slug y `(sin dato)` | `backend/src/modules/ai/runtime/prompt-variables.js` | 2026-09-05 |
