# 03 — Migration Plan (Implementation-Ready)

> **Status: Phases 0–5 complete** on branch `migrate/mcp-ext-apps`.
> Verified: focused typecheck (77 files), all 275 Phase 7 checks, runtime
> smoke test over InMemoryTransport (12 tools / 4 UI resources / clean meta /
> auth challenge intact), Phase 9H visual QA (10/10 states).
> Only remaining item: the **manual** basic-host live smoke test
> (commands in Phase 4 below and `07-testing-plan.md §13`).
>
> **Implementation deviations from the original sketch:**
> 1. `window.__VERTO_MCP_PAYLOAD__` kept as a documented standalone/QA hook —
>    `phase9h-visual-qa.mjs` injects payloads through it; removing it would
>    have broken visual QA. All `window.openai` code paths were removed.
> 2. Widget byte budgets raised to a uniform 384 KB (`build-widgets.mjs` +
>    phase7 check): the SDK `App` bundles zod v4 + protocol schemas into each
>    standalone IIFE (~305 KB minified baseline; widgets now ~324–330 KB).
> 3. `scripts/mcp-apps/phase7-checks.mjs`: nine assertions that pinned the old
>    implementation details (`openai/outputTemplate`, `'ui/csp'`,
>    `'ui/initialize'`, `event.source !== window.parent`, …) were rewritten to
>    pin the new SDK equivalents (`registerAppTool(`, camelCase CSP,
>    `ontoolresult`, `callServerTool`, SDK import).
> 4. `registerPresentationTool` generic constrained to
>    `Record<string, z.ZodTypeAny> & ZodRawShapeCompat` with a mirrored
>    conditional callback cast (`AppToolCallback`) — required because
>    `registerAppTool` resolves its input-schema conditional *outside*
>    `ToolCallback`.
> 5. UI resources now also carry listing-level `_meta.ui`
>    (`resources/list` entries), not just content-item meta.

Goal: replace the OpenAI-specific widget layer with the standardized
`@modelcontextprotocol/ext-apps` SDK (v1.7.5, already in `package.json`)
so the four Verto widgets render in **any** MCP Apps host.

Guiding constraints:

1. Preserve the `shared/runtime.ts` facade so the four component files need
   zero-to-minimal edits.
2. Keep tool handlers, auth, scopes, middleware, and payload contracts
   (`widget-data.ts`) untouched.
3. Keep the esbuild single-file HTML build strategy.
4. No OpenAI metadata keys remain after migration.

---

## Phase 0 — Prep

- [ ] Create branch: `git checkout -b migrate/mcp-ext-apps`
- [ ] Confirm dependency present: `@modelcontextprotocol/ext-apps@^1.7.5`
      (already installed; run `npm ls @modelcontextprotocol/ext-apps` to verify)
- [ ] Baseline: `npm run mcp:apps:build && npm run mcp:phase7` — record current
      bundle sizes and pass state for comparison

## Phase 1 — Server-side migration

### 1.1 Rewrite `src/mcp/apps/constants.ts`

Changes:
- Re-export `RESOURCE_MIME_TYPE` from `@modelcontextprotocol/ext-apps/server`
  as `MCP_APP_UI_MIME_TYPE` (or update all importers to use the SDK constant).
- Keep `MCP_APP_UI_RESOURCE_URIS` unchanged (`ui://verto/*.html`).
- Replace `createToolUiMeta()` with a typed helper that emits **only**:

  ```ts
  {
    ui: {
      ...(resourceUri ? { resourceUri } : {}),
      visibility: appCallable ? ['model', 'app'] : ['model'],
    },
  }
  ```

- Delete `createUiResourceContentMeta()`'s legacy/OpenAI keys. New shape:

  ```ts
  {
    ui: {
      prefersBorder: true,
      csp: { connectDomains: [], resourceDomains: [] },
      ...(getWidgetDomain() ? { domain: getWidgetDomain() } : {}),
    },
  }
  ```

