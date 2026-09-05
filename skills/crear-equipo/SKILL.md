---
name: crear-equipo
description: Montar o rediseñar un equipo de agentes de IA en FlujosChat — decidir entre derivar el control (HANDOFF) o una sola voz que consulta especialistas (SUPERVISOR), fijar el agente de entrada, dibujar las derivaciones, escribir las fichas de handoff, validar el grafo y probarlo antes de conectarlo a WhatsApp. Úsalo cuando digan "arma un equipo con el agente de ventas y el de soporte", "que recepción derive a ventas", "quiero varios agentes especializados", "que responda siempre el mismo pero consulte a otros", "pásalo a modo supervisor", "valida mi equipo", "prueba el equipo con un cliente que pregunta X", "conecta el equipo a mi flujo" o "el equipo no deriva bien". Para crear los agentes que falten usa crear-agente.
---

# Equipos de agentes de IA (FlujosChat)

El equipo es lo que atiende al cliente: uno o más agentes conectados por derivaciones, con un
agente de entrada. Tres cosas que gobiernan este skill:

- `save_team_graph` REEMPLAZA el grafo entero: lo que omitas se borra, posiciones incluidas.
- `run_team` gasta saldo de IA y ejecuta de verdad las herramientas HTTP y MCP del equipo.
- Los campos exactos los publica `get_agent_schema`; aquí está el procedimiento.

Requisitos: scope `agents:write`, rol OWNER o ADMIN, suscripción activa.

## 0. Antes de empezar

1. `get_agent_schema`.
2. `list_agents`: cuáles están activos, cuáles tienen `handoffDescription`, qué herramientas y
   categorías tienen.
3. `list_teams`: si ya hay un equipo para esto, `get_team` y trabaja sobre él conservando sus
   miembros, aristas y posiciones.
4. `get_ai_balance`: modo y saldo, para la prueba del paso 6.

Antes de seguir: sabes qué agentes hay y cuáles reciben derivaciones sin ficha.

## 1. Entender el reparto (en este orden)

1. ¿Qué trabajos distintos hay? Uno por agente. Si hay uno solo, el equipo es de un miembro y
   también hace falta: sin equipo, un agente no atiende.
2. ¿Quién recibe el primer mensaje? Es la entrada y se fija SIEMPRE.
3. ¿El cliente debe pasar con un especialista que se queda con la conversación, o prefieres una
   sola voz que consulta por detrás? Lee la tabla de decisión en
   `${CLAUDE_PLUGIN_ROOT}/references/diseno-de-equipos.md` y explícaselo con la frase que trae.
4. ¿Quién puede derivar a quién? ¿Se vuelve a recepción? (en `HANDOFF` el destino se queda con
   la conversación: sin una derivación de vuelta no regresa).
5. ¿Faltan agentes? Créalos con `crear-agente` y anota sus ids.

Antes de seguir: miembros, entrada, derivaciones y modo escritos en una tabla.

## 2. El menú de lo posible (equipos)

En cinco líneas, en lenguaje de cliente: derivaciones de vuelta a recepción; modo de una sola
voz; aviso por WhatsApp al equipo humano cuando el agente deriva (panel); demostración pública
del equipo para prospectos (panel, gasta saldo con cupo diario); conexión a WhatsApp con un paso
`AI_HANDOFF` en un flujo. Pregunta qué quiere.

## 3. Fichas de handoff

Todo agente que RECIBE una derivación necesita `handoffDescription`: es lo que lee quien decide
derivar (en `SUPERVISOR`, la descripción de la herramienta que ve la entrada). Redacta las que
falten siguiendo la sección de fichas de la referencia: tercera persona, qué cubre, distinta de
las de sus hermanos, sin saludos ni variables. Se guardan con `update_agent` y pasan por la puerta.

## 4. PUERTA — el grafo antes de escribir

