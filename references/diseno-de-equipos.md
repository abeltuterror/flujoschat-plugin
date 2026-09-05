# Diseño de equipos de agentes

Un equipo es lo que atiende al cliente; un agente suelto no atiende a nadie. Este documento
enseña a decidir el reparto, el modo, la entrada y las derivaciones, a leer lo que devuelve
`validate_team` y a probar con `run_team`. Los campos exactos de `create_team` y
`save_team_graph` los publica `get_agent_schema`.

## 1. ¿Hace falta un equipo de varios?

- Empieza con **un agente**. Un equipo de un solo miembro es válido y es lo mínimo para
  atender en WhatsApp.
- Divide en varios cuando: hay dos trabajos con tono o reglas distintos (ventas y soporte), el
  prompt de uno ya pasa de 60 líneas porque mezcla temas, o cada tema tiene sus propias fuentes
  y herramientas.
- Regla: **un agente por trabajo**, no por producto ni por persona del equipo humano.

## 2. `HANDOFF` o `SUPERVISOR`

| Pregunta al dueño | `HANDOFF` | `SUPERVISOR` |
|---|---|---|
| ¿Quién habla con el cliente? | El especialista al que se derivó | Siempre el agente de entrada |
| ¿Qué pasa en el siguiente mensaje del cliente? | Sigue con el especialista (se queda con la conversación) | Vuelve a entrar por el de entrada, que consulta a quien haga falta |
| ¿Cuándo elegirlo? | Temas largos que conviene atender de principio a fin con un experto: soporte técnico, agenda, cobranzas | Una sola voz que combina respuestas de varios expertos en un mismo mensaje; o cuando cambiar de "persona" confundiría al cliente |
| ¿Qué nota el cliente? | Puede notar el cambio de estilo si los prompts son distintos | Nada: una sola personalidad |
| ¿Coste por turno? | Una llamada al modelo por el agente que atiende (más una si hubo derivación) | Una llamada por el de entrada más una por cada especialista consultado |
| ¿Qué lee el que decide? | La `handoffDescription` del destino | La `handoffDescription` del destino, convertida en la descripción de una herramienta |

Frase para explicárselo al dueño: "En el primero, recepción te pasa con el especialista y él se
queda contigo. En el segundo, hablas siempre con la misma persona, que va a preguntar por
detrás y te trae la respuesta."

## 3. Topologías que funcionan

- **Estrella (hub):** entrada → N especialistas. La más común. En `HANDOFF`, sin derivaciones
  de vuelta, el cliente se queda con el especialista aunque cambie de tema.
- **Estrella con vuelta:** cada especialista tiene una derivación de regreso a la entrada. Sirve
  cuando los clientes saltan de tema. Requiere que la entrada tenga `handoffDescription` (recibe
  derivaciones).
- **Lineal:** calificación → asesoría → cierre. Cada paso deriva al siguiente. Útil en ventas
  con etapas claras.
- **Estrella en `SUPERVISOR`:** la entrada consulta a todos. Solo los conectados directamente a
  la entrada son consultables; `validate_team` avisa si alguno queda fuera.

Lo que se rompe:
- Sin `entryAgentId`, el runtime arranca por un miembro cualquiera. Fíjalo siempre.
- Un agente inactivo se omite al construir el equipo; si era la entrada, el equipo falla.
- Una derivación hacia un agente que ya no es miembro se ignora en silencio.

## 4. La ficha de handoff (`handoffDescription`)

La leen **los otros agentes**, no el cliente. Es lo que le dice al que decide para qué sirve
este agente; en `SUPERVISOR` es literalmente la descripción de la herramienta que ve el de
entrada.

- Tercera persona, una o dos frases: qué temas cubre, con las palabras que usaría el cliente.
- Distinta de la de sus hermanos: dos fichas parecidas hacen que el que decide elija al azar.
- Sin saludos ni instrucciones ("saluda y…"): no es un prompt.
- Sin marcadores de variables: aquí no se resuelven.
- Obligatoria en la práctica para todo agente que **reciba** derivaciones. `validate_team` lo
  avisa.

| Mal | Bien |
|---|---|
| "Agente de ventas" | "Precios, planes, promociones vigentes y proceso de compra." |
| "Ayuda con problemas" | "Fallos de acceso, errores de la app, pedidos que no llegaron y devoluciones." |
| "Saluda al cliente y pregúntale qué necesita" | (recepción no suele necesitar ficha; si recibe vueltas: "Recibe al cliente y lo orienta cuando su tema no corresponde a ningún especialista.") |

## 5. Posiciones en el lienzo

`save_team_graph` acepta `posX` y `posY` por miembro para el lienzo del panel. Si no se mandan,
quedan en cero y los nodos se amontonan. Convención: entrada en (0, 0); especialistas en x = 300,
separados 150 en y (−150, 0, 150…). Si el equipo ya existía, lee sus posiciones con `get_team`
y consérvalas: el grafo se reemplaza entero.

## 6. Leer `validate_team`

