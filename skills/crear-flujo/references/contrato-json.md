# Formato JSON de flujos — FlujosChat

Cuerpo: `{ "flow": {...}, "steps": [...] }`. Las transiciones van **anidadas** en cada step.

## flow
| Campo | Tipo | Req | Notas |
|---|---|---|---|
| name | string 3–100 | sí | |
| description | string ≤500 | no | |
| trigger | enum | sí | `KEYWORD` · `WELCOME` · `EVENT` · `MANUAL` (auto-disparan KEYWORD y WELCOME) |
| triggerKeywords | string[] | no | relevante con KEYWORD |
| priority | int 1–100 | no | default 10 |
| isActive | boolean | no | default true |

## steps[]
| Campo | Tipo | Req | Notas |
|---|---|---|---|
| stepOrder | int ≥1 | sí | identificador lógico; las referencias usan este número |
| stepType | enum | sí | `MESSAGE` `QUESTION` `CONDITION` `WAIT` `API_CALL` `AI_HANDOFF` `END` |
| name | string 3–100 | sí | |
| config | object | sí | depende de stepType (ver abajo) |
| nextStepId | int(stepOrder) \| uuid \| null | no | paso siguiente por defecto. **No** usar "nextStepOrder" |
| transitions | array | no | bifurcaciones (default []) |

## transitions[] (dentro de cada step)
| Campo | Tipo | Req | Notas |
|---|---|---|---|
| toStepOrder | int ≥1 | sí | destino por stepOrder; el origen es implícito |
| condition | enum | sí | `EXACT_MATCH` `CONTAINS` `STARTS_WITH` `REGEX` `ANY` `BUTTON` `LIST` |
| matchValue | string | no | requerido salvo `ANY` |
| priority | int 1–100 | no | default 10; `ANY` al final con priority 1 |

## config por stepType
- **MESSAGE/QUESTION TEXT:** `{ "text": "Hola {{nombre}}" }` (QUESTION puede usar `"question"`)
- **BUTTONS:** `{ "messageType":"BUTTONS", "text":"…", "buttons":[{"id":"si","title":"Sí"}], "header":"", "footer":"" }`
- **LIST:** `{ "messageType":"LIST", "text":"…", "buttonText":"Ver", "sections":[{"title":"…","rows":[{"id":"r1","title":"…","description":"…"}]}] }`
- **IMAGE:** `{ "messageType":"IMAGE", "imageUrl":"https://…", "caption":"" }`
- **DOCUMENT:** `{ "messageType":"DOCUMENT", "documentUrl":"https://…", "filename":"Catálogo.pdf" }`
- **QUESTION** acepta `"variable":"nombre"` para guardar la respuesta; `"transferToAgent":true` deriva a humano.
- **CONDITION:** `{ "variable":"x", "operator":"==", "value":"y", "trueStepId":5, "falseStepId":6 }` (stepId acepta stepOrder numérico). Operadores: `== === != !== > >= < <= contains starts_with`.
- **WAIT:** `{ "duration":30, "unit":"minutes" }` (`seconds|minutes|hours`) + `nextStepId`
- **API_CALL:** `{ "url":"https://…/{{var}}", "method":"GET", "saveAs":"resultado", "nextStepIdOnError":9 }`
- **AI_HANDOFF:** `{ "teamId":"uuid", "contextKeys":["x"], "greetImmediately":true }`
- **END:** `{ "message":"¡Gracias!" }`

Interpolación: usa `{{variable}}` en textos (se reemplaza con datos de la sesión).

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
        { "toStepOrder": 3, "condition": "BUTTON", "matchValue": "soporte", "priority": 10 },
        { "toStepOrder": 4, "condition": "ANY", "priority": 1 }
      ]
    },
    { "stepOrder": 2, "stepType": "MESSAGE", "name": "Ventas", "config": { "text": "Te paso con ventas 🛒" }, "nextStepId": 4 },
    { "stepOrder": 3, "stepType": "MESSAGE", "name": "Soporte", "config": { "text": "Cuéntanos tu problema 🛠️" }, "nextStepId": 4 },
    { "stepOrder": 4, "stepType": "END", "name": "Cierre", "config": { "message": "¡Gracias!" } }
  ]
}
```
