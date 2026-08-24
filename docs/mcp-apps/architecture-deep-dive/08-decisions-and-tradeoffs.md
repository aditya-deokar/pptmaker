# 08 — Engineering Decisions & Trade-offs (ADR Catalog)

> Part of the [architecture deep dive](./README.md). Every major decision in
> Context → Options → Decision → Consequences form. Widget-client decisions
> already recorded in
> [`11-immersive §10`](../11-immersive-widgets-architecture.md) are summarized,
> not repeated.

Format note: these are written the way you'd tell them in a staff-engineer
interview — including what we'd do differently.

---

## ADR-1 — Ship MCP as part of the Next.js app

**Context:** MCP endpoints need auth identity, DB access, and business logic
identical to the dashboard's.
**Options:** (a) separate Node service; (b) same Next.js deployable via route handlers.
**Decision:** (b).
**Consequences:** + zero identity/ORM duplication, one deploy, stdio reuses handlers.
− protocol availability couples to web deploys; serverless session affinity issues surface early (which we treat as honest signal, see 09).

## ADR-2 — Opaque hashed tokens over JWTs for OAuth

**Options:** short-JWT with JWKS; opaque random + introspection-at-read.
**Decision:** opaque (`vto_at_`/`vto_rt_`), SHA-256 at rest.
**Why:** revocation becomes trivial (row state), no key distribution to
resource servers (we *are* the resource server), no claims leakage in logs.
**Cost:** a DB hit per call — acceptable; double-resolution collapse is Phase C7.

## ADR-3 — Self-hosted OAuth authorization server

**Context:** app-directory listings demand real user consent flows scoped to this resource.
**Options:** Clerk-only sessions; third-party Auth0/FusionAuth; self-hosted minimal OAuth 2.1.
**Decision:** self-hosted (~1.3k lines across `auth/oauth-*` + routes).
**Consequences:** + exact RFC conformance where reviewers look (PKCE S256, resource binding, DCR/CIMD, revocation); − we own rotation edge cases (documented gaps: non-transactional rotation commit, no reuse-detection → Phase C3). Would choose again; would write the rotation test first.

## ADR-4 — Visibility classes as the permission UX

`['model']` / `['model','app']` / `['app']` map to "model-only", "user-click",
"never-in-context". **Alternative:** one flat tool list + prompt discipline.
**Decision:** spec-native visibility. **Why:** it encodes product intent into
protocol metadata that hosts honor mechanically. **Cost:** phase7 must pin all
14 classifications (it does) because a flipped flag silently changes UX/security posture.

## ADR-5 — Widgets poll; dashboard streams

Same engine events, two transports chosen per surface constraints (host heterogeneity vs owned ends). Full rationale in [05 §5](./05-generation-pipeline.md). **Trade-off accepted:** widget freshness lags seconds behind dashboard during generation; mitigated by adaptive backoff tuned so typical 20–60 s runs complete within 2–4 polls.

## ADR-6 — Generation runs in-request (today)

**Options:** queue now (Inngest exists for mobile-design); in-request with timeout→RUNNING.
**Decision:** in-request + RUNNING protocol pattern.
**Why:** ships the directory-blocking features without ops overhead; RUNNING+poll is protocol-correct regardless of execution backend.
**Debt:** request-thread occupancy up to ~150 LLM steps; multi-instance SSE breaks. Queue migration path pre-cut ([09](./09-scaling-limits-roadmap.md)). If asked "biggest thing you'd change": this.

## ADR-7 — Slides as JSON on Project (no Slide table)

Recursive ContentItem trees stored verbatim. **Alternatives:** normalized Slide/Component tables.
**Why JSON:** templates byte-identical with projects; full-deck replacement atomic; schema evolution = read-time normalization (normalizeSteps pattern applied to steps; slide shapes validated at boundaries).
**Cost:** no row-level queries over slides; acceptable — access is always whole-deck.

