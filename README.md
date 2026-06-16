# Plugin de FlujosChat para Claude Code

Crea y edita **flujos de WhatsApp** y **agentes IA** de [FlujosChat](https://www.flujoschat.foo)
directamente desde Claude, vía un servidor **MCP remoto** protegido con **OAuth 2.1**.

## Qué incluye

- **Servidor MCP remoto** (`.mcp.json`): se conecta a tu instancia de FlujosChat y expone tools
  para gestionar flujos (`create_flow`, `list_flows`, `get_flow`, `update_flow`, `duplicate_flow`,
  `delete_flow`, `get_flow_schema`) y agentes IA (`list_agents`, `create_agent`, `update_agent`,
  `create_team`, `save_team_graph`, `create_ai_tool`, `create_knowledge_category`, …).
- **Skills**:
  - `crear-flujo` — diseña un flujo desde lenguaje natural, lo valida y lo crea.
  - `editar-flujo` — inspecciona, actualiza, duplica o elimina flujos.
  - `crear-agente` — configura agentes IA (system prompt, RAG, herramientas).
  - `crear-equipo` — monta equipos multi-agente con handoffs.

## Instalación

```bash
# 1. Añade el marketplace (reemplaza por tu repo si publicas un fork)
/plugin marketplace add abeltuterror/flujoschat-plugin

# 2. Instala el plugin
/plugin install flujoschat@flujoschat-marketplace
```

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

## Permisos (scopes)

- `flows:read` / `flows:write` — ver / crear y editar flujos.
- `agents:read` / `agents:write` — ver / crear y editar agentes IA (las escrituras requieren rol
  OWNER o ADMIN en FlujosChat).

Apruebas los permisos en la pantalla de consentimiento al conectar.

## Documentación

Formato JSON de flujos y guía completa: <https://www.flujoschat.foo/ayuda>
