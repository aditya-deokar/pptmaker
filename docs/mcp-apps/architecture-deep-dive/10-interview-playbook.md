# 10 — Interview Playbook

> Part of the [architecture deep dive](./README.md). How to talk about this
> system: pitches, walkthrough scripts, a Q&A bank keyed to the docs, and
> numbers worth memorizing.

---

## 1. Elevator pitches (pick by audience)

**30-second version.**
"I built Verto AI's MCP server and its in-chat UI: 14 presentation tools over
Streamable HTTP with a self-hosted OAuth 2.1 stack — PKCE, DCR, refresh
rotation — plus seven interactive widgets that render as sandboxed iframes in
ChatGPT/Claude via the MCP Apps standard. One LangGraph generation engine and
one slide-render kernel serve both the web dashboard and the widgets, so every
surface renders decks identically."

**Staff-level version (adds judgment).**
"The interesting problems weren't features — they were boundaries. I kept one
identity spine so dashboard cookies, API keys, and directory-issued OAuth
tokens resolve to the same user; extracted a transport-neutral core after the
actions/MCP layers grew twins; made widget progress poll-by-design because host
capabilities are heterogeneous while the dashboard streams because we own both
ends; and converted quality claims into hard gates — byte budgets on bundles,
360 contract pins, a Puppeteer contrast/a11y matrix across 65 themes. I can
also tell you exactly what breaks at instance two and the order I'd fix it."

## 2. The 5-minute whiteboard walkthrough

Follow this arc (draw as you go):

1. **Frame**: one Next.js deployable = web app + MCP server + OAuth server + widget resource server. Draw the box.
2. **Protocol path**: initialize → session id → tools/list (with `_meta.ui` bindings) → tools/call. Show middleware chain: auth → scopes → rate limit → ownership → envelope.
3. **The Apps magic**: tool declares `ui.resourceUri` → host iframes single-file HTML → SDK `App` class postMessage bridge → widget calls tools itself (`['model','app']`) or never bothers the model (`['app']`).
4. **Generation**: tool returns RUNNING + resource URI at timeout instead of hanging; DB-backed run row is the shared truth; dashboard SSE-first w/ fallback, widgets adaptive-backoff polling.
5. **Shared kernel**: same renderer for editor preview, present/share, and widgets — found because dashboard silently dropped 6 content types the widgets handled.
6. **Close with trade-offs**: in-request generation + in-process state = deliberate launch debt with a pre-cut queue/Redis migration path.

## 3. Q&A bank

### Architecture & boundaries

**Q: Why is there no chat UI in your web app?**
Deliberate product boundary: conversation lives where models live (hosts).
Dashboard covers structured input with five creation modes. Benefit: no prompt
plumbing/state sync/moderation surface duplicated; cost: brand presence in
conversation is mediated by our widgets, which is why they got the investment.

**Q: How do three credential types coexist?**
One Prisma User keyed by clerkId; middleware resolves bearer→OAuth/API-key,
else Clerk cookie, into one AuthContext. Handlers never see credentials.

**Q: What does `_meta.ui.visibility` buy you?**
Mechanical, host-enforced interaction classes: model-only for destructive
mutations; model+app for user-clickable everyday actions (zero model
latency/tokens); app-only for view swaps that must never enter context.

**Q: Why opaque tokens instead of JWTs?**
We're simultaneously authorization *and* resource server — revocation-as-row-
state beats distributed key rotation; nothing sensitive rides in tokens;
DB hit per call is acceptable and collapsible.

### Reliability & scale

**Q: What happens when a generation takes 90 seconds?**
Tool races engine vs wait window (≤120 s), returns RUNNING + runId +
progress_resource_uri + explicit "don't duplicate" hints. Model polls status;
widget auto-polls with backoff. Timeout became protocol, not error.

**Q: What breaks at two instances? Name the first three.**
SSE fan-out (in-process emitter), MCP sessions (Map without TTL/stickiness),
rate-limit buckets (per-instance). Then thread occupancy from in-request
generation under load. Each has an interface seam cut for Redis/queue swap.

**Q: Walk me through making SSE multi-instance safe.**
Keep emitter API; add Redis pub/sub adapter for fan-out + stream/history for
replay (seq numbers already exist); sessions get Redis store with TTL sweeper;
then move engine behind Inngest so worker emits where it runs. Client contract
unchanged by design.

### Security

