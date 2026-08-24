# Verto AI MCP Apps: Beginner Overview

Last updated: 2026-06-17

This folder explains how to turn the existing Verto AI MCP server into a public ChatGPT app and Claude connector/app.

In plain English: MCP is a standard way for AI apps like ChatGPT and Claude to safely call tools from another product. Verto already has MCP tools for presentations. The remaining work is to make those tools publishable, add proper OAuth login, add optional interactive UI widgets, test with real ChatGPT and Claude clients, then submit to each app directory.

## The Short Answer

Yes, this is possible.

For ChatGPT, Verto AI needs to be submitted as a ChatGPT App through OpenAI's Apps SDK/app submission flow. Users will not download a Windows/Mac app. They will install or connect Verto AI from ChatGPT's Apps and Connectors area, authorize their Verto account, then use Verto tools in a chat.

For Claude, Verto AI needs to be submitted to the Claude Connectors Directory as a remote MCP server. Claude also supports custom connector testing before directory approval.

Both platforms can use the same core MCP server if we follow the portable MCP Apps standard and only add ChatGPT-specific or Claude-specific behavior when necessary.

## What Already Exists In This Repo

Current MCP code:

- HTTP MCP endpoint: `src/app/api/mcp/route.ts`
- Streamable HTTP transport: `src/mcp/transport/http.ts`
- Local stdio transport: `src/mcp/transport/stdio.ts`
- Server factory and instructions: `src/mcp/server.ts`
- Tool registry: `src/mcp/tools/registry.ts`
- Presentation tools: `src/mcp/tools/presentation/index.ts`
- Resource registry: `src/mcp/resources/registry.ts`
- API key auth: `src/mcp/auth/api-key.ts`
- Public protected-resource metadata rewrite: `src/proxy.ts`
- Current MCP user guide: `docs/mcp/04-usage-guide.md`

Legacy public endpoint:

```text
https://verto.ai.aditya-deokar.me/api/mcp
```

Primary production endpoint for app-directory submission:

```text
https://verto.ai.aditya-deokar.me/mcp
```

Keep `/api/mcp` working for backwards compatibility, but add `/mcp` as the clean public connector URL.

## Current Launch Blockers

These are the biggest gaps before Verto AI can be listed publicly.

| Blocker | Why it matters | Current repo status | Required result |
| --- | --- | --- | --- |
| OAuth 2.1 user auth | Public ChatGPT and Claude listings need a real user authorization flow for private user data and write actions. | Implemented in Phase 3 with first-party OAuth, Clerk login, opaque tokens, PKCE, DCR/CIMD, revoke, and scope checks. | Validate live in ChatGPT developer mode and Claude custom connector. |
| Tool annotations | Reviewers require tools to declare whether they read, write, or destroy data. | Implemented with `registerTool(...)` metadata in Phase 2. | Keep the tool review matrix aligned with code before submission. |
| Interactive MCP Apps UI | ChatGPT Apps and Claude MCP Apps can render interactive UI in chat. This is the app-like experience. | Started in Phase 4 with static `ui://` generation progress and deck preview resources. | Validate rendering in ChatGPT/Claude, then add richer widgets if needed. |
| Submission assets | App directories need logo, description, screenshots, privacy policy, support contact, and test prompts. | Product docs exist, but no dedicated app submission packet. | Prepare final metadata and reviewer test account. |
| Review-grade safety | App stores reject vague tools, prompt-injection patterns, broken tools, or risky destructive actions. | Tool descriptions are decent but need review annotations and tighter policy checks. | Pass MCP Inspector, ChatGPT developer mode, Claude custom connector, and review checklist. |

## Final User Experience

### ChatGPT User Flow

1. User opens ChatGPT.
2. User goes to Apps/Connectors and searches for "Verto AI".
3. User clicks Connect or Install.
4. ChatGPT opens Verto's OAuth login/consent page.
5. User signs in to Verto and grants access.
6. User starts a chat and enables Verto AI from the app/tool picker.
7. User asks: "Create a 10 slide pitch deck for my AI tutoring startup."
8. ChatGPT calls Verto's `presentation_generate` tool.
9. Verto returns a generated presentation, share link, and optionally an embedded deck preview/progress UI.
10. User can ask follow-ups like "change the theme", "publish this", or "make slide 3 more visual."

