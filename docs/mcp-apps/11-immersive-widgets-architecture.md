# Verto Immersive In-Chat Widgets — Architecture

> Companion to [`10-in-chat-verto-experience-plan.md`](./10-in-chat-verto-experience-plan.md)
> (delivery status: §12 there). This document explains **how the shipped
> system actually works**: layers, data flows, invariants, and the reasoning
> behind every major decision. Written to be readable stand-alone — including
> as interview preparation.

Last updated: 2026-08-22

---

## 1. System at a glance

Verto AI's presentation tools are exposed over MCP. MCP Apps–capable hosts
(ChatGPT, Claude, VS Code, the `basic-host` reference) render Verto's UI as
sandboxed iframes whose single-file HTML is served from `ui://` resources.
Seven widgets cover the whole lifecycle: browse decks, watch generation live,
present fullscreen, restyle visually, edit slide text, publish/share, and see
action results.

```
┌────────────────────────── Host (ChatGPT / Claude / basic-host) ──────────────────────────┐
│                                                                                          │
│   Model turns                                   Widget iframes (sandboxed origins)       │
│  ┌──────────────┐   tool calls    ┌─────────────────────────── MCP Apps protocol ────────┐ │
│  │  LLM agent   │ ─────────────► │  ui://verto/deck-preview.html   (IIFE bundle)         │ │
│  └──────────────┘                │  ui://verto/generation-progress.html                  │ │
│        ▲                         │  ui://verto/deck-live.html                            │ │
│        │ updateModelContext      │  ui://verto/theme-studio.html                         │ │
│        │ (F8, capability-gated)  │  ui://verto/publish-card.html                         │ │
│        │                         │  ui://verto/action-result.html                        │ │
│        │                         │  ui://verto/presentation-list.html                    │ │
│        │                         └───────────────────────────────────────────────────────┘ │
└───────────────────────────────────────│──────────────────────────────────────────────────┘
                                        │ JSON-RPC (Streamable HTTP / stdio)
┌───────────────────────────────────────▼──────────────────────────────────────────────────┐
│ Verto MCP server (Next.js API routes + src/mcp/**)                                       │
│  transport/http.ts ─ auth middleware (OAuth 2.1 │ API key │ Clerk session)               │
│    ├─ tools/presentation/*  (14 tools, registerAppTool + _meta.ui)                       │
│    ├─ resources/app-ui.ts   (registerAppResource per widget, CSP/permissions meta)      │
│    ├─ apps/widget-data.ts   (payload contracts, version 2)                               │
│    └─ lib/presentation-generation-runs.ts (run snapshots, step normalization)            │
│                                             │                                            │
│                                     Prisma │ Project.slides (JSON array)                 │
│                                            │ PresentationGenerationRun                   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

| Layer | Files | Responsibility |
| --- | --- | --- |
| Transport + auth | `src/mcp/transport/*`, `src/mcp/auth/*` | Streamable HTTP & stdio; OAuth 2.1 (protected-resource metadata, PKCE), API keys, Clerk session bridging |
| Tool layer | `src/mcp/tools/presentation/*` | Zod schemas, handlers, response builders, UI binding metadata |
| Contracts | `src/mcp/apps/widget-data.ts`, `constants.ts` | Versioned widget payloads (`structuredContent.widget`), resource URIs, `_meta.ui` builders |
| Widget sources | `src/mcp/apps/components/*` | One TypeScript entry per widget + shared kernel |
| Generated artifacts | `src/mcp/apps/generated/*` | Minified single-file HTML + TS string modules (build output, never hand-edited) |
| Build & QA | `scripts/mcp-apps/*` | esbuild bundling + budgets, theme-codegen, 358 static pins, focused typecheck, Puppeteer visual/a11y harness |

---

## 2. Runtime model — how a widget boots

Every widget is the same tiny program shape (`components/shared/runtime.ts`):

```
host fetches ui://verto/<name>.html          (server: apps/widgets.ts getter)
        │
iframe sandbox loads single-file HTML
        │
IIFE executes:
  1. injectStyles(vertoSkinStyles)           ← skin FIRST, zero flash
  2. attachHostAdaptation(app)               ← onhostcontextchanged wired
  3.     BEFORE connect()                    ← handshake burst can't be missed
  4. app.ontoolresult = render(payload)      ← also BEFORE connect()
  5. app.connect()                           ← SDK handshake (ui/initialize)
  6. refreshHostAdaptation()                 ← adopt initial host context
  7. if window.__VERTO_MCP_PAYLOAD__         ← QA harness / static preview hook
        render immediately
        │
ontoolresult fires (initial result AND every re-delivery):
  normalizePayload(raw)                      ← structuredContent › JSON-text › {}
  render(viewModel(payload))                 ← widget-specific DOM build
```

Key invariant: **registration order matters**. The SDK delivers the first
tool result and host context immediately after `ui/initialize`; handlers
registered after `connect()` would miss them. Both the host-adaptation
listener and `ontoolresult` are installed pre-connect deliberately.

Payload normalization accepts three shapes for robustness across hosts and
older cached resources:

1. `params.structuredContent` (standard),
2. a JSON object serialized inside a `text` content block,
3. bare record fallback.

Each widget then pattern-matches its own contract first
(`payload.widget.widget === 'deck_preview'`) and falls back to legacy/raw
shapes, so stale v1 results still render.

---

## 3. Server architecture

### 3.1 Tool registration and UI binding

All 14 presentation tools go through one helper
(`tools/presentation/index.ts`):

```ts
registerAppTool(server, name, {
  title, description, inputSchema /* zod */,
  outputSchema: MCP_SUCCESS_OUTPUT_SCHEMA,
  annotations /* readOnlyHint, destructiveHint, … */,
  _meta: createToolUiMeta(resourceUri, { appCallable, appOnly }),
}, callback);
```

`createToolUiMeta` (`apps/constants.ts`) emits only spec keys:

```jsonc
"_meta": { "ui": {
  "resourceUri": "ui://verto/deck-preview.html",
  "visibility": ["model", "app"]     // or ["model"] / ["app"]
} }
```

Visibility semantics drive the whole interaction model:

| Class | Tools | Meaning |
| --- | --- | --- |
| model-only | create, delete, recover, delete_permanently, generate | Destructive/broad mutations stay under model control |
| model + app | list, get, **update_slides**, **update_theme**, publish, unpublish, generation_status | Widget may call them itself (in-widget actions) |
| app-only | **render_deck**, **render_theme_studio** | Pure view swaps; never pollute model context |

### 3.2 Middleware pipeline (per call)

```
callServerTool / model invocation
  → createRequestContext(transport, extra, args)     // trace ids, sizes
  → resolveAuth                                      // OAuth bearer │ api-key │ Clerk
  → hasRequiredScopes(auth, getRequiredScopesForTool) // presentations:{read,write,publish,generate}
  → withErrorBoundary(handler)                       // uniform McpError envelopes
  → handler(args, auth)                              // e.g. getOwnedProjectForMcp(uid) ownership gate
  → mcpSuccess(data, { widget })                     // structuredContent envelope
  → logAuditEntry(...)                               // post-hoc audit record