## ADR-8 — Full-replacement slide saves + fetch-before-patch

One write contract (`update_slides`) instead of patch endpoints. Concurrency safety from fetch-fresh-tree → deep-clone patch → replace. **Alternative rejected:** diff endpoint — new server surface, conflict semantics unclear, and the editor mediates every call anyway.

## ADR-9 — Vanilla widgets; React stays out of iframes

Bundle math: SDK ≈305 KB baseline; React adds ~45 KB+ with zero capability gain for these UIs. Renderer mirrors dashboard semantics instead. React allowed for widget #8+ under explicit budget-line justification (policy in README). See also [11 §10 #1](../11-immersive-widgets-architecture.md).

## ADR-10 — Single-file HTML resources, not CDN

Spec-preferred; host-cached; empty-CSP valid; identical behavior everywhere.
**Cost:** ~340 KB per resource read (hosts cache; acceptable), and every bundle re-ships SDK — the price of portability, paid knowingly.

## ADR-11 — Static pins (360) as executable spec, unit tests later

Grep-level assertions pin contracts/features/docs wiring; Puppeteer harness covers behavior/a11y. **Honest framing:** pins prove *wiring*, not logic — auth math and lifecycle transitions remain untested until vitest lands (Phase B2 priority list written: token lifecycle, PKCE verify, cursor round-trip, rate windows). Chosen because a fast-moving UI surface needed a regression tripwire that fails loudly with file:line context, and pins double as documentation.

## ADR-12 — One shared render kernel instead of three renderers

Discovery that forced D1: dashboard preview surfaces silently dropped 6 legal content types while the widget renderer handled them. Kernel = framework-free registry consumed by esbuild bundles AND React wrapper. Editing remains React. Coverage gate added so drift can't recur.

## ADR-13 — `core/` extraction by strangler, not big-bang

Moved MCP-side implementations (already userId-parametric, race-safer) into core; repointed actions as envelope-wrappers; mcp libs became re-export shims. Zero call-site churn outside actions/mcp. **Lesson:** extract toward the stricter implementation, never the looser one.

## ADR-14 — SSE made authoritative *and* authenticated together (D2)

The stream route previously had zero auth — any runId leaked tokens. Fixed in the same PR that made SSE primary: ownership check before subscribe, hydration snapshot from DB, seq-resume, backoff-with-terminal-codes client. **Principle:** when refactoring a channel's role, fix its security model simultaneously or you'll ship the refactor around the hole.

## ADR-15 — Chat delegated to hosts; no free-form chat UI in the web app

Product-level ADR. The dashboard's five form-driven create-modes cover structured input; conversation lives where models live (ChatGPT/Claude). **Benefit:** no prompt-plumbing, no chat state sync, no second moderation surface. **Risk accepted:** Verto's brand presence inside conversations is mediated entirely by host UX + our widgets — which is precisely why the widget layer got Plan-10 investment.

## ADR-16 — Budgets & pins over review-time vigilance

Every soft quality claim got a hard gate: byte budgets (build fail), artifact freshness (--check), contract coherence (360 pins), visual/a11y (Puppeteer matrix), focused typecheck. **Philosophy:** an experienced team doesn't remember constraints; it compiles them into red/green.

---

### Trade-off summary table (rapid recall)

| Decision | Gave up | Got |
|---|---|---|
| Same-deployable MCP | independent scaling | zero duplication |
| Opaque tokens | stateless authz | instant revocation |
| Self-hosted OAuth | vendor offload | exact conformance control |
| In-request generation | thread freedom | shipped fast; protocol unchanged later |
| Polling widgets | push latency | universal host support |
| JSON slides | queryability | atomicity + template parity |
| Static pins | behavioral proof (partial) | executable spec + loud failures |
| Vanilla widgets | DX familiarity | 7 widgets inside budgets |

Continue to [09 — Scaling limits & roadmap](./09-scaling-limits-roadmap.md).
