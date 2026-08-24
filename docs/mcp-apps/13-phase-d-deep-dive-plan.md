# 13 — Phase D Deep-Dive: Implementation Plan

> **Status: IMPLEMENTED (2026-08-24).** All five workstreams (D5, D3, D2, D1, D4) are
> complete on branch `migrate/mcp-ext-apps`, in the execution order below.
> Verification results: `npx tsc --noEmit` clean (0 errors), full `next build` green,
> `npm run mcp:apps:build` all 7 widgets within budget,
> `npm run mcp:phase7` **360/360 checks** (incl. 2 new D1 gates) + focused typecheck,
> `npm run mcp:phase9h` visual QA passed across all widget states and the
> themes×schemes matrix. Live-host manual checks (basic-host smoke test, ChatGPT/
> Claude captures) remain per `07-testing-plan.md §13`.
>
> Implementation notes vs. plan:
> - The kernel lives at `src/lib/slides/render-core/index.ts`; the old
>   `shared/slide-renderer.ts` was deleted (not shimmed) and phase7/focused-typecheck
>   pins were updated to the new path, plus a new coverage gate asserting every
>   `ContentType` member has a handler or alias.
> - SSE resume uses a `?lastSeq=` query param instead of `Last-Event-ID` headers
>   (fetch-based reader makes status codes observable).
> - `comparisonTable`/`pricingTable` are kernel aliases only (not `ContentType`
>   members); runtime occurrences reach them via the default→kernel fallback.

> Companion to [`12-mcp-apps-audit-report.md`](./12-mcp-apps-audit-report.md) (Phase D row).
> Every claim below was verified by reading the actual code on branch `migrate/mcp-ext-apps`.
> File references use `path:line` so you can jump straight to the evidence.

---

## 0. Summary of what changed vs. the original Phase D table

Deep-reading the code surfaced **four facts that reshape the plan**:

| # | Finding | Consequence for the plan |
|---|---|---|
| F1 | The vanilla widget renderer (`slide-renderer.ts`, 1,121 ln) covers **more** content types than the dashboard's React renderer. `MasterRecursiveComponent.tsx:444–447` drops `multiColumn`, `imageAndText`, `comparisonTable`, `pricingTable`, `link`, `customButton` (default case → `null`). These types are legal per `src/lib/types.ts:44–75`. **Decks containing them render blank in the editor, `/present`, AND `/share`** (PresentationViewer reuses MasterRecursiveComponent, `PresentationViewer.tsx:38`). | D1 is not just "dedup" — it is a **bug fix**. The vanilla renderer becomes the canonical kernel; the dashboard adopts it for non-editing surfaces. |
| F2 | The SSE route `api/generation/stream/route.ts` has **no auth or ownership check** — anyone with a `runId` can subscribe to another user's generation token stream. | D2 must include an auth fix before any refactor. |
| F3 | The two progress channels are not duplicates of the same data: polling drives the progress bar/steps (`useAgenticGenerationV2.ts:135–137`), SSE drives only the token viewer (`AgenticWorkflowDialog.tsx:42–64`) even though SSE events already carry `progress`/`stepId` fields that are ignored. | D2 = "make SSE authoritative, polling becomes fallback", a smaller and safer change than "pick one". |
| F4 | Dead code list verified at **zero importers** for every item, but deletion order matters: deleting first shrinks the surface the other workstreams touch. | Execution order becomes **D5 → D3 → D2 → D1 → D4**, reversing the original table order. |

Recommended execution order and dependency graph:

```
D5 (delete dead code)          ── 0.5 d   ── no deps; do first
      │
D3 (core/ services layer)     ── 2 d     ── needs clean tree
      │
D2 (SSE-first progress)       ── 1–1.5 d ── uses core/generation/runs
      │
D1 (shared render kernel)     ── 3–4 d   ── biggest; benefits from all above
      │
D4 (widget enhancements)      ── 2–3 d   ── builds on stabilized runtime facade
```

---

## 1. D5 — Delete dead weight (do this FIRST)

### 1.1 Verified-dead inventory (all checked at zero external importers)