```

Ownership is enforced inside every handler via
`getOwnedProjectForMcp(presentation_id, auth.userId)` — the widget can never
address another user's project even though the tool schema would accept it.

### 3.3 Response envelope

`tools/_shared/response.ts` builds one shape for success:

```ts
{
  structuredContent: { success: true, data: <presentation…>, widget?: <contract>, pagination? },
  content: [{ type: 'text', text: JSON.stringify({ success: true, data }) }]
}
```

The text block keeps non-Apps clients working; Apps hosts prefer
`structuredContent`. Errors use `mcpError` with `isError: true` and a typed
`error.code/message/suggestion` object — widgets surface `error.message`
directly in their action notes.

### 3.4 UI resources, CSP and permissions

`resources/app-ui.ts` registers one `ui://` resource per widget with content
metadata:

```ts
createUiResourceContentMeta({
  extraResourceDomains: SLIDE_IMAGE_RESOURCE_DOMAINS,  // deck-rendering widgets only
  clipboardWrite: true,                                 // publish card Copy button
})
// → _meta.ui = { prefersBorder, csp: { connectDomains, resourceDomains },
//                 permissions?: { clipboardWrite: {} }, domain? }
```

Notable choices:

- Slide-image origins (`images.unsplash.com`, `plus.unsplash.com`,
  `via.placeholder.com`) are allowlisted **only** for widgets that render real
  slides; everything else ships with empty CSP lists.