Devuelve `ok`, `errors` (no va a funcionar) y `warnings` (funciona, pero no como esperas).
**`ok` en verdadero no basta**: un equipo inactivo sale como aviso, no como error. Lee siempre
las dos listas. No gasta saldo.

| Mensaje que devuelve | Tipo | Qué hacer |
|---|---|---|
| «El equipo no tiene agentes» | error | `save_team_graph` con al menos un miembro |
| «Ningún agente del equipo está activo» | error | `update_agent` con `isActive` en verdadero para alguno |
| «Falta el agente de entrada (entryAgentId)» | error | Reenviar el grafo completo con `entryAgentId` |
| «El agente de entrada no es miembro del equipo» | error | Incluirlo en `members` |
| «El agente de entrada» … «está inactivo.» | error | Activarlo o elegir otra entrada |
| «está inactivo: se omitirá al correr el equipo» | aviso | Activar al agente o quitarlo del grafo |
| «El equipo está inactivo: no responderá aunque un flujo lo invoque» | aviso | `update_team` con `isActive` en verdadero |
| «Hay una conexión hacia un agente que ya no es miembro del equipo» | aviso | Quitar esa derivación del grafo |
| «toca un agente inactivo: se ignorará» | aviso | Activar al agente o quitar la derivación |
| «no es alcanzable desde el agente de entrada: nunca recibirá la conversación» | aviso (`HANDOFF`) | Añadir una derivación desde la entrada o desde un intermedio |
| «no está conectado al agente de entrada: nunca será consultado» | aviso (`SUPERVISOR`) | Añadir la derivación directa desde la entrada |
| «recibe conexiones pero no tiene handoffDescription» | aviso | `update_agent` con la ficha (pasa por la puerta de acuerdo) |
| «El equipo tiene varios agentes activos pero ninguna conexión entre ellos» | aviso | Añadir las derivaciones que faltan |

Errores que devuelve `save_team_graph` antes de escribir nada:

| Mensaje | Qué hacer |
|---|---|
| «Hay agentes duplicados en el equipo» | Un `agentId` por miembro |
| «Algún agente no existe o no pertenece a tu empresa» | Releer con `list_agents` y usar los ids reales |
| «El agente de entrada debe ser miembro del equipo» | Incluir la entrada en `members` |
| «Un agente no puede hacer handoff a sí mismo» | Quitar la derivación de un agente hacia él mismo |
| «Los handoffs deben conectar agentes del equipo» | Ambos extremos en `members` |
| «Equipo no encontrado» | El `teamId` no es de esta empresa: releer con `list_teams` |

## 7. Probar con `run_team`

- **Gasta saldo de IA y ejecuta de verdad las herramientas HTTP y MCP atadas.** Pide un sí
  explícito antes de cada corrida y propón un escenario a la vez.
- Escenarios mínimos: uno por especialista (un mensaje que claramente le corresponda) y uno
  fuera de alcance (debe derivar a una persona o reconocer que no sabe).
- `messages` termina siempre con un mensaje del usuario. Para un segundo turno, reenvía el
  historial y el `lastAgentId` que devolvió el turno anterior: así reproduces el comportamiento
  real de WhatsApp, donde el especialista se queda con la conversación.
- Qué leer en la respuesta: `agentName` (¿respondió quien debía?), `toolCalls` (¿consultó lo
  que tenía que consultar?), `transferToHuman` (¿derivó cuando tocaba?), `interactiveReply`
  (los botones, si la capacidad está atada).
- Lo esperado en una prueba, que NO es un fallo: las variables del prompt salen como
  `(sin dato)`; las capacidades integradas (agenda, ficha, flujos) responden que están en una
  prueba y dicen qué harían; no se envía ningún WhatsApp.
- Si un escenario acaba en el agente equivocado, el arreglo casi siempre está en las fichas
  (`handoffDescription`) o en el prompt de quien decide, no en el grafo.

## 8. Conectar y operar

- Para que atienda en WhatsApp: un flujo con un paso `AI_HANDOFF` cuya configuración apunta al
  `teamId`. El formato exacto del paso lo publica `get_flow_schema`; no lo copies de memoria.
- Aviso por WhatsApp al equipo humano cuando el agente deriva, y demostración pública del
  equipo: se configuran en el panel (ver `catalogo-capacidades.md`).
- Si cambias un agente que está en un equipo, vuelve a pasar `validate_team`: una ficha vacía o
  un agente desactivado se notan ahí antes que en producción.

## Verificado contra

| Ref | Qué respalda | Archivo (repo chatboxabel) | Fecha |
|---|---|---|---|
| F13 | Cableado de `HANDOFF` (el destino se queda) y `SUPERVISOR` (destino como herramienta); entrada arbitraria si falta | `backend/src/modules/ai/runtime/agent-builder.js` | 2026-09-05 |
| F22 | Mensajes de `validate_team` y de `save_team_graph`; posiciones por defecto | `backend/src/modules/ai/agents/team.service.js` | 2026-09-05 |
| F20 | Respuesta de `run_team` y prueba sin conversación real | `backend/src/modules/ai/runtime/playground.service.js` | 2026-09-05 |
