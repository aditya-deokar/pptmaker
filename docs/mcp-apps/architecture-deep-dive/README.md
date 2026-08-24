# Verto AI MCP Apps — Architecture Deep Dive

> A complete, interview-ready explanation of how the Verto AI MCP server and
> its in-chat UI (MCP Apps) actually work — transport, auth, tools, generation,
> widgets, shared kernel, scaling limits, and every engineering decision behind
> them. Every claim maps to real code on branch `migrate/mcp-ext-apps`.

Last updated: 2026-08-24

---

## Why this folder exists

[`11-immersive-widgets-architecture.md`](../11-immersive-widgets-architecture.md)
explains the **widget client layer** in depth (skin engine, renderer, editor,
QA harness). This series zooms out to the **whole system**: what happens
between a user typing *"make me a 10-slide pitch deck"* in ChatGPT and seeing
a themed, presentable deck — plus the parts no widget doc covers: the OAuth
server we run ourselves, the Streamable HTTP session layer, the LangGraph
generation pipeline, the shared `core/` service layer, and the honest list of
things that break at scale.

## Reading order

| # | Document | One-line summary |
|---|---|---|
| 1 | [`01-system-architecture.md`](./01-system-architecture.md) | Bird's-eye view: components, layers, end-to-end request lifecycle |
| 2 | [`02-transport-and-sessions.md`](./02-transport-and-sessions.md) | Streamable HTTP transport, session lifecycle, hardening, stdio vs HTTP |
| 3 | [`03-auth-security.md`](./03-auth-security.md) | One identity spine; self-hosted OAuth 2.1 (PKCE/DCR/CIMD), API keys, scopes, audit |
| 4 | [`04-tool-pipeline.md`](./04-tool-pipeline.md) | How a tool call flows: registration → middleware → handler → envelope |
| 5 | [`05-generation-pipeline.md`](./05-generation-pipeline.md) | The LangGraph v2 engine, run state machine, progress delivery per surface |
| 6 | [`06-widget-system.md`](./06-widget-system.md) | MCP Apps model condensed: iframes, `ui://` resources, visibility classes, CSP |
| 7 | [`07-shared-kernel-data-layer.md`](./07-shared-kernel-data-layer.md) | `core/` services, the render kernel shared by dashboard + widgets, payload contracts |
| 8 | [`08-decisions-and-tradeoffs.md`](./08-decisions-and-tradeoffs.md) | ADR catalog: context → options → decision → consequences for ~16 choices |
| 9 | [`09-scaling-limits-roadmap.md`](./09-scaling-limits-roadmap.md) | What breaks beyond one process, and the concrete migration path |
| 10 | [`10-interview-playbook.md`](./10-interview-playbook.md) | Elevator pitch, walkthrough script, Q&A bank, metrics cheat sheet |

## The whole system in one picture

```
                        ┌─────────────────────────────────────────────┐
                        │        MCP HOSTS (the "agent UI")           │
                        │  ChatGPT · Claude · VS Code · basic-host    │
                        │                                             │
                        │  LLM turn ──tools/call──►  widget iframes   │
                        │      ▲                     (ui:// resources)│
                        │      └── updateModelContext ──────────────┐ │
                        └──────────────────┬────────────────────────┼─┘
                                           │ JSON-RPC               │ JSON-RPC
                                           ▼ (Streamable HTTP)      │
┌──────────────────────────────────────────────────────────────────┼──────────────┐
│ VERTO SERVER (Next.js 16, single deployable)                     │              │
│                                                                  │              │
│  /mcp  /api/mcp          src/mcp/transport/http.ts               │              │
│    ├ sessions Map, origin allowlist, body caps, scope guards     │              │
│    ├ auth: OAuth 2.1 bearer │ API key │ Clerk cookie  ◄──────────┘              │
│    │     src/mcp/auth/*  (+ /oauth/{authorize,token,revoke,register})           │
│    ├ 14 tools  src/mcp/tools/presentation/*   (registerAppTool)                 │
│    │     middleware: rate-limit → policy → error boundary → handler             │
│    ├ 7 ui:// resources + data resources  src/mcp/resources/*                    │
│    │                                                                             │
│  Dashboard ("human UI")  src/app/(protected)/**  ── server actions ──┐          │
│    chat-less by design: forms → engine; SSE+fallback progress        │          │
│                                                                      ▼          │
│                          SHARED CORE (Phase D3)   src/core/**                  │
│                            ownership · run lifecycle · step snapshots          │
│                                      │                                         │
│            GENERATION ENGINE (LangGraph v2)  src/agentic-workflow-v2/**        │
│              8 nodes · DB-tracked runs · SSE emitter · BYOK models             │
│                                      │                                         │
│                          Prisma + Postgres  (User, Project, Run, OAuth tables) │
└────────────────────────────────────────────────────────────────────────────────┘
```

**The three UIs, one sentence each**

- **Agent UI** = MCP hosts driving the 14 tools, rendering the 7 widgets.
- **Human UI** = the Next.js dashboard (forms → engine → full slide editor).
- **Chat UI** does not exist as web code — conversation is delegated to hosts;
  the dashboard's "conversation" is form-driven creation modes with live
  progress. This was a deliberate product decision (see [08](./08-decisions-and-tradeoffs.md)).

## Glossary (terms used across all docs)

| Term | Meaning |
|---|---|
| **Host** | An app that connects an MCP server and can render MCP Apps UI (ChatGPT, Claude…) |
| **MCP Apps** | Spec extension: tools bind `_meta.ui.resourceUri` → sandboxed iframe HTML served from `ui://` resources |
| **Visibility class** | `_meta.ui.visibility` array: model-only vs model+app vs app-only — who may invoke a tool |
| **Widget** | One single-file HTML bundle (IIFE) rendered in a host iframe, speaking JSON-RPC over postMessage via the SDK `App` class |
| **Run** | `PresentationGenerationRun` DB row tracking an async generation (status/steps/progress) |
| **Kernel** | `src/lib/slides/render-core` — the one ContentItem→HTML renderer used by widgets *and* dashboard preview surfaces |
| **BYOK** | Bring-your-own-key: user-supplied Gemini/OpenAI/Groq keys (AES-GCM encrypted) resolved before platform defaults |

## Ground-truth numbers (as of this writing)

| Metric | Value |
|---|---|
| Tools registered | 14 (`registerAppTool`; 2 app-only, 8 app-callable, 4 model-only) |
| Widgets shipped | 7 single-file bundles (341–411 KB measured; budgets 384–512 KB) |
| Static QA pins | 360 assertions (`mcp:phase7`) + focused typecheck |
| Visual QA scenarios | 33 Puppeteer states incl. 14-cell theme×scheme matrix |
| Themes in catalog | 65 (codegen'd from dashboard constants into `themes-data.ts`) |
| Generation graph | 8 nodes, layout-before-content ordering, ≤150 recursion steps |
| Protocol version pinned | `2025-03-26` (config/constants.ts) |
