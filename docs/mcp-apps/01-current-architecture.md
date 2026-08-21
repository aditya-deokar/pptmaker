# 01 — Current Architecture Analysis

Scope: `src/mcp/apps/**`, plus the touchpoints in `src/mcp/resources`,
`src/mcp/tools/presentation/index.ts` and `src/mcp/transport/http.ts`.

## 1. Component inventory

```
src/mcp/
├── apps/
│   ├── constants.ts                  ← dual OpenAI + MCP meta builders (SERVER)
│   ├── widget-data.ts                ← typed widget payload builders (SERVER, spec-neutral ✓)
│   ├── widgets.ts                    ← HTML getters re-exporting generated strings
│   ├── components/
│   │   ├── shared/runtime.ts         ← hand-rolled postMessage bridge (CLIENT) ⚠
│   │   ├── action-result.ts          ← vanilla-JS widget (uses facade)
│   │   ├── deck-preview.ts           ← vanilla-JS widget (uses facade)
│   │   ├── generation-progress.ts    ← vanilla-JS widget (uses facade)
│   │   └── presentation-list.ts      ← vanilla-JS widget (uses facade)
│   └── generated/                    ← build artifacts: *.html + *.ts string exports
├── resources/app-ui.ts               ← registers 4 UI resources via raw server.resource()
├── tools/presentation/index.ts       ← registers 12 tools via raw server.registerTool()
└── transport/http.ts                 ← Next.js route handlers + CORS
scripts/mcp-apps/build-widgets.mjs   ← esbuild IIFE → single-file HTML → TS string export
```

Four widgets: `presentation_list`, `deck_preview`, `generation_progress`,
`action_result`. (`publish_card` / `theme_studio` payload types exist in
`widget-data.ts` but have no registered UI yet.)

## 2. Server side

### 2.1 `apps/constants.ts` — the dual-metadata problem

`createToolUiMeta(resourceUri?, { appCallable })` returns **both** dialects at once:

| Key emitted | Dialect | Notes |
|---|---|---|
| `ui.resourceUri` | MCP Apps ✓ | correct nested form |
| `ui.visibility: ['model','app'?]` | MCP Apps ✓ | correct array form |
| `openai/outputTemplate` | OpenAI ✗ | → `_meta.ui.resourceUri` |
| `openai/toolInvocation/invoking` | OpenAI ✗ | no MCP equivalent — drop |
| `openai/toolInvocation/invoked` | OpenAI ✗ | no MCP equivalent — drop |
| `openai/widgetAccessible` | OpenAI ✗ | → visibility `['app']` |

`createUiResourceContentMeta(description)` likewise mixes:

| Key emitted | Dialect | Notes |
|---|---|---|
| `ui.prefersBorder`, `ui.domain`, `ui.csp.{connectDomains,resourceDomains}` | MCP Apps ✓ | camelCase correct |
| `ui/csp` with `connect_domains` / `resource_domains` | legacy snake_case ✗ | delete |
| `openai/widgetCSP` (+ `redirect_domains`) | OpenAI ✗ | delete |
| `openai/widgetDescription` | OpenAI ✗ | no equivalent; tool/resource `description` already carries this |
| `openai/widgetPrefersBorder` | OpenAI ✗ | delete |
| `openai/widgetDomain` | OpenAI ✗ | → optional `_meta.ui.domain` |

Domain resolution: `MCP_APP_WIDGET_DOMAIN || NEXT_PUBLIC_APP_URL || https://verto.ai.aditya-deokar.me`.

MIME type is hand-declared as `'text/html;profile=mcp-app'` — value already
correct, but should come from the SDK constant `RESOURCE_MIME_TYPE`.

### 2.2 `resources/app-ui.ts`

Registers the four `ui://verto/*.html` resources through raw
`server.resource(name, uri, { description, mimeType, _meta }, cb)` with the
mixed meta above. Under MCP Apps this must go through
`registerAppResource(server, name, uri, config, cb)`, which:

- defaults the MIME type to `RESOURCE_MIME_TYPE`,
- validates/normalizes `_meta.ui.*`,
- keeps CSP camelCase-only.

### 2.3 `tools/presentation/index.ts`

