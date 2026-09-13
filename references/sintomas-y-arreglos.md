# Síntomas y arreglos — cuando un agente no hace lo que el dueño esperaba

Para el skill `actualizar-agente` y para el auditor. No todo se arregla en el prompt: a veces
es la descripción de una herramienta, un documento que falta, una capacidad sin atar o el grafo
del equipo. Antes de proponer nada, lee el estado actual con `get_agent`, `get_team` y
`validate_team`.

| Síntoma que cuenta el dueño | Causa probable | Dónde se arregla | Cómo se comprueba |
|---|---|---|---|
| "Inventa precios, plazos o promociones" | Sin prohibición explícita; sin documento que lo diga; categoría no atada al agente | Regla en "Lo que no haces" + documento de conocimiento + `categoryIds` con la categoría | `run_team` con la pregunta (gasta saldo) y mirar si consultó el conocimiento en `toolCalls` |
| "Nunca pasa con una persona" | Sin criterios de derivación en el prompt | Sección "Pasa a una persona" con casos concretos | `run_team` con un reclamo → `transferToHuman` en verdadero |
| "Deriva por cualquier cosa" | Criterios vagos ("si dudas, deriva") | Acotar: "intenta resolver dos veces antes de derivar" | Mismo escenario; debe intentar antes |
| "Responde muy largo" o "sale con símbolos raros" | Sin sección de estilo; markdown que WhatsApp no pinta | Sección "Estilo" (largo, negrita, sin encabezados ni tablas) | `run_team` y contar líneas |
| "No usa la herramienta" | La descripción de la herramienta no dice cuándo usarla; el prompt no tiene política; la herramienta está inactiva o no está atada | `update_ai_tool` (descripción); política en el prompt; `toolIds` con la herramienta; `isActive` | `toolCalls` en `run_team` |
| "Dice que no puede agendar" | Capacidad de agenda no atada, agenda sin configurar en el panel, o estás en una prueba (en `run_team` responde que está en una prueba, y eso es normal) | `list_ai_tools` → atar con `toolIds`; configurar la agenda en el panel | Conversación real, no la prueba |
| "Le dice al cliente (sin dato)" | Una frase del prompt asume el valor | Patrón "Etiqueta: {{…}}" más la instrucción de no repetir ese texto | Leer el prompt |
| "No sabe el nombre del cliente" o "no lee el campo" | Slug mal escrito; el flujo guarda ese dato con otro nombre de variable | Slug canónico (minúsculas, sin acentos, guion bajo); alinear la variable del paso del flujo con el nombre del campo | El editor del panel avisa de marcadores desconocidos; conversación real |
| "Se equivoca de fecha" o "cree que mañana es otro día" | Prompt con fecha fija o regla por hora | Quitarlo: la plataforma pone la fecha del día; el modelo no sabe la hora | `run_team` preguntando qué día es hoy |
| "En el equipo nadie le pasa la conversación" | Sin `handoffDescription` o demasiado genérica | Ficha específica en tercera persona | `validate_team` (aviso de ficha) y `run_team` con un mensaje de su tema |
| "El equipo empieza por el agente equivocado" | `entryAgentId` sin fijar o mal fijado | `save_team_graph` con la entrada correcta (grafo completo) | `get_team` |
| "Cambié el modelo y no se nota" | Con la IA incluida, un modelo sin tarifa se cambia por el default sin avisar | Elegir uno de la lista que publica `get_agent_schema`; comprobar el modo con `get_ai_balance` | La respuesta de `update_agent` trae el modelo guardado; el efectivo depende del modo |
| "Revela sus instrucciones" | Falta la línea de postura ante manipulación (fuera de la demo pública, donde la pone la plataforma) | Última línea del prompt | `run_team` pidiendo las instrucciones |
| "Dos agentes contestan lo mismo" | Fichas solapadas; o `SUPERVISOR` donde tocaba `HANDOFF` | Fichas disjuntas; revisar el modo con `update_team` | `run_team` por escenario y mirar `agentName` |
| "Contesta cosas de otro negocio" o "opina de todo" | Alcance sin definir | Sección "Tu trabajo" y "Lo que no haces" | `run_team` con una pregunta fuera de tema |
| "Se quedó mudo / no responde" | Saldo agotado, plan sin IA, equipo o agente inactivos, suscripción inactiva | `get_ai_balance`; `validate_team`; `update_agent`/`update_team` con `isActive` | Volver a probar |
| "Ofrece botones raros / repite las opciones en texto" | Capacidad de botones atada sin política, o política sin la capacidad | Atar la capacidad (`toolIds`) y añadir la política, o quitar ambas | `interactiveReply` en `run_team` |
| "Guarda datos que no son" | La capacidad de ficha escribe lo que el modelo entiende; sin instrucción de no inventar | "Guarda solo lo que el cliente dijo textualmente; no inventes valores" | Ficha del contacto tras una conversación real |
| "Dice que no puede mandarle el correo al cliente" | Interruptor de escribir al cliente apagado; sin correos del equipo para la copia oculta; campo de correo vacío o anotado por el propio agente; permiso de envío de Gmail todavía sin aprobar por Google; o estás en una prueba | Panel (Personalizar panel; el correo del cliente guardado por un asesor). El texto que devolvió la herramienta dice cuál: ver `errores-y-costes.md`, § 2 bis | Conversación real, no la prueba |
| "No cambia la hoja" o "dice que esa columna no se puede modificar" | Falta google_sheets_consultar en el mismo agente; la columna no termina su título en "(editable)"; hay filas idénticas; o estás en una prueba | Atar las dos capacidades de Sheets; marcar la columna en la hoja; limpiar duplicados | Conversación real |
| "No encuentra un documento de Drive" | No está elegido; está en una subcarpeta de la carpeta elegida; es un acceso directo; o lo que busca está en otra pestaña de una hoja (de una hoja solo se lee la primera) | Elegir el documento o la carpeta que lo contiene directamente; para pestañas, google_sheets_consultar | `toolCalls` en `run_team` (las lecturas de Drive sí corren en la prueba, contra la cuenta real) |
| "Le contó a un cliente datos de otro" | Se le entregó una hoja o un documento con datos de varios clientes: google_sheets_consultar lee cualquier fila que coincida y google_drive_buscar lee el documento entero | Quitar esa hoja o documento de la lista, o preparar una versión con solo lo que un cliente puede ver. Una regla en el prompt ayuda, pero la barrera real es qué se le entrega | Revisar qué hojas y documentos están elegidos |
| "La herramienta de Apps Script falla" | Sin clave compartida (creada por este canal); implementación sin acceso para cualquiera; URL `/exec` equivocada; o el script no responde con su formato | Clave en el panel; volver a implementar el script; revisar `execUrl` | `test_ai_tool` (se ejecuta de verdad) y el texto que devuelve |

