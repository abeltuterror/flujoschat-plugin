---
name: actualizar-agente
description: Revisar y modificar un agente de IA que ya existe en FlujosChat — ajustar el prompt sin perder lo que funciona, sumar o quitar conocimiento y herramientas, cambiar modelo, nombre, ficha de handoff o estado, o auditar por qué responde mal. Muestra el antes y el después y el impacto en sus equipos, y espera el acuerdo del dueño antes de guardar. Úsalo cuando digan "mi agente responde mal", "inventa precios", "cámbiale el tono", "que no dé descuentos", "hazlo más corto", "agrégale la categoría de precios", "conéctale la agenda", "quítale esa herramienta", "revisa mi agente", "audita el equipo", "desactiva el agente", "cambia el modelo" o "bórralo". Si el agente no existe usa crear-agente.
---

# Actualizar un agente de IA (FlujosChat)

`update_agent` escribe al instante en producción, `categoryIds` y `toolIds` REEMPLAZAN la lista
completa cuando los envías, y el agente puede estar atendiendo ahora mismo dentro de un equipo.
Por eso aquí se lee todo antes de opinar y se muestra el antes y el después antes de guardar.

## 0. Antes de tocar nada

1. `get_agent_schema` (fuente viva de campos, límites y reglas).
2. `list_agents` para localizarlo por nombre; si hay dos parecidos, pregunta cuál.
3. `get_agent`: prompt actual completo, categorías, herramientas, `isActive`,
   `handoffDescription`, modelo. Guárdalo íntegro en la conversación: es tu "antes".
4. `list_teams` y `get_team` de los equipos donde está: ¿es la entrada? ¿recibe derivaciones?
5. Si el cambio toca el modelo: `get_ai_balance` para saber el modo.

## 1. Clasificar lo que piden

- **Comportamiento** ("responde mal", "más corto", "que no dé descuentos") → pasos 2 y 3.
- **Fuentes y acciones** (categorías, herramientas, capacidades) → paso 3, con reemplazo total.
- **Ficha** (nombre, `handoffDescription`, modelo, `isActive`) → paso 3.
- **"Revísalo" / "por qué…"**, o un cambio grande en un agente que ya está en un equipo → paso 2.
- **Borrar** → paso 6.

## 2. Diagnóstico

- Lanza el subagente `auditor-agente-ia` con el id del agente, los ids de sus equipos y el
  síntoma literal que contó el dueño. Es de solo lectura y no gasta saldo. Presenta su informe y
  pregunta qué hallazgos quiere aplicar.
- Si el dueño trae una conversación real que salió mal, usa
  `${CLAUDE_PLUGIN_ROOT}/references/sintomas-y-arreglos.md`: no todo se arregla en el prompt;
  a veces es la descripción de una herramienta, un documento que falta, una capacidad sin atar o
  el grafo del equipo.

Antes de seguir: cada hallazgo tiene un cambio concreto (prompt, herramienta, conocimiento, grafo).

## 3. Preparar el cambio (sin escribir aún)

- **Prompt:** EDITA el texto actual por secciones; no lo reescribas desde cero salvo que lo
  pidan. Aplica `${CLAUDE_PLUGIN_ROOT}/references/buenas-practicas-prompt.md` solo a lo que
  tocas. Produce un antes/después por sección cambiada.
- **Categorías y herramientas:** parte de la lista actual de `get_agent`, aplica altas y bajas y
  muestra la LISTA FINAL completa marcando qué entra y qué sale. Ids nuevos verificados con
  `list_knowledge_categories` y `list_ai_tools`. Una capacidad integrada que no exista como fila
  se activa en el panel, no aquí.
- **`isActive` en falso:** avisa qué equipos pierden a este agente y si era la entrada (el
  equipo quedará roto; `validate_team` lo dirá). Es reversible: preferible a borrar.
- **Modelo:** solo los de la lista del esquema para el modo actual; si no, avisa del cambio
  silencioso al default.
- **`handoffDescription`:** si recibe derivaciones, no puede quedar vacía ni genérica.

Antes de seguir: el cuerpo de `update_agent` lleva SOLO los campos que cambian (omitir = no tocar).

## 4. PUERTA — antes/después e impacto

Tabla de campos que cambian (antes → después), el prompt nuevo completo en bloque de código si
cambió, y una línea de impacto: "Está en el equipo X como agente de entrada; el cambio aplica a
las conversaciones que entren desde ahora". Pregunta: "¿Guardo estos cambios?" y ESPERA.

## 5. Guardar y comprobar

1. `update_agent` con los campos cambiados.
2. Compara la respuesta con lo mostrado: conteo de categorías y herramientas, modelo guardado.
3. `validate_team` de cada equipo donde está; informa los avisos nuevos.
4. Ofrece `run_team` con UN escenario que ejercite el cambio (gasta saldo; pide un sí explícito;
   recuerda que las variables salen `(sin dato)` y que las capacidades integradas dicen que
   están en una prueba). Si el dueño trajo una conversación que fallaba, repite ese escenario y
   uno que funcionaba.

## 6. Borrar

`delete_agent` es irreversible. Antes: `get_team` de sus equipos; si es la entrada o recibe
derivaciones, propón primero rehacer el grafo (`crear-equipo`) o `isActive` en falso. Doble
confirmación: el dueño escribe el nombre del agente. Después, `validate_team` de los equipos
afectados.

## 7. Reglas

- Estado actual completo antes de opinar.
- Edita, no reescribas.
- Las listas se REEMPLAZAN: manda siempre la lista final entera.
- Nada se guarda sin pasar por la puerta.
- Lo que gasta saldo se pide antes.
- Máximo dos correcciones por objetivo; a la tercera, explica qué falta.
- Ninguna credencial por el chat ni por este canal; un `config` con credencial se edita en el panel.

## 8. Errores y costes

`${CLAUDE_PLUGIN_ROOT}/references/errores-y-costes.md`.

## 9. De lo que piden a lo que haces

- "Inventa precios" → auditor → regla en "Lo que no haces" + documento con los precios +
  categoría atada → puerta → `update_agent` → `validate_team` → `run_team` con la pregunta.
- "Conéctale la agenda" → `list_ai_tools`: ¿existe la capacidad de agenda? Sí: `toolIds` final
  con ella + política de agenda en el prompt → puerta. No: el panel primero (activarla y
  configurar la agenda), después volver aquí.
- "Ponlo en pausa" → `isActive` en falso → impacto en sus equipos → puerta → `validate_team`.