- `clipboardWrite` is scoped to the publish card because it's the only
  surface needing the sandbox permission.
- An explicit sandbox origin can be pinned via `MCP_APP_WIDGET_DOMAIN`;
  otherwise hosts assign opaque origins (which is why widgets never touch
  `localStorage`).

---

## 4. Payload contracts (version 2)

`apps/widget-data.ts` defines one discriminated union
(`McpAppWidgetData`) plus pure factory functions handlers call:

| Contract | Producer tool(s) | Distinctive fields |
| --- | --- | --- |
| `PresentationListWidgetData` | presentation_list | rows, pagination cursor, summary counts |
| `DeckPreviewWidgetData` | presentation_get | slides (mapped preview + full `content` trees, capped 50), actions incl. `canUpdateSlides` |
| `DeckLiveWidgetData` | presentation_render_deck | slim: slides + theme, no prose |
| `GenerationProgressWidgetData` | generate, generation_status | run status, `steps[]` (real run steps), `createdAt/completedAt`, optional `completion {slideCount, themeName, previewSlide}` |
| `ThemeStudioWidgetData` | update_theme, render_theme_studio | `themes[]` (name + `[background, accent, font]` triplet + `isNew`) |
| `PublishCardWidgetData` | publish | shareUrl + copy/open/unpublish flags |
| `ActionResultWidgetData` | all other mutations | operation summary + affected list |

Shared pieces:

```ts
interface BaseWidgetData { widget: Kind; version: 2 }
interface WidgetLinks { editorUrl; presentUrl; shareUrl }   // F9 deep links
```

Design rules the factories enforce:

- **Pure functions** — trivially unit-testable, no hidden reads.
- **Snake-case tolerance** — mappers accept both cases because dashboard
  entities and MCP naming conventions differ.
- **Caps at the boundary** — `MAX_DECK_PREVIEW_SLIDES = 50`,
  preview text truncated at 180 chars; payloads stay small regardless of deck
  size.
- **Completion snapshot instead of round-trips** — when a generation finishes,
  the status tool embeds `{slideCount, themeName, previewSlide}` (one Prisma
  select) so the widget can celebrate without calling `presentation_get`.

---

## 5. Shared client kernel (`components/shared/`)

Five small modules every widget composes. Deliberately dependency-free of
each other's widgets (skin ← runtime wiring only).

### 5.1 `runtime.ts` — the SDK bridge

Wraps `new App({name:'verto-ai'}, {}, {autoResize:true})` and exposes exactly
what widgets need:

| Export | Notes |
| --- | --- |
| `mountWidget(render)` | ordering-safe boot (§2), standalone payload hook |
| `callMcpTool(name, args)` | `callServerTool` with 15 s timeout; normalizes response |
| `sendFollowUpMessage(prompt)` | `app.sendMessage` user-turn follow-ups ("Ask ChatGPT to retry") |
| `pushModelContext(structured, digest)` | **F8**: capability-guarded `updateModelContext`, de-duplicated by digest hash — silent no-op on unsupported hosts |
| `onTeardown(fn)` | single-slot `onteardown` (flush timers / warn unsaved edits) |
| `logWidgetWarning(msg)` | `sendLog` when available, console fallback |
| `byId / setText / getString / getRecord / …` | tiny DOM/data helpers |

### 5.2 `verto-skin.ts` — design system + theme engine + host adapter

Three jobs in one module (≈1k lines):

1. **Token stylesheet** injected once: brand gradient, vivid accent ramp,
   glass panels, dotted grid, radius/shadow scale, focus-visible rings,
   motion kit (all animations killed under `prefers-reduced-motion`),
   F10 adaptive classes (§8.7).
