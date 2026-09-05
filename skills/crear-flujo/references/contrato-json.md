# Formato JSON de flujos — FlujosChat

Cuerpo: `{ "flow": {...}, "steps": [...] }`. Las transiciones van **anidadas** en cada step.
Este documento es el respaldo cuando el MCP no está conectado; la fuente viva es la tool
`get_flow_schema`.

## flow
| Campo | Tipo | Req | Notas |
|---|---|---|---|
| name | string 3–100 | sí | |
| description | string ≤500 | no | |
| trigger | enum | sí | `KEYWORD` · `WELCOME` · `EVENT` · `MANUAL` · `REFERRAL`. Auto-disparan KEYWORD, WELCOME y REFERRAL (cuando el cliente llega desde un anuncio) |
| triggerKeywords | string[] | no | relevante con KEYWORD |
| triggerReferralIds | string[] | no | con REFERRAL: ids de anuncio que lo disparan; vacío = cualquier anuncio |
| priority | int 1–100 | no | default 10 |
| isActive | boolean | no | default true |

## steps[]
| Campo | Tipo | Req | Notas |
|---|---|---|---|
| stepOrder | int ≥1 | sí | identificador lógico; las referencias usan este número |
| stepType | enum | sí | `MESSAGE` `QUESTION` `CONDITION` `WAIT` `API_CALL` `AI_HANDOFF` `PAYMENT` `END` |
| name | string 3–100 | sí | |
| config | object | sí | depende de stepType (ver abajo) |
| nextStepId | int(stepOrder) \| uuid \| null | no | paso siguiente por defecto. **No** usar "nextStepOrder" |
| transitions | array | no | bifurcaciones (default []) |
| posX / posY | number | no | posición en el lienzo del panel; omitir = automático |

## transitions[] (dentro de cada step)
| Campo | Tipo | Req | Notas |
|---|---|---|---|
| toStepOrder | int ≥1 | sí | destino por stepOrder; el origen es implícito |
| condition | enum | sí | `EXACT_MATCH` `CONTAINS` `STARTS_WITH` `REGEX` `ANY` `BUTTON` `LIST` |
| matchValue | string | no | requerido salvo `ANY`. Para botones y filas es el `id`, idéntico y sensible a mayúsculas |
| priority | int 1–100 | no | default 10 |

**Regla de las opciones:** en un paso con botones o lista, **cada botón o fila lleva su propia
transición** (`BUTTON` con el id del botón; `LIST` con el id de la fila) y **no se usa `ANY`**:
WhatsApp no desactiva los botones de mensajes anteriores y el motor acepta esos clics, así que
un `ANY` captura respuestas que no le corresponden (variables corruptas y bucles). `ANY` solo
sirve como último recurso en pasos de texto libre.

## config por stepType
- **MESSAGE/QUESTION TEXT:** `{ "text": "Hola {{nombre}}" }` (QUESTION puede usar `"question"`). Cuerpo ≤ 4096.
- **BUTTONS:** `{ "messageType":"BUTTONS", "text":"…", "buttons":[{"id":"si","title":"Sí"}], "header":"", "footer":"" }` — máx. **3 botones**, título ≤ **20**, cuerpo ≤ **1024**. Con más opciones, LIST.
- **LIST:** `{ "messageType":"LIST", "text":"…", "buttonText":"Ver", "sections":[{"title":"…","rows":[{"id":"r1","title":"…","description":"…"}]}] }` — máx. **10 filas** en total, título de fila ≤ **24**, descripción ≤ **72**, `buttonText` ≤ **20**, título de sección ≤ **24**.
- **IMAGE:** `{ "messageType":"IMAGE", "imageUrl":"https://…", "caption":"" }`
- **DOCUMENT:** `{ "messageType":"DOCUMENT", "documentUrl":"https://…", "filename":"Catálogo.pdf" }`
- **Portada** `headerImageUrl` (foto + texto + botones en una sola burbuja): **solo** en pasos BUTTONS; en LIST o TEXT se guarda y nunca se envía. Enlace `https://` público, no un media id (caducan a los 30 días). La URL sale de `upload_flow_image`; `list_flow_images` enseña las ya subidas; `set_flow_step_image` la pone o quita en un flujo que ya existe.
- **QUESTION** acepta `"variable":"nombre"` para guardar la respuesta.
- **Derivar a humano** (MESSAGE y QUESTION): `"transferToAgent":true` entrega a una persona y CORTA el flujo (ese paso no lleva transiciones ni nextStepId). `"notifyAgent":true` solo AVISA y el flujo sigue: es el que toca si después hay que cobrar o dejar botones vivos.
- **CONDITION:** `{ "variable":"x", "operator":"==", "value":"y", "trueStepId":5, "falseStepId":6 }` (stepId acepta stepOrder numérico). Operadores: `== === != !== > >= < <= contains starts_with`.
- **WAIT:** `{ "duration":30, "unit":"minutes" }` (`seconds|minutes|hours`) + `nextStepId`
- **API_CALL:** `{ "url":"https://…/{{var}}", "method":"GET", "body":{}, "headers":{}, "saveAs":"resultado", "nextStepIdOnError":9 }`
- **AI_HANDOFF:** `{ "teamId":"uuid", "contextKeys":["x"], "greetImmediately":false }` — `contextKeys` vacío = todas las variables; `greetImmediately` en true hace que la IA escriba primero (una corrida más, con su coste).
- **PAYMENT** (cobro con confirmación automática): `{ "amountCents":2500, "amountVariable":"order_total", "instructionText":"Yapea *S/ {payment_amount}* al 999…", "ttlMinutes":30, "successStepId":7, "timeoutStepId":8 }` — bifurca por config, no por transiciones; `successStepId` y `timeoutStepId` son obligatorios; el monto sale de `amountCents` (fijo, gana si está) o de `amountVariable` (variable en soles); `instructionText` debe incluir `{payment_amount}`.
- **END:** `{ "message":"¡Gracias!" }`

Interpolación: usa `{{variable}}` en textos (se reemplaza con datos de la sesión).

> `REFERRAL` y `PAYMENT` por MCP requieren un servidor actualizado (septiembre de 2026). Si
> `create_flow` los rechaza, importa el JSON desde **Panel → Flujos → Importar desde JSON**,
> que los admite.

## Ejemplo
```json
{
  "flow": { "name": "Bienvenida", "trigger": "WELCOME", "priority": 50 },
  "steps": [
    {
      "stepOrder": 1, "stepType": "QUESTION", "name": "Saludo",
      "config": { "messageType": "BUTTONS", "question": "¿En qué te ayudamos?",
        "buttons": [{ "id": "ventas", "title": "Ventas" }, { "id": "soporte", "title": "Soporte" }],
        "variable": "area" },
      "transitions": [
        { "toStepOrder": 2, "condition": "BUTTON", "matchValue": "ventas", "priority": 10 },
        { "toStepOrder": 3, "condition": "BUTTON", "matchValue": "soporte", "priority": 10 }
      ]
    },
    { "stepOrder": 2, "stepType": "MESSAGE", "name": "Ventas", "config": { "text": "Te paso con ventas 🛒" }, "nextStepId": 4 },
    { "stepOrder": 3, "stepType": "MESSAGE", "name": "Soporte", "config": { "text": "Cuéntanos tu problema 🛠️" }, "nextStepId": 4 },
    { "stepOrder": 4, "stepType": "END", "name": "Cierre", "config": { "message": "¡Gracias!" } }
  ]
}
```