### Claude User Flow

1. User opens Claude.
2. User goes to Connectors Directory and searches for "Verto AI".
3. User clicks Connect.
4. Claude opens Verto's OAuth login/consent page.
5. User signs in and grants access.
6. User asks Claude to create, read, edit, publish, or summarize Verto presentations.
7. If we add MCP Apps UI, Claude can show interactive deck previews and forms inside chat.

### Pre-Approval Testing Flow

Before public listing, both products let us test privately.

ChatGPT:

- Enable developer mode.
- Create a connector pointing at the public MCP endpoint.
- Test tools and UI in a normal ChatGPT conversation.

Claude:

- Add a custom connector in Settings > Connectors.
- Or share a custom connector install link with the Verto MCP URL prefilled.
- Test the same runtime used by directory connectors.

## Documentation In This Folder

| File | Purpose |
| --- | --- |
| `01-product-requirements.md` | Product requirement document: users, goals, features, launch criteria, metrics, risks. |
| `02-technical-implementation.md` | Architecture and implementation guide tied to the current repo. |
| `03-publishing-and-setup-checklist.md` | Step-by-step ChatGPT and Claude setup, credentials, testing, and submission checklist. |
| `legacy/04-research-notes-and-sources.md` | **Archived.** Research summary with source links used to build the original plan (predates the ext-apps migration). |
| `05-tool-review-matrix.md` | Tool titles, review annotations, and safety notes for app submission. |
| `06-security-privacy-observability.md` | Phase 6 hardening notes, ownership matrix, prompt-injection tests, and validation checklist. |
| `07-testing-plan.md` | Phase 7 automated checks, MCP Inspector steps, ChatGPT developer mode steps, Claude custom connector steps, and reviewer prompt matrix. |
| `08-product-submission-packet.md` | Phase 8 app listing copy, reviewer instructions, data handling answers, screenshot plan, help article drafts, and owner submission steps. |
| `legacy/09-premium-mcp-apps-ui-plan.md` | **Archived.** Phase 9 plan for making Verto's ChatGPT MCP Apps UI render reliably, then upgrading it into a premium in-chat presentation experience (superseded by the ext-apps migration). |
| `09h-visual-qa-evidence.md` | Phase 9H automated visual QA command plus exact ChatGPT prompts, widget button actions, accessibility checks, and screenshot evidence checklist. |
| `10-in-chat-verto-experience-plan.md` | Phase 10 upgrade plan: real themed slide rendering, in-chat presenter mode, theme studio, live generation, and model-context sync — bringing the full dashboard experience into any MCP Apps host. |
| `11-immersive-widgets-architecture.md` | Architecture deep-dive for the Plan 10 immersive widget layer (layers, data flows, decisions). |
| `12-mcp-apps-audit-report.md` | Full audit of the MCP Apps feature vs. actual code: consistency check, UI-connection analysis, missing pieces, and a phased improvement plan (A–D) with quick wins. |
| `13-phase-d-deep-dive-plan.md` | Implementation-ready deep dive for Phase D (UI story): shared render kernel, SSE-first progress, `core/` service extraction, widget enhancement backlog, dead-code deletion — with verified file:line evidence, execution order (D5→D3→D2→D1→D4), gates, and risk table. |
| `architecture-deep-dive/` | **Full system architecture series** (interview-grade): 10 documents with Mermaid flowcharts/sequence/state diagrams covering transport & sessions, OAuth security model, tool pipeline, generation engine, widget system, shared kernel, ADR trade-off catalog, scaling limits, and an interview playbook. Start at its `README.md`. |
| `submission-assets/` | Place final icons, screenshots, and evidence files here before app review. |

## Widget Layer: MCP Apps SDK Migration (2026-08)

The interactive widget layer now uses the standardized MCP Apps SDK
(`@modelcontextprotocol/ext-apps`) instead of OpenAI-specific metadata and a
hand-rolled postMessage bridge, so the same widgets render in ChatGPT, Claude,
VS Code, Goose, and any other compliant host:

- Tools register through `registerAppTool()`; UI resources through
  `registerAppResource()` (`src/mcp/tools/presentation/index.ts`,
  `src/mcp/resources/app-ui.ts`). All legacy `openai/*` metadata keys are gone.
