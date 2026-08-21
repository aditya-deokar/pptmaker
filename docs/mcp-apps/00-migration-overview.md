# MCP Apps Migration — OpenAI Apps SDK → `@modelcontextprotocol/ext-apps`

> Migration planning docs for converting Verto AI's MCP widget/UI layer from
> its OpenAI-Apps-SDK-flavoured implementation to the standardized MCP Apps
> SDK. (The project README for the overall MCP Apps submission lives in
> [README.md](./README.md).)

## Documents

| Document | Contents |
|---|---|
| [01-current-architecture.md](./01-current-architecture.md) | Analysis of the existing implementation in `src/mcp/apps`, what is already spec-compliant, and what is OpenAI-specific |
| [02-api-mapping.md](./02-api-mapping.md) | Codebase-specific mapping of every OpenAI API/metadata key to its MCP Apps equivalent (server + client) |
| [03-migration-plan.md](./03-migration-plan.md) | Phased, file-by-file implementation plan with code sketches, risks, and verification steps |

## Executive summary

**Current state.** The server already speaks "half" MCP Apps (`ui://verto/*.html`
resource URIs, `text/html;profile=mcp-app` MIME type, nested `ui.*` meta keys)
but emits a **dual payload**: every tool/resource also carries legacy flat
OpenAI keys (`openai/outputTemplate`, `openai/widgetCSP` with snake_case
`connect_domains`, etc.). On the client, each widget bundles a ~250-line
hand-written JSON-RPC-over-postMessage bridge (`shared/runtime.ts`) that
duplicates exactly what the SDK's `App` class + `PostMessageTransport`
provide, plus fallbacks to `window.openai.callTool` /
`window.openai.sendFollowUpMessage`.

**Target state.**

- Server registers tools/resources through the SDK helpers
  `registerAppTool()` / `registerAppResource()` from
  `@modelcontextprotocol/ext-apps/server` — all OpenAI keys deleted.
- Widgets instantiate the SDK `App` class from
  `@modelcontextprotocol/ext-apps`; data arrives via `ontoolinput` /
  `ontoolresult` handlers; tool calls go through `app.callServerTool()`;
  follow-ups via `app.sendMessage()`.
- The public facade used by the four widget components
  (`mountWidget`, `callMcpTool`, `sendFollowUpMessage`, DOM helpers) is
  **preserved**, so component files need zero-to-minimal changes.
- Build pipeline (`scripts/mcp-apps/build-widgets.mjs`) is unchanged except
  size-budget verification, since each IIFE bundle now includes the SDK client.

**Already in place.**

- `@modelcontextprotocol/ext-apps@1.7.5` is already a dependency
  (`package.json`) but unused by source code.
- Widget resource URIs and MIME type already match the MCP Apps spec values.
- HTTP transport CORS already allows `mcp-session-id`,
  `mcp-protocol-version`, `last-event-id` headers (`src/mcp/transport/http.ts`).

**Feature trade-offs** (no MCP equivalent yet): the two
`openai/toolInvocation/{invoking,invoked}` status strings and
`openai/widgetDescription` are dropped; `openai/widgetDomain` +
`redirect_domains` are dropped in favour of optional `_meta.ui.domain`.
Widget state persistence via `window.openai.setWidgetState` was never used
here, so nothing is lost.

## Verification checklist (post-migration)

- `rg "openai/" src` → no matches outside comments/history
- `rg "skybridge|connect_domains|resource_domains|window\.openai" src` → no matches
- `npm run mcp:apps:build && npm run mcp:phase7` → passes within byte budgets
- Tools list correctly in MCP Inspector; UI resources readable with
  `text/html;profile=mcp-app`
- Smoke test in `basic-host` from the ext-apps repo against local `/mcp`
