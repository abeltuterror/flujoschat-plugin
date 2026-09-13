# Changelog

## 1.3.0 — 2026-09-13

Cuatro capacidades de Google más y un tipo de herramienta nuevo, que el servidor ya expone y
aquí no se enseñaban.

- **Nuevo** en `references/catalogo-capacidades.md`:
  - `google_sheets_consultar`: ver las hojas elegidas, listar sus pestañas, buscar filas y leer
    un tramo. Con el aviso de privacidad: lee cualquier fila que coincida, sea de quien sea.
  - `google_sheets_actualizar`: modificar celdas de una fila existente. Explica la convención de
    columnas "(editable)", que va siempre junto con consultar, que no hay autorización por
    cliente y que la columna que identifica al cliente no se marca.
  - `google_gmail_escribir_cliente`: correo al cliente, solo a una dirección guardada desde el
    panel o por la API. Cubre también el interruptor del panel, la copia oculta al equipo, los
    topes y el riesgo de exfiltración si el agente lee datos de otros clientes.
  - `google_drive_buscar`: listar lo elegido y leer por páginas de 4000 caracteres. Solo lo
    elegido y sus hijos directos, y de una hoja solo la primera pestaña.
  - El tipo de herramienta `APPS_SCRIPT` (`execUrl`, `action`, `params`), con la clave
    compartida que solo se pone desde el panel.
- **Nuevo**: la importación de documentos de Google Drive a la base de conocimiento, que es una
  función del PANEL y no una capacidad del agente. Aparece en el catálogo, en la tabla de gastos
  y en las tablas de «solo desde el panel».
- **Nuevo** en `references/errores-y-costes.md`: los errores de Apps Script al crear o editar la
  herramienta, y una sección con lo que las herramientas de Google y Apps Script le devuelven al
  agente. Además, `run_team` ya dice que ejecuta de verdad las herramientas Apps Script y las
  lecturas de hojas y de Drive.
- **Nuevo** en `references/cuestionario-descubrimiento.md` y en `references/sintomas-y-arreglos.md`:
  preguntas y síntomas de las cuatro capacidades y de Apps Script.
- **Corregido**: el catálogo decía que de una hoja entregada el agente solo lee el nombre y la
  primera fila. Con `google_sheets_consultar` lee cualquier fila de cualquier pestaña.
- **Corregido**: no se decía que el envío de Gmail —avisar al equipo y escribir al cliente—
  depende de que Google apruebe ese permiso para FlujosChat.
- **Corregido**: los recuentos. Hay doce capacidades integradas, ocho de ellas de Google.
- `crear-agente`, `actualizar-agente` y el subagente `auditor-agente-ia` conocen las dos reglas
  de combinación: actualizar exige consultar, y el correo al cliente no se combina con lecturas
  de datos de otros clientes.
- `marketplace.json` se había quedado en 1.1.0; se alinea con el manifiesto.

Verificado contra el servidor de FlujosChat (repo `chatboxabel`, rama con `google_drive_buscar`)
con `npm run check:plugin`.

## 1.2.0 — 2026-09-06

Las cuatro capacidades de Google Workspace, que el servidor ya expone y aquí no se enseñaban:
un agente podía usarlas y este plugin no sabía que existían.

- **Nuevo** en `references/catalogo-capacidades.md`: `google_calendar` (qué calendarios hay y
  qué horas están ocupadas), `google_calendar_editar` (crear, mover y cancelar eventos),
  `google_gmail_enviar` (avisar por correo al equipo) y `google_sheets_anotar` (añadir una fila
  a una hoja que eligió el dueño), con sus prerrequisitos, sus límites y una sección sobre qué
  contarle al dueño antes de que las elija.
- **Nuevo** en `references/cuestionario-descubrimiento.md`: preguntas de descubrimiento para las
  tres —el calendario, el correo de aviso y la hoja de cálculo—, con lo que hay que preguntar
  ADEMÁS del «sí quiero»: a qué direcciones, y qué columnas tiene la primera fila de la hoja.
- **Corregido** en `references/errores-y-costes.md`: se decía que en `run_team` las capacidades
  integradas «no actúan». Es cierto solo para las herramientas que ESCRIBEN; las que consultan
  se ejecutan de verdad, y con Google eso sale hacia la cuenta real del dueño. Ya era inexacto
  antes de Google (`consultar_horarios_libres` nunca se negó en una prueba); Google lo vuelve
  visible porque ahora la consulta sale de la casa.
- **Corregido** «las 4 capacidades integradas» en las notas de dos referencias: son ocho.

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