2. **Deck-theme engine**: `setWidgetTheme(themeName)` resolves a catalog
   entry into CSS custom properties:

   ```
   themes-data.ts (65 entries, generated)
     → findTheme (exact › prefix match › Default fallback)
     → resolveThemeTokens (port of src/lib/themeUtils.ts)
        fontFamily/headingFont, accentGradient, radius, shadow preset
        slideBackground = gradientBackground ?? slideBackgroundColor ?? backgroundColor
        slideBackgroundSolid = averaged stops (opaque underlay)
        slideForeground = readableOn(fontColor, bg)   // WCAG-chosen black/white/preferred
        slideMutedForeground = mutedVariant(fg, bg)   // strongest ≥4.5:1 "muted"
     → sets --vt-accent/-gradient/-fill/-heading-font/-body-font/
             -radius/-shadow/-slide-bg(-solid)/-image/-fg/-muted
     → data-vt-theme="light|dark" attribute for variant styling
   ```

3. **Host adapter** (F10/F11): applies host theme (`applyDocumentTheme`,
   falling back to SDK `getDocumentTheme()` for hosts that force a scheme
   silently), host fonts, hover/touch capabilities, platform + displayMode
   classes, advertised display modes, safe-area insets — re-applied on every
   `onhostcontextchanged`.

Plus F9 helpers: `extractWidgetLinks` (v2 links › legacy fields),
`renderDeepLinkMenu` (native `<details>` overflow menu), `openVertoLink`
(`openLink` capability-checked with `window.open` fallback).

### 5.3 `slide-renderer.ts` — faithful slide HTML (F1)

