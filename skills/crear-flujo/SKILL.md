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

2. **Entiende lo que pide el usuario.** Aclara: ¿cómo se dispara (palabra clave, bienvenida o
   anuncio)?, ¿qué pasos y mensajes?, ¿hay opciones/botones y bifurcaciones?, ¿se cobra algo?,
   ¿se transfiere a un humano o a un equipo de IA al final?

3. **Diseña el JSON `{ flow, steps }`** siguiendo el contrato:
   - `trigger`: `KEYWORD` (con `triggerKeywords`), `WELCOME` (conversación nueva) o `REFERRAL`
     (llega desde un anuncio, con `triggerReferralIds`).
   - Cada paso: `stepOrder` (número), `stepType`, `name`, `config`.
   - Avance lineal con `nextStepId` (acepta el `stepOrder` del destino).
   - Bifurcaciones con `transitions[]`: **una por cada botón o fila**, con condición `BUTTON`
     (id del botón) o `LIST` (id de la fila). `ANY` solo como último recurso en pasos de
     texto libre, nunca en un paso con botones o lista.
   - Una foto con los botones: `headerImageUrl` (solo en pasos BUTTONS) con la URL que devuelve
     `upload_flow_image`; `list_flow_images` enseña las ya subidas.

4. **Valida en local antes de enviar:**
   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/validate-flow.mjs <ruta-al-json>
   ```
   Corrige lo que reporte: campos inválidos, enums, transiciones mal puestas, y los límites de
   WhatsApp, que Meta aplica sin avisar.

5. **Crea el flujo.** Llama a la tool MCP **`create_flow`** con `{ flow, steps }`. Revisa el
   campo **`warnings`** de la respuesta (referencias que no se aplicaron). Si el servidor MCP
   no está conectado, entrega el JSON al usuario para que lo importe en
   **Panel → Flujos → Importar desde JSON**.

## Reglas clave (errores frecuentes)

- Las `transitions` van **dentro de cada step**, nunca en el nivel superior.
- El campo es **`nextStepId`** (no `nextStepOrder`); acepta un `stepOrder` numérico.
- `trigger` admite `KEYWORD | WELCOME | EVENT | MANUAL | REFERRAL` (auto-disparan KEYWORD,
  WELCOME y REFERRAL).
- **Nunca `ANY` en un paso con botones o lista.** WhatsApp no desactiva los botones de mensajes
  anteriores y el motor acepta esos clics: un `ANY` captura respuestas que no le corresponden
  (variables corruptas, bucles). Cada botón o fila lleva su transición.
- **Todo botón o fila debe tener transición**: sin ella, la sesión queda atrapada.
- **Límites de WhatsApp (Meta rechaza en silencio):** máximo **3 botones** con título ≤ **20**
  caracteres (con más opciones, lista); lista con máximo **10 filas** en total, título de fila
  ≤ **24**, descripción ≤ **72**, `buttonText` ≤ **20**; cuerpo ≤ **1024** caracteres cuando
  hay botones (4096 en texto y listas).
- `headerImageUrl` **solo** en pasos BUTTONS; en una lista se guarda y nunca se envía.
- `transferToAgent: true` corta el flujo: ese paso no lleva transiciones ni `nextStepId`. Si
  después hay que cobrar o dejar botones vivos, usa `notifyAgent: true`.
- Un paso `PAYMENT` bifurca por `successStepId` y `timeoutStepId`, no por transiciones, y su
  `instructionText` debe incluir `{payment_amount}`.
- `REFERRAL` y `PAYMENT` por MCP requieren un servidor actualizado; si `create_flow` los
  rechaza, importa el JSON desde el panel.
