# 02 — API Mapping: OpenAI Apps SDK → MCP Apps (`@modelcontextprotocol/ext-apps` v1.7.5)

Reference for this migration. Generic tables from the official
`migrate_from_openai_apps.md` guide, instantiated with the exact symbols used
in this repo.

## 1. Server side

### 1.1 Imports

| Current | After |
|---|---|
| `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js` | unchanged |
| hand-declared `MCP_APP_UI_MIME_TYPE` in `apps/constants.ts` | `RESOURCE_MIME_TYPE` from `@modelcontextprotocol/ext-apps/server` |
| — | `registerAppTool`, `registerAppResource` from `@modelcontextprotocol/ext-apps/server` |

### 1.2 Tool registration

Current (`tools/presentation/index.ts:200-213`):

```ts
server.registerTool(toolName, {
  title, description, inputSchema,
  outputSchema: MCP_SUCCESS_OUTPUT_SCHEMA,
  annotations: metadata.annotations,
  _meta: createToolUiMeta(metadata.uiResourceUri, { appCallable: metadata.appCallable }),
}, callback);
```

After:

```ts
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';

registerAppTool(server, toolName, {
  title, description, inputSchema,
  outputSchema: MCP_SUCCESS_OUTPUT_SCHEMA,
  annotations: metadata.annotations,
  _meta: {
    ui: {
      ...(metadata.uiResourceUri ? { resourceUri: metadata.uiResourceUri } : {}),
      visibility: metadata.appCallable ? ['model', 'app'] : ['model'],
    },
  },
}, callback);
```

### 1.3 Tool `_meta` key mapping (as emitted by `createToolUiMeta`)

| Current key | MCP Apps replacement | Action |
|---|---|---|
| `ui.resourceUri` | `_meta.ui.resourceUri` | keep (now via helper) |
| `ui.visibility: ['model', 'app'?]` | same | keep |
| `openai/outputTemplate` | `_meta.ui.resourceUri` | **delete** (duplicate) |
| `openai/toolInvocation/invoking: 'Preparing Verto view'` | — not yet in spec | **delete** |
| `openai/toolInvocation/invoked: 'Verto view ready'` | — not yet in spec | **delete** |
| `openai/widgetAccessible: boolean` | encoded by `visibility` containing `'app'` | **delete** |

### 1.4 Resource registration

Current (`resources/app-ui.ts`, ×4):

```ts
server.resource(name, uri, createUiResourceMeta(description), async () => ({
  contents: [{ uri, mimeType: MCP_APP_UI_MIME_TYPE, text: html(),
               _meta: createUiResourceContentMeta(description) }],
}));
```

After:

```ts
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

registerAppResource(server, name, uri, { description }, async () => ({
  contents: [{
    uri,
    mimeType: RESOURCE_MIME_TYPE,
    text: html(),
    _meta: {
      ui: {
        prefersBorder: true,
        csp: { connectDomains: [], resourceDomains: [] },
        // `domain` only if MCP_APP_WIDGET_DOMAIN is explicitly configured
      },
    },
  }],
}));
```

### 1.5 Resource `_meta` key mapping (as emitted by `createUiResourceContentMeta`)

| Current key | MCP Apps replacement | Action |
|---|---|---|
| `ui.prefersBorder: true` | same | keep |
| `ui.domain` (env-derived) | `_meta.ui.domain` | keep **only when env-configured**; omit otherwise (host assigns sandbox origin) |
| `ui.csp.{connectDomains,resourceDomains}` | same | keep (empty arrays valid — widgets are self-contained) |
| `'ui/csp'` with `connect_domains`/`resource_domains` | camelCase nested form above | **delete** |
| `openai/widgetCSP` (+ `redirect_domains`) | `_meta.ui.csp`; `redirect_domains` has no equivalent | **delete** |
| `openai/widgetDescription` | resource/tool `description` field (already set) | **delete** |
| `openai/widgetPrefersBorder` | `_meta.ui.prefersBorder` | **delete** (duplicate) |
| `openai/widgetDomain` | `_meta.ui.domain` | **delete** (duplicate) |

## 2. Client side

### 2.2 Setup & connection

| Current (`shared/runtime.ts`) | After |
|---|---|
| implicit bridge init on first message | `const app = new App({ name:'verto-ai', version:'0.1.0' })` then `await app.connect()` |
| manual `ui/initialize` + `initialized` notify with timeout | handled inside `connect()` |
| `window.openai.*` fallbacks in `pickInitialPayload()` / `callMcpToolRaw()` | none needed — `connect()` auto-detects host environment |

### 2.3 Data flow

| Current | After |
|---|---|
| initial render from `window.openai.toolOutput\|toolResult\|toolResponse` or cached payload | register `app.ontoolresult = (params) => render(normalize(params.structuredContent))` **before** `connect()`; host replays the current result after handshake |
| `message` listener branch for method `ui/notifications/tool-result` | replaced by `ontoolresult` handler |
| `window.__VERTO_MCP_PAYLOAD__` cache | delete |

### 2.4 Widget actions

| Current | After |
|---|---|
| `callMcpTool(name, args)` → custom `tools/call` RPC or `window.openai.callTool` | `await app.callServerTool({ name, arguments: args })` |
| `sendFollowUpMessage(prompt)` → `window.openai.sendFollowUpMessage` or `rpcNotify('ui/message', …)` | `await app.sendMessage({ role:'user', content:[{ type:'text', text: prompt }] })`, guarded by `app.getHostCapabilities()?.serverTools !== undefined` style checks / try-catch |
| anchor links `target="_blank"` to Verto app | unchanged (works in sandbox); optionally `await app.openLink({ url })` where host supports it (`getHostCapabilities()?.openLinks`) |

### 2.5 Not migrated (no MCP equivalent today)

| OpenAI feature | Status in this repo | Decision |
|---|---|---|
| `openai/toolInvocation/{invoking,invoked}` strings | hardcoded in `constants.ts` | drop; hosts show generic progress |
| `openai/widgetDescription` | hardcoded per widget | drop; description already on tool/resource |
| `window.openai.setWidgetState` / `widgetState` | never used | nothing to do |
| `uploadFile` / `getFileDownloadUrl` / `requestModal` / `requestClose` / `view` | never used | nothing to do |

## 3. Facade contract preserved (components untouched)

`runtime.ts` keeps exporting the exact names/signatures below; internals are
replaced by the SDK:

```ts
mountWidget(render: (payload: Record<string, unknown>) => void): void
callMcpTool(name: string, args: Record<string, unknown>): Promise<VertoPayload>
sendFollowUpMessage(prompt: string): Promise<void>
byId(id): HTMLElement; setText(id, value): void; setLink(id, href): void
getRecord(v): Record<string, unknown>; getString(v, fallback?): string
getNumber(v, fallback?): number; getArray(v): unknown[]
injectStyles(css: string): void
baseStyles: string
```

Behaviour change only: `mountWidget` now creates the SDK `App`, wires
`ontoolinput`/`ontoolresult`, awaits `connect()`, and invokes `render` with
`structuredContent` payloads instead of listening for raw postMessages.