A recursive `renderItem(content)` dispatching ~25 ContentItem types to
themed markup (`.vts-*` classes mirroring the dashboard's Tailwind output):
headings with accent bars, stat boxes, timeline rails, five callout variants,
code blocks with chrome dots, tables, TOC, images (with delegated `error`
fallback tile), links/buttons, and recursive column layouts.

Non-negotiables:

- **Everything interpolated is escaped** (`escapeHtml`/`escapeAttr`) — slide
  content comes from untrusted tool payloads.
- Unknown types degrade to plain rendering rather than dropping data.
- Text-bearing elements carry **stable edit hooks**
  (`data-vts-id`, `data-vts-index`, `data-vts-field`) consumed by the guided
  editor (§8.5).
- Accent-tinted text goes through `readableAccent()` =
  `ensureReadable(accent, solidUnderlay, 4.5)`; callout variants adapt icon
  (3:1) and body (4.5:1) colors to the resolved surface. These thresholds are
  what makes the 65-theme × 2-scheme QA matrix passable.

### 5.4 `slide-editor.ts` — guided editing state machine (F6)

Pure-ish controller mounted into a container element:

```
collectTargets(slide.content)              DFS → labeled editable targets
   title/h1-h4/paragraph/text (string content only)
   bullet|numbered|todo items (todo "[x] " prefixes preserved separately)
   quote/callout bodies, statBox value+label, timelineCard title+description
renderFields()                             themed textareas (.vt-slide-surface wrapper)
pendingBySlide: Map<slideId, Map<targetKey, PendingEdit>>
   input events upsert/delete; chip shows cross-slide dirty count
Save  → collectPatches() → options.save(patches)   [widget performs network leg]
Undo  → reversed patches through the same save path (one level)
Close → two-step discard confirm; onClose(hadUnsaved) → teardown warning
applyPatchesToSlides(slides, patches)      deep-clone; find node by id;
                                           write content | node[field] | list[index]+prefix
```

Guardrails: one slide displayed at a time, edits accumulate per slide,
explicit Cancel discards, `hasUnsavedEdits()` exposed for the widget's
`onTeardown` warning log.

### 5.5 `qrcode.ts` — in-widget QR (F5)

ISO/IEC 18004 byte-mode, versions 1–6, ECC level M (~4 KB): Reed–Solomon over
GF(256), function patterns, zigzag placement, format bits, all 8 masks scored
and best chosen. Inputs >106 bytes throw `RangeError`; the publish card hides
the QR panel gracefully instead. No external image service ⇒ no CSP origin,
no privacy leak of share URLs.

---

## 6. Feature walkthroughs

### 6.1 Presenter (`deck_live`, F2)

Slim payload (slides + theme only). Inline stage with prev/next pills, dot
picker, counter, swipe; `requestDisplayMode({mode:'fullscreen'})` behind
`availableDisplayModes` gating; keyboard map (←/→/Space navigate, G grid
overlay, Esc exit), idle-hide chrome after 3 s, top progress bar, grid
thumbnails rendered through the same renderer at reduced scale, safe-area
padding in fullscreen.

### 6.2 Theme studio (F4)

Search + All/Light/Dark tabs filter 65 cards client-side; each card paints a
mini slide mock (accent chip + three bars) using the payload's color triplet,
with `ensureReadable` guaranteeing bar visibility on any background.
Apply flow: select → confirm strip → `presentation_update_theme` → server
validates name against catalog → fresh `theme_studio` contract returned →
widget merges state, `setWidgetTheme` re-skins live, and pushes
`{event:'theme_applied', …}` to the model. Entry points: the tool result
itself and a "Change theme" CTA on deck_preview that invokes app-only
`presentation_render_theme_studio` (host swaps the surface).

### 6.3 Publish card (F5)

Deterministic confetti (index-derived positions so screenshots are stable;
invisible under reduced motion), big share URL with clipboard copy
(permission declared in resource meta), QR canvas, `openLink` deep link,
two-step unpublish → private state → republish loop (re-celebrates on
observed draft→published transitions only). Publish/unpublish taken here push
model context so follow-ups don't re-ask.

### 6.4 Live generation (F7)

```
generate → RUNNING + runId (progress UI attached)
auto-poll engine (module state machine):
  delay = min(8s, 3s + 1s × stagnantPolls)     // reset when progress advances
  ticker @250ms → countdown ring (SVG dashoffset) + seconds label
  fire → callMcpTool('presentation_generation_status')
         ├─ ok: consecutiveFailures=0; render(payload); terminal? stop : reschedule
         └─ err: ++failures; ≥3 → stop + "Auto-refresh paused" note
  document.hidden → pause (record remaining); visible → resume
  onTeardown → stopPolling()
timeline: real run.steps[] names/statuses/description/details (cosmetic stages
          remain only as legacy-payload fallback); animated connectors
chips: elapsed (createdAt→now/completedAt), ETA (velocity extrapolation between polls)
completion transition (prev running → now complete):
  embeds completion.previewSlide via slide-renderer on themed surface
  + pushModelContext("Generation run X completed; presentation Y … N slides")
failure: error card + Retry follow-up message (unchanged behaviour)
```

Why in-widget polling: the plan removed the manual "Check status" button from
the critical path while keeping it as manual override; the server stays
stateless per call.

### 6.5 Guided edits (F6) — end-to-end save

```
[Edit this slide] (enabled iff actions.canUpdateSlides && rawSlides.length)
  ↓ createSlideEditor({getSlides, save})
user edits textareas … dirty chip
[Save changes]
  widget.save(patches):
    1. callMcpTool('presentation_get', include_slides:true)   ← fresh tree
    2. extractRawSlides(payload)                              ← raw slides (slideName/type intact)
    3. next = applyPatchesToSlides(fresh, patches)            ← deep-cloned patch application
    4. callMcpTool('presentation_update_slides',
                   { presentation_id, slides: next })         ← FULL REPLACEMENT contract
    5. assertSuccess → syncAfterSave(): re-render local VM from `next`,
       note "Slide edits saved", pushModelContext({event:'slides_edited', edits[]})
editor: showDiff("Updated N text blocks", old→new rows) + [Undo changes]
Undo → same save path with swapped original/new texts
```

Fetch-before-write gives optimistic-concurrency behaviour despite the
full-replacement contract: patches land on whatever the server holds *now*,
not the widget's possibly stale copy. `presentation_update_slides` is
deliberately `visibility:['model','app']` — the one broad mutation widgets
may invoke, because the editor mediates every call.

### 6.6 Model-context sync (F8)

`pushModelContext(structuredContent, textDigest)` is the single choke point:
capability-gated (`getHostCapabilities().updateModelContext`), de-duplicated
by digest, silent no-op elsewhere. Push events shipped: theme applied (F4),
publish/unpublish (F5), generation completed (F7), slides edited (F6). The
digest doubles as the human-readable sentence the model sees, e.g.
*"User applied theme Ocean Breeze to presentation Q3 Review (abc123) from
the chat theme studio."*

### 6.7 Adaptive layout & host theming (F10/F11)

Host context maps to root classes; CSS does the rest:

| Signal | Class | Effect |
| --- | --- | --- |
| `platform === 'mobile'` | `.vt-mobile` | ≥44 px targets, 46 px CTAs, bigger reorder/menu buttons, sticky bottom-sheet footers |
| `deviceCapabilities.touch === true` | `.vt-touch` | same target bumps |
| viewport ≤560 px (`matchMedia` watcher) | `.vt-narrow` | same as mobile — covers hosts that never announce platform |
| `displayMode === 'pip'` | `.vt-pip` | compact paddings, heavy sections hidden |
| `deviceCapabilities.hover === false` | `.vt-no-hover` | `[data-hover-only]` hints hidden |
| `safeAreaInsets` | `--vt-safe-*` | body padding + presenter fullscreen padding |
| `availableDisplayModes` | dataset | `canPresentFullscreen()` gates the Present hero button |

F11 handshake order: host-declared theme wins; otherwise seed from
`getDocumentTheme()` (hosts that force a scheme without announcing it); then
host fonts; then deck-theme tokens override chrome accents only.

---

## 7. Build pipeline and size budgets

```
npm run mcp:apps:build
  gen-themes.mjs        parses src/lib/constants.ts themes[]
                        → generated/themes-data.ts (65 slim entries; --check mode verifies freshness)
  for each widget entry (7):
    esbuild {bundle, minify, iife, es2020, browser}
      → single JS (SDK ~305 KB baseline + widget code)
    wrapHtml(title, js) → <!doctype html>…<script>…
    enforce budgetBytes                      ← hard CI failure
    write generated/<name>.html + <name>.ts  (export const X_WIDGET_HTML = "…")
  regenerate generated/index.ts barrel
```

Budgets (plan §8 + measured reality):

| Widget | Budget | Why larger than 384 KB standard |
| --- | --- | --- |
| presentation-list, action-result, theme-studio, publish-card | 384 KB | standard |
| generation-progress | **416 KB** | F7 bundles the shared slide renderer (inline previews) + poll engine |
| deck-preview | **448 KB** | F6 guided editor rides along |
| deck-live | **512 KB** | renderer + stage + grid |

`--check` mode makes generated artifacts hermetic in CI: any source change
without a rebuild fails `mcp:phase7`.

---

## 8. Quality gates

| Gate | Script | What it actually verifies |
| --- | --- | --- |
| Artifact freshness + budgets | `mcp:apps:check` | regenerated bytes == committed bytes; per-widget caps |
| Contract pins | `mcp:phase7:checks` | **358 assertions**: required files; per-tool metadata blocks (regex-extracted) incl. UI uri + visibility class; scopes/security-policy coherence; every payload factory wired in its producer; widget feature strings (e.g. presenter keyboard map, editor guardrails); budgets; doc cross-references |
| Types | `mcp:phase7:typecheck` | `ts.createProgram` over curated roots scoped to `src/mcp/**`, `src/app/{mcp,api,oauth}/**` |
| Visual + a11y | `mcp:phase9h` | Puppeteer, 33 scenarios |

Phase9h anatomy (per scenario): inject
`window.__VERTO_MCP_PAYLOAD__` → emulate color-scheme + reduced-motion → run
interactions (`preClicks`, `setValueSteps`) → full-page screenshot → run in
page: **contrast sampling** (every visible text node; effective background =
nearest ancestor with α>0.94; 4.5:1 normal, 3:1 large/bold), **keyboard walk**
(Tab reachability + visible focus ring per stop), label coverage, landmark
coverage, nested-scroller detection, horizontal-overflow detection, body-text
floor → scenario expectations DSL (text contains / exact counts / minimum
counts / keyboard steps asserting counters) → aggregate report JSON +
markdown.

Matrix (10G): six representative themes × light/dark desktop + two mobile
cells, all through the full deck-preview pipeline — this is what forced the
opaque surface underlay and surface-adaptive accent/callout colors.

---

## 9. Cross-cutting concerns

**Security.** Slide content and theme names arrive from untrusted payloads:
renderer escapes everything; editor writes only through typed patch kinds;
tool handlers re-validate theme names against the catalog and enforce row
ownership. Widget→server calls ride the same auth middleware as model calls.
No widget persists anything: storage APIs are never touched (opaque sandbox
origins), state lives in memory and dies with teardown (with a warning log
when edits die mid-flight).

**Capability degradation.** Every host-dependent API is guarded:
`openLinks`, `updateModelContext`, `sendLog`, `requestDisplayMode`,
clipboard. Each degrades to a sensible fallback (browser tab, silent no-op,
console warn, inline stage, URL shown in note).

**Accessibility.** Focus-visible rings globally; labelled landmarks/controls
enforced by the harness; aria-live notes for async outcomes; reduced-motion
kills all animation globally; touch-target floors; contrast verified per
element against *resolved* surfaces across 65 themes × 2 schemes.

**Performance.** Single-file bundles cached by hosts (no external requests
except allowlisted slide images/fonts-by-host); polling backs off and pauses
when hidden; deterministic confetti avoids layout thrash; renderer is pure
string composition (no framework hydration).

---

## 10. Design decisions & tradeoffs

| # | Decision | Alternative considered | Why this won |
| --- | --- | --- | --- |
| 1 | Vanilla TS widgets, no React | Port dashboard components | Bundle math: SDK alone ≈305 KB; React+renderer would blow every budget. Renderer mirrors dashboard semantics instead. |
| 2 | Single-file HTML per widget served from `ui://` | Host-side bundles / CDN | Spec-preferred; hosts cache resources; CSP stays minimal; works identically in every host. |
| 3 | `structuredContent.widget` discriminated union, version 2 | Loose ad-hoc payloads | Type-safe factories server-side + defensive parsing client-side; version field future-proofs migrations. |
| 4 | Widgets call tools directly (`['model','app']` visibility) | Everything through the model | Sub-second UX (refresh/apply/save) with zero model latency/tokens; destructive tools stay model-only. |
| 5 | App-only view tools (`render_deck`, `render_theme_studio`) | Model-mediated navigation | View swaps must not consume model turns or hallucinate parameters. |
| 6 | Full-replacement slide saves + fetch-before-patch | Patch/diff endpoint | Matches existing tool contract; fetch-before-write provides concurrency safety without new server surface. |
| 7 | Generated theme catalog imported by widgets | Embed tokens per payload | One source of truth; ~20 KB tree-shaken per bundle beats duplicating tokens in every response; payloads stay lean. |
| 8 | In-widget auto-polling with backoff | SSE/resource subscriptions | Host support for streaming resources is inconsistent; HTTP polling with pause/backoff is universally safe and testable. |
| 9 | Runtime-computed contrast (ensureReadable) | Pre-baked accessible palettes | Works for arbitrary user/theme combinations, gradients included; the QA matrix continuously proves it. |
| 10 | Static pin suite (358) instead of unit tests for contracts | Traditional unit tests | Pins double as executable spec + regression tripwire for a fast-moving UI surface; behavioural risk covered by the Puppeteer battery. |
| 11 | Dedicated budgets per heavyweight widget | One global cap | Keeps flagship features feasible while CI still fails loudly on creep. |
| 12 | Cancel-generation deferred | Stub tool | Plan §7.3 made it conditional on backend support; Inngest run manager lacks cancellation — shipping a fake would mislead users. Documented decision. |

---

## 11. Interview quick answers

**Q: Walk me through what happens when a user clicks “Apply theme” in chat.**
Studio collects the selected theme → confirm strip → `callServerTool('presentation_update_theme')` → server re-validates the name against the catalog, checks ownership, updates Prisma → responds with a *fresh* `theme_studio` contract → widget merges state, calls `setWidgetTheme` (catalog lookup → `--vt-*` custom properties → instant re-skin) → capability-guarded `updateModelContext` tells the model what happened so the next turn doesn't re-ask. (§6.2)

**Q: How do widgets stay in sync with the model?**
One choke point, `pushModelContext`: capability-gated, digest-deduped pushes on meaningful user actions (theme applied, published/unpublished, edits saved, generation completed). Silent no-op on hosts lacking support. (§6.6)

**Q: Why full-deck replacement for a one-line text edit — isn't that wasteful?**
It's the existing tool contract (`presentation_update_slides`). Safety comes from fetch-before-patch: we pull the freshest slides, deep-clone, apply typed patches (node-id addressed, todo-prefix preserving), then replace. That yields optimistic-concurrency behaviour without inventing new server surface. Payload cost is bounded by the 50-slide cap. (§6.5)

**Q: How do you keep text readable on 65 arbitrary themes including gradients?**
At resolution time: pick foreground via WCAG (`readableOn`), derive a muted variant that still clears 4.5:1, expose an *opaque averaged underlay* beneath gradient paints so effective backgrounds always resolve, and route accent-tinted small text through `ensureReadable(accent, underlay, 4.5)`; callout variants adapt icon/body colors similarly. The Puppeteer matrix samples every text node across themes×schemes to prove it. (§5.2, §5.3, §8)

**Q: What breaks first if the host disappears mid-edit?**
Nothing corrupts — edits are client-memory only. `onteardown` fires our warning logger (“unsaved guided slide edits”) via `sendLog` (console fallback). Explicit cancel discards; save is atomic per full replacement. (§5.4, §9)

**Q: How is the QR code done — external service?**
No. A ~4 KB ISO-18004 encoder (byte mode, v1–6, ECC M, GF(256) Reed–Solomon, mask scoring) renders straight to canvas. >106-byte URLs degrade to link-only. Keeps share URLs out of third-party requests and the CSP clean. (§5.5)

**Q: How do you prevent the model from invoking dangerous mutations from widget clicks?**
Visibility classes: destructive tools are `['model']` only; seven everyday mutations are `['model','app']` so the *user's own click* can invoke them through the same authenticated pipeline; navigation/view tools are `['app']` so they never enter model context at all. Plus per-tool scopes, ownership checks, audit logs. (§3.1–3.2)

**Q: What's your testing strategy for something this visual?**
Three layers: artifact hermeticity (regenerate-and-compare), a 358-assertion static pin suite that acts as an executable spec for contracts and features, and a Puppeteer harness doing real rendering with an in-page a11y battery (contrast with effective-background walking, keyboard/focus walks, labels, overflow) across 33 scenarios including a themes×schemes matrix. Interactions (click/type) are scripted so flows like the guided editor are captured mid-use. (§8)

**Q: Biggest perf constraint?**
Bundle size — every widget re-ships the SDK (~305 KB). That drove: vanilla over React, one shared kernel, tree-shaken theme catalog, per-widget budgets enforced in CI, and keeping the renderer dependency-free. (§7, §10)

**Q: If you added streaming generation updates, what would change?**
Swap the poll engine's transport for resource-subscription notifications when hosts support them; keep the same reducer surface (status payloads unchanged), retain polling as fallback. The engine is already isolated behind `runAutoPoll`/timers precisely so this swap is contained. (§6.4, §12#8)

---

## 12. File map (quick reference)

```
src/mcp/
├─ apps/
│  ├─ constants.ts                  URIs, _meta.ui builders, image-domain allowlist
│  ├─ widget-data.ts                v2 contracts + factories (+completion snapshot)
│  ├─ widgets.ts                    generated-HTML getters
│  ├─ components/
│  │  ├─ shared/{runtime,verto-skin,slide-renderer,slide-editor,qrcode}.ts
│  │  └─ {presentation-list,generation-progress,deck-preview,deck-live,
│  │      theme-studio,publish-card,action-result}.ts
│  └─ generated/                    BUILD OUTPUT (html + ts + index barrel + themes-data)
├─ resources/app-ui.ts              registerAppResource per widget (+CSP/permissions)
├─ tools/presentation/              14 tools; index.ts = metadata + registration
│  └─ render-{deck,theme-studio}.ts app-only view tools
└─ lib/presentation-generation-runs.ts  run snapshots, status builder

scripts/mcp-apps/
├─ gen-themes.mjs                   constants.ts → themes-data.ts (freshness-checked)
├─ build-widgets.mjs                esbuild → html/ts artifacts + budgets (--check)
├─ phase7-checks.mjs                358 static pins
├─ focused-typecheck.mjs            curated tsc program
└─ phase9h-visual-qa.mjs            Puppeteer a11y/visual harness + matrix

docs/mcp-apps/
├─ 10-in-chat-verto-experience-plan.md   plan + §12 delivery status
├─ 07-testing-plan.md                    manual P10-1…P10-6 matrix
└─ submission-assets/                    screenshots, qa-report.json, summary.md
```