All 12 tools are registered via a local wrapper
`registerPresentationTool()` → raw `server.registerTool()` with
`_meta: createToolUiMeta(...)`. Four tools set `appCallable: true`
(`presentation_list`, `presentation_get`, `presentation_publish`,
`presentation_generation_status`) → these become
`ui.visibility: ['model', 'app']`; the rest stay `['model']`.
Tool handlers/auth/scopes/middleware are transport-agnostic and unaffected.

### 2.4 Transport (`transport/http.ts`)

CORS already allows and exposes the required headers
(`MCP-Session-Id`, `MCP-Protocol-Version`, `Last-Event-ID`). No changes needed.

## 3. Client side

### 3.1 `components/shared/runtime.ts` — the hand-rolled bridge (~390 lines)

Implements, from scratch, what the SDK's `App` class provides:

| Hand-rolled piece | SDK replacement |
|---|---|
| JSON-RPC id/timeout bookkeeping over `window.parent.postMessage` | `PostMessageTransport` (internal to `App.connect()`) |
| `ui/initialize` + `ui/notifications/initialized` handshake | `await app.connect()` |
| Listener for `ui/notifications/tool-result` | `app.ontoolresult = (params) => …` |
| `tools/call` request helper (`callMcpToolRaw`) | `await app.callServerTool({ name, arguments })` |
| `ui/message` follow-up notify | `await app.sendMessage({ role:'user', content:[{type:'text',text}] })` |
| Initial payload from `window.openai.toolOutput\|toolResult\|toolResponse` | host replays last tool result via `ontoolresult` after connect |
| Fallbacks to `window.openai.callTool` / `sendFollowUpMessage` | unnecessary — SDK auto-detects host environment on `connect()` |
| `window.__VERTO_MCP_PAYLOAD__` cache | unnecessary |

**Facade kept stable** — all four components import only:
`byId, callMcpTool, getArray, getNumber, getRecord, getString, injectStyles,
mountWidget, sendFollowUpMessage` (plus `baseStyles` implicitly via
`mountWidget`). If `runtime.ts` keeps exporting these names with the same
signatures, component files require **no changes**.

Theming today uses pure CSS `prefers-color-scheme` media queries — works in
any sandboxed iframe regardless of host; optionally enhanced later by reacting
to `app.getHostContext()?.theme` / `onhostcontextchanged`.

### 3.2 Build pipeline (`scripts/mcp-apps/build-widgets.mjs`)

Per widget: esbuild IIFE bundle (minified, es2020) wrapped into a standalone
HTML document → written to `generated/*.html` + `generated/*.ts` string
export → imported by `widgets.ts` → served as resource text.
Byte budgets: 160 KB / 120 KB / 180 KB / 140 KB.

Adding the SDK client to each bundle increases size (est. ~25–40 KB minified
per widget). Budgets likely still hold but must be verified; budgets are
configurable in one place if adjustment is justified.

## 4. What is already spec-compliant (keep as-is)

- `ui://verto/{name}.html` resource URI scheme
- MIME type value `text/html;profile=mcp-app`
- Nested `ui.visibility` array semantics for app-callable tools
- camelCase `ui.csp.{connectDomains,resourceDomains}` (currently empty arrays —
  correct: widgets are fully self-contained, zero external origins)
- Widget payload contracts in `widget-data.ts` (pure data, host-agnostic)
- CORS configuration on the HTTP transport
- Single-file inline HTML build strategy (no CDN origins ⇒ empty CSP is valid)

## 5. Gap summary

| # | Gap | Severity |
|---|---|---|
| G1 | Flat `openai/*` meta keys emitted on every tool & resource | High — blocks clean MCP Apps conformance |
| G2 | Legacy snake_case `ui/csp` block | Medium |
| G3 | Raw `server.registerTool/registerResource` instead of SDK helpers (no validation, manual MIME/meta) | High |
| G4 | Custom postMessage bridge instead of SDK `App` (duplicated protocol logic, OpenAI fallbacks, no auto-resize, no host-context, no cancellation/partial-input support) | High |
| G5 | No capability checks before `sendMessage`/`openLink` style actions | Low |
| G6 | Bundle-size budgets unverified after SDK inclusion | Low |