| Path | Evidence it's dead | Action |
|---|---|---|
| `src/agentic-workflow/**` (entire v1 pipeline: 7 agents, LangGraph, llm.ts) | Grep `from '@/agentic-workflow/` → **0 hits** outside the folder itself | Delete folder |
| `src/actions/genai-pre.ts` (~49 KB, ~100% commented lines) | No references anywhere | Delete file |
| `src/store/useAgenticWorkflowStore.tsx` | Only self-reference | Delete file |
| `src/app/(protected)/presentation/[presentationId]/_components/editor-sidebar/leftsidebar/**` (DraggableSlidePreview, LayoutPreview, ScaledPreview) | Superseded by `new-leftsidebar/`; grep → 0 external imports | Delete folder |
| `src/components/landingPage/**` (old marketing generation) | `app/page.tsx:1` imports `LandingPageV2/LandingPage`; `/landing-v2` route also uses V2 components; grep `@/components/landingPage` → **0 hits** | Delete folder |
| `genai.ts` live dead exports: `generateLayoutsJSON` (line 668), `generateLayouts` (line 911), `replaceImagePlaceholders` (line 222), commented prompt block (lines 335–658) | No callers found in src | Delete exports + block |
| `src/app/(protected)/(pages)/(dashboardPages)/dashboard/demo-workflow/page.tsx` | References stale v1-era step ids (`outline-solid`) | Delete route |
| `@google/generative-ai` dependency | Superseded by `@ai-sdk/google`; **verify zero imports before removing** | Remove from package.json after grep |

⚠️ Do **not** delete `src/store/useCreativeAiStore.tsx` / `useScratchStore.tsx` — they are used by their respective create-flow pages.

### 1.2 Steps

1. Create branch `chore/delete-dead-code` off the migration branch.
2. Delete items in the table above, one commit per group (workflow v1 / actions+store / UI folders / landing).
3. After each commit run:
   ```powershell
   npm run build        # catches broken imports Next sees
   npx tsc --noEmit     # full typecheck; expect tsc_errors.log issues to shrink
   ```
4. Grep gates before merge:
   - `agentic-workflow/` → only `agentic-workflow-v2` and `components/global/agentic-workflow` remain
   - `landingPage` → only `LandingPageV2` remains
5. Update `docs/mcp-apps/07-testing-plan.md` if demo-workflow was referenced.

**Effort:** 0.5 d · **Risk:** low · **Rollback:** revert commits (no data/schema changes).

---

## 2. D3 — Extract transport-neutral `core/` services

### 2.1 Current state (verified twins)

| Concern | Actions version (Clerk-coupled) | MCP version (userId param) | Verdict |
|---|---|---|---|
| Step normalization | `actions/presentation-generation.ts:12–34` `normalizeSteps()` | `mcp/lib/presentation-generation-runs.ts:36–58` `normalizeGenerationSteps()` | **Byte-for-byte identical logic** |
| Run create/start/fail/complete | same file, lines 55–292 (findUnique + update pairs) | same MCP file, lines 119–158 (`createGenerationRunForMcp`, `markGenerationRunStartedForMcp`) | Same shape; action versions do find→update (race-prone), MCP start uses atomic `updateMany({userId})` ✓ better |
| Project ownership | `actions/project-access.ts:26–71` `getOwnedProject()` (auth inside, returns `{status,user,project}` envelope) | `mcp/lib/mcp-project-access.ts:27–53` `getOwnedProjectForMcp()` (explicit userId, returns entity\|null) | Same Prisma query; different envelopes |

The root cause: neither side can call the other because actions embed Clerk auth *inside* business logic, while MCP embeds its own AuthContext. The fix is the standard three-layer split.

### 2.2 Target design

```
src/core/                      ← NEW: transport-neutral, NO Clerk, NO MCP imports
├── projects/
│   └── ownership.ts           getOwnedProject(projectId, userId, opts?) → Project | null
└── generation/
    ├── steps.ts               normalizeSteps(), updateStepSnapshots()   [moved as-is]
    ├── runs.ts                createRun, markStarted, markStepRunning,
    │                          markStepCompleted, failRun, completeRun   ← ALL userId-explicit,
    │                          using atomic updateMany where MCP already does
    └── mapping.ts             runToStatusResponse(), projectToDto()     [absorb mcp mappers]
```

Layering rules (enforce with eslint `import/no-restricted-paths`):

- `core/*` imports only: prisma, `@/generated/prisma`, `@/lib/types`, `agentic-workflow-v2/lib/progress`
- `src/actions/*` may import `core/*` + Clerk (`onAuthenticateUser`)
- `src/mcp/**` may import `core/*` + its own auth

