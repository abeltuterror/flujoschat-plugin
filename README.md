# Plugin de FlujosChat para Claude Code

Crea y edita **flujos de WhatsApp** y **agentes de IA** de [FlujosChat](https://www.flujoschat.foo)
directamente desde Claude, vía un servidor **MCP remoto** protegido con **OAuth 2.1**.

## Qué incluye

- **Servidor MCP remoto** (`.mcp.json`): se conecta a tu cuenta de FlujosChat y expone 45 tools
  para flujos (crear, editar, duplicar, borrar, imágenes) y para todo el módulo de IA (agentes,
  equipos, herramientas, base de conocimiento, saldo). Dos de ellas traen el contrato completo y
  siempre al día: `get_flow_schema` y `get_agent_schema`.
- **Cinco skills**, que Claude aplica cuando reconoce lo que pides:

  | Skill | Cuándo se dispara |
  |---|---|
  | `crear-flujo` | "crea un flujo para mi negocio", "un bot de WhatsApp con botones", "una secuencia de mensajes" |
  | `editar-flujo` | "cambia el nombre de este flujo", "duplícalo", "desactívalo", "ponle una foto a este paso" |
  | `crear-agente` | "quiero un bot con inteligencia artificial", "crea un agente de IA", "que la IA agende las citas", "qué puede hacer la IA de FlujosChat" |
  | `actualizar-agente` | "mi agente responde mal", "cámbiale el tono", "conéctale la agenda", "revisa mi agente", "desactívalo" |
  | `crear-equipo` | "arma un equipo con ventas y soporte", "que recepción derive", "pásalo a modo supervisor", "valida mi equipo" |

- **Un subagente**, `auditor-agente-ia`: revisa un agente o un equipo en modo solo lectura y
  devuelve hallazgos con el cambio propuesto. No escribe nada y no gasta saldo.
- **Referencias compartidas** (`references/`): cuestionario de descubrimiento, catálogo de todo lo
  que puede hacer un agente, buenas prácticas para el prompt, plantillas por caso de uso, diseño
  de equipos, síntomas y arreglos, errores y costes.

## Instalación

```bash
# 1. Añade el marketplace (usa SIEMPRE la URL HTTPS, no el atajo owner/repo)
/plugin marketplace add https://github.com/abeltuterror/flujoschat-plugin

# 2. Instala el plugin
/plugin install flujoschat@flujoschat-marketplace
```

Para invocar una skill a mano: `/flujoschat:crear-agente`, `/flujoschat:crear-equipo`, etc.

## Conexión (OAuth)

Al usarse por primera vez, Claude detecta que el servidor MCP requiere autenticación y abre el
navegador para que inicies sesión en FlujosChat y autorices el acceso:

```bash
/mcp        # selecciona "flujoschat" y completa el login OAuth en el navegador
```

Claude registra el cliente automáticamente (Dynamic Client Registration + PKCE) y guarda los
tokens de forma segura. Verás la app autorizada en **Panel → Ajustes → Integraciones →
Conexiones MCP**, donde puedes revocarla cuando quieras.

## Configuración del endpoint

`.mcp.json` apunta por defecto a `https://api.flujoschat.foo/api/v1/mcp`. Si usas otra instancia
(self-hosted o dominio propio), edita la `url` para que coincida con el `OAUTH_ISSUER_URL` de tu
backend + `/api/v1/mcp`. El servidor publica su metadata OAuth en:

- `https://<tu-dominio>/.well-known/oauth-protected-resource/api/v1/mcp`
- `https://<tu-dominio>/.well-known/oauth-authorization-server`

## Permisos

- Scopes: `flows:read` / `flows:write` para flujos; `agents:read` / `agents:write` para todo el
  módulo de IA (agentes, equipos, herramientas, conocimiento, saldo). Los apruebas en la pantalla
  de consentimiento al conectar.
- Escribir exige además **rol OWNER o ADMIN** en FlujosChat y una suscripción activa. Ver el saldo
  (`get_ai_balance`) también exige OWNER o ADMIN.

## Cómo trabajan los skills de agentes

- Llaman primero a `get_agent_schema`: es la fuente viva de campos, límites y modelos, y por eso
  los skills no los repiten.
- Te enseñan **todo lo que un agente puede hacer** antes de diseñar: responder con tu propia
  información, consultar tus sistemas, agendar citas reales, responder con botones, guardar datos
  en la ficha del cliente, arrancar tus flujos, consultar y modificar tus hojas de Google, leer tus
  documentos de Drive, escribirle al cliente por correo, llamar a tu Apps Script, repartir el
  trabajo entre especialistas.
- **Te muestran el plan y el prompt y esperan tu acuerdo** antes de crear o modificar nada en tu
  cuenta.
- **Nunca te piden una credencial por el chat**: el servidor las rechaza. Las claves de tus
  herramientas se añaden en el panel.
- **Avisan de lo que gasta saldo de IA** antes de hacerlo: probar un equipo (`run_team`), buscar
  en el conocimiento (`search_knowledge`), crear o reindexar documentos.
- Te dejan una lista de **pendientes del panel** (credenciales, capacidades integradas, archivos,
  demostración pública, aviso a tu equipo).

## Lo que solo se hace desde el panel

| Qué | Dónde |
|---|---|
| Credenciales de una herramienta HTTP o MCP, y la clave compartida de una herramienta Apps Script | `/dashboard/ai/tools` → ficha de la herramienta |
| Activar una capacidad integrada (agenda, botones, ficha del cliente, flujos y las de Google: Calendar, Gmail, Sheets y Drive) | `/dashboard/ai/tools` → capacidad del sistema |
| Conectar tu cuenta de Google y elegir las hojas, documentos y carpetas que usa el agente | Configuración → Integraciones → Google |
| Permitir que la IA escriba al cliente por correo | Configuración → Personalizar panel |
| Subir archivos a la base de conocimiento | `/dashboard/ai/knowledge` |
| Importar documentos de Google Drive a la base de conocimiento | `/dashboard/ai/knowledge` → Importar de Drive |
| Clave o proveedor propio de IA | `/dashboard/ai/config` |
| Demostración pública de un equipo | `/dashboard/ai/teams` → Compartir demo |
| Aviso por WhatsApp a tu equipo cuando la IA deriva | Configuración → Personalizar panel → Avisos al equipo |

## Verificación

Cada referencia termina en una tabla **"Verificado contra"** con el archivo del servidor que
respalda cada afirmación y la fecha. El repositorio del servidor comprueba este plugin con
`npm run check:plugin`: que cada tool que se nombra existe, que ninguna existente queda sin
enseñar, que los campos citados los publica el servidor y que los mensajes de error citados son
reales.

## Documentación

- Manual: <https://www.flujoschat.foo/ayuda> — en particular
  [Agentes, equipos y herramientas](https://www.flujoschat.foo/ayuda/ia-agentes-y-equipos),
  [La base de conocimiento](https://www.flujoschat.foo/ayuda/ia-conocimiento),
  [Poner a trabajar a la IA](https://www.flujoschat.foo/ayuda/ia-configuracion) y
  [Conectar Claude por MCP](https://www.flujoschat.foo/ayuda/conectar-claude-mcp).
- Formato JSON de flujos: `get_flow_schema` o `skills/crear-flujo/references/contrato-json.md`.
