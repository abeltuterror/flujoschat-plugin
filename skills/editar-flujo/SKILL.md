---
name: editar-flujo
description: Inspeccionar y editar flujos de WhatsApp existentes en FlujosChat — cambiar nombre, trigger, prioridad o estado, duplicar, eliminar, o reconstruir la lógica de pasos. Úsalo cuando el usuario quiera modificar, revisar, clonar o borrar un flujo existente en FlujosChat.
allowed-tools: "Read Write Bash(node *)"
---

# Editar flujos de WhatsApp (FlujosChat)

Requiere el servidor MCP de FlujosChat conectado.

## Flujo de trabajo

1. **Localiza el flujo.** Usa **`list_flows`** (filtra por `isActive`/`trigger`) y **`get_flow`**
   (con el `flowId`) para ver sus pasos y transiciones actuales.

2. **Elige la acción:**
   - **Metadatos** (nombre, descripción, trigger, triggerKeywords, prioridad, activar/desactivar):
     usa **`update_flow`** con `flowId` y solo los campos a cambiar.
   - **Duplicar:** **`duplicate_flow`** (`flowId`, `newName`). El clon queda inactivo.
   - **Eliminar:** **`delete_flow`** (`flowId`). Irreversible — confirma con el usuario.
   - **Imagen de un paso:** **`set_flow_step_image`** (`flowId`, `stepOrder` o `stepId`, `imageUrl`
     o `null` para quitarla) pone o quita la portada de un paso con botones o la imagen de un
     paso IMAGE sin recrear el flujo. La URL sale de **`upload_flow_image`** (base64 o una
     `sourceUrl` pública); **`list_flow_images`** enseña las ya subidas para reutilizarlas. Solo un
     paso BUTTONS admite portada: en una lista se guardaría y nunca se enviaría.
   - **Reestructurar pasos/transiciones:** las tools MCP no editan pasos uno a uno. Parte del
     `{ flow, steps }` que devuelve `get_flow`, corrígelo (ver la skill `crear-flujo` y su
     validador) y crea un flujo nuevo con **`create_flow`**; o indica al usuario que ajuste los
     pasos en el editor visual del panel. `update_flow` no añade ni cambia pasos.

3. **Confirma** los cambios mostrando el resultado de la tool (y los `warnings` si aplica).

## Notas
- Toda operación se limita a la empresa del usuario autenticado (multi-tenant).
- Para el contrato del JSON al reconstruir un flujo, usa `get_flow_schema` o la skill `crear-flujo`.