### 2.3 Migration steps (strangler pattern — no big-bang)

1. **Create `core/`** by moving logic verbatim from the MCP variants (they're already userId-parametric and race-safer):
   - `normalizeGenerationSteps` → `core/generation/steps.ts#normalizeSteps`
   - `getOwnedProjectForMcp` → `core/projects/ownership.ts#getOwnedProject`
   - Port the six run-lifecycle functions from `actions/presentation-generation.ts` into `core/generation/runs.ts`, converting each `findUnique→update` pair into `updateMany({ id, userId })` + count check (copy the pattern from `markGenerationRunStartedForMcp:138–151`).
2. **Repoint actions**: `actions/presentation-generation.ts` functions become thin wrappers:
   ```ts
   export const createPresentationGenerationRun = async (topic: string) => {
     const auth = await getAuthenticatedAppUser();
     if (auth.status !== 200) return auth;
     try {
       return { status: 200 as const, data: await createRun(auth.user.id, topic) };
     } catch { return { status: 500 as const, error: "Internal server error" }; }
   };
   ```
   Same for `getOwnedProject` (keep its `{status,user,project}` envelope so ~15 call sites don't change).
3. **Repoint MCP**: `mcp/lib/presentation-generation-runs.ts` and `mcp-project-access.ts` re-export from `core/` (or delete after import rewrite). Keep `buildGenerationStatusResponse` initially in mcp lib (it contains LLM-facing copy), move later into `core/generation/mapping.ts`.
4. **Guardrail**: add phase7-style static check asserting `src/core/**` contains no `clerk`/`auth()`/`AuthContext` imports.
5. Also fold in the misleading-name fix from audit C4 while touching these files: rename `generateAdvancedPresentation(userId…)` first param to `clerkId` (call sites: `actions/generatePresentation.ts`, `mcp/tools/presentation/generate.ts:93`).

**Files touched:** 2 new core modules (~250 ln moved), 3 action files slimmed, 2 mcp lib files repointed, 1 eslint rule.
**Verification:** `npm run mcp:phase7` (275 checks) + full typecheck + manual generate-from-dashboard smoke test + one MCP stdio tool call via `npm run mcp:inspect`.
**Effort:** 2 d · **Risk:** medium (touches generation write path) — mitigated by verbatim-move strategy.

---

## 3. D2 — SSE-first progress with polling fallback

### 3.1 Current architecture (verified)

```
useAgenticGenerationV2.generate()
 ├─ createPresentationGenerationRun()            → DB row
 ├─ setInterval(1 s) pollProgress()              → getPresentationGenerationRun (DB read)
 │    drives: progress %, agentSteps, error      ← channel A ("state of record")
 ├─ await generatePresentationAction(...)        → runs whole LangGraph in-request;
 │    wrapNode writes DB step status AND emits SSE via streamingEmitter
AgenticWorkflowDialog
 └─ useStreamingGeneration.connect(runId)        → EventSource /api/generation/stream
      drives: token terminal viewer ONLY         ← channel B (ignores progress fields)
```

Problems found:

1. **Security hole:** `api/generation/stream/route.ts:13` reads `runId` from query and subscribes with **zero authentication**. Fix regardless of everything else.
2. Wasted work: 1 s DB polls continue even while SSE is healthy.
3. SSE events already carry `progress` + `stepId` (`EventEmitter.ts:90–97 emitProgress`) but the client hook never maps them onto the progress bar.
4. Reconnect replays history (`route.ts:48–52`), but emitter deletes history when the last listener unsubscribes (`EventEmitter.ts:37–41`) — a page refresh mid-run loses the replay buffer. History should be cleared on run completion/TTL instead.
5. Fixed 2 s blind reconnect loop (`useStreamingGeneration.ts:130–135`) — no backoff, retries forever on 4xx.
6. In-memory emitter breaks under >1 instance (documented limitation; the Redis migration lives in Phase C — D2 keeps the interface compatible).

### 3.2 Target design

One authoritative event source, degraded gracefully:

```
                 ┌────────────────────────────────────────────┐
                 │  SSE  (primary): step snapshots + tokens    │
                 │  Poll (fallback): 5 s, ONLY when !connected │
                 └────────────────────────────────────────────┘
Client state machine (new hook useGenerationProgress):
  CONNECTING → LIVE(SSE) ──error──► FALLBACK(poll 5 s, backoff retry SSE)
       ▲                              │
       └──────── SSE recovers ────────┘
  Terminal states: COMPLETED / FAILED (from either channel)
```

### 3.3 Implementation steps

**Server (≈ half day)**

1. **Auth the SSE route** (`api/generation/stream/route.ts`):
   ```ts
   const auth = await getAuthenticatedAppUser();               // Clerk session
   if (auth.status !== 200) return new Response('Unauthorized', { status: 401 });
   const run = await prisma.presentationGenerationRun.findFirst({
     where: { id: runId, userId: auth.user.id },
   });
   if (!run) return new Response('Not found', { status: 404 }); // before subscribing
   ```
   (After D3 this calls `core/generation/runs.getRun(runId, userId)`.)
2. Emit a **snapshot event** on subscribe: `{ type:'progress', steps:[...], progress, currentStepId }` built via `normalizeSteps(run.steps)` so late joiners paint instantly without waiting for the next DB transition.
3. Stop deleting history on last unsubscribe (`EventEmitter.ts:37–41`); instead clear in `clearHistory()` called from `completePresentationGenerationRun`/`failPresentationGenerationRun`, plus a lazy TTL sweep (>30 min old).
4. Support `Last-Event-ID`: stamp each emitted event with a monotonic seq; on reconnect filter history > seq (small change in route + emitter).

**Client (≈ half day)**

5. New `hooks/useGenerationProgress.ts` owning the state machine above. It wraps the existing `useStreamingGeneration` unchanged and maps SSE events:
   - `agent_start`/`agent_complete`/`progress` → update `agentSteps` + `progress`
   - `error` → surface
   - snapshot event → hydrate all
6. Rewire `useAgenticGenerationV2`: delete the unconditional `setInterval` (`useAgenticGenerationV2.ts:135–137`); keep an initial `pollProgress()` fetch (pre-SSE snapshot) and let `useGenerationProgress` decide when to poll. The `generatePresentationAction` call and navigation stay untouched.
7. Add exponential backoff + max attempts + jitter to reconnect (`useStreamingGeneration.ts:130`), and stop retrying on HTTP 401/404 (EventSource surfaces via `onerror` only — switch to `fetch`-based SSE reader like `useStreamableGeneration.ts:174` already does, which gives status-code access).
8. Delete the dead no-op `setTimeout` block at `useAgenticGenerationV2.ts:104–108`.

**Verification:** two-browser test (owner streams; second browser w/o session gets 401); kill dev server mid-run and confirm fallback polling takes over then SSE resumes; `progress === 100` still triggers redirect countdown in dialog.
**Effort:** 1–1.5 d · **Risk:** low-medium · **Note:** multi-instance correctness remains Phase C (Redis pub/sub behind the same `streamingEmitter` interface).

---

## 4. D1 — Shared slide-renderer kernel

### 4.1 Current state (verified)

| Renderer | Tech | Used by | Type coverage |
|---|---|---|---|
| `mcp/apps/components/shared/slide-renderer.ts` (1,121 ln) | Vanilla TS → HTML string, HTML-escaped, `--vt-*` theme vars | deck-live (:567,:654), deck-preview (:1068), generation-progress (:1009) | **Full set** incl. aliases + `multiColumn`, `imageAndText`, `comparisonTable`, `pricingTable`, `link`, `customButton`, unknown-type fallback |
| `MasterRecursiveComponent.tsx` (566 ln) + 15 components in `compontents/` | React + framer-motion + react-dnd + zustand store + inline textareas | Editor edit mode, **and** preview mode via ResizableComponent; **and** `/present` + `/share` via PresentationViewer | Missing 6 types listed in F1 → blank output; unknown type → `console.warn` + null |

Theme systems: dashboard `lib/themeUtils.getThemeCSSVars(theme)` emits `--theme-*`; widgets `verto-skin.setWidgetTheme(name)` resolves the generated 65-theme catalog into `--vt-*`. Both derive from the same `Theme` shape (`lib/types.ts:77–96`).

### 4.2 Design decision

**Keep two rendering *surfaces*, one rendering *kernel*.**

The vanilla renderer is already a pure `(content: unknown) => string` function with escaping and theme-token indirection — it is 90% of the way to being the kernel. React re-implementations of stat boxes and timelines add animation/drag affordances that widgets don't need and that would bloat the IIFE bundles if shared. So:

```
src/lib/slides/
├── content-model.ts      ← move/extend ContentItem + ContentType (+ zod schema, kills z.any() later)
├── render-core/          ← MOVE slide-renderer.ts here verbatim (framework-free)
│   ├── index.ts            renderSlideContent(content, opts?)
│   ├── styles.ts           slideRendererStyles (parametrized prefix)
│   └── registry.ts         type→handler map extracted from the switch (dispatch.ts:635)
├── react/
│   └── SlideCanvas.tsx   ← 30-line React wrapper: <div dangerouslySetInnerHTML={renderSlideContent(content)}>
│                            + optional CSS var scope + image-fallback listener
└── themes.ts             ← single resolveThemeTokens + CSS-var builder serving BOTH --theme-* and --vt-* names
```

- **Widgets** keep importing the same module (repointed path; bundle contents unchanged — still esbuild-inlined).
- **Dashboard PREVIEW surfaces** (`PresentationViewer`, present/share, editor preview mode, thumbnails) switch to `<SlideCanvas>`.
- **Dashboard EDIT mode keeps** `MasterRecursiveComponent` (dnd/dropzones/textareas are genuinely editor-only) but its missing cases now fall back to `<SlideCanvas content={item}/>` instead of `null` — closing bug F1 immediately without rewriting 15 components.

### 4.3 Steps

1. **Move, don't rewrite:** relocate `slide-renderer.ts` → `src/lib/slides/render-core/index.ts`; convert the `dispatch()` switch (`:635–840`) into a `Record<string, Handler>` registry so both packages extend it without editing a monolith. Keep `escapeHtml`/`escapeAttr` exactly.
2. Parametrize style class prefix (`.vts-` stays default) and expose `renderSlideStyles(prefix)`; widget bundles unaffected (same output bytes — assert via `npm run mcp:apps:check` byte-diff report).
3. Build `SlideCanvas.tsx` wrapper + `themes.ts` dual-token builder (`--theme-accent` and `--vt-accent` set together).
4. Repoint the three widget imports (deck-live/deck-preview/generation-progress) at the new path; regenerate bundles; confirm phase9h passes unchanged.
5. Swap `PresentationViewer.tsx:38` usage: replace `<MasterRecursiveComponent … isPreview>` with `<SlideCanvas>` per slide (viewer has no editing anyway). Verify `/share/[id]` and `/present/[id]` visually against current screenshots.
6. In `MasterRecursiveComponent`'s `ContentRenderer.default:` case, replace `return null` with fallback `<SlideCanvas content={content}/>`; add the 6 missing types as explicit cases delegating to SlideCanvas.
7. Extract the type→handler map into `registry.ts` and add a **coverage unit test** (Phase B vitest): iterate every `ContentType` member, assert a handler exists and renders non-empty HTML for a fixture item. This prevents future drift between `types.ts` and both surfaces.
8. Optional stretch (separate PR): feed the same fixtures through phase9h's contrast checker for the dashboard skin.

**Verification:** `npm run mcp:apps:check && npm run mcp:phase7 && npm run mcp:phase9h`; side-by-side screenshot diff of `/present/[id]` before/after; open a deck containing `comparisonTable` + `customButton` in editor pre/post fix (blank → rendered).
**Effort:** 3–4 d · **Risk:** medium — visual regressions possible in present/share; mitigate with screenshot diff, keep old component available behind a flag for one release.

---

## 5. D4 — Widget enhancement backlog

All APIs verified present in installed `@modelcontextprotocol/ext-apps@1.7.5`.

### 5.1 `ontoolinputpartial` streaming (≈1 d)

Where it actually pays off: **not** generation (topic input is tiny) but **guided slide edits** — `presentation_update_slides` receives the entire slide JSON; hosts supporting partial-input notifications will stream it as the model composes.

1. Extend the runtime facade (`shared/runtime.ts`):
   ```ts
   export function onToolInputPartial(handler: (args: Record<string, unknown>) => void): void {
     app.ontoolinputpartial = (params) =>
       handler((params.arguments ?? {}) as Record<string, unknown>);
   }
   ```
   Register **before** `connect()` alongside existing handlers.
2. Consumer: deck-preview/slide-editor guided-edit mode — debounce 150 ms; while partial args contain a matching `presentation_id`, render incoming slide titles/count as a "model is preparing N slides…" skeleton; finalize on `ontoolinput`.
3. Capability note: hosts that don't send the notification simply never fire the handler — code is inert elsewhere. Add one phase9h scenario injecting a partial payload through the QA hook.

### 5.2 Host-context reactivity audit (≈0.5 d)

`verto-skin.attachHostAdaptation(app)` (`verto-skin.ts:736–806`) already wires `onhostcontextchanged` → theme/font/safe-area tokens centrally, and every widget mounts through it (`runtime.ts:38–54`). The audit deliverable:

1. Checklist per widget × {host light↔dark toggle, font change, locale change, safe-area change} executed in basic-host; record gaps (e.g., QR canvas colors and confetti palette are theme-snapshot-based — verify they re-resolve on change).
2. Fix any stale-theme caches found (likely candidates: module-level resolved tokens in `verto-skin.ts:440` consumers).
3. Document results in `09h-visual-qa-evidence.md`.

### 5.3 React port policy (decision, ≈0 d implementation)

Do **not** port existing widgets: each bundle already carries ~305 KB SDK+zod baseline; adding React (~45 KB+) buys nothing functional and pressures budgets (deck-live already at 512 KB cap). Adopt a written rule in `README.md`:

> New widgets default to vanilla + shared facade. React (`ext-apps/react`: `useApp`, `useAutoResize`, `useDocumentTheme`, `useHostStyles`) allowed only when a widget needs complex local state/animations that outweigh ~50 KB, and only if its budget line is raised explicitly in `build-widgets.mjs`.

### 5.4 Bonus quick wins while in the runtime (≈0.5 d)

- Replace deprecated `sendOpenLink` usages if any exist with `openLink` (SDK marks it deprecated, `app.d.ts:1226`).
- Expose `getHostContext()?.platform`/`deviceCapabilities` to the adaptive-layout code paths that currently infer touch from media queries.

**Verification:** extended phase9h scenarios; basic-host manual pass per §13 of testing plan.
**Effort:** 2–3 d total · **Risk:** low.

---

## 6. Consolidated timeline & gates

| Order | Workstream | Effort | Gate to exit |
|---|---|---|---|
| 1 | D5 deletions | 0.5 d | build + full tsc green; greps empty |
| 2 | D3 core/ extraction | 2 d | phase7 green; dashboard generate + MCP inspect smoke tests pass |
| 3 | D2 SSE-first | 1–1.5 d | 401 test for foreign runId; kill-server fallback test; redirect flow intact |
| 4 | D1 render kernel | 3–4 d | phase9h unchanged; present/share screenshot diff; 6-missing-types deck renders |
| 5 | D4 widget backlog | 2–3 d | new phase9h scenarios pass; host-context checklist recorded |

Total ≈ 8.5–11 working days (matches the original 2-week estimate, now with evidence-backed scope).

**Cross-cutting rules for every PR:**
- `npm run mcp:phase7` must pass (it pins tool/resource wiring).
- Widgets must stay within `WIDGET_BUDGET_BYTES` (`scripts/mcp-apps/build-widgets.mjs`).
- No new `any`/`z.any()` introduced; `core/` stays transport-pure.
- Each workstream ships independently revertable.

## 7. Top risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Present/share visual regression after D1 swap | Medium | Screenshot diff vs. captured baseline; feature-flag rollback to MasterRecursiveComponent |
| Generation lifecycle regression during D3 move | Medium | Verbatim moves only; atomic `updateMany` pattern copied from MCP variant; smoke-test both surfaces per commit |
| SSE auth fix (D2) breaking legitimate flows where Clerk cookie absent | Low | Mirror `resolveClerkSession` behavior used elsewhere; document that stream requires dashboard session (MCP hosts use polling path, unaffected) |
| Bundle-size drift from import repointing (D1/D4) | Low | `mcp:apps:check` byte-diff gate on every PR |
| Deleting landing v1 that someone secretly prefers | Low | It's unreachable code (0 imports); git history preserves it |

---

*End of plan. Update checkboxes in `03-migration-plan.md §Out of scope` and the audit report scorecard (maintainability 6/10 → expected 8/10 after D3/D5; functionality gains from D1 bug fix) as workstreams land.*
