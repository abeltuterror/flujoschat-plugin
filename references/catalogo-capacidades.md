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
| responda con mis políticas, precios y preguntas frecuentes | Base de conocimiento (categorías y documentos, búsqueda semántica) | Aquí: `create_knowledge_category` + `create_knowledge_document` con texto pegado. Archivos (PDF, Word): solo desde el panel, `/dashboard/ai/knowledge`; ahí mismo, *Importar de Drive* trae documentos de Google Drive a una categoría y los vuelve a sincronizar solos cada 2 horas. El agente la usa si tiene la categoría atada en `categoryIds`. | Sí: indexar cada documento (también cada vez que la sincronización con Drive trae un cambio) y cada búsqueda que haga en conversación | F7, F8, F30 |
| consulte mi sistema (estado de un pedido, stock, saldo del cliente) | Herramienta HTTP | Aquí: `create_ai_tool` de tipo HTTP, sin credencial. Si el endpoint pide clave, el dueño la añade en el panel (`/dashboard/ai/tools`). | No gasta saldo de IA; la llamada a tu sistema es real | F9 |
| use las funciones de mi propio servidor MCP | Herramienta MCP | Aquí: `create_ai_tool` de tipo MCP con la dirección del servidor. Credenciales, en el panel. | No | F9 |
| llame a un Google Apps Script mío (una hoja o un proceso que ya automaticé con Apps Script) | Herramienta `APPS_SCRIPT` | Aquí: `create_ai_tool` de tipo `APPS_SCRIPT` con `execUrl` (la dirección de la implementación como aplicación web, la que termina en `/exec`), `action` (la acción que despacha el script) y `params`. La clave compartida la pone el dueño SOLO en el panel (`/dashboard/ai/tools`): creada por aquí, la herramienta queda sin clave y el script la rechazará hasta entonces. El script tiene que estar implementado con acceso para cualquiera. | No gasta saldo de IA; el script corre de verdad | F25 |
| agende, mueva o cancele citas reales | Capacidad integrada **agenda** (consultar horarios libres, agendar, reprogramar, cancelar) | Panel: Agentes IA → Herramientas → capacidad del sistema; requiere la agenda del negocio configurada (horario, cupo, profesionales). Luego se ata al agente con `toolIds`. | No | F1, F10 |
| responda con botones tocables | Capacidad integrada **botones** (hasta 3 opciones cerradas por mensaje) | Panel; luego `toolIds`. Es la única capacidad que también funciona en la demostración pública. | No | F1, F2 |
| guarde nombre, documento, correo en la ficha del cliente | Capacidad integrada **contacto** (rellena campos personalizados que ya existen) | Panel; requiere campos personalizados creados. No crea campos. Luego `toolIds`. | No | F1 |
| recomiende y arranque uno de mis flujos de WhatsApp | Capacidad integrada **flujos** (lista los flujos, incluidos los apagados, y arranca el elegido en la misma conversación) | Panel; luego `toolIds`. El agente elige por la descripción de cada flujo: un flujo sin descripción es invisible para él. | No | F1 |
| consulte el Google Calendar del negocio (qué calendarios hay, qué horas están ocupadas) | Capacidad integrada **google_calendar** | Panel: el dueño conecta su cuenta en Configuración → Integraciones → Google y activa la capacidad; luego `toolIds`. Buscar los EVENTOS con su título es un permiso aparte (lo cubre también el de escritura): sin ninguno de los dos, esa función avisa y las otras siguen. | Solo lo que gasta el turno del modelo | F21 |
| cree, mueva o cancele eventos en ese calendario | Capacidad integrada **google_calendar_editar** | Panel; exige el permiso de escritura de Calendar. ⚠️ Trae SOLO crear, mover y cancelar: para mirar las horas libres antes de proponer, o para localizar el id del evento que hay que mover, el agente necesita además `google_calendar`. Casi siempre se atan las dos. | Solo el turno | F21 |
| avise por CORREO a mi equipo desde mi Gmail | Capacidad integrada **google_gmail_enviar** (una sola función: asunto y mensaje) | Panel: hasta 5 direcciones en Configuración → Personalizar panel. El agente no elige destinatario —escribe a esa lista entera y a nadie más—, y no puede repetir aviso en la misma conversación antes de 10 minutos. ⚠️ Necesita el permiso de envío de Gmail, que Google tiene que aprobar para FlujosChat: mientras no lo apruebe, Gmail sale pendiente en la conexión y no se envía nada. | Solo el turno | F22 |
| le mande al CLIENTE con el que habla un correo (un resumen, una cotización en texto) | Capacidad integrada **google_gmail_escribir_cliente** (una sola función: asunto y mensaje) | Panel: en Configuración → Personalizar panel hay que encender "Permitir que la IA escriba al cliente por correo", tener al menos un correo en "Avisos al equipo" (reciben copia oculta de cada correo; sin ellos no sale ninguno) y un campo personalizado de tipo correo. El agente NO elige la dirección: usa la de la ficha del cliente, y solo si la guardó una persona desde el panel o un sistema por la API (una que el cliente le dictó al agente no vale hasta que un asesor la confirme). Solo texto, sin enlaces; como mucho 50 correos al día por empresa y uno cada 10 minutos por conversación. ⚠️ Depende del mismo permiso de envío de Gmail. | Solo el turno | F26 |
| anote una fila en una hoja de cálculo mía (un interesado, un pedido) | Capacidad integrada **google_sheets_anotar** | Panel: eliges las hojas con el selector de Google en Configuración → Integraciones → Google. Solo escribe en esas; si no eliges ninguna, no escribe en ninguna parte. Una fila por turno, hasta 26 valores; escribe al final de la PRIMERA pestaña (no se puede elegir otra) y el agente ve las 10 primeras hojas autorizadas. | Solo el turno | F23 |
| busque un pedido o un cliente en una hoja de cálculo mía y responda con lo que dice | Capacidad integrada **google_sheets_consultar** (ver las hojas, listar sus pestañas, buscar filas por texto y leer un tramo de filas) | Panel: trabaja sobre las MISMAS hojas elegidas en Configuración → Integraciones → Google. Solo lee: busca en las primeras 2000 filas y las columnas A–Z de cada pestaña, y lee como mucho 50 filas seguidas. ⚠️ Puede leer cualquier fila que coincida con lo que pregunte, sea de quien sea: entrégale hojas preparadas para que las vea un cliente. | Solo el turno | F27 |
| cambie un dato de una fila que ya existe (el estado de un pedido, la dirección de entrega) | Capacidad integrada **google_sheets_actualizar** (una sola función: modificar celdas de una fila) | Panel, y siempre JUNTO con google_sheets_consultar en el mismo agente: la fila y su huella salen de la búsqueda. Solo cambia las columnas cuyo título, en la propia hoja, termina en "(editable)" (sin ninguna marcada no cambia nada), nunca la fila de los títulos, y una fila por turno; lo que había en esas celdas se pierde. ⚠️ No hay autorización por cliente: puede modificar cualquier fila que encuentre, así que la columna que identifica al cliente (teléfono, DNI, correo) NO se marca como editable. | Solo el turno | F28 |
| responda con lo que dicen mis documentos de Google Drive (manuales, catálogos, políticas) | Capacidad integrada **google_drive_buscar** (listar lo elegido y leer un documento por páginas) | Panel: eliges documentos y carpetas con el selector de Drive en Configuración → Integraciones → Google. Lee esos documentos y los que están DIRECTAMENTE dentro de esas carpetas (los de sus subcarpetas no); Documentos, Presentaciones y Hojas de Google (de una hoja, solo la primera pestaña), PDF, txt, md y csv, por páginas de 4000 caracteres y hasta 200 000 por documento. Solo lee. | Solo el turno | F29 |
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