- Widgets run on the SDK `App` client (`src/mcp/apps/components/shared/runtime.ts`);
  tool data arrives via `ontoolresult`, widget actions call tools through
  `app.callServerTool()`.
- The canonical slide renderer lives in `src/lib/slides/render-core/`
  (Phase D1) and is shared by the widget bundles AND the dashboard's preview
  surfaces via `src/lib/slides/SlideCanvas.tsx`.
- Migration analysis, API mapping, and phase-by-phase plan:
  `00-migration-overview.md`, `01-current-architecture.md`, `02-api-mapping.md`,
  `03-migration-plan.md` in this folder.
- Automated evidence: Phase 7 checks and Phase 9H visual QA both pass on
  the migrated stack; see `07-testing-plan.md` for live-host steps.

### Widget technology policy (Phase D4)

New widgets default to **vanilla TS + the shared runtime facade**. The React
subpath (`@modelcontextprotocol/ext-apps/react`: `useApp`, `useAutoResize`,
`useDocumentTheme`, `useHostStyles`) may be used only when a widget needs
complex local state or animations that outweigh ~50 KB of extra bundle size,
and only if its byte-budget line in `scripts/mcp-apps/build-widgets.mjs` is
raised explicitly with a comment explaining why. Existing seven widgets stay
vanilla: each bundle already carries a ~305 KB SDK+zod baseline, and React adds
no functional capability for them.

## The Immersive In-Chat Experience (Plan 10 — shipped)

The successor plan [`10-in-chat-verto-experience-plan.md`](./10-in-chat-verto-experience-plan.md)
closed the gap between chat widgets and the real dashboard. All phases
(10A–10H) are delivered. Architecture deep-dive (layers, data flows,
decisions): [`11-immersive-widgets-architecture.md`](./11-immersive-widgets-architecture.md).

| Area | What ships in-chat |
| --- | --- |
| Verto skin + theme engine | Every widget paints with the deck's actual theme (`--vt-*` tokens from a generated 65-theme catalog), host light/dark + fonts adopted |
| Real slides | Faithful vanilla renderer for ~95% of generated content types (stats, timelines, callouts, tables, columns, images) |
| `deck_live` presenter | Fullscreen presenting with keyboard nav, grid overview, progress bar, safe-area insets; inline fallback |
| Theme studio | Browse/search/filter all 65 themes visually, apply live via `presentation_update_theme`, model-context push |
| Publish card | Celebration moment, share URL + copy, in-widget QR code, unpublish/re-publish loop |
| Live generation | Auto-polling with countdown ring and adaptive backoff, real run-step timeline, elapsed/ETA chips, inline first-slide preview on completion |
| Guided slide edits | Single-slide text editing with themed fields, full-replacement save, diff confirmation strip, undo chip |
| Adaptive layout | Mobile/touch hit-target ≥44px, bottom-sheet action rows, PiP compact variant, Present button gated by host display modes |

App-visible tool surface grew by two app-only entries:
`presentation_render_deck` (presenter) and `presentation_render_theme_studio`
(theme browser). Widget payloads are version 2 with editor/present/share deep
links. Automated gates: `npm run mcp:phase7` (358 checks + focused typecheck)
and `npm run mcp:phase9h` (33 scenarios including a themes × schemes contrast
matrix).

## Source Highlights

- OpenAI says ChatGPT Apps use MCP servers and can be connected from ChatGPT developer mode before public submission: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
- OpenAI's submission flow is the path to public ChatGPT app distribution: https://developers.openai.com/apps-sdk/deploy/submission
- ChatGPT supports MCP Apps UI standard plus optional `window.openai` extensions: https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt (external reference only — Verto widgets no longer use these; see the migration note above)
- Claude supports Streamable HTTP remote MCP connectors and directory submission: https://claude.com/docs/connectors/building
- Claude directory submissions can include remote MCP servers and MCP Apps: https://claude.com/docs/connectors/building/submission
- MCP Apps standard explains iframe UI resources, `ui://` resources, JSON-RPC over `postMessage`, and sandboxing: https://modelcontextprotocol.io/extensions/apps/overview
