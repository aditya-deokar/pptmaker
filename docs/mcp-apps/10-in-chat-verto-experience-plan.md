# 10 — Immersive In-Chat Verto Experience: Implementation Plan

> Successor to the archived `legacy/09-premium-mcp-apps-ui-plan.md`
> (Phases 9A–9H = today's four widgets, all shipped). This plan closes the gap
> between *using Verto through chat widgets* and *using the real Verto
> dashboard* — inside ChatGPT, Claude, VS Code, or any MCP Apps host.
>
> Prerequisite: the ext-apps migration (`03-migration-plan.md`) is merged;
> widgets run on the SDK `App` client.

---

## 1. Vision

A user who never opens the dashboard should be able to, entirely in chat:

1. **See their actual deck** — real themed slides (gradients, fonts, layouts,
   images), not text summaries.
2. **Present it** — fullscreen, keyboard navigation, grid overview, progress.
3. **Restyle it** — browse all 65 themes visually and apply one, live.
4. **Iterate** — tweak slide text, reorder, then save back safely.
5. **Feel Verto** — the glassmorphism / gradient / dotted-grid design language,
   adaptive to the host's light/dark theme, mobile or desktop.

And uniquely for an agent surface: **the model stays in sync** — when the user
acts inside a widget (picks a theme, finishes editing), the widget pushes that
state back to the LLM via `app.updateModelContext()` so follow-up prompts are
grounded without the user repeating themselves.

## 2. Where we are today (widget audit)

| Widget | Renders | Interactive | Gap vs dashboard |
|---|---|---|---|
| `presentation_list` | table rows: title/slides/theme/status/actions | refresh, preview-latest (follow-up msg), open links | No thumbnails, no live data feel |
| `deck_preview` | slide **text** mapped to plain HTML (`renderContentItem()`, ~15 types approximated) | reorder, publish confirm, refresh | Not real slides: no themes/gradients/fonts/images/statBox/timelineCard fidelity; no paging |
| `generation_progress` | % bar + six fixed stage cards | manual "Check status" poll, retry/inspect follow-ups | Polling is manual; stages are cosmetic, not live step names; no completion handoff |
| `action_result` | summary grid + CTAs | open/copy/follow-ups | Static; no celebration moment |

Cross-cutting gaps: widgets use their own hardcoded teal/dark stylesheet
(`baseStyles`), ignore the deck's actual theme, ignore host light/dark &
viewport context, and never talk back to the model.

## 3. Dashboard inventory → what we can mirror in-chat

From the editor research (`src/app/(protected)/presentation/[id]/**`):

| Dashboard capability | Reusable asset | In-chat opportunity |
|---|---|---|
| Universal slide renderer | `MasterRecursiveComponent` semantics + `ContentItem` tree (`src/lib/types.ts`) | Port to vanilla renderer covering the high-frequency types (F1) |
| 65 themes with gradients/fonts/radius/shadows | `themes[]` (`src/lib/constants.ts:764`), token resolver `src/lib/themeUtils.ts` (`getThemeCSSVars` → `--theme-*`) | Theme engine as CSS variables inside every widget (F3); `theme_studio` browser (F4) |
| Presenter `/present/[id]` | `PresentationViewer.tsx` patterns: snap feed, grid overlay, progress bar, idle-hiding chrome, keyboard map | In-widget presenter mode using `requestDisplayMode('fullscreen')` (F2) |
| Layout library (38 layout types) | `slideLayouts.tsx`, `constants.layouts` | Outline→layout hints during creation flow; layout picker card in edit flow (later phase) |
| Slide reorder / add / delete | `presentation_update_slides` already replaces full decks | Existing reorder controls stay; add delete/undo chip in edit mode (F6) |
| Share/publish | `publishProject`, share URL `${origin}/share/{id}` | `publish_card` widget with QR + copy + `openLink` (F5) |
| Design language | `.verto` red→orange gradient, `.text-vivid` (#F55C7A→#F6BC66), glass panels (`bg-white/5 blur border-white/10`), dotted-grid canvas, rounded-2xl, Geist | Shared widget CSS foundation (§5) |
| Export PDF | html2canvas+jsPDF (dashboard-only) | Out of scope in-chat (needs binary download; revisit when hosts mature) |

## 4. Unused SDK toolbox (this plan's levers)

Already available in `@modelcontextprotocol/ext-apps@1.7.5`, none used yet:

| API | Use here |
|---|---|
| `app.getHostContext()` | `theme`, `locale`, `platform` ('web'/'desktop'/'mobile'), `deviceCapabilities.{touch,hover}`, `safeAreaInsets`, viewport container sizes, `availableDisplayModes`, `toolInfo` |
| `app.onhostcontextchanged` | Live re-layout / re-theme when host flips light↔dark or resizes |
| `app.requestDisplayMode({mode})` | True fullscreen presenter mode (F2) |
| `app.updateModelContext({structuredContent})` | Push widget-side state to the LLM (F8 — flagship) |
| `app.openLink({url})` (+ capability check) | Deep-link into dashboard editor/present routes (F9) |
| `applyHostStyleVariables` / `applyDocumentTheme` / `getDocumentTheme` / `applyHostFonts` (SDK exports) | Adopt host fonts/colors as widget baseline before Verto skin is applied (F11) |
| `app.onteardown` | Flush pending edits / abort poll timers cleanly |
| `app.sendLog` | Structured widget telemetry into host logs |
| `app.sendMessage` | Already used for follow-ups; keep |
| `ontoolinputpartial` / `ontoolcancelled` | Streaming args for long inputs; cancelled-generation UX (stretch) |

Not available (do not design around them): `widgetState` persistence, modals,
file upload/download (SDK has `downloadFile` but host support is rare),
`toolInvocation/invoking|invoked`.

## 5. Foundation: "Verto Skin" + theme engine (shared CSS)

New `components/shared/verto-skin.ts` replacing `baseStyles`:

1. **Design tokens** mirroring `globals.css`: brand gradient
   `linear-gradient(135deg,#ef4444,#f97316)` accents, `.text-vivid`
   (#F55C7A→#F6BC66) for kickers/headers, glass panels
   (`rgba(255,255,255,.06)` + `backdrop-filter: blur(12px)` +
   `border:1px solid rgba(255,255,255,.1)`), radius scale (xl=16px, 2xl=24px,
   pills), dotted-grid backdrop (`radial-gradient` 24px), soft shadow presets
   matching `shadowPreset` map in `themeUtils.ts`.
2. **Theme variable layer**: `setWidgetTheme(themeName)` injects
   `--vt-bg/--vt-surface/--vt-fg/--vt-muted/--vt-accent/--vt-accent-gradient/
   --vt-heading-font/--vt-body-font/--vt-radius/--vt-shadow` resolved exactly
   like `resolveThemeTokens()` (port the resolver; source data imported from a
   new generated JSON of the 65 themes — see §7 Server changes).
3. **Host adaptation**: on mount → `applyHostFonts(document)` +
   baseline vars from `getHostContext()`; `onhostcontextchanged` → re-apply;
   respects `prefers-reduced-motion`; hover affordances only when
   `deviceCapabilities.hover`.
4. **Motion kit**: shared keyframes (shimmer skeleton, fade-slide-in,
   count-up numbers, confetti burst on publish) — all gated by reduced-motion.

Deliverable: every widget (old and new) renders themed by the deck's actual
theme instead of hardcoded teal-on-dark.

## 6. Feature work

### F1 — Real slide renderer (vanilla port) · P0

Replace `renderContentItem()`'s approximation with a faithful renderer for the
content types that cover ~95% of generated decks:

- Full support: `title`, `heading1–4`, `paragraph`, `text`, `bulletedList`,
  `numberedList`, `bulletList`, `todoList`, `blockquote`, `quote`,
  `calloutBox`, `codeBlock`, `divider`, `statBox` (value+label card with
  accent gradient number), `timelineCard` (dot+line rail), `table`,
  `tableOfContents`, `image` (with graceful fallback box), `link`,
  `customButton`, `column` / `multiColumn` / `resizable-column` /
  `imageAndText` recursive flex layouts.
- Theme-aware: colors/fonts/radius from §5 variables; `slideBackgroundColor` /
  `gradientBackground` painted per slide like `SlideCanvas` does.
- Files: new `components/shared/slide-renderer.ts` (+ tests-by-snapshot in
  phase9h harness); `deck-preview.ts` refactored to consume it.

### F2 — `deck_live` presenter widget · P0

The flagship "wow": present the real deck inside chat.

- Trigger: new app-visible entry — extend `presentation_get` result with a
  `live_view` action flag, and/or new app-only tool (see §7). Widget shows a
  **"Present"** hero button on `deck_preview`.
- Behaviour (mirrors `PresentationViewer.tsx`):
  - Inline mode: 16:9 stage, prev/next pill, dot progress, slide counter,
    swipe on touch devices.
  - `requestDisplayMode({mode:'fullscreen'})` (capability-checked) for true
    presenting: keyboard ←/→/Space/Esc, `G` grid overlay (blurred backdrop,
    thumbnail grid rendered at reduced scale), thin top progress bar,
    chrome auto-hide after 3 s idle.
  - Transition set: fade / slide (scale & cube out of scope in-chat).
- Data: full `Slide[]` already obtainable via `callServerTool`
  `presentation_get {include_slides:true}` — no round-trip through the model.

### F3 — Theme engine everywhere · P0

- Widgets read `theme_name` from payloads → `setWidgetTheme()` paints them
  (list rows, preview cards, progress ring, action cards).
- `deck_live` renders each slide in its deck theme (gradient backgrounds,
  heading fonts, accent rules) — this alone collapses most of the
  "widget ≠ Verto" perception gap.

### F4 — `theme_studio` widget · P1

Payload contract already exists in `widget-data.ts` (`ThemeStudioWidgetData`),
never wired up:

- Grid of theme cards: gradient/color swatch preview (mini slide mock:
  title bar + two text bars painted in theme colors), Light/Dark filter tabs,
  search, "NEW" badge support (fix the stale `Amber Glow` reference found in
  `ThemeChooser.tsx` while porting).
- Select → confirmation strip → `presentation_update_theme` via
  `callServerTool` → success state + **`updateModelContext` push**
  ("user applied theme X to presentation Y") so the model's next reply knows.
- Entry points: `presentation_update_theme` result gains
  `ui.resourceUri: theme-studio.html`; plus a "Change theme" CTA on
  `deck_preview`.

### F5 — `publish_card` widget · P1

Contract exists (`PublishCardWidgetData`):

- Celebration moment (confetti keyframes, reduced-motion aware), big share URL
  with **Copy** (clipboard permission in `_meta.ui.permissions`), QR code
  generated in-widget (tiny embedded QR encoder ~4 KB) linking the share URL,
  `openLink` to `${origin}/share/{id}`, Unpublish action.
- Becomes the dedicated UI for `presentation_publish` (today it reuses
  `action_result`).

### F6 — Guided slide edits in-chat · P2

- In `deck_live`/`deck_preview`: "Edit this slide" → editable overlays on
  text-bearing components (title/headings/paragraph/list items) rendered as
  `contenteditable`-like textareas styled identically.
- Save = fetch current deck → apply patch to the edited `ContentItem`s →
  `presentation_update_slides` (full replacement, per tool contract) → diff
  confirmation strip ("Updated 3 text blocks") → `updateModelContext` push.
- Guardrails: single-slide-at-a-time, unsaved-changes chip wired to
  `onteardown` warning log, explicit Cancel discards.

### F7 — Live generation experience · P1

Upgrade `generation_progress` from manual polling to an ambient experience:

- Auto-poll loop (adaptive interval 3 s → 8 s backoff) driven in-widget via
  `presentation_generation_status`; visible countdown ring; stops itself on
  terminal states.
- Stage timeline bound to **real run steps** (`run.steps[]` names/statuses)
  instead of six cosmetic labels; animated connector fill; elapsed/ETA chips.
- On completion: auto-transition card → inline "Open deck" + **embeds the
  first slide preview** (via F1 renderer) + fires `updateModelContext`
  ("generation_run X completed; presentation Y ready with N slides").
- On failure: error card with reason + Retry (`sendMessage` pre-filled) —
  existing behaviour preserved.
- Optional server addition (§7): `presentation_generation_cancel` for runs
  started in-session; wire a Cancel button behind capability detection.

### F8 — Model-context sync (flagship) · P1

Small helper in runtime facade: `pushContext(structuredContent, textDigest)` →

`app.updateModelContext({ content:[{type:'text',text:digest}],
  structuredContent })`, capability-guarded, de-duplicated (last-write hash).

Push events: theme applied (F4), publish/unpublish (F5), edits saved (F6),
generation completed (F7), list filtered/sorted meaningfully (v2).

Why it matters: the agent stops asking "which theme did you want?" — the
widget already told it. This is the biggest step toward feeling like one
continuous product rather than a bolt-on panel.

### F9 — Deep links into the real product · P0 (tiny)

- Every widget header gains an overflow menu: "Open in editor"
  (`/presentation/{id}`), "Present" (`/present/{id}`), "Share" (`/share/{id}`)
  — via `openLink` with anchor-tag fallback.
- `widget-data.ts` already computes `openUrl`; add `editorUrl`/`presentUrl`.

### F10 — Host-adaptive layout · P1

One responsive pass across widgets using host context:

- `platform==='mobile'` or narrow container → stacked cards, larger touch
  targets (≥44 px), bottom-sheet-style action rows; hide hover-only hints.
- Respect `safeAreaInsets` padding in fullscreen presenter.
- `displayMode==='pip'|'fullscreen'` → compact/full variants
  (`availableDisplayModes` gates the Present button).

### F11 — Host theming handshake · P2

Baseline pass: `applyHostFonts` + `getDocumentTheme`/host context to seed
light/dark before Verto tokens override; ensures widgets never flash wrong
scheme inside Claude/VS Code hosts that force a scheme.

### F12 — Micro-interactions & a11y polish · P1

Skeleton shimmer on every async load; count-up stats; staggered row reveal on
list; focus-visible rings; `aria-live` for progress announcements; hit-target
audit; contrast checked per theme family in the QA harness (extend phase9h
contrast sampling to run against top-10 themes, both schemes).

## 7. Server-side changes (small, deliberate)

1. **Generated theme data module**: build script emits
   `src/mcp/apps/generated/themes-data.ts` from `themes[]`
   (name/type/colors/gradients/radius/shadow/fonts) so widgets get exact
   tokens without importing dashboard constants. Add to
   `build-widgets.mjs` pipeline (source: `scripts/mcp-apps/gen-themes.mjs`).
2. **Widget payload v2** (`widget-data.ts`): bump `version: 2`; add
   `editorUrl`, `presentUrl`; include resolved `theme` object snapshot
   (tokens) alongside `themeName` so widgets don't need a second lookup;
   `generation_progress` carries full `steps[]` detail (already does).
3. **Optional new tools** (each app-visible only, `visibility:['app']`):
   - `presentation_render_deck` — slim payload: slides + theme tokens only
     (no metadata prose) to keep `deck_live` transfers small.
   - `presentation_generation_cancel` — marks a run cancelled (P2, only if
     backend run manager supports it; otherwise defer).
4. **Visibility updates**: `presentation_get` becomes app-callable already ✓;
   `presentation_update_theme` gains `theme_studio` UI attachment
   (`ui.resourceUri`) once F4 ships.
5. **CSP additions on affected resources** (see Risks): font CDN origins for
   themed typography; image-storage origin for slide images.

## 8. Build & size strategy

Current: four IIFE bundles ≈ 325 KB each (384 KB budget), SDK baseline ≈305 KB.

- `slide-renderer.ts` + `verto-skin.ts` add ~25–40 KB to consuming widgets.
- `deck_live` (renderer + presenter + grid) will land ≈380–420 KB → give it a
  dedicated **512 KB budget**; keep others at 384 KB.
- QR encoder only bundled into `action-result`/`publish_card` variant.
- Themes JSON (~65 × ~300 B ≈ 20 KB minified) only bundled into widgets that
  paint themes (all of them post-F3 — acceptable; tree-shaken per-bundle).
- Keep single-file inline HTML strategy (hosts cache resources); no external
  bundles ⇒ keeps CSP minimal except fonts/images below.

## 9. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Sandbox storage**: opaque-origin iframes may throw on `localStorage` | High | Never assume storage; keep all state in-memory + `onteardown` flush; feature-test before any use |
| **Images in slides** need `resourceDomains` for the storage host (unknown today) | High | Investigation task W1: locate image URL host(s) from `generateImageUrl` outputs; add origins to `registerAppResource` CSP for `deck-live`/`deck-preview` only; graceful fallback tile when blocked |
| **Web fonts** (Playfair, Orbitron…) need font-CDN CSP or fall back | Medium | Map 65 themes → closest system stack by default; opt-in `fonts.googleapis.com`+`fonts.gstatic.com` in CSP for `deck_live`/`theme_studio`; document trade-off |
| `updateModelContext` unsupported on some hosts | Medium | Capability-guard every push; silent no-op otherwise |
| Fullscreen denied (host lacks display-mode cap) | Low | Presenter falls back to inline stage with same controls |
| Payload growth on `render_deck` for 50-slide decks | Medium | Cap at `MAX_DECK_PREVIEW_SLIDES` (50) + lazy page windowing in widget (fetch ranges of 10 via tool args if added later) |
| Budget creep | Low | Dedicated per-widget budgets (§8); CI fails loudly |

## 10. Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| **10A** | §5 skin + theme engine, F3 wiring into existing 4 widgets, F9 deep links | All widgets paint deck theme; deep-link menu works; phase9h green |
| **10B** | F1 renderer + refactor `deck_preview` onto it | Snapshot parity vs dashboard render for top types; phase9h green |
| **10C** | F2 `deck_live` presenter + W1 image-CSP fix | Fullscreen present, keyboard, grid, transitions in basic-host |
| **10D** | F4 theme_studio + F5 publish_card (wire existing contracts) | Apply-theme & celebrate-publish flows E2E in basic-host |
| **10E** | F7 live generation + F8 updateModelContext helper | Zero-touch run→completion demo; model receives completion context |
| **10F** | F6 guided slide edits | Text edit → save → diff confirm; undo chip |
| **10G** | F10 adaptive layout + F11 host theming + F12 polish/QA expansion | Mobile-pipeline screenshots; extended phase9h (themes × schemes) |
| **10H** | Server extras (`render_deck`, cancel), payload v2 cleanup, docs | Inspector + phase7 updated pins green |

Order is deliberate: skin first (everything benefits), renderer second
(presenter depends on it), then the two new widgets, then the agentic glue.

## 11. Definition of done

- A user can: generate → watch live progress → present the **themed real
  deck** fullscreen → switch theme visually → tweak a slide's text → publish
  with share link — **without leaving chat**, and the model follows along at
  each step.
- `npm run mcp:phase7` (with new pins), `mcp:apps:check`, `mcp:phase9h`
  (extended matrix), focused typecheck: all green.
- Manual: basic-host pass on desktop + mobile-width; one Claude/VS Code smoke.

---

## 12. Delivery status — COMPLETE (10A–10H)

All phases shipped. Automated gates at close: `npm run mcp:apps:check`
(fresh artifacts, per-widget budgets), `npm run mcp:phase7` (**358 checks** +
focused typecheck over 88 MCP/OAuth/widget files), and `npm run mcp:phase9h`
(**33 scenarios**, including the F12 themes × schemes matrix). Evidence
assets live in `docs/mcp-apps/submission-assets/`.

| Phase | Scope | Status | Notes |
| --- | --- | --- | --- |
| 10A | §5 skin + theme engine, F3 wiring, F9 deep links | ✅ | `verto-skin.ts`; all widgets paint deck themes; overflow deep-link menus |
| 10B | F1 renderer + deck_preview refactor | ✅ | `slide-renderer.ts`, snapshot-pinned in phase9h |
| 10C | F2 presenter + W1 image CSP | ✅ | Fullscreen/keyboard/grid; Unsplash origins allowlisted |
| 10D | F4 theme_studio + F5 publish_card | ✅ | Existing contracts wired end-to-end; clipboard permission; in-widget QR |
| 10E | F7 live generation + F8 helper | ✅ | Adaptive auto-poll (3→8 s) + countdown ring, real step timeline, elapsed/ETA chips, inline first-slide preview, completion context push (`pushModelContext`) |
| 10F | F6 guided slide edits | ✅ | Themed single-slide editor, fetch→patch→full-replacement save, diff strip + undo chip, teardown warning via `sendLog` fallback |
| 10G | F10 adaptive layout + F11 host theming + F12 polish/QA matrix | ✅ | `.vt-mobile/.vt-touch/.vt-narrow/.vt-pip` classes, ≥44 px hit targets, bottom-sheet footers, PiP compact variant, Present gated by `availableDisplayModes`, safe-area insets; `getDocumentTheme` seeds forced schemes; opaque surface underlays + surface-adaptive accents/callouts; phase9h extended to 33 scenarios |
| 10H | Server extras, payload v2 cleanup, docs | ✅* | See decisions below |

### Decisions & deviations

1. **`presentation_render_deck` shipped early (10C)** — the app-only slim
   payload tool landed with the presenter instead of waiting for 10H.
2. **`presentation_generation_cancel` deferred indefinitely** — plan §7.3
   made it conditional on backend support; the Inngest-driven run manager has
   no cancel API, so no tool was added rather than shipping a stub.
3. **Payload v2 theme snapshot not added** — §7.2 proposed embedding resolved
   theme tokens per payload; widgets already ship the generated 65-theme
   catalog (`generated/themes-data.ts`, tree-shaken per bundle), so a
   snapshot would only duplicate bytes. `themeName` + catalog lookup remains
   the contract.
4. **Budget exceptions (§8)** — three widgets carry dedicated budgets for
   flagship machinery: `deck_live` 512 KB (renderer + stage + grid),
   `deck_preview` 448 KB (F6 editor), `generation_progress` 416 KB
   (F7 poll engine + renderer); others remain at 384 KB and CI-fail loudly.
5. **Accessibility fixes surfaced by the 10G matrix** — slide surfaces now
   paint an opaque averaged underlay beneath gradients
   (`--vt-slide-bg-solid`); accent-tinted small text and callout variants
   adapt to the resolved surface at WCAG thresholds.

### Remaining manual work

- basic-host pass on desktop + mobile width (steps P10-1…P10-6 in
  `07-testing-plan.md`)
- One ChatGPT Developer Mode + Claude Custom Connector smoke
- Live captures for the `chatgpt-*` submission assets
