# Errores y costes — qué devuelve el servidor y qué hacer

## 1. Cómo llegan los errores

Las herramientas de IA del servidor MCP devuelven los errores como **texto**, con el prefijo
"Error:" y sin código: hay que reconocerlos por un fragmento del mensaje. Léelo entero. Un
error de validación de los argumentos (viene en inglés, generado por el validador del servidor)
cita el campo que falló y el límite que se superó: corrige ese campo y nada más.

Los fragmentos de abajo están entre comillas angulares porque son texto literal del servidor.

## 2. Tabla: fragmento → qué pasó → qué hacer

| Fragmento del mensaje | Qué pasó | Qué hacer |
|---|---|---|
| «Falta el permiso» | La conexión no tiene el scope que hace falta (`agents:read` para leer, `agents:write` para escribir) | Reconectar (`/mcp` en Claude Code) aceptando el permiso. No reintentar la misma llamada |
| «Esta acción requiere rol OWNER o ADMIN» | Este usuario puede leer pero no escribir | Parar. Entregar el prompt y el plan en texto para que lo aplique un administrador |
| «Tu suscripción está inactiva» | Suscripción parada | Avisar al dueño; se resuelve en facturación, no aquí |
| «El token no tiene una empresa asociada» | Token sin empresa | Reconectar |
| «Esto no se puede enviar por MCP» | Metiste una credencial (clave, token, cabecera de autorización) en `config` o en `args` | Quitarla y crear la herramienta sin ella. Decirle al dueño que la añada en el panel. **No pedírsela por el chat** |
| «No le pidas credenciales al usuario por el chat» | Misma situación, mensaje completo | Ídem |
| «No reenvíes el valor tapado» | Reenviaste un `config` leído con una credencial tapada | No toques el `config` de esa herramienta: solo `name`, `description` o `isActive`. El resto, en el panel |
| «Esta herramienta guarda un secreto de autenticación» | Intentaste apuntar a otro dominio una herramienta con credencial | Ese cambio se hace en el panel |
| «Agente no encontrado» / «Equipo no encontrado» | El id no es de esta empresa o está mal | Releer con `list_agents` / `list_teams` |
| «Alguna categoría no existe o no pertenece a tu empresa» | Un id en `categoryIds` no es válido | `list_knowledge_categories` |
| «Algún tool no existe o no pertenece a tu empresa» | Un id en `toolIds` no es válido | `list_ai_tools` |
| «El nombre debe ser snake_case» | Nombre de herramienta con mayúsculas, espacios o guiones | Minúsculas, números y guion bajo, empezando por letra |
| «Los tools HTTP requieren config.url» | Falta la dirección | Añadir `url` completa con `https://` |
| «Los tools MCP requieren config.serverUrl» | Usaste `url` en una herramienta MCP | El campo es `serverUrl` |
| «Capacidad integrada desconocida» / «Una capacidad integrada no se configura» / «El nombre de una capacidad integrada lo fija el sistema» | Intentaste crear o reconfigurar una capacidad integrada | No se crean ni se configuran por este canal: se activan en el panel y se atan con `toolIds` |
| «Hay agentes duplicados en el equipo» · «Algún agente no existe o no pertenece a tu empresa» · «El agente de entrada debe ser miembro del equipo» · «Un agente no puede hacer handoff a sí mismo» · «Los handoffs deben conectar agentes del equipo» | Grafo mal armado | Corregir y reenviar el grafo COMPLETO (ver `diseno-de-equipos.md`) |
| «El último mensaje debe ser del usuario» | `run_team` con la conversación terminando en un mensaje del asistente | Terminar `messages` con un mensaje del usuario |
| «Saldo de IA agotado» | Sin saldo de IA incluida | `get_ai_balance` para confirmarlo; no insistir. El dueño recarga o configura clave propia en el panel |
| «Tu plan no incluye el módulo de IA» / «Esta función no está incluida en tu plan» | El plan no tiene IA (o esa función) | Avisar; es cosa del plan |
| «Has alcanzado el límite de tu plan» | Tope de agentes, equipos o herramientas del plan | Avisar; proponer reutilizar o desactivar antes de crear |
| «La IA incluida no está disponible en este momento» | La plataforma no tiene la IA incluida operativa | Reintentar más tarde; si persiste, avisar |
| «estás en una prueba» (dentro de una respuesta de `run_team`) | Una capacidad integrada se negó a actuar porque no hay conversación real | No es un error: es lo esperado en la prueba. Se comprueba en una conversación real |
| Documento con estado `FAILED` y un mensaje de error | La ingesta del documento falló | Leer el motivo, corregir el texto y solo entonces `reprocess_knowledge_document` (gasta saldo) |
| `test_ai_tool` de una herramienta MCP devuelve que no conectó | Dirección incorrecta o servidor caído | Revisar `serverUrl`; el agente corre sin esa herramienta hasta que conecte |

## 3. Qué gasta saldo y qué tiene efectos reales

