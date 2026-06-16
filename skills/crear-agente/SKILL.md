---
name: crear-agente
description: Crear o editar agentes IA en FlujosChat — define el system prompt (instructions), el modelo, las categorías de conocimiento (RAG) y las herramientas (HTTP/MCP) de un agente conversacional. Úsalo cuando el usuario quiera crear, configurar o modificar un agente de inteligencia artificial en FlujosChat.
---

# Crear y configurar agentes IA (FlujosChat)

Requiere el servidor MCP de FlujosChat conectado y **rol OWNER o ADMIN** para escribir.

## Conceptos
- **Agente** (`AiAgent`): un asistente con un `name`, `instructions` (system prompt), un `model`
  opcional, categorías de conocimiento (RAG) y herramientas.
- **Herramienta** (`AiTool`): un endpoint `HTTP` o un servidor `MCP` que el agente puede invocar.
- **Categoría de conocimiento**: agrupa documentos para RAG (la subida de documentos se hace en el panel).

## Flujo de trabajo

1. **Revisa lo existente:** `list_agents`, `list_ai_tools`, `list_knowledge_categories`
   (y `get_agent` para ver uno en detalle).

2. **Prepara dependencias si hace falta:**
   - Categoría RAG → `create_knowledge_category` (`name`, `description?`).
   - Herramienta → `create_ai_tool`:
     - HTTP: `{ name, description, type:"HTTP", config:{ url, method?, params? }, authSecret? }`
     - MCP: `{ name, description, type:"MCP", config:{ serverUrl } }`
     - `name` en snake_case (`^[a-z][a-z0-9_]{1,63}$`).

3. **Crea el agente:** `create_agent` con `name`, `instructions` (system prompt claro y específico),
   `model?`, `handoffDescription?` (cómo lo ven otros agentes), `categoryIds?`, `toolIds?`.

4. **Edita** con `update_agent` (los `categoryIds`/`toolIds` reemplazan por completo si se envían).
   Elimina con `delete_agent`.

## Notas
- Para que un agente atienda conversaciones, debe formar parte de un **equipo** y conectarse al
  flujo mediante un paso `AI_HANDOFF` (ver la skill `crear-equipo`).
- Las escrituras requieren rol OWNER/ADMIN; si falla por permisos, indícalo al usuario.
