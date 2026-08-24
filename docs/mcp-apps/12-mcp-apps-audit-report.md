# 12 — MCP Apps & UI Feature Audit Report

> Audit date: 2026-08-24
> Scope: `docs/mcp-apps/**` (15 planning docs) audited against the actual implementation in
> `src/mcp/**`, `src/agentic-workflow-v2/**`, `src/app/**`, `src/components/**`, `src/actions/**`,
> `scripts/mcp-apps/**`, and `prisma/schema.prisma`.
> Method: full code read + two deep sub-agent explorations + direct verification of key files.
> Branch audited: `migrate/mcp-ext-apps` (current checkout; **not yet merged to `master`**).

---

## 1. Executive Summary

| Dimension | Verdict | Notes |
|---|---|---|
| **Functional** | ✅ Strong | 14 tools, 7 widgets, OAuth 2.1, resources — all wired end-to-end and verified in code |
| **Correct / Spec-compliant** | ✅ Good | Official `ext-apps` SDK used on both server (`registerAppTool`/`registerAppResource`) and client (`App` class); no OpenAI legacy keys remain |
| **Well organized** | ⚠️ Mixed | MCP layer itself is clean & layered; the surrounding app carries ~5k lines of dead/duplicated code |
| **Maintainable** | ⚠️ Mixed | Zero automated tests, no CI, duplicated zod schemas, twin service functions between `src/actions` and `src/mcp/lib` |
| **Scalable** | ❌ Weak | In-memory sessions/rate-limits/SSE emitter assume a single process; generation blocks the request thread |
| **Industry grade?** | 🟡 *Not yet* | Feature-complete for submission, but missing CI, tests, horizontal-scale readiness, and several security hardening items |

**One-line verdict:** The MCP Apps layer is unusually mature and matches its documentation almost exactly — the real gaps are operational (no CI/tests, single-process state assumptions) and architectural hygiene (dead v1 workflow, duplicated services), not feature completeness.

---

## 2. Docs ↔ Code Consistency Check

The documentation is exceptionally disciplined and — rare for planning docs — it **matches the code**.

| Claim in docs | Code reality | Status |
|---|---|---|
| Migration to `@modelcontextprotocol/ext-apps` complete | `runtime.ts:1` imports SDK `App`; tools use `registerAppTool` (`tools/presentation/index.ts:250`); resources use `registerAppResource` | ✅ Verified |
| No `openai/*` metadata remains | Grep confirms zero hits in `src/` | ✅ Verified |
| Plan 10 "shipped": 7 widgets incl. `publish_card`, `theme_studio`, `deck_live` | All 7 components exist, are built into `generated/*.html`, registered as `ui://verto/*.html`, bound to tools, covered by phase9h QA | ✅ Verified |
| 14 tools with correct annotations/scopes/visibility | Metadata table at `index.ts:66–221`; app-only tools (`presentation_render_deck`, `presentation_render_theme_studio`) use `visibility: ['app']` correctly | ✅ Verified |
| Phase 7 / 9H gates pass | Scripts exist (`phase7-checks.mjs` ≈700 ln, `phase9h-visual-qa.mjs` ≈1,577 ln) but run **manually only** | ⚠️ Not gated |
| "basic-host manual smoke test" remaining | Still unchecked in `03-migration-plan.md:220` | ⏳ Open item |
| README says console logs "12 tools" | Actual registrations = 14; log line at `index.ts:550` is stale | 🔸 Minor drift |

**Docs debt:** minor. Fix the stale tool count; mark the basic-host checkbox when done.

---

## 3. How MCP Connects to Agent UI / Human UI / Chat UI

### 3.1 The actual topology (verified)

```
                    ┌──────────────────────────────────────────────┐
                    │        SHARED CORE (the good part)           │
                    │  generateAdvancedPresentation()              │
                    │  (LangGraph v2, 8 nodes, DB-tracked runs)    │
                    │  lib/prisma · lib/usage-limit ·              │
                    │  lib/ai-provider (BYOK) · Clerk identity     │
                    └──────────┬───────────────┬───────────────────┘
                               │               │
        ┌──────────────────────┴───┐   ┌───────┴──────────────────────────┐
        │ HUMAN UI (web dashboard) │   │ AGENT UI = MCP HOSTS             │
        │ • Form-driven creation   │   │ ChatGPT / Claude / VS Code       │
        │   (5 modes, RenderPage)  │   │ • 14 tools via /mcp + /api/mcp   │
        │ • SSE progress dialog +  │   │ • OAuth 2.1 / API keys / Clerk   │
        │   1s DB polling          │   │ • 7 in-chat widgets (ui://)      │
        │ • Full slide editor      │   │ • Poll-based progress widget     │
        │ • Theme picker / publish │   │                                  │
        └──────────────────────────┘   └──────────────────────────────────┘
```