- Change `getWidgetDomain()` to return `string | undefined`: only honour an
  explicit `MCP_APP_WIDGET_DOMAIN`; drop the `NEXT_PUBLIC_APP_URL` /
  hardcoded-fallback chain (the app URL is not a sandbox origin; hosts assign
  their own when `domain` is omitted).

### 1.2 Update `src/mcp/resources/app-ui.ts`

- Import `registerAppResource`, `RESOURCE_MIME_TYPE` from
  `@modelcontextprotocol/ext-apps/server`.
- Replace each of the four `server.resource(...)` calls with
  `registerAppResource(server, name, uri, { description }, readCallback)`.
- Read callback returns `mimeType: RESOURCE_MIME_TYPE` and the cleaned `_meta.ui`.
- Optional cleanup: collapse the four near-identical blocks into one loop over
  a descriptor table `{ name, uri, description, html }`.

### 1.3 Update `src/mcp/tools/presentation/index.ts`

- Import `registerAppTool` from `@modelcontextprotocol/ext-apps/server`.
- In `registerPresentationTool()`, swap `server.registerTool(...)` →
  `registerAppTool(server, ...)` (same argument order; config type is
  compatible — `_meta` now only carries `ui.*`).
- `PRESENTATION_TOOL_METADATA` table unchanged (`uiResourceUri`,
  `appCallable` map straight onto the new meta helper).

### 1.4 Sweep for stragglers

- Grep `openai/`, `skybridge`, `connect_domains`, `resource_domains`,
  `redirect_domains` under `src/` → must be zero hits (excluding this docs folder).

## Phase 2 — Client-side migration (`components/shared/runtime.ts`)

Rewrite internals; keep every export signature from the facade contract
(see `02-api-mapping.md §3`).

### 2.1 New structure

```ts
import { App } from '@modelcontextprotocol/ext-apps';

const app = new App(
  { name: 'verto-ai', version: '0.1.0' },
  {},                      // capabilities
  { autoResize: true }     // ResizeObserver-based size reporting (replaces nothing today; free win)
);

let latestPayload: VertoPayload = {};

export function mountWidget(render: RenderHandler): void {
  injectStyles(baseStyles);

  // Handlers MUST be registered before connect()
  app.ontoolinput = (params) => {
    // optional: expose arguments if widgets ever need them
  };
  app.ontoolresult = (params) => {
    latestPayload = normalizePayload(params.structuredContent);
    render(latestPayload);
  };

  void app.connect().catch((error) => {
    console.warn('Verto MCP Apps bridge was not initialized:', error);
  });
}
```

### 2.2 Tool calls & follow-ups

```ts
export async function callMcpTool(name, args): Promise<VertoPayload> {
  const result = await app.callServerTool({ name, arguments: args });
  latestPayload = normalizePayload(result.structuredContent ?? result);
  render hooks not needed here — components re-render themselves after await
  return latestPayload;
}

export async function sendFollowUpMessage(prompt: string): Promise<void> {
  if (!prompt.trim()) return;
  await app.sendMessage({
    role: 'user',
    content: [{ type: 'text', text: prompt }],
  });
}
```

Notes:
- `normalizePayload` keeps its current tolerant behaviour
  (`structuredContent` → JSON text block → record), so existing components'
  expectations hold.
- Delete: `window.openai` global declaration & fallbacks,
  `__VERTO_MCP_PAYLOAD__`, `rpcRequest/rpcNotify/handleRpcResponse/
  initializeMcpAppsBridge/hasParentBridge/pickInitialPayload`, timeout maps.
- Keep: DOM helpers, style helpers, `baseStyles`.

### 2.3 Components

Expected diff: none. Verify each component compiles against unchanged facade;
fix only if TypeScript surfaces a mismatch.

## Phase 3 — Build pipeline — DONE

- [x] Run `npm run mcp:apps:build`; compare per-widget byte sizes vs Phase 0 baseline.
- [x] Budgets raised to a uniform **384 KB** (`WIDGET_BUDGET_BYTES` in
      `scripts/mcp-apps/build-widgets.mjs`, mirrored in the phase7 check) with a
      comment noting the SDK inclusion. Actual growth was ~305 KB/widget
      (zod v4 + MCP Apps protocol schemas), far above the original ~25–40 KB
      estimate. Minification unchanged.
