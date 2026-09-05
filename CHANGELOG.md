# Changelog

## 1.1.0 — 2026-09-05

Skills de agentes de IA reescritos como guías paso a paso, con puertas de acuerdo antes de
escribir en la cuenta del cliente y avisos de lo que gasta saldo.

- **Nuevo** `actualizar-agente`: revisar y modificar un agente existente (antes/después, listas
  completas, impacto en sus equipos, borrado con doble confirmación).
- **Nuevo** subagente `auditor-agente-ia`: auditoría de solo lectura de un agente o equipo.
- **Reescrito** `crear-agente`: descubrimiento en dos rondas, menú de lo posible, diseño,
  redacción del prompt con buenas prácticas, dos puertas, comprobación y pendientes del panel.
- **Reescrito** `crear-equipo`: elección entre HANDOFF y SUPERVISOR, fichas de handoff, grafo
  completo, lectura de `validate_team` (errores y avisos), protocolo de prueba con `run_team`.
- **Nuevo** `references/`: cuestionario de descubrimiento, catálogo de capacidades, buenas
  prácticas de prompt, plantillas por caso de uso, diseño de equipos, síntomas y arreglos,
  errores y costes. Cada una termina en "Verificado contra" con el archivo del servidor y la
  fecha.
- **Corregido** en `crear-agente`: se enseñaba a enviar una credencial (`authSecret`) que el
  servidor rechaza; se decía que los documentos solo se suben desde el panel (por MCP entra
  texto); `params` de una herramienta HTTP se describía sin decir que es una lista de
  definiciones.
- **Corregido** en `crear-equipo`: `create_team` devuelve `id`, no `teamId`; faltaban
  `orchestrationMode`, `handoffDescription`, `validate_team`, `run_team`, `isActive` y las
  posiciones del lienzo.
- **Corregido** en `crear-flujo`: el validador admite `REFERRAL` y `PAYMENT`, marca como error
  un `ANY` en pasos con botones o lista y un botón o fila sin transición, y comprueba los
  límites de WhatsApp (3 botones, 20/24/72 caracteres, 10 filas, cuerpo 1024). El contrato y el
  ejemplo dejan de recomendar el `ANY` sobre botones.
- `editar-flujo` menciona `set_flow_step_image`, `list_flow_images` y `upload_flow_image`.
- Añadidos `LICENSE` (MIT, ya declarado en el manifiesto) y este changelog.

Verificado contra el servidor de FlujosChat (repo `chatboxabel`) con `npm run check:plugin`.

## 1.0.0

Primera versión: servidor MCP remoto y skills `crear-flujo`, `editar-flujo`, `crear-agente`,
`crear-equipo`.