Muestra: modo · entrada · tabla de miembros (nombre, activo, ficha sí/no) · derivaciones "A → B"
· fichas nuevas a guardar · y, si el equipo existía, qué desaparece respecto a `get_team`.
Pregunta: "¿Guardo este equipo así?" y ESPERA.

## 5. Escribir en orden

1. `update_agent` con las fichas que faltaban.
2. `create_team` (nombre, descripción, `orchestrationMode`) o `update_team` si existía.
3. `save_team_graph` con el estado COMPLETO: `entryAgentId`, todos los miembros con `posX` y
   `posY` (entrada en 0,0; especialistas en x = 300 separados 150 en y; conserva las posiciones
   que ya había) y todas las derivaciones. La respuesta de `create_team` trae el equipo con su
   `id`: ese es el `teamId`.
4. `validate_team`. Lee `errors` Y `warnings` (`ok` en verdadero no cubre los avisos): la tabla
   mensaje → arreglo está en la referencia. Corrige y repite, máximo dos vueltas. Avisos que el
   dueño acepte, díselo por escrito.

Antes de seguir: `get_team` refleja entrada, miembros y derivaciones exactamente como se acordó.

## 6. Probar (gasta saldo: un sí explícito por escenario)

Propón dos o tres escenarios: uno por especialista y uno fuera de alcance (debe derivar a una
persona o decir que no sabe). En `run_team`, `messages` termina con el mensaje del usuario;
para el segundo turno reenvía el historial y el `lastAgentId` del turno anterior (así reproduces
que el especialista se queda con la conversación). Lee `agentName` (¿respondió quien debía?),
`toolCalls`, `transferToHuman` e `interactiveReply`. Lo esperado y que no es fallo: variables
`(sin dato)`; capacidades integradas que dicen estar en una prueba; ningún WhatsApp enviado. Las
herramientas HTTP y MCP SÍ se ejecutan.

Antes de seguir: cada escenario acabó en el agente esperado. Si no, ajusta fichas o prompts
(`actualizar-agente`) antes de conectar.

## 7. Conectar a WhatsApp

Un flujo con un paso `AI_HANDOFF` cuya configuración apunta al `teamId` (skill `crear-flujo`;
el formato exacto del paso lo da `get_flow_schema`, no lo copies de memoria). Si el flujo ya
existe, el paso se añade desde el editor visual del panel: `update_flow` no añade pasos.
Recuerda los pendientes del panel: aviso al equipo al derivar y demostración pública.

## 8. Reglas

- Entrada siempre fijada.
- Grafo completo, nunca un delta; `get_team` antes de reescribir uno existente.
- Ficha en todo agente que recibe derivaciones.
- Validar antes de probar; probar antes de conectar.
- Nada se escribe sin pasar por la puerta; nada que gaste saldo sin un sí explícito.
- Máximo dos correcciones por objetivo.

## 9. Errores

`${CLAUDE_PLUGIN_ROOT}/references/diseno-de-equipos.md` (mensajes de `validate_team` y de
`save_team_graph`) y `${CLAUDE_PLUGIN_ROOT}/references/errores-y-costes.md`.

## 10. De lo que piden a lo que haces

- "Arma recepción → ventas y soporte" → paso 0 → reparto (tres trabajos, entrada recepción,
  `HANDOFF`, dos derivaciones) → fichas de ventas y soporte → puerta → `update_agent` ×2 →
  `create_team` → `save_team_graph` → `validate_team` → tres escenarios → `crear-flujo`.
- "Que responda siempre el mismo" → `SUPERVISOR` con la entrada conectada a cada especialista;
  fichas específicas (son las descripciones de las herramientas) → puerta → escribir → validar
  → un escenario por tema mirando `toolCalls`.
- "El equipo no deriva bien" → `get_team` + `validate_team` → auditor (`auditor-agente-ia`)
  sobre la entrada y los especialistas → fichas y prompt de quien decide → puerta →
  `update_agent` → volver a probar el escenario que fallaba.