- [x] Regenerated artifacts land in `src/mcp/apps/generated/**` (committed as before).

Final bundle sizes (baseline → final):

| Widget | Baseline | Final |
|---|---|---|
| presentation-list | 20,873 B | 326,442 B |
| generation-progress | 22,346 B | 327,923 B |
| deck-preview | 24,494 B | 330,228 B |
| action-result | 18,642 B | 324,230 B |

## Phase 4 — Verification

Static checks (all pass):
- [x] `rg "openai/" src` → no matches
- [x] `rg "skybridge|connect_domains|resource_domains|window\.openai" src` → no matches
- [x] `npm run mcp:apps:check` → generated artifacts current
- [x] `npm run mcp:phase7` (checks + focused typecheck) → **275/275 + typecheck pass**

Runtime checks:
- [x] In-memory transport smoke test (supersedes Inspector for CI): all 12 tools
      listed with `_meta.ui.resourceUri` + `visibility`; exactly 4 app-callable;
      four `ui://verto/*.html` resources readable with MIME
      `text/html;profile=mcp-app`, camelCase CSP, listing-level `_meta.ui`;
      tool results include `structuredContent`.
- [x] Auth paths unaffected: unauthenticated `presentation_list` call returns
      `isError` with the `WWW-Authenticate` challenge through the new
      `registerAppTool` wrapper.
- [x] Phase 9H visual QA (`npm run mcp:phase9h`) — all 10 widget states render
      from the SDK-bundled HTML in Puppeteer (layout/contrast/keyboard/reduced-motion).
- [ ] basic-host smoke test — **manual, remaining** (reference host from ext-apps repo):

      ```bash
      # terminal 1
      npm run dev   # Next.js serving /mcp
      # terminal 2 (ext-apps checkout)
      cd examples/basic-host && npm install
      SERVERS='["http://localhost:3000/mcp"]' npm run start
      ```

      Then verify per widget:
      1. App loads without console errors
      2. `ontoolresult` fires and renders data (list / preview / progress / action result)
      3. In-widget actions (`callMcpTool` → refresh/publish/status) work
      4. Follow-up message path works where host supports it

      Also documented in `07-testing-plan.md §13`.

## Phase 5 — Cleanup & docs — DONE

- [x] Dead exports removed from `constants.ts` during rewrite; grep confirms no
      imports of removed symbols (`createUiResourceMeta`, `widgetAccessible`,
      `outputTemplate`, `toolInvocation`) remain.
- [x] Docs updated: migration status section appended to this folder's README;
      `07-testing-plan.md §13` documents ext-apps verification + live-host steps.
- [x] Final bundle sizes recorded above (PR description when the PR is opened).

---

## Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Bundle size growth pushes widgets over byte budgets | CI check fails | Measure in Phase 3; budgets are one-line constants; SDK gzip footprint is modest |
| Host replays tool result *after* first paint → flash of empty state | Cosmetic | Widgets already render skeleton states; optionally render from `ontoolinput` args |
| Some hosts lack `sendMessage` capability | Follow-up button fails | Wrap in try/catch + capability check; degrade to hiding follow-up affordance |
| `App.connect()` in non-iframe contexts (e.g., Inspector preview) rejects | Console warning only | Existing `.catch(console.warn)` pattern retained |
| ChatGPT-specific behaviour regressions | Older OpenAI-only clients lose invoking/invoked strings | Accepted trade-off; MCP Apps is supported by ChatGPT per official client list |

## Out of scope (follow-ups)

- React port of widgets via `@modelcontextprotocol/ext-apps/react` (`useApp`)
- Reacting to host theme via `onhostcontextchanged` (today: CSS media queries)
- Implementing the dormant `publish_card` / `theme_studio` widget types
- Streaming partial tool input (`ontoolinputpartial`) for generation progress