Las ocho se apoyan en cuentas de Google que conecta el DUEÑO en Configuración →
Integraciones → Google, no en una credencial por agente. Lo que conviene decirle antes de que
elija:

- **Lo que es único es el vínculo empresa + servicio**, no la cuenta. Según el plan puede haber
  más de una cuenta conectada, y Calendar, Gmail, Sheets y Drive pueden apuntar a cuentas
  distintas; lo que no se puede es que dos agentes usen cuentas distintas para el mismo
  servicio. Ojo al cambiar la cuenta de Sheets o de Drive: la lista de hojas o de documentos
  elegidos de ese servicio se vacía, porque se los dio la cuenta anterior. [F21]
- **Cada servicio se activa por separado y con su nivel.** Calendar distingue tres cosas
  (consultar disponibilidad · leer los eventos · escribirlos); Gmail solo tiene envío; Sheets y
  Drive usan el mismo permiso para leer y escribir, concedido fichero a fichero. Si Google todavía
  no ha concedido un permiso, esa capacidad no se puede usar y las demás siguen. ⚠️ El panel
  resume Calendar como «lectura»: eso puede estar en verde y aun así faltar el permiso de leer
  eventos, que es el que necesita la búsqueda. [F21]
- **Gmail depende de que Google apruebe la app.** El permiso de envío de Gmail (igual que leer o
  escribir eventos de Calendar) es de los que Google revisa. Mientras no lo apruebe para
  FlujosChat, Gmail sale pendiente en la conexión y sus dos capacidades —avisar al equipo y
  escribir al cliente— no envían nada aunque estén atadas al agente. Sheets y Drive no dependen
  de esa revisión. Dilo antes de diseñar un agente que cuente con el correo. [F22, F26]