Key facts:

- **There is no free-form chat UI in the web app.** Chat is deliberately delegated to MCP hosts. The web dashboard's "conversation" is form-driven (Streamable Slides, Agentic Workflow, Creative AI, Scratch, Template) via `RenderPage.tsx` switching on `usePromptStore.page`.
- **The agent workflow engine is genuinely shared, not duplicated**: `mcp/tools/presentation/generate.ts:92` calls the same `generateAdvancedPresentation()` used by `actions/generatePresentation.ts`. Same run-tracking model (`PresentationGenerationRun`), same usage metering, same BYOK resolution → one user identity across surfaces.
- **Progress delivery differs per surface:** dashboard uses SSE (`/api/generation/stream`) **plus** 1 s DB polling (belt-and-braces in `AgenticWorkflowDialog`); the MCP progress widget polls `presentation_generation_status` with adaptive backoff (3→8 s). Both read the same DB row — consistent by construction.
- **Widgets push context back to the model** via capability-guarded `updateModelContext` (`runtime.ts:124–148`) so follow-up turns stay grounded after theme apply/unpublish/edit — this is the piece that makes the chat UI feel like an app, and it's done right.

### 3.2 Connection-quality gaps

| # | Gap | Where | Impact |
|---|---|---|---|
| C1 | Dashboard runs SSE **and** polling simultaneously — two channels doing one job | `useAgenticGenerationV2.ts` + `AgenticWorkflowDialog.tsx` | Complexity, flaky UX edge cases |
| C2 | SSE fan-out uses an **in-process EventEmitter** — breaks with >1 instance | `lib/streaming/EventEmitter.ts` | Dashboard progress dies behind load balancers |
| C3 | `normalizeSteps` (actions) vs `normalizeGenerationSteps` (mcp/lib) are byte-twins; `getOwnedProject` vs `getOwnedProjectForMcp` likewise | `actions/presentation-generation.ts:12` vs `mcp/lib/presentation-generation-runs.ts:36` | Drift risk between UI and agent views of the same data |
| C4 | Misleading boundary naming: MCP passes `auth.clerkId` into a param called `userId` | `generate.ts:93` | Future auth bugs waiting to happen |
| C5 | No web-side equivalent of the immersive widgets — dashboard editor and in-chat presenter/theme-studio are separate codebases rendering the same slides | `slide-renderer.ts` vs `MasterRecursiveComponent.tsx` | Two renderers to keep visually in sync |

---

## 4. What's Missing or Incomplete

### 4.1 Launch blockers (P0 — must fix before public listing)

| # | Item | Evidence |
|---|---|---|
| B1 | **Merge branch to master & deploy.** All migration work lives unmerged on `migrate/mcp-ext-apps`. | `git branch` |
| B2 | **No CI whatsoever.** No `.github/workflows`; phase7/typecheck/phase9h rely on humans remembering. One bad merge silently breaks conformance. | repo root |
| B3 | **Zero automated tests.** No vitest/jest anywhere; auth/token code — the riskiest logic — has no coverage. Phase7 checks are grep-based (proves wiring, not behavior). | `package.json` scripts |
| B4 | **Session store has no TTL/sweeper.** Abandoned HTTP sessions live forever in the module-level `Map` (`http.ts:39`); multi-instance deployments return misleading "expired session" errors. | `transport/http.ts:39,439–445` |
| B5 | **Rate limiting is per-process memory.** Resets on deploy, unshared across instances; `generationsPerHour` tier config exists but is dead code. | `middleware/rate-limiter.ts:10`, `config/constants.ts:15–17` |
| B6 | **Scope model decorative for first-party callers.** API keys and Clerk sessions silently receive ALL scopes (`getAllMcpOAuthScopes()`); only third-party OAuth clients are constrained. | `auth/clerk-session.ts:50`, `auth/api-key.ts:74` |

### 4.2 Security hardening (P1)

