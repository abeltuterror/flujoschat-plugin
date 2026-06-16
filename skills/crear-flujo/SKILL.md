---
name: crear-flujo
description: Crear un flujo de WhatsApp en FlujosChat a partir de una descripción en lenguaje natural. Úsalo cuando el usuario quiera construir un flujo, una automatización, un bot conversacional, un journey de cliente o una secuencia de mensajes de WhatsApp en FlujosChat o ChatBoxAbel.
allowed-tools: "Read Write Bash(node *)"
---

# Crear un flujo de WhatsApp (FlujosChat)

Diseña un flujo conversacional de WhatsApp y créalo en FlujosChat. Un flujo es un objeto
JSON con dos claves: `flow` (metadatos) y `steps` (los pasos, con sus transiciones anidadas).

## Flujo de trabajo

1. **Conoce el contrato.** Si el servidor MCP de FlujosChat está conectado, llama a la tool
   **`get_flow_schema`** para obtener el formato exacto y un ejemplo. Si no, lee
   [references/contrato-json.md](references/contrato-json.md).

2. **Entiende lo que pide el usuario.** Aclara: ¿cómo se dispara (palabra clave o bienvenida)?,
   ¿qué pasos y mensajes?, ¿hay opciones/botones y bifurcaciones?, ¿se transfiere a un humano
   o a un equipo de IA al final?

3. **Diseña el JSON `{ flow, steps }`** siguiendo el contrato:
   - `trigger`: `KEYWORD` (con `triggerKeywords`) o `WELCOME` (conversación nueva).
   - Cada paso: `stepOrder` (número), `stepType`, `name`, `config`.
   - Avance lineal con `nextStepId` (acepta el `stepOrder` del destino).
   - Bifurcaciones con `transitions[]` (condición `BUTTON`/`LIST`/`CONTAINS`/`ANY`…).
   - Pon una transición `ANY` con `priority: 1` como último recurso.

4. **Valida en local antes de enviar:**
   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/validate-flow.mjs <ruta-al-json>
   ```
   Corrige lo que reporte (campos inválidos, enums, transiciones mal puestas).

5. **Crea el flujo.** Llama a la tool MCP **`create_flow`** con `{ flow, steps }`. Revisa el
   campo **`warnings`** de la respuesta (referencias que no se aplicaron). Si el servidor MCP
   no está conectado, entrega el JSON al usuario para que lo importe en
   **Panel → Flujos → Importar desde JSON**.

## Reglas clave (errores frecuentes)

- Las `transitions` van **dentro de cada step**, nunca en el nivel superior.
- El campo es **`nextStepId`** (no `nextStepOrder`); acepta un `stepOrder` numérico.
- `trigger` solo admite `KEYWORD | WELCOME | EVENT | MANUAL` (auto-disparan KEYWORD y WELCOME).
- `priority` de transición: 1–100 (usa `1` para el `ANY`).
- Para botones: condición `BUTTON` con el `id` del botón. Para listas: `LIST` con el `id` de la fila.