- **El agente no entra en el buzón de Gmail ni recorre el Drive entero, pero lo que se le
  entrega lo ve entero.** Solo toca las hojas, documentos y carpetas que el dueño eligió uno a
  uno. Dentro de eso: con google_sheets_consultar busca en cualquier fila de cualquier pestaña,
  sea de quien sea; con google_drive_buscar lee los documentos completos, página a página; y
  google_sheets_anotar lee el nombre de cada hoja y su primera fila para saber el orden de las
  columnas. Lo que el agente lee puede acabar en su respuesta al cliente: entrega solo hojas y
  documentos preparados para que los vea un cliente. [F23, F27, F29]
- **Dos combinaciones que se deciden a propósito.** google_sheets_actualizar sin
  google_sheets_consultar en el mismo agente no sirve: no tiene de dónde sacar la fila ni su
  huella. Y google_gmail_escribir_cliente NO se enciende en un agente que además lee datos de
  otros clientes (hojas, Drive, conocimiento con datos personales): el correo lo redacta el
  modelo con lo que tenga a mano, y lo que lee puede acabar dentro. [F26, F28]
- **Documentos de Drive: leerlos en vivo o importarlos al conocimiento no es lo mismo.**
  *Importar de Drive* (panel, en el estudio de conocimiento) los copia a una categoría: se
  indexan (gasta saldo), el agente busca en ellos por significado y se re-sincronizan solos cada
  2 horas; quitar el fichero de la lista de Drive lo retira del índice. google_drive_buscar los
  lee tal cual están en Drive, sin indexarlos, pero con un tope de consultas a Drive por turno y
  página a página desde el principio. Importar conviene cuando el dato hay que encontrarlo dentro
  de muchos documentos; leer en vivo, cuando son pocos y cortos. [F29, F30]
