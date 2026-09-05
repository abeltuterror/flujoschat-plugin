---
name: crear-agente
description: Crear un agente de IA en FlujosChat de principio a fin — descubre qué necesita el negocio, le enseña al dueño todo lo que el agente puede hacer (responder con su propia información, consultar sus sistemas, agendar citas reales, botones, guardar datos en la ficha, equipos), redacta el system prompt con buenas prácticas y lo crea por MCP solo después de su acuerdo. Úsalo cuando digan "quiero un bot con inteligencia artificial para mi WhatsApp", "crea un agente de IA", "un asistente que responda a mis clientes", "que la IA agende las citas", "que responda con mis precios y políticas", "arma el prompt de mi agente", "qué puede hacer la IA de FlujosChat" o "quiero automatizar la atención con IA". Si el agente ya existe usa actualizar-agente; para conectar varios agentes usa crear-equipo.
---

# Crear un agente de IA (FlujosChat)

Un agente es un asistente con un system prompt (`instructions`), un modelo, conocimiento propio y
herramientas. Tres cosas que gobiernan este skill:

- **Todo lo que se escribe va a la cuenta real del cliente, al instante.** Por eso hay dos
  puertas de acuerdo antes de crear nada.
- **Las capacidades las publica el servidor.** `get_agent_schema` es la fuente viva de campos,
  límites, modelos y reglas; este documento enseña el procedimiento y no repite esos datos.
- **Un agente suelto no atiende a nadie.** Atiende a través de un equipo conectado a un flujo.

Requisitos: MCP de FlujosChat conectado con el scope `agents:write`, rol OWNER o ADMIN y
suscripción activa. Lo que gasta saldo de IA se anuncia antes de hacerlo.

## 0. Antes de empezar (no se salta)

1. Llama a `get_agent_schema`. Siempre, en esta conversación, aunque creas recordarlo.
2. Inventario: `list_agents`, `list_ai_tools`, `list_knowledge_categories`, `list_teams`.
   - Si ya hay un agente con ese nombre o ese trabajo, propón `actualizar-agente`.
   - Anota las filas de tipo `BUILTIN` (capacidades integradas: agenda, botones, contacto,
     flujos) con su id: son las que el dueño ya activó en el panel. Las que no estén NO se
     crean por este canal.
3. `get_ai_balance`: te da el modo de IA (incluida o clave propia) y el saldo. Si responde que
   requiere rol OWNER o ADMIN, este usuario tampoco podrá crear nada: dilo ahora y ofrece
   entregar el prompt en texto para que lo pegue un administrador. `get_ai_config` solo enseña
   la configuración guardada, no el modo.

Antes de seguir: has leído el esquema, sabes qué existe y sabes el modo y si hay saldo.

## 1. Descubrir qué necesita (dos rondas, no un interrogatorio)

Lee `${CLAUDE_PLUGIN_ROOT}/references/cuestionario-descubrimiento.md`. Reglas: una etapa por
turno; propone valores por defecto y pide confirmación; no preguntes lo que ya dijo; máximo dos
rondas. La ronda 1 cubre negocio, objetivo, alcance y límites. La ronda 2 va después del paso 2.

