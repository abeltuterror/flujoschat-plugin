# Catálogo de capacidades — todo lo que puede hacer un agente de IA en FlujosChat

Este documento tiene dos lectores: la IA que ejecuta un skill (para saber qué existe, cómo se
activa y qué cuesta) y, a través de ella, el dueño del negocio (para descubrir opciones que no
sabía que tenía). Los nombres exactos de campos, límites y modelos NO están aquí a propósito:
los publica el servidor en `get_agent_schema`, y ahí siempre están al día.

## Cómo presentarlo al dueño ("el menú de lo posible")

- Filtra por su negocio: 5 a 8 líneas, no la tabla entera. A una clínica le importan agenda,
  ficha, conocimiento con precios y aviso al equipo; a una tienda, conocimiento, consulta de
  pedidos, botones y ventas.
- Cada línea en lenguaje de cliente, sin nombres de herramientas: qué logra · dónde se activa
  (aquí mismo, o en el panel) · si gasta saldo de IA.
- Termina preguntando cuáles quiere para ESTE agente, y anota aparte lo que quede pendiente
  del panel.

## Tabla maestra

| Quiero que el agente… | Capacidad | Cómo se activa | ¿Gasta saldo de IA? | Ref |
|---|---|---|---|---|
| responda con mis políticas, precios y preguntas frecuentes | Base de conocimiento (categorías y documentos, búsqueda semántica) | Aquí: `create_knowledge_category` + `create_knowledge_document` con texto pegado. Archivos (PDF, Word): solo desde el panel, `/dashboard/ai/knowledge`. El agente la usa si tiene la categoría atada en `categoryIds`. | Sí: indexar cada documento y cada búsqueda que haga en conversación | F7, F8 |
| consulte mi sistema (estado de un pedido, stock, saldo del cliente) | Herramienta HTTP | Aquí: `create_ai_tool` de tipo HTTP, sin credencial. Si el endpoint pide clave, el dueño la añade en el panel (`/dashboard/ai/tools`). | No gasta saldo de IA; la llamada a tu sistema es real | F9 |
| use las funciones de mi propio servidor MCP | Herramienta MCP | Aquí: `create_ai_tool` de tipo MCP con la dirección del servidor. Credenciales, en el panel. | No | F9 |
| agende, mueva o cancele citas reales | Capacidad integrada **agenda** (consultar horarios libres, agendar, reprogramar, cancelar) | Panel: Agentes IA → Herramientas → capacidad del sistema; requiere la agenda del negocio configurada (horario, cupo, profesionales). Luego se ata al agente con `toolIds`. | No | F1, F10 |
| responda con botones tocables | Capacidad integrada **botones** (hasta 3 opciones cerradas por mensaje) | Panel; luego `toolIds`. Es la única capacidad que también funciona en la demostración pública. | No | F1, F2 |
| guarde nombre, documento, correo en la ficha del cliente | Capacidad integrada **contacto** (rellena campos personalizados que ya existen) | Panel; requiere campos personalizados creados. No crea campos. Luego `toolIds`. | No | F1 |
| recomiende y arranque uno de mis flujos de WhatsApp | Capacidad integrada **flujos** (lista los flujos, incluidos los apagados, y arranca el elegido en la misma conversación) | Panel; luego `toolIds`. El agente elige por la descripción de cada flujo: un flujo sin descripción es invisible para él. | No | F1 |
| consulte el Google Calendar del negocio (qué calendarios hay, qué horas están ocupadas) | Capacidad integrada **google_calendar** | Panel: el dueño conecta su cuenta en Configuración → Integraciones → Google y activa la capacidad; luego `toolIds`. Buscar los EVENTOS con su título es un permiso aparte (lo cubre también el de escritura): sin ninguno de los dos, esa función avisa y las otras siguen. | Solo lo que gasta el turno del modelo | F21 |
| cree, mueva o cancele eventos en ese calendario | Capacidad integrada **google_calendar_editar** | Panel; exige el permiso de escritura de Calendar. ⚠️ Trae SOLO crear, mover y cancelar: para mirar las horas libres antes de proponer, o para localizar el id del evento que hay que mover, el agente necesita además `google_calendar`. Casi siempre se atan las dos. | Solo el turno | F21 |
| avise por CORREO a mi equipo desde mi Gmail | Capacidad integrada **google_gmail_enviar** (una sola función: asunto y mensaje) | Panel: hasta 5 direcciones en Configuración → Personalizar panel. El agente no elige destinatario —escribe a esa lista entera y a nadie más—, y no puede repetir aviso en la misma conversación antes de 10 minutos. | Solo el turno | F22 |
| anote una fila en una hoja de cálculo mía (un interesado, un pedido) | Capacidad integrada **google_sheets_anotar** | Panel: eliges las hojas con el selector de Google en Configuración → Integraciones → Google. Solo escribe en esas; si no eliges ninguna, no escribe en ninguna parte. Una fila por turno, hasta 26 valores; escribe al final de la PRIMERA pestaña (no se puede elegir otra) y el agente ve las 10 primeras hojas autorizadas. | Solo el turno | F23 |
| pase la conversación a una persona | Derivar a humano | Automático en todo agente: no se registra nada. En el prompt va solo el CRITERIO de cuándo hacerlo y qué decirle al cliente. | No | F6 |
| avise por WhatsApp a mi equipo cuando derive | Aviso al equipo | Panel: Configuración → Personalizar panel → Avisos al equipo (lista de celulares). Va como texto libre, así que cada celular debe haberle escrito al bot en las últimas 24 horas; si falla, el panel lo muestra. | No | F11 |
| salude por su nombre y conozca sus datos | Variables del prompt | En las instrucciones: `{{cliente.nombre}}`, `{{cliente.telefono}}`, `{{campo.<slug>}}`. Reglas en `get_agent_schema` y en `buenas-practicas-prompt.md`. | No | F16 |
| entienda fotos y notas de voz del cliente | Multimodal | Automático: las imágenes que manda el cliente (hasta tres por turno) y sus notas de voz (transcritas) llegan al agente sin configurar nada. | La transcripción se mide como consumo de IA | F17 |
| reparta el trabajo entre especialistas que se pasan la conversación | Equipo en modo `HANDOFF` | Aquí: `create_team` + `save_team_graph` (skill `crear-equipo`). El especialista que recibe se queda con la conversación. | Cada turno llama al modelo por cada agente que interviene | F13 |
| hable con una sola voz que consulta a expertos por detrás | Equipo en modo `SUPERVISOR` | Idem, con `orchestrationMode`. El cliente solo habla con el de entrada. | Cada consulta a un especialista es otra llamada al modelo | F13 |
| rescate a un cliente que se sale del guion de un flujo | Rescate de flujos con IA | Panel, en la configuración del flujo: un equipo atiende lo que el flujo no entiende, sin perder el paso. | Sí, cuando interviene | F18 |
| lo pueda probar un prospecto sin WhatsApp | Demostración pública del equipo (`/demo/ia/<token>`) | Panel: "Compartir demo" en el equipo. Configurable: título, mensaje de bienvenida, cupo diario, si puede usar el conocimiento. | Sí, con cupo diario; no ejecuta acciones reales | F12 |
| use un modelo más barato o más potente | Campo `model` del agente | Aquí, en `create_agent`/`update_agent`. La lista válida y el recomendado los publica `get_agent_schema`. Con la IA incluida, un modelo sin tarifa se cambia por el default sin avisar. | Tarifa por modelo | F19 |
| use mi propia clave de OpenAI u otro proveedor | Modo con clave propia | Panel: `/dashboard/ai/config`. Por este canal nunca entran claves. | Factura tu proveedor, no el saldo | F19 |
| atienda de verdad en WhatsApp | Flujo con un paso `AI_HANDOFF` apuntando al equipo | Skill `crear-flujo` (o el editor visual del panel). Un agente suelto no atiende a nadie: siempre a través de un equipo. | — | F13 |

