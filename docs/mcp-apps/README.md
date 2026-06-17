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
| `04-research-notes-and-sources.md` | Research summary with source links used to build this plan. |
| `05-tool-review-matrix.md` | Tool titles, review annotations, and safety notes for app submission. |
| `06-security-privacy-observability.md` | Phase 6 hardening notes, ownership matrix, prompt-injection tests, and validation checklist. |
| `07-testing-plan.md` | Phase 7 automated checks, MCP Inspector steps, ChatGPT developer mode steps, Claude custom connector steps, and reviewer prompt matrix. |
| `08-product-submission-packet.md` | Phase 8 app listing copy, reviewer instructions, data handling answers, screenshot plan, help article drafts, and owner submission steps. |
| `submission-assets/` | Place final icons, screenshots, and evidence files here before app review. |

## Source Highlights

- OpenAI says ChatGPT Apps use MCP servers and can be connected from ChatGPT developer mode before public submission: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
- OpenAI's submission flow is the path to public ChatGPT app distribution: https://developers.openai.com/apps-sdk/deploy/submission
- ChatGPT supports MCP Apps UI standard plus optional `window.openai` extensions: https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt
- Claude supports Streamable HTTP remote MCP connectors and directory submission: https://claude.com/docs/connectors/building
- Claude directory submissions can include remote MCP servers and MCP Apps: https://claude.com/docs/connectors/building/submission
- MCP Apps standard explains iframe UI resources, `ui://` resources, JSON-RPC over `postMessage`, and sandboxing: https://modelcontextprotocol.io/extensions/apps/overview
