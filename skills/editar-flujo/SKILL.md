---
name: editar-flujo
description: Inspeccionar y editar flujos de WhatsApp existentes en FlujosChat — cambiar nombre, trigger, prioridad o estado, duplicar, eliminar, o añadir, editar y borrar pasos y transiciones uno a uno. Úsalo cuando el usuario quiera modificar, revisar, clonar o borrar un flujo existente en FlujosChat.
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
   - **Cambiar pasos y transiciones (sin recrear el flujo):** edita en el sitio, paso a paso.
     Los ids de pasos y transiciones salen de `get_flow`; el `config` de cada tipo, de
     `get_flow_schema`.
     - **`add_flow_step`** (`flowId`, `stepType`, `name`, `config`, `nextStepId?`, `stepOrder?`):
       el paso nace SIN conectar; enlázalo después.
     - **`update_flow_step`** (`stepId` + solo lo que cambia). ⚠️ `config` REEMPLAZA el config
       entero: manda el config COMPLETO leído con `get_flow` con tu cambio aplicado.
     - **`add_flow_transition`** (`fromStepId`, `toStepId`, `condition`, `matchValue` salvo en
       `ANY`, `priority?`), **`update_flow_transition`** y **`delete_flow_transition`**.
     - **`delete_flow_step`** no re-enlaza nada: antes de borrar, repunta las ramas del `config`
       que lo apuntan (`trueStepId`/`falseStepId`, `successStepId`/`timeoutStepId`,
       `nextStepIdOnError`) y reconecta la cadena; si no, quedan apuntando a un paso que ya no existe.
     - Todas las referencias deben ser pasos del MISMO flujo. Al terminar, `get_flow` otra vez y
       revisa que no quede ningún paso suelto.
   - **Rehacerlo entero** solo si el cambio toca casi todo: parte del `{ flow, steps }` de
     `get_flow`, corrígelo (skill `crear-flujo` y su validador) y crea uno nuevo con
     **`create_flow`**; desactiva el viejo con `update_flow` en vez de borrarlo.

3. **Confirma** los cambios mostrando el resultado de la tool (y los `warnings` si aplica).

## Notas
- Toda operación se limita a la empresa del usuario autenticado (multi-tenant).
- Para el contrato del JSON al reconstruir un flujo, usa `get_flow_schema` o la skill `crear-flujo`.