## Antes de ofrecer las capacidades de Google

Las cuatro se apoyan en cuentas de Google que conecta el DUEÑO en Configuración →
Integraciones → Google, no en una credencial por agente. Cuatro cosas que conviene decirle
antes de que elija:

- **Lo que es único es el vínculo empresa + servicio**, no la cuenta. Según el plan puede haber
  más de una cuenta conectada, y Calendar, Gmail y Sheets pueden apuntar a cuentas distintas;
  lo que no se puede es que dos agentes usen cuentas distintas para el mismo servicio. Ojo al
  cambiar la cuenta de Sheets: la lista de hojas autorizadas se vacía, porque esas hojas se las
  dio la cuenta anterior. [F21]
- **Cada servicio se activa por separado y con su nivel.** Calendar distingue tres cosas
  (consultar disponibilidad · leer los eventos · escribirlos); Gmail solo tiene envío, y Sheets
  usa el mismo permiso para leer y escribir. Si Google todavía no ha concedido un permiso, esa
  capacidad no se puede usar y las demás siguen. ⚠️ El panel resume Calendar como «lectura»: eso
  puede estar en verde y aun así faltar el permiso de leer eventos, que es el que necesita la
  búsqueda. [F21]
- **El alcance es estrecho, pero hay que contarlo con precisión.** El agente no entra en el
  buzón de Gmail y no tiene acceso general al Drive. Lo que sí hace: enviar correo a la lista
  que fijó el dueño, y de las hojas que él entregó una a una, leer su nombre y su **primera
  fila** para saber el orden de las columnas. Si esa primera fila lleva datos en vez de
  cabeceras, eso es lo que lee. [F22, F23]