Antes de seguir: puedes escribir la frase-resumen del cuestionario ("Un agente que … para …, que
sí …, nunca …, y pasa a una persona cuando …"). Si no puedes, falta una respuesta.

## 2. El menú de lo posible

Lee `${CLAUDE_PLUGIN_ROOT}/references/catalogo-capacidades.md`. Presenta al dueño un menú
FILTRADO para su negocio: 5 a 8 líneas, en lenguaje de cliente, sin nombres de herramientas,
cada una con qué logra · dónde se activa (aquí o en el panel) · si gasta saldo. Pregunta cuáles
quiere para este agente. Con eso, haz la ronda 2 del cuestionario.

Antes de seguir: cada capacidad elegida está en `list_ai_tools` (integrada), se va a crear aquí
(HTTP o MCP) o queda anotada como pendiente del panel con su enlace.

## 3. Diseñar antes de escribir

- **¿Uno o varios?** Empieza por uno, salvo que haya dos trabajos con tono o reglas distintos:
  un agente por trabajo. Si son varios, créalos aquí uno a uno y sigue con `crear-equipo`.
- **Conocimiento:** una categoría por tema; documentos con el texto que el dueño pega o dicta
  (archivos: panel). Cada documento indexado gasta saldo y queda disponible para la IA en cuanto
  está listo: cuenta cuántos son antes de la puerta 1.
- **Herramientas HTTP o MCP:** dirección pública; método; `params` como lista de definiciones de
  argumentos (el esquema lo explica); NUNCA una credencial, ni en `config` ni en cabeceras: se
  añade en el panel después. Empieza por herramientas de solo lectura.
- **Capacidades integradas:** solo se atan con `toolIds` si ya existen como fila. Comprueba sus
  prerrequisitos (agenda configurada, campos personalizados, flujos con descripción).
- **Variables:** pide los nombres exactos de los campos personalizados y conviértelos a slug.
- **Modelo:** `null` (el default de la empresa) salvo motivo. Solo los modelos que lista el
  esquema; con la IA incluida, otro se cambia por el default sin avisar.
- **`handoffDescription`:** solo si va a recibir derivaciones dentro de un equipo. Tercera
  persona, específica.

Antes de seguir: tienes la ficha del agente y la lista de dependencias (herramientas,
categorías, documentos) completas.

## 4. Redactar el prompt

Lee `${CLAUDE_PLUGIN_ROOT}/references/buenas-practicas-prompt.md` (obligatorio) y elige una
base en `${CLAUDE_PLUGIN_ROOT}/references/plantillas-prompt.md`. Escribe el prompt completo y
pásalo por la checklist final de la guía antes de mostrarlo. No pongas: la fecha o la hora (la
plataforma añade la fecha sola), definiciones de las herramientas (llegan con la suya), precios
o catálogo (van a conocimiento), direcciones o claves (van a herramientas).

## 5. PUERTA 1 — dependencias (solo si las hay)

Muestra la lista: herramientas (nombre, dirección, argumentos), categorías, documentos (título y
tamaño) y el aviso "indexar N documentos gasta saldo". Espera un sí explícito. Luego, en orden:

1. `create_ai_tool` y, si el dueño quiere probarla, `test_ai_tool` avisando de que una
   herramienta HTTP se ejecuta de verdad (una MCP solo lista sus funciones).
2. `create_knowledge_category` y `create_knowledge_document` (texto plano).
3. `list_knowledge_documents` hasta ver el documento listo: nace pendiente, no lo des por listo.

Si una herramienta necesita credencial: créala sin ella, di al dueño que la añada en
`/dashboard/ai/tools` y que hasta entonces fallará. No la pidas por el chat: el servidor la
rechaza y quedaría escrita en la conversación.

Antes de seguir: ids anotados; herramienta probada o marcada "pendiente de credencial";
documentos listos (si uno falló, lee el motivo antes de reprocesar: reprocesar gasta).

## 6. PUERTA 2 — el agente

Muestra la ficha en una tabla (nombre · modelo · ficha de handoff · categorías · herramientas ·
variables usadas · pendientes del panel) y el prompt entero en un bloque de código. Pregunta,
literal: "¿Lo creo así en tu cuenta?" y ESPERA. Si pide cambios, vuelve a mostrar.

## 7. Crear y comprobar

Llama a `create_agent`. En la respuesta comprueba el `id`, que las categorías y herramientas
sean tantas como mandaste, y el modelo guardado. Entrega: id, enlace `/dashboard/ai/agents/<id>`
y la lista de pendientes del panel.

## 8. Después de crear (siempre)

- Un agente solo no atiende: ofrece montar el equipo (aunque sea de un miembro) con
  `crear-equipo` y conectarlo a un flujo con un paso `AI_HANDOFF` (`crear-flujo`).
- Probarlo es `run_team` sobre un equipo: gasta saldo y ejecuta de verdad las herramientas HTTP.
  Se ofrece, nunca se lanza sin acuerdo. En la prueba las variables salen como `(sin dato)` y
  las capacidades integradas dicen que están en una prueba: es lo esperado.
- Pendientes del panel, con enlaces: credenciales, capacidades integradas no activadas, subida de
  archivos, aviso por WhatsApp al equipo al derivar, demostración pública, clave propia.

## 9. Reglas que no se negocian

- El esquema primero. Nada se escribe sin pasar por una puerta.
- Ninguna credencial por el chat ni por este canal.
- No inventes capacidades ni modelos: si no está en el esquema o en `list_ai_tools`, no existe.
- Lo que cambia (precios, stock, horarios) va a conocimiento o a una herramienta, no al prompt.
- Lo que gasta saldo se anuncia antes.
- Máximo dos correcciones por objetivo; a la tercera, explica qué falta.
- Si falta permiso o saldo, para y explícalo. No busques la vuelta.

## 10. Errores y costes

Tabla de fragmento de error → qué hacer, y qué gasta saldo:
`${CLAUDE_PLUGIN_ROOT}/references/errores-y-costes.md`.

## 11. De lo que piden a lo que haces

- "Quiero un bot que responda dudas de mis productos" → paso 0 → ronda 1 → menú (conocimiento,
  botones, ficha) → ronda 2 → documentos en texto → puerta 1 → prompt → puerta 2 →
  `create_agent` → ofrecer equipo y flujo.
- "Que agende citas" → en `list_ai_tools` busca la capacidad de agenda; si no está, primero el
  panel (activarla y configurar la agenda); luego `toolIds` y la política de agenda en el prompt.
- "Conéctalo a mi API de pedidos" → `create_ai_tool` de solo lectura sin credencial →
  `test_ai_tool` con aviso → el dueño pone la clave en el panel → política en el prompt.
- "Usa el modelo más potente" → modo con `get_ai_balance` y lista del esquema; avisa el coste;
  con la IA incluida, solo los modelos con tarifa.