**Q: How do you stop a widget from touching another user's deck?**
Ownership inside every handler (`findOwnedProject(id, ctx.userId)`); not-found
== not-yours; widget clicks ride the same authenticated pipeline as models.

**Q: Slide content is untrusted — XSS story?**
Everything HTML-escaped in the kernel; no inline handlers; sandboxed opaque
origin iframes; CSP empty except allowlisted image hosts on slide-rendering
widgets; clipboard permission scoped to publish card only.

**Q: Where's your auth weakest? Be honest.**
First-party callers receive all scopes today (only third-party clients scoped);
refresh rotation commits new pair before revoking old outside a transaction,
and rotated-token replay lacks family revocation. All three are ticketed with
designs (C3/C5).

### Engineering craft

**Q: Testing strategy for a visual, protocol-heavy surface?**
Three layers: artifact hermeticity (regenerate-and-compare + byte budgets),
360 static pins as executable spec (wiring, metadata, visibility classes),
Puppeteer harness rendering real bundles with in-page contrast/keyboard/label/
overflow batteries across 33 scenarios incl. themes×schemes matrix. Unit-test
backlog prioritized for pure logic: token lifecycle, PKCE verify, cursors,
limiter windows.

**Q: A decision you reversed?**
Progress architecture: dashboard ran SSE *and* 1s-polling concurrently doing
overlapping jobs; I collapsed to SSE-authoritative-with-fallback — and fixed
the stream route's missing auth in the same change, since promoting a channel
without securing it would ship the refactor around the hole.

**Q: Most subtle bug you found during audit?**
Dashboard present/share silently rendered blank slides for six legal content
types (`multiColumn`, `imageAndText`, tables aliases, link, customButton) —
the React switch's default case returned null. The widget renderer already
handled them; adopting it as the canonical kernel turned the fix into an
invariant (coverage gate parses types.ts against the registry).

**Q: Bundle size — why do you accept ~340 KB widgets?**
Portability tax: each bundle embeds the SDK+zod (~305 KB) so any MCP Apps host
runs it without forks. Budgets (384–512 KB per class) make creep red/green;
vanilla-over-React and tree-shaken theme catalog were direct consequences.

## 4. Numbers cheat sheet

| Say | Value |
|---|---|
| Tools / widgets | 14 / 7 |
| Visibility split | 2 app-only · 8 model+app · 4 model-only |
| Protocol | Streamable HTTP @ 2025-03-26; stdio for dev |
| Token TTLs | access 1 h · refresh 30 d · code 10 min |
| Body caps | 10 MB · JSON depth 20 |
| Output caps | 40 slides / 200 KB tool-side · 50 slides payload-side |
| Generation | 8-node graph · wait 25 s default / 120 max · poll backoff 3→8 s |
| QA | 360 pins · focused tsc · Puppeteer 33 scenarios · 14-cell theme×scheme matrix |
| Bundles | 341–411 KB measured · budgets 384–512 KB |
| Catalog | 65 themes, codegen-shared |

## 5. Trap questions & deflections

**"Why not just use OpenAI's Apps SDK?"**
We did originally — then migrated to the standardized `ext-apps` so identical
bundles serve ChatGPT, Claude, VS Code, and basic-host. Migration deleted every
`openai/*` metadata key and the hand-rolled postMessage bridge; phase pins were
rewritten to enforce the spec-native shape.

**"Why build OAuth yourself? Use Clerk."**
Clerk authenticates humans on our site; directory apps need consent flows
issuing resource-bound, MCP-scoped tokens with DCR — different problem. Our
server is ~1.3k focused lines conforming to the exact RFCs reviewers probe.

**"Isn't grep-based testing fragile?"**
It proves wiring, not logic — which is its job: contracts and file topology as
an executable spec. Behavior lives in the Puppeteer battery; pure logic is the
documented vitest backlog. Fragility argument cuts the other way: pins failed
loudly during the SDK migration exactly as intended.

**"What would you redesign first?"**
Queue the engine (ADR-6). It's the only component whose correctness depends on
process lifetime; everything else already externalizes cleanly.

---

*Cross-references: [01](./01-system-architecture.md) system map ·
[03](./03-auth-security.md) security detail · [05](./05-generation-pipeline.md)
generation · [08](./08-decisions-and-tradeoffs.md) ADRs ·
[09](./09-scaling-limits-roadmap.md) scaling.*
