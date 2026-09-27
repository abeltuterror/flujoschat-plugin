---
name: editar-flujo
description: Inspeccionar y editar flujos de WhatsApp existentes en FlujosChat — cambiar nombre, trigger, prioridad o estado, editar, añadir o quitar pasos y transiciones uno a uno, duplicar o eliminar. Úsalo cuando el usuario quiera modificar, revisar, clonar o borrar un flujo existente en FlujosChat.
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
   - **Duplicar:** **`duplicate_flow`** (`flowId`, `newName`). El clon queda inactivo. No lo
     uses como copia de seguridad: conserva las ramas de las condiciones apuntando a los pasos
     del flujo ORIGINAL (para guardar una copia, `get_flow`).
   - **Eliminar:** **`delete_flow`** (`flowId`). Irreversible — confirma con el usuario.
   - **Imagen de un paso:** **`set_flow_step_image`** (`flowId`, `stepOrder` o `stepId`, `imageUrl`
     o `null` para quitarla) pone o quita la portada de un paso con botones o la imagen de un
     paso IMAGE sin recrear el flujo. La URL sale de **`upload_flow_image`** (base64 o una
     `sourceUrl` pública); **`list_flow_images`** enseña las ya subidas para reutilizarlas. Solo un
     paso BUTTONS admite portada: en una lista se guardaría y nunca se enviaría.
   - **Cambiar un paso** (texto, botones, opciones): **`update_flow_step`** (`stepId` y los campos
     a cambiar). OJO: su `config` **reemplaza** el entero — lee el paso con `get_flow` y manda el
     config COMPLETO con tu cambio, o se pierden las demás claves.
   - **Añadir un paso:** **`add_flow_step`** (`flowId`, `stepType`, `name`, `config`; sin
     `stepOrder` va al final). En ESTE orden: créalo ya enlazado a lo que va después
     (`nextStepId` al crearlo, o una transición desde él) y SOLO al final apunta el paso anterior
     a él (`update_flow_step` con `nextStepId`, o una transición). Al revés, en un flujo activo
     hay un rato —o para siempre, si falla la última llamada— en que los clientes llegan a un paso
     sin continuación.
   - **Quitar un paso:** reconecta PRIMERO lo que apuntaba a él con su siguiente y después
     **`delete_flow_step`** (`stepId`). No re-enlaza nada: las transiciones que llegaban a él se
     borran, pero las ramas de las condiciones que lo apuntaban se quedan apuntando a un paso que
     ya no existe (la sesión se corta ahí, y el servidor no deja volver a guardar esa condición
     sin repuntarlas). Por eso se repuntan ANTES de borrar.
   - **Cambiar a dónde lleva una respuesta:** **`add_flow_transition`** (`fromStepId`,
     `toStepId`, `condition`, `matchValue`), **`update_flow_transition`** o
     **`delete_flow_transition`** (`transitionId`). Los dos pasos tienen que ser del mismo flujo.
   - **Reescritura grande:** sigue valiendo partir del `{ flow, steps }` de `get_flow`, corregirlo
     (skill `crear-flujo` y su validador) y crear un flujo nuevo con **`create_flow`** desactivado.
   - `update_flow` no añade ni cambia pasos: solo metadatos.
   - Tras editar pasos, **relee con `get_flow`** y recorre el flujo: ningún paso suelto ni
     respuesta que no lleve a ningún sitio. Si el flujo está activo, el cambio llega a los
     clientes en cuanto se guarda.

3. **Confirma** los cambios mostrando el resultado de la tool (y los `warnings` si aplica).

## Notas
- Toda operación se limita a la empresa del usuario autenticado (multi-tenant).
- Para el contrato del JSON al reconstruir un flujo, usa `get_flow_schema` o la skill `crear-flujo`.