- **Ninguna de las cuatro funciona en la demostración pública** de un equipo: tocan la cuenta
  real de un tercero. En una prueba desde el panel el corte es por HERRAMIENTA, no por
  capacidad: las que escriben se niegan («estás en una prueba») y las que solo leen se ejecutan
  de verdad contra Google. `google_sheets_anotar` tiene una de cada. [F24]

## Lo que la plataforma hace sola (no lo pongas en el prompt)

- **La fecha de hoy**, en la zona horaria del negocio, se añade a las instrucciones en cada
  corrida. Sin la hora, a propósito: el modelo no sabe qué hora es. [F5]
- **Derivar a una persona** está disponible siempre. Al usarla, la conversación vuelve a manos
  del equipo humano. [F6]
- **Buscar en el conocimiento** se activa solo con que el agente tenga categorías atadas. [F13]
- **Un dato del cliente que falta** se sustituye por `(sin dato)`; nunca se queda el marcador
  literal. [F16]
- **En la demostración pública**, la plataforma añade su propio bloque de contexto y neutraliza
  toda acción real. [F12]

## Solo desde el panel (el skill lo deja en la lista de pendientes)

| Qué | Dónde |
|---|---|
| Credenciales de una herramienta HTTP o MCP | `/dashboard/ai/tools` → ficha de la herramienta |
| Activar una capacidad integrada (agenda, botones, contacto, flujos y las cuatro de Google) | `/dashboard/ai/tools` → capacidad del sistema |
| Conectar la cuenta de Google del negocio y activar cada servicio | Configuración → Integraciones → Google |
| Elegir en qué hojas de cálculo puede anotar el agente | Configuración → Integraciones → Google |
| Direcciones de correo a las que el agente puede avisar | Configuración → Personalizar panel |
| Subir archivos a la base de conocimiento | `/dashboard/ai/knowledge` |
| Clave o proveedor propio (por empresa o por agente) | `/dashboard/ai/config` y ficha del agente en `/dashboard/ai/agents` |
| Demostración pública de un equipo | `/dashboard/ai/teams` → Compartir demo |
| Aviso por WhatsApp al equipo al derivar | Configuración → Personalizar panel → Avisos al equipo |
| Campos personalizados (para la ficha y las variables) | Ajustes → Campos personalizados |
| Configurar la agenda del negocio | `/dashboard/agenda` |
| Conectar el equipo a un flujo existente (paso `AI_HANDOFF`) | Editor visual de flujos |

## Lo que hoy no es posible (dilo sin rodeos si lo piden)

- Escribirle primero a un cliente con texto libre fuera de la ventana de 24 horas: WhatsApp lo
  exige por plantilla aprobada. El agente responde; no inicia. [F15]
- Enviar credenciales por este canal, ni al crear ni al editar una herramienta. Se rechaza. [F9]
- Crear una capacidad integrada por este canal: se activa en el panel y luego se ata. [F1]
- Ajustar "temperatura" o "creatividad" del modelo: no existe ese ajuste. Se gobierna con las
  instrucciones y con el modelo elegido. [F19]