| # | Item | Evidence |
|---|---|---|
| S1 | Refresh-token rotation not transactional + **no reuse detection** (presenting an already-rotated token should revoke the family) | `auth/oauth-tokens.ts:225–238` |
| S2 | `presentation_update_slides` accepts `content: z.any()` — arbitrary payloads accepted server-side (output caps exist, input validation doesn't) | `tools/presentation/schemas.ts:72` |
| S3 | No prompt-injection defenses beyond audit redaction + widget escaping/CSP; model-facing slide text passes through unfiltered | grep "injection" → 0 hits |
| S4 | Auth resolved twice per HTTP tool call (transport guard + tool callback) — duplicate DB lookups per request | `http.ts:160–217` vs `index.ts:283` |
| S5 | `request_id` idempotency logged but not enforced on `presentation_create` ("deferred to Phase 4") | `create.ts:32` |

### 4.3 Scalability gaps (P1)

| # | Item | Evidence |
|---|---|---|
| X1 | Generation runs **inside the HTTP request/server action** (up to 150 recursion steps) instead of the Inngest queue already deployed for mobile-design | `agentic-workflow-v2/index.ts` |
| X2 | Sessions Map, rate-limiter Map, SSE emitter all assume one process — the app cannot scale horizontally today | §4.1 B4/B5, C2 |
| X3 | Widget bundles ~305 KB minified each (SDK+zod baseline) — fine functionally, but 7×~330 KB served per resource read; no caching headers documented for resource reads | `03-migration-plan.md:192–199` |

### 4.4 Hygiene / maintainability (P2)

- **Dead code (~5k lines):** entire `src/agentic-workflow` v1 (0 importers), `genai-pre.ts` (~1,200 commented lines), `useAgenticWorkflowStore` (0 importers), old editor leftsidebar folder, dead exports in `genai.ts` (`generateLayouts*`), demo-workflow page referencing stale step ids.
- **Duplicated logic ×3:** UUID sanitize/populate exists in `genai.ts`, streamable route, and v2 jsonCompiler; two landing-page generations coexist (`landingPage` vs `LandingPageV2` + `/landing-v2` route).
- **Zod schemas declared twice** (inline in `index.ts` registrations AND `schemas.ts`) — currently matching, guaranteed to drift.
- **Checked-in type errors:** `tsc_errors.log` shows real breakage (AI SDK v5→v6 renames in `imageQueryGenerator.ts:92`, mobile-design `maxSteps`) — typecheck is not gating builds.
- Minor: stale "12 tools" log (`index.ts:550`), `verto://presentations` resource is a placeholder stub, folder typo `compontents`, schema column typo `varientId`.

---

## 5. What's Already Industry Grade (keep & protect)

Credit where due — these are better than most production MCP servers:

1. **Spec-correct MCP Apps layer** — official SDK both sides, camelCase CSP, `visibility: ['model','app'] / ['app']`, MIME `text/html;profile=mcp-app`, size-budgeted single-file widgets.
2. **Real OAuth 2.1** — PKCE S256-only with timing-safe compare, hashed opaque tokens, atomic single-use codes, RFC 8707 resource binding, DCR+CIMD, revocation endpoints.
3. **Uniform handler discipline** — ownership check helper on every tool, typed error taxonomy with LLM-facing hints, idempotent mutations, cursor pagination, output caps (40 slides / 200 KB).
4. **Structured audit logging** with secret/user-content redaction and policy flags.
5. **Phase 9H visual QA harness** — Puppeteer matrix over themes×schemes×viewports with WCAG contrast, keyboard-nav, reduced-motion assertions. Rare even at big companies.
6. **Single shared generation spine** across web + MCP (one engine, one run model, one usage meter).

---

## 6. Improvement Plan

### Phase A — Ship what you built (≈1 week)

| Step | Task | Effort |
|---|---|---|
| A1 | Merge `migrate/mcp-ext-apps` → `master`; deploy; verify `/mcp` health in production | 0.5 d |
| A2 | Run the pending **basic-host smoke test** (`07-testing-plan.md §13`); tick the box | 0.5 d |
| A3 | Complete ChatGPT developer-mode + Claude custom-connector live passes; capture screenshots into `submission-assets/` | 2 d |
| A4 | Fix stale bits: "12 tools" log line, `tsc_errors.log` fallout (`maxTokens`→`maxOutputTokens`, `maxSteps`→`stopWhen`), trash-page type error | 1 d |
| A5 | Submit to OpenAI / Anthropic directories using the Phase 8 packet | 1 d |

### Phase B — Industrialize quality gates (≈1–2 weeks)

| Step | Task | Effort |
|---|---|---|
| B1 | Add GitHub Actions: lint + focused-typecheck + `mcp:apps:check` + `mcp:phase7` on every PR; `mcp:phase9h` nightly | 1 d |
| B2 | Introduce vitest. Priority test targets: OAuth token lifecycle (issue/rotate/revoke/reuse), PKCE verify, pagination cursor round-trip, rate limiter windows, `update_slides` schema rejection paths | 3–4 d |
| B3 | Add an in-memory-transport integration test that exercises each tool end-to-end with a fake AuthContext (extends the smoke test already proven in migration) | 2 d |
| B4 | Make full-repo typecheck blocking; delete `tsc_errors.log` workflow of record | 0.5 d |

### Phase C — Scale & harden (≈2–3 weeks)

| Step | Task | Effort |
|---|---|---|
| C1 | Move generation to **Inngest** (infrastructure already exists for mobile-design): enqueue run, stream progress from worker; keeps SSE/polling contracts unchanged | 3 d |
| C2 | Externalize state: Redis-backed rate limiter + session registry (or sticky-session-safe signed session state); add session TTL sweeper regardless | 2–3 d |
| C3 | Transactional refresh rotation + reuse detection (revoke token family on rotated-token replay) | 1 d |
| C4 | Replace `z.any()` on `update_slides.content` with a real slide-content zod schema (reuse the renderer's shape); add per-request input byte cap | 1–2 d |
| C5 | Scope API keys minimally at creation UI (read-only default, explicit write grants); keep Clerk sessions broad internally if desired | 1 d |
| C6 | Single auth resolution per request (pass AuthContext through transport → tool args) | 0.5 d |
| C7 | Implement `request_id` dedup on create (short-TTL unique index) | 0.5 d |

### Phase D — Deepen the UI story (≈2 weeks, differentiating)

| Step | Task | Effort |
|---|---|---|
| D1 | Extract a **shared slide-renderer core** so dashboard editor and widgets render from one source (today: vanilla `slide-renderer.ts` vs React `MasterRecursiveComponent`) | 3–4 d |
| D2 | Collapse dashboard dual-channel progress to SSE-first with polling fallback only | 1 d |
| D3 | Extract transport-neutral `core/` services (ownership check, step normalization, project mapping) to kill the actions↔mcp twins (C3) | 2 d |
| D4 | Widget enhancement backlog from docs' own "out of scope" list: `ontoolinputpartial` streaming for generation, host-theme reactivity audit, React port via `useApp` when adding widget #8+ | 2–3 d |
| D5 | Delete dead weight: agentic-workflow v1, `genai-pre.ts`, unused store, old leftsidebar, second landing generation | 0.5 d |

---

## 7. Quick Wins (do this week)

1. Merge the branch (B1) — everything else assumes it.
2. Add the GitHub Actions workflow running existing `npm run mcp:phase7` (B1-lite) — 1 hour, permanent protection.
3. Fix the stale "12 tools" log and the two AI-SDK rename errors — hours.
4. Add TTL sweeper to the sessions Map — ~20 lines, removes the worst leak.
5. Replace `z.any()` with a minimal slide schema even if permissive — stops the widest open door.

> **Update (2026-08-24):** Phase D is now implemented — see
> [`13-phase-d-deep-dive-plan.md`](./13-phase-d-deep-dive-plan.md) status header.
> Highlights: dead v1 stack deleted (~5k lines, full typecheck now clean),
> transport-neutral `src/core/` layer extracted, SSE progress made authoritative
> **and authenticated** (the previously unauthenticated stream route now enforces
> Clerk session + ownership), one canonical slide-render kernel shared by widgets
> and dashboard preview surfaces (fixes the 6 dropped content types in
> present/share), and `ontoolinputpartial` + host-context APIs exposed in the
> runtime facade. Gates: phase7 360/360 · phase9h passed · next build green.

---

## 8. Scorecard Summary

| Area | Score | Comment |
|---|---|---|
| Feature completeness vs docs | 9/10 | Everything claimed exists; only basic-host smoke test outstanding |
| Protocol correctness | 9/10 | SDK-native, spec-clean, verified |
| Security design | 7/10 | Strong OAuth core; scope decoration, rotation edge cases, z.any() hold it back |
| Testing | 3/10 | Great bespoke QA scripts, zero unit/integration tests |
| CI/CD | 1/10 | Nothing automated |
| Scalability | 4/10 | Single-process assumptions throughout; Inngest underused |
| Maintainability | 6/10 | Clean MCP layer; dead v1 stack + twins drag the score |
| Documentation | 10/10 | Matches reality — exemplary |

**Bottom line:** You have a submission-ready, spec-compliant MCP Apps product with best-in-class docs and QA tooling. To be genuinely industry grade, invest next in CI + tests (Phase B) and horizontal-scale state (Phase C) — the features themselves need very little.