- **Ninguna de las ocho funciona en la demostración pública** de un equipo: tocan la cuenta
  real de un tercero. En una prueba (desde el panel o con `run_team`) el corte es por
  HERRAMIENTA, no por capacidad: las que escriben o envían se niegan («estás en una prueba») y las
  que solo leen —las consultas de google_calendar, google_sheets_consultar, google_drive_buscar y
  la lista de hojas de google_sheets_anotar— se ejecutan de verdad contra Google. [F24]

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
| Credenciales de una herramienta HTTP o MCP, y la clave compartida de una herramienta Apps Script | `/dashboard/ai/tools` → ficha de la herramienta |
| Activar una capacidad integrada (agenda, botones, contacto, flujos y las ocho de Google) | `/dashboard/ai/tools` → capacidad del sistema |
| Conectar la cuenta de Google del negocio y activar cada servicio | Configuración → Integraciones → Google |
| Elegir las hojas de cálculo (para anotar, consultar y modificar) y los documentos y carpetas de Drive que puede usar el agente | Configuración → Integraciones → Google |
| Marcar qué columnas de una hoja puede modificar el agente | En la propia hoja de Google: el título de la columna termina en "(editable)" |
| Direcciones de correo a las que el agente puede avisar (y que reciben copia oculta de cada correo al cliente) | Configuración → Personalizar panel |
| Permitir que la IA escriba al cliente por correo, y qué campo de la ficha es su correo | Configuración → Personalizar panel |
| Confirmar un correo del cliente que anotó el agente, para que se le pueda escribir | Ficha del contacto: guardarlo desde el panel |
| Subir archivos a la base de conocimiento | `/dashboard/ai/knowledge` |
| Importar documentos de Google Drive a la base de conocimiento | `/dashboard/ai/knowledge` → Importar de Drive |
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
- Poner la clave compartida de una herramienta Apps Script por este canal: se pone en el panel. [F25]
- Que el agente le escriba a un correo que elija él o que el cliente le dicte en el chat: solo a
  la dirección de la ficha guardada desde el panel o por la API. [F26]
- Que el agente modifique una columna que el dueño no marcó como editable, o borre filas. [F28]
- Que el agente lea las subcarpetas de una carpeta de Drive elegida o siga un acceso directo. [F29]
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
| F1 | Catálogo de las 12 capacidades integradas, prerrequisitos, cuál funciona en demo | `backend/src/modules/ai/tools/builtin-catalog.js`, `backend/src/modules/mcp/agent-schema.js` | 2026-09-13 |
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
| F22 | Gmail solo envía, a direcciones que no elige el agente; el envío es un permiso sensible que Google revisa | `backend/src/modules/ai/tools/google-gmail-tools.js`, `backend/src/modules/integrations/google/gmail-destinatarios.js`, `backend/src/modules/integrations/google/google-scopes.js` | 2026-09-13 |
| F23 | Sheets escribe solo en las hojas autorizadas; lista vacía = ninguna | `backend/src/modules/ai/tools/google-sheets-tools.js`, `backend/src/modules/integrations/google/google-recursos.service.js` | 2026-09-06 |
| F24 | Ninguna capacidad de Google se ejecuta en la demostración pública; en una prueba las lecturas sí | `backend/src/modules/ai/tools/builtin-catalog.js`, `backend/src/modules/mcp/agent-schema.js` | 2026-09-13 |
| F25 | Herramienta Apps Script: `execUrl`, `action`, `params`, clave solo desde el panel, llamada real | `backend/src/modules/ai/tools/apps-script-tool.js`, `backend/src/modules/ai/tools/tools.service.js`, `backend/src/modules/mcp/agent-schema.js` | 2026-09-13 |
| F26 | Gmail al cliente: interruptor, copia oculta, dirección guardada desde el panel o la API, topes, exfiltración | `backend/src/modules/ai/tools/google-gmail-cliente-tools.js`, `backend/src/utils/custom-field-source.js` | 2026-09-13 |
| F27 | Sheets consultar: hojas elegidas, 2000 filas × A–Z, 50 filas por lectura, cualquier fila que coincida | `backend/src/modules/ai/tools/google-sheets-consulta-tools.js`, `backend/src/modules/mcp/agent-schema.js` | 2026-09-13 |
| F28 | Sheets modificar: columnas "(editable)", huella, una fila por turno, sin autorización por cliente | `backend/src/modules/ai/tools/google-sheets-actualizar-tools.js`, `backend/src/modules/mcp/agent-schema.js` | 2026-09-13 |
| F29 | Drive leer: lo elegido y sus hijos directos, páginas de 4000, 200 000 por documento, primera pestaña de una hoja | `backend/src/modules/ai/tools/google-drive-tools.js`, `backend/src/modules/mcp/agent-schema.js` | 2026-09-13 |
| F30 | Importar de Drive a la base de conocimiento, re-sincronización y retirada del índice | `backend/src/modules/integrations/google/google-drive-import.js`, `docs/referencia/base-conocimiento.md` | 2026-09-13 |