## Reglas para diagnosticar

1. Pide una conversación real que salió mal y la respuesta que el dueño esperaba. Sin el
   ejemplo, todo arreglo es una suposición.
2. Clasifica el problema antes de tocar el prompt: prompt · conocimiento · herramienta ·
   capacidad · modelo · grafo · saldo/estado.
3. Un cambio a la vez, y vuelve a probar el escenario que fallaba **y** uno que funcionaba
   (regresión).
4. Edita el prompt por secciones; no lo reescribas entero salvo que lo pidan.
5. Si el arreglo requiere el panel (credencial, capacidad no activada, campo personalizado,
   agenda), dilo con el enlace y no intentes rodearlo.

## Verificado contra

| Ref | Qué respalda | Archivo (repo chatboxabel) | Fecha |
|---|---|---|---|
| F1 | Capacidades integradas y sus prerrequisitos | `backend/src/modules/ai/tools/builtin-catalog.js` | 2026-09-05 |
| F5 | Fecha sin hora inyectada por la plataforma | `backend/src/modules/ai/runtime/fecha-actual.js` | 2026-09-05 |
| F13 | Modelo efectivo en modo incluido; cableado de equipos | `backend/src/modules/ai/runtime/agent-builder.js` | 2026-09-05 |
| F16 | Variables y `(sin dato)`; el editor avisa de marcadores desconocidos | `docs/referencia/variables-de-prompt.md` | 2026-09-05 |
| F20 | Qué devuelve `run_team` | `backend/src/modules/ai/runtime/playground.service.js` | 2026-09-05 |
| F22 | Avisos de `validate_team` | `backend/src/modules/ai/agents/team.service.js` | 2026-09-05 |
| F25 | Herramienta Apps Script: clave, acceso de la implementación y respuestas | `backend/src/modules/ai/tools/apps-script-tool.js` | 2026-09-13 |
| F26 | Gmail al cliente: por qué no envía | `backend/src/modules/ai/tools/google-gmail-cliente-tools.js`, `backend/src/modules/integrations/google/google-scopes.js` | 2026-09-13 |
| F27 | Sheets consultar y modificar: columnas "(editable)", duplicados, privacidad | `backend/src/modules/ai/tools/google-sheets-consulta-tools.js`, `backend/src/modules/ai/tools/google-sheets-actualizar-tools.js` | 2026-09-13 |
| F29 | Drive leer: hijos directos, accesos directos, primera pestaña | `backend/src/modules/ai/tools/google-drive-tools.js` | 2026-09-13 |
