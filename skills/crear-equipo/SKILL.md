---
name: crear-equipo
description: Crear y configurar equipos de agentes IA en FlujosChat — define los miembros, el agente de entrada y los handoffs (derivaciones) entre agentes. Úsalo cuando el usuario quiera montar un equipo multi-agente, orquestar varios agentes IA o definir cómo se pasan el control en FlujosChat.
---

# Crear equipos de agentes IA (FlujosChat)

Requiere el servidor MCP de FlujosChat conectado y **rol OWNER o ADMIN** para escribir.

Un **equipo** (`AiTeam`) agrupa agentes, define cuál recibe el primer mensaje (`entryAgent`) y
las derivaciones dirigidas (`handoffs`) entre ellos. Es lo que un flujo invoca con un paso
`AI_HANDOFF` (`config.teamId`).

## Flujo de trabajo

1. **Asegura los agentes.** Usa `list_agents` (y la skill `crear-agente` para crear los que falten).
   Anota sus `id`.

2. **Crea el equipo:** `create_team` (`name`, `description?`). Devuelve el `teamId`.

3. **Define el grafo:** `save_team_graph` con:
   ```json
   {
     "teamId": "...",
     "entryAgentId": "<id del agente que recibe el primer mensaje>",
     "members": [{ "agentId": "<id>" }, { "agentId": "<id>" }],
     "handoffs": [{ "fromAgentId": "<id>", "toAgentId": "<id>" }]
   }
   ```
   Validaciones del servidor: todos los agentes deben ser de la empresa, sin duplicados, sin
   self-loops (`from` ≠ `to`), y los handoffs solo entre miembros. `save_team_graph` **reemplaza**
   el grafo completo.

4. **Conéctalo a un flujo:** en el flujo, añade un paso `AI_HANDOFF` con
   `config: { "teamId": "<teamId>", "contextKeys": [...], "greetImmediately": true }`
   (ver la skill `crear-flujo`).

5. **Gestión:** `get_team` para inspeccionar, `update_team` para metadatos, `delete_team` para borrar.

## Notas
- Multi-tenant: todo se limita a la empresa del usuario autenticado.
- Las escrituras requieren rol OWNER/ADMIN.