| Herramienta | ¿Gasta saldo de IA? | ¿Efecto real? |
|---|---|---|
| `run_team` | Sí (llama al modelo) | Ejecuta de verdad las herramientas HTTP y MCP del equipo. De las capacidades integradas el corte es por HERRAMIENTA: las que modifican datos se niegan («estás en una prueba»), y las que solo consultan se ejecutan de verdad — con Google eso sale hacia la cuenta real del dueño (sus calendarios, sus horas ocupadas, sus hojas autorizadas). Una misma capacidad puede tener de las dos. No envía WhatsApp |
| `search_knowledge` | Sí (embebe la consulta) | No |
| `create_knowledge_document` | Sí (se indexa al crearse) | El documento nace con la búsqueda encendida: la IA lo usa en cuanto está listo |
| `update_knowledge_document` | Sí, si la búsqueda está encendida y el texto cambió | Reemplaza lo que sirve la IA |
| `set_knowledge_document_rag` al encender | Sí, si el índice estaba desactualizado | La IA empieza o deja de usar el documento |
| `reprocess_knowledge_document` | Sí, siempre | Reindexa |
| `test_ai_tool` (HTTP) | No | Llamada real al sistema del dueño, con la credencial guardada. Si el endpoint escribe, escribe |
| `create_agent`, `update_agent`, `create_team`, `update_team`, `save_team_graph`, `create_ai_tool`, `update_ai_tool`, `create_knowledge_category`, `update_knowledge_category`, `transition_knowledge_document` | No | Escriben al instante en la cuenta de producción |
| `delete_agent`, `delete_team`, `delete_ai_tool`, `delete_knowledge_category`, `delete_knowledge_document` | No | Irreversibles. Borrar una categoría borra sus documentos |
| `validate_team`, `get_agent_schema`, `list_agents`, `get_agent`, `list_teams`, `get_team`, `list_ai_tools`, `list_knowledge_categories`, `list_knowledge_documents`, `get_knowledge_document`, `list_knowledge_document_versions`, `get_ai_config`, `get_ai_balance` | No | No |
| Demostración pública del equipo (panel) | Sí, con cupo diario | No ejecuta acciones reales |

## 4. Permisos, en una tabla

| Para… | Hace falta |
|---|---|
| Leer (listar, ver, validar, esquema) | Scope `agents:read` y suscripción activa |
| Escribir (crear, actualizar, borrar, grafo, probar) | Scope `agents:write`, rol OWNER o ADMIN, suscripción activa |
| Ver el saldo (`get_ai_balance`) | Rol OWNER o ADMIN aunque sea lectura |
| Crear agentes o equipos | Además, que el plan incluya el módulo de IA y no se haya alcanzado su tope |

## 5. Norma de reintento

- Máximo dos correcciones por objetivo. A la tercera, para y explica qué falta.
- Nunca repitas una herramienta que gasta saldo sin haber cambiado algo.
- Si el error dice "panel", es panel: no busques la vuelta por este canal.

## Verificado contra

| Ref | Qué respalda | Archivo (repo chatboxabel) | Fecha |
|---|---|---|---|
| F23 | Guardas de scope, rol, suscripción y empresa; forma de los errores | `backend/src/modules/mcp/tools/helpers.js` | 2026-09-05 |
| F9 | Rechazo de credenciales y del valor tapado | `backend/src/modules/mcp/tools/credenciales.js` | 2026-09-05 |
| F24 | Errores de herramientas (nombre, url, serverUrl, capacidades integradas, secreto) | `backend/src/modules/ai/tools/tools.service.js` | 2026-09-05 |
| F25 | Errores de agentes (no encontrado, categorías y herramientas ajenas) | `backend/src/modules/ai/agents/agent.service.js` | 2026-09-05 |
| F22 | Errores del grafo | `backend/src/modules/ai/agents/team.service.js` | 2026-09-05 |
| F20 | Gate de saldo y plan en `run_team`; último mensaje del usuario | `backend/src/modules/ai/runtime/playground.service.js` | 2026-09-05 |
| F26 | Saldo agotado fuera de la conversación | `backend/src/services/ai-balance.service.js` | 2026-09-05 |
| F27 | Límites y funciones del plan | `backend/src/services/entitlements.guard.js` | 2026-09-05 |
| F28 | Qué gasta saldo en conocimiento | `backend/src/modules/mcp/tools/ai.tools.js`, `backend/src/modules/ai/knowledge/knowledge.service.js` | 2026-09-05 |
| F1 | Capacidades integradas en modo prueba: las escrituras exigen conversación, las lecturas no | `backend/src/modules/ai/tools/agenda-tools.js`, `backend/src/modules/ai/tools/contacto-tools.js`, `backend/src/modules/ai/tools/flow-tools.js`, `backend/src/modules/ai/tools/google-calendar-tools.js`, `backend/src/modules/ai/tools/google-sheets-tools.js` | 2026-09-06 |