- Que el modelo sepa la hora: solo conoce el día. Las horas reales llegan por la agenda. [F5]
- Subir archivos por este canal: solo texto pegado. [F7]
- Enviar un WhatsApp desde una prueba con `run_team`: la prueba es una conversación simulada,
  sin cliente real. Las capacidades integradas responden "estás en una prueba". [F20]

## Verificado contra

| Ref | Qué respalda | Archivo (repo chatboxabel) | Fecha |
|---|---|---|---|
| F1 | Catálogo de las 4 capacidades integradas, prerrequisitos, cuál funciona en demo | `backend/src/modules/ai/tools/builtin-catalog.js` | 2026-09-05 |
| F2 | Límites de los botones | `backend/src/modules/ai/tools/buttons-tools.js` | 2026-09-05 |
| F5 | Bloque de fecha sin hora | `backend/src/modules/ai/runtime/fecha-actual.js` | 2026-09-05 |
| F6 | Derivar a humano automático | `backend/src/modules/ai/tools/builtin-tools.js` | 2026-09-05 |
| F7 | Documentos por MCP: texto, gasto al indexar | `backend/src/modules/mcp/tools/ai.tools.js` | 2026-09-05 |
| F8 | Búsqueda en conocimiento gasta saldo | `backend/src/modules/mcp/tools/ai.tools.js` (`search_knowledge`) | 2026-09-05 |
| F9 | Herramientas HTTP/MCP, sin credenciales por MCP | `backend/src/modules/mcp/tools/credenciales.js`, `backend/src/modules/ai/tools/http-tool.js` | 2026-09-05 |
| F10 | Funciones de agenda | `backend/src/modules/ai/tools/agenda-tools.js` | 2026-09-05 |
| F11 | Aviso al equipo al transferir | `backend/src/modules/ai/transfer-alert.js` | 2026-09-05 |
| F12 | Demostración pública: cupo, conocimiento opcional, sin acciones | `docs/referencia/playground-publico-agentes.md` | 2026-09-05 |
| F13 | Cableado de equipos, búsqueda automática, entrada | `backend/src/modules/ai/runtime/agent-builder.js` | 2026-09-05 |
| F15 | Ventana de 24 horas y plantillas | `backend/prisma/seeds/blog/agentes-ia-whatsapp-base-de-conocimiento.md` | 2026-09-05 |
| F16 | Variables del prompt | `backend/src/modules/ai/runtime/prompt-variables.js` | 2026-09-05 |
| F17 | Imágenes (hasta 3 por turno) y notas de voz transcritas | `backend/src/modules/ai/ai-message.handler.js`, `backend/src/modules/ai/audio/transcription.service.js` | 2026-09-05 |
| F18 | Rescate de flujos con un equipo de IA | `backend/src/modules/automation/ai-rescue.service.js` | 2026-09-05 |
| F19 | Modelos con tarifa, cambio silencioso al default, sin ajuste de temperatura | `backend/src/config/ai-pricing.js`, `backend/src/modules/ai/runtime/agent-builder.js` | 2026-09-05 |
| F20 | Prueba de equipo sin conversación real | `backend/src/modules/ai/runtime/playground.service.js` | 2026-09-05 |
| F21 | Capacidades de Calendar, niveles de permiso por servicio y qué pasa sin el sensible | `backend/src/modules/ai/tools/google-calendar-tools.js`, `backend/src/modules/integrations/google/google-scopes.js` | 2026-09-06 |
| F22 | Gmail solo envía, y solo a las direcciones que eligió el dueño | `backend/src/modules/ai/tools/google-gmail-tools.js`, `backend/src/modules/integrations/google/gmail-destinatarios.js` | 2026-09-06 |
| F23 | Sheets escribe solo en las hojas autorizadas; lista vacía = ninguna | `backend/src/modules/ai/tools/google-sheets-tools.js`, `backend/src/modules/integrations/google/google-recursos.service.js` | 2026-09-06 |
| F24 | Ninguna capacidad de Google se ejecuta en la demostración pública; en una prueba del panel las lecturas sí | `backend/src/modules/ai/tools/builtin-catalog.js` | 2026-09-06 |
